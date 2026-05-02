// ============================================================
// FILE PATH: src/hooks/use-siswa.ts
// ============================================================
// REPLACE. Tambahan: useBulkImportSiswa untuk CSV import flow.
//
// Existing hooks (usePesertaDidik, useCreatePesertaDidik, etc) TIDAK
// BERUBAH — di-keep persis seperti versi sebelumnya.
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  PesertaDidikFormData,
  EnrollmentFormData,
} from "@/lib/validators";
import { toast } from "sonner";

const QK = {
  all: ["peserta_didik"] as const,
  byId: (id: string) => ["peserta_didik", id] as const,
  enrollment: ["enrollment"] as const,
  byKelas: (kelasId: number) => ["enrollment", "kelas", kelasId] as const,
};

export function usePesertaDidik() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peserta_didik")
        .select("*")
        .order("nama_lengkap");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePesertaDidikById(id: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byId(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peserta_didik")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePesertaDidik() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: PesertaDidikFormData) => {
      const { data, error } = await supabase
        .from("peserta_didik")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Peserta didik berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useUpdatePesertaDidik() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<PesertaDidikFormData>;
    }) => {
      const { error } = await supabase
        .from("peserta_didik")
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.byId(vars.id) });
      toast.success("Data berhasil diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

// FIX: hapus .order("peserta_didik(nama_lengkap)"), sort client-side
export function useEnrollmentByKelas(kelasId: number | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byKelas(kelasId ?? 0),
    enabled: !!kelasId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollment")
        .select(`
          *,
          peserta_didik(id, nama_lengkap, nisn, jenis_kelamin),
          rombongan_belajar(id, nama_kelas, tingkat, paket, fase)
        `)
        .eq("rombongan_belajar_id", kelasId!)
        .eq("status", "aktif");
      if (error) throw error;

      const rows = data ?? [];
      return rows.sort((a, b) => {
        const nameA =
          (a.peserta_didik as { nama_lengkap: string } | null)?.nama_lengkap ??
          "";
        const nameB =
          (b.peserta_didik as { nama_lengkap: string } | null)?.nama_lengkap ??
          "";
        return nameA.localeCompare(nameB, "id");
      });
    },
  });
}

export function useCreateEnrollment() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: EnrollmentFormData) => {
      const { error } = await supabase.from("enrollment").insert(values);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.byKelas(vars.rombongan_belajar_id) });
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Siswa berhasil didaftarkan ke kelas");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useUpdateEnrollmentStatus() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("enrollment")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.enrollment });
      toast.success("Status enrollment diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

// ============================================================
// NEW — useBulkImportSiswa
// ============================================================
// Bulk insert peserta_didik + bulk insert enrollment (atomic-ish:
// kalau enrollment fail, rollback siswa yang baru dibuat di batch ini).
//
// Strategy:
//   1. Insert semua peserta_didik sekaligus (1 query)
//   2. Pakai returned IDs untuk build payload enrollment
//   3. Insert semua enrollment sekaligus (1 query)
//   4. Kalau enrollment fail → delete semua peserta_didik yang baru
//      dibuat di batch ini (rollback manual karena Supabase JS
//      client gak punya transaction support)
// ============================================================

export function useBulkImportSiswa() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      rows: Array<{
        nama_lengkap: string;
        jenis_kelamin: "L" | "P";
        rombongan_belajar_id: number;
      }>;
      tahun_pelajaran_id: number;
    }) => {
      if (payload.rows.length === 0) {
        return { inserted: 0 };
      }

      // 1. Insert peserta_didik
      const siswaPayload = payload.rows.map((r) => ({
        nama_lengkap: r.nama_lengkap,
        jenis_kelamin: r.jenis_kelamin,
        agama: "Islam" as const, // placeholder, admin lengkapi via edit form
        is_aktif: true,
      }));

      const { data: insertedSiswa, error: e1 } = await supabase
        .from("peserta_didik")
        .insert(siswaPayload)
        .select("id");
      if (e1) throw e1;
      if (!insertedSiswa || insertedSiswa.length === 0) {
        throw new Error("Gagal insert siswa: response kosong");
      }

      // 2. Build enrollment payload — match index by index
      //    karena urutan returned IDs sama dengan urutan insert
      const enrollPayload = insertedSiswa.map((s, i) => ({
        peserta_didik_id: s.id,
        rombongan_belajar_id: payload.rows[i].rombongan_belajar_id,
        tahun_pelajaran_id: payload.tahun_pelajaran_id,
        status: "aktif" as const,
      }));

      const { error: e2 } = await supabase.from("enrollment").insert(enrollPayload);

      if (e2) {
        // Rollback: hapus siswa yang baru dibuat di batch ini
        const newIds = insertedSiswa.map((s) => s.id);
        await supabase.from("peserta_didik").delete().in("id", newIds);
        throw new Error("Gagal enroll siswa: " + e2.message);
      }

      return { inserted: insertedSiswa.length };
    },
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: ["enrollment"] });
      // Invalidate per-kelas yang ke-touch
      const uniqueKelas = [
        ...new Set(vars.rows.map((r) => r.rombongan_belajar_id)),
      ];
      uniqueKelas.forEach((kid) => {
        qc.invalidateQueries({ queryKey: QK.byKelas(kid) });
      });
      toast.success(
        `${result.inserted} siswa berhasil diimport & di-enroll`
      );
    },
    onError: (err: Error) => toast.error("Gagal import: " + err.message),
  });
}