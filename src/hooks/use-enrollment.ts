// ============================================================
// FILE PATH: src/hooks/use-enrollment.ts
// ============================================================
// REPLACE file lama. Keep existing hooks + tambah 5 hook baru untuk
// enrollment management (kelola siswa di kelas).
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const QK = {
  byId: (id: string) => ["enrollment", id] as const,
  byKelas: (kelasId: number) => ["enrollment", "kelas", kelasId] as const,
  byKelasAll: (kelasId: number) => ["enrollment", "kelas", kelasId, "all"] as const,
  unenrolled: (tahunId: number) => ["enrollment", "unenrolled", tahunId] as const,
};

// ============================================================
// EXISTING — single enrollment lengkap untuk halaman input nilai & rapor
// ============================================================
export function useEnrollmentById(enrollmentId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byId(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollment")
        .select(`
          *,
          peserta_didik(*),
          rombongan_belajar(
            id, nama_kelas, tingkat, paket, fase,
            tahun_pelajaran(id, nama, semester)
          )
        `)
        .eq("id", enrollmentId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// EXISTING — list enrollment AKTIF per kelas (untuk penilaian / rapor UI)
// ============================================================
export function useEnrollmentByKelasId(kelasId: number | null) {
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
          rapor_header(id, status)
        `)
        .eq("rombongan_belajar_id", kelasId!)
        .eq("status", "aktif");
      if (error) throw error;
      const rows = data ?? [];
      return rows.sort((a, b) => {
        const nameA = (a.peserta_didik as { nama_lengkap: string } | null)?.nama_lengkap ?? "";
        const nameB = (b.peserta_didik as { nama_lengkap: string } | null)?.nama_lengkap ?? "";
        return nameA.localeCompare(nameB, "id");
      });
    },
  });
}

// ============================================================
// NEW — list SEMUA enrollment per kelas (termasuk keluar/pindah/lulus)
// Dipakai di admin EnrollmentDialog tab "Terdaftar".
// ============================================================
export function useEnrollmentByKelasAll(kelasId: number | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byKelasAll(kelasId ?? 0),
    enabled: !!kelasId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollment")
        .select(`
          *,
          peserta_didik(id, nama_lengkap, nisn, jenis_kelamin, is_aktif)
        `)
        .eq("rombongan_belajar_id", kelasId!);
      if (error) throw error;
      const rows = data ?? [];
      return rows.sort((a, b) => {
        // Aktif dulu, lalu alfabet
        if (a.status === "aktif" && b.status !== "aktif") return -1;
        if (a.status !== "aktif" && b.status === "aktif") return 1;
        const nameA = (a.peserta_didik as { nama_lengkap: string } | null)?.nama_lengkap ?? "";
        const nameB = (b.peserta_didik as { nama_lengkap: string } | null)?.nama_lengkap ?? "";
        return nameA.localeCompare(nameB, "id");
      });
    },
  });
}

// ============================================================
// NEW — list peserta_didik yang BELUM punya enrollment di tahun tsb
// (termasuk belum pernah enroll, dan belum pernah keluar di tahun itu).
// Berguna di tab "Pilih Existing".
// ============================================================
export function useUnenrolledSiswa(tahunPelajaranId: number | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.unenrolled(tahunPelajaranId ?? 0),
    enabled: !!tahunPelajaranId,
    queryFn: async () => {
      // 1. semua peserta_didik_id yang sudah punya row enrollment (status apapun)
      //    di tahun pelajaran ini
      const { data: enrolled, error: e1 } = await supabase
        .from("enrollment")
        .select("peserta_didik_id")
        .eq("tahun_pelajaran_id", tahunPelajaranId!);
      if (e1) throw e1;

      const enrolledIds = new Set((enrolled ?? []).map((r) => r.peserta_didik_id));

      // 2. semua peserta_didik yang aktif di master
      const { data: allSiswa, error: e2 } = await supabase
        .from("peserta_didik")
        .select("id, nama_lengkap, nisn, jenis_kelamin")
        .eq("is_aktif", true)
        .order("nama_lengkap");
      if (e2) throw e2;

      // 3. filter yang belum ter-enroll sama sekali di tahun ini
      return (allSiswa ?? []).filter((s) => !enrolledIds.has(s.id));
    },
  });
}

// ============================================================
// NEW — bulk enroll siswa ke satu kelas
// ============================================================
export function useEnrollSiswa() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      peserta_didik_ids: string[];
      rombongan_belajar_id: number;
      tahun_pelajaran_id: number;
    }) => {
      const rows = payload.peserta_didik_ids.map((id) => ({
        peserta_didik_id: id,
        rombongan_belajar_id: payload.rombongan_belajar_id,
        tahun_pelajaran_id: payload.tahun_pelajaran_id,
        status: "aktif" as const,
      }));
      const { error } = await supabase.from("enrollment").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.byKelas(vars.rombongan_belajar_id) });
      qc.invalidateQueries({ queryKey: QK.byKelasAll(vars.rombongan_belajar_id) });
      qc.invalidateQueries({ queryKey: QK.unenrolled(vars.tahun_pelajaran_id) });
      toast.success(
        `${vars.peserta_didik_ids.length} siswa berhasil di-enroll`
      );
    },
    onError: (err: Error) => toast.error("Gagal enroll: " + err.message),
  });
}

// ============================================================
// NEW — set enrollment status (soft delete / lulus / reinstate)
// ============================================================
export function useSetEnrollmentStatus() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      enrollmentId: string;
      status: "aktif" | "lulus" | "keluar" | "pindah";
      kelasId: number;
      tahunId: number;
    }) => {
      const { error } = await supabase
        .from("enrollment")
        .update({ status: payload.status })
        .eq("id", payload.enrollmentId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.byKelas(vars.kelasId) });
      qc.invalidateQueries({ queryKey: QK.byKelasAll(vars.kelasId) });
      qc.invalidateQueries({ queryKey: QK.unenrolled(vars.tahunId) });
      qc.invalidateQueries({ queryKey: QK.byId(vars.enrollmentId) });
      toast.success("Status siswa diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

// ============================================================
// NEW — create peserta_didik baru + langsung enroll ke kelas
// ============================================================
export function useCreateSiswaAndEnroll() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      siswa: {
        nama_lengkap: string;
        jenis_kelamin: "L" | "P";
        nisn?: string | null;
        nis?: string | null;
      };
      rombongan_belajar_id: number;
      tahun_pelajaran_id: number;
    }) => {
      // 1. create peserta_didik
      const { data: newSiswa, error: e1 } = await supabase
        .from("peserta_didik")
        .insert({
          nama_lengkap: payload.siswa.nama_lengkap,
          jenis_kelamin: payload.siswa.jenis_kelamin,
          nisn: payload.siswa.nisn || null,
          nis: payload.siswa.nis || null,
          agama: "Islam", // TODO: minta admin update via edit form setelah create
          is_aktif: true,
        })
        .select()
        .single();
      if (e1) throw e1;

      // 2. create enrollment
      const { error: e2 } = await supabase.from("enrollment").insert({
        peserta_didik_id: newSiswa.id,
        rombongan_belajar_id: payload.rombongan_belajar_id,
        tahun_pelajaran_id: payload.tahun_pelajaran_id,
        status: "aktif",
      });
      if (e2) {
        // rollback: hapus siswa yang baru dibuat biar nggak ghost
        await supabase.from("peserta_didik").delete().eq("id", newSiswa.id);
        throw e2;
      }
      return newSiswa;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["peserta_didik"] });
      qc.invalidateQueries({ queryKey: QK.byKelas(vars.rombongan_belajar_id) });
      qc.invalidateQueries({ queryKey: QK.byKelasAll(vars.rombongan_belajar_id) });
      qc.invalidateQueries({ queryKey: QK.unenrolled(vars.tahun_pelajaran_id) });
      toast.success("Siswa baru berhasil didaftarkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}