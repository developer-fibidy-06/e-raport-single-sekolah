// ============================================================
// FILE PATH: src/hooks/use-kelas.ts
// ============================================================
// REPLACE file lama. Perubahan:
//   - Hapus relasi `wali_kelas:user_profiles(...)` dari select
//   - `wali_kelas` sekarang kolom text, ikut di row langsung
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
    mutationFn: async ({ id, values }: { id: number; values: Partial<RombonganBelajarFormData> }) => {
      const payload: Partial<RombonganBelajarFormData> = { ...values };
      if ("wali_kelas" in payload) {
        payload.wali_kelas =
          typeof payload.wali_kelas === "string"
            ? payload.wali_kelas.trim() || null
            : payload.wali_kelas;
      }
      const { error } = await supabase.from("rombongan_belajar").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Kelas berhasil diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useDeleteKelas() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("rombongan_belajar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Kelas dihapus");
    },
    onError: (err: Error) => toast.error("Gagal menghapus: " + err.message),
  });
}