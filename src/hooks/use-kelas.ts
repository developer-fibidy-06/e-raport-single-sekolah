// ============================================================
// FILE PATH: src/hooks/use-kelas.ts
// ============================================================
// REPLACE. Perubahan dari versi sebelumnya:
//
//   useDeleteKelas: tambah error parsing untuk FK violation (23503).
//   Setelah migration v2.5 (CASCADE), error 23503 dari FK
//   enrollment_rombongan_belajar_id_fkey seharusnya gak muncul
//   lagi. Tapi kalau ada FK lain yang belum CASCADE (misal admin
//   bikin custom FK di luar schema standar), pesan errornya lebih
//   informatif daripada raw Supabase message.
//
//   Tambah invalidate queries untuk child tables setelah delete:
//     - enrollment, nilai_mapel, penilaian_p5, rapor_header,
//       kelas_deletion_impact
//
//   Hooks lain (useKelasByTahun, useAllKelas, useCreateKelas,
//   useUpdateKelas) PRESERVED tanpa perubahan.
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RombonganBelajarFormData } from "@/lib/validators";
import { toast } from "sonner";

const QK = {
  all: ["kelas"] as const,
  byTahun: (tahunId: number) => ["kelas", tahunId] as const,
};

export function useKelasByTahun(tahunPelajaranId: number | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byTahun(tahunPelajaranId ?? 0),
    enabled: !!tahunPelajaranId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rombongan_belajar")
        .select("*, tahun_pelajaran(id, nama, semester)")
        .eq("tahun_pelajaran_id", tahunPelajaranId!)
        .order("tingkat")
        .order("kelas_paralel");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllKelas() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rombongan_belajar")
        .select("*, tahun_pelajaran(id, nama, semester, is_aktif)")
        .order("tingkat")
        .order("kelas_paralel");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateKelas() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: RombonganBelajarFormData) => {
      const { error } = await supabase.from("rombongan_belajar").insert({
        ...values,
        wali_kelas: values.wali_kelas?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.byTahun(vars.tahun_pelajaran_id) });
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Kelas berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useUpdateKelas() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: Partial<RombonganBelajarFormData>;
    }) => {
      const payload: Partial<RombonganBelajarFormData> = { ...values };
      if ("wali_kelas" in payload) {
        payload.wali_kelas =
          typeof payload.wali_kelas === "string"
            ? payload.wali_kelas.trim() || null
            : payload.wali_kelas;
      }
      const { error } = await supabase
        .from("rombongan_belajar")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Kelas berhasil diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

// ============================================================
// useDeleteKelas — dengan error parsing FK violation
// ============================================================
// Setelah migration ON DELETE CASCADE, delete kelas akan auto-nuke
// enrollment + child-nya (nilai_mapel, penilaian_p5, ekstrakurikuler,
// dst). Kalau masih ada FK violation, kemungkinan:
//   - Migration belum jalan (FK masih RESTRICT)
//   - Ada custom FK di luar schema standar
// Error message di-translate ke bahasa user-friendly.
// ============================================================

function isFkViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "23503") return true;
  if (e.message && /foreign key|violates.*constraint/i.test(e.message)) {
    return true;
  }
  return false;
}

export function useDeleteKelas() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("rombongan_belajar")
        .delete()
        .eq("id", id);
      if (error) {
        if (isFkViolation(error)) {
          throw new Error(
            "Tidak bisa hapus kelas: masih ada data terkait yang belum di-cascade. " +
            "Pastikan migration v2.5 (ON DELETE CASCADE) sudah dijalankan di Supabase, " +
            "atau hubungi admin teknis."
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate kelas list
      qc.invalidateQueries({ queryKey: QK.all });
      // Invalidate semua child cache karena CASCADE delete
      qc.invalidateQueries({ queryKey: ["enrollment"] });
      qc.invalidateQueries({ queryKey: ["nilai_mapel"] });
      qc.invalidateQueries({ queryKey: ["penilaian_p5"] });
      qc.invalidateQueries({ queryKey: ["catatan_p5"] });
      qc.invalidateQueries({ queryKey: ["ekstrakurikuler"] });
      qc.invalidateQueries({ queryKey: ["ketidakhadiran"] });
      qc.invalidateQueries({ queryKey: ["catatan_wali_kelas"] });
      qc.invalidateQueries({ queryKey: ["rapor_header"] });
      qc.invalidateQueries({ queryKey: ["kelas_deletion_impact"] });
      toast.success("Kelas dan semua data terkait berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}