// ============================================================
// FILE PATH: src/hooks/use-siswa.ts
// ============================================================
// REPLACE. Perubahan dari versi sebelumnya:
//
//   NEW: useDeletePesertaDidik (single delete)
//   NEW: useBulkDeletePesertaDidik (multi delete via .in() query)
//
//   Both hooks rely on migration v2.6 (enrollment.peserta_didik_id
//   ON DELETE CASCADE). Kalau migration belum dijalankan, error 23503
//   bakal di-catch dan ditampilkan dengan pesan jelas — admin tau
//   harus jalankan migration dulu, bukan diem-diem fail.
//
//   Cache invalidation setelah delete:
//     - peserta_didik (list utama)
//     - enrollment (cascade)
//     - nilai_mapel, penilaian_p5, catatan_p5, ekstrakurikuler,
//       ketidakhadiran, catatan_wali_kelas, rapor_header (cascade child)
//     - siswa_deletion_impact (refresh impact preview)
//
//   Sisa hooks (usePesertaDidik, useCreatePesertaDidik,
//   useUpdatePesertaDidik, useEnrollmentByKelas, useCreateEnrollment,
//   useUpdateEnrollmentStatus, useBulkImportSiswa) PRESERVED tanpa
//   perubahan dari versi sebelumnya.
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  PesertaDidikFormData,
  EnrollmentFormData,
} from "@/lib/validators";
import { AGAMA_VALUES } from "@/lib/validators";
import { toast } from "sonner";

type AgamaCanonical = (typeof AGAMA_VALUES)[number];

const QK = {
  all: ["peserta_didik"] as const,
  byId: (id: string) => ["peserta_didik", id] as const,
  enrollment: ["enrollment"] as const,
  byKelas: (kelasId: number) => ["enrollment", "kelas", kelasId] as const,
};

// ============================================================
// HELPER: detect FK violation (in case migration v2.6 hasn't run)
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

const FK_VIOLATION_MESSAGE =
  "Tidak bisa hapus siswa: masih ada data terkait yang belum di-cascade. " +
  "Pastikan migration v2.6 (ON DELETE CASCADE untuk peserta_didik) sudah " +
  "dijalankan di Supabase, atau hubungi admin teknis.";

// Helper buat invalidate semua cache yang ke-impact saat delete siswa
function invalidateAllSiswaCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: QK.all });
  qc.invalidateQueries({ queryKey: ["enrollment"] });
  qc.invalidateQueries({ queryKey: ["nilai_mapel"] });
  qc.invalidateQueries({ queryKey: ["penilaian_p5"] });
  qc.invalidateQueries({ queryKey: ["catatan_p5"] });
  qc.invalidateQueries({ queryKey: ["ekstrakurikuler"] });
  qc.invalidateQueries({ queryKey: ["ketidakhadiran"] });
  qc.invalidateQueries({ queryKey: ["catatan_wali_kelas"] });
  qc.invalidateQueries({ queryKey: ["rapor_header"] });
  qc.invalidateQueries({ queryKey: ["siswa_deletion_impact"] });
  qc.invalidateQueries({ queryKey: ["kelas_deletion_impact"] });
}

// ============================================================
// QUERIES
// ============================================================

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

// ============================================================
// MUTATIONS — CREATE / UPDATE
// ============================================================

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

// ============================================================
// MUTATIONS — DELETE (single + bulk)
// ============================================================
// Both rely on migration v2.6 (CASCADE). Sebelum migration:
//   - DELETE 1 siswa dengan enrollment → error 23503 → user-friendly msg
// Setelah migration:
//   - DELETE auto-cascade enrollment + semua child (nilai, rapor, dll)
// ============================================================

export function useDeletePesertaDidik() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("peserta_didik")
        .delete()
        .eq("id", id);
      if (error) {
        if (isFkViolation(error)) {
          throw new Error(FK_VIOLATION_MESSAGE);
        }
        throw error;
      }
    },
    onSuccess: () => {
      invalidateAllSiswaCaches(qc);
      toast.success("Siswa dan semua data terkait berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBulkDeletePesertaDidik() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return { count: 0 };
      const { error } = await supabase
        .from("peserta_didik")
        .delete()
        .in("id", ids);
      if (error) {
        if (isFkViolation(error)) {
          throw new Error(FK_VIOLATION_MESSAGE);
        }
        throw error;
      }
      return { count: ids.length };
    },
    onSuccess: (res) => {
      invalidateAllSiswaCaches(qc);
      toast.success(`${res?.count ?? 0} siswa berhasil dihapus`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ============================================================
// ENROLLMENT — preserved
// ============================================================

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
// useBulkImportSiswa — preserved (NIS/NISN dukungan + race handling)
// ============================================================

function parseUniqueNisnViolation(errorMsg: string): string | null {
  const match = errorMsg.match(/Key \(nisn\)=\(([^)]+)\) already exists/i);
  return match?.[1] ?? null;
}

export function useBulkImportSiswa() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      rows: Array<{
        nama_lengkap: string;
        jenis_kelamin: "L" | "P";
        agama: AgamaCanonical;
        nis: string | null;
        nisn: string | null;
        rombongan_belajar_id: number;
      }>;
      tahun_pelajaran_id: number;
    }) => {
      if (payload.rows.length === 0) {
        return { inserted: 0 };
      }

      const siswaPayload = payload.rows.map((r) => ({
        nama_lengkap: r.nama_lengkap,
        jenis_kelamin: r.jenis_kelamin,
        agama: r.agama,
        nis: r.nis,
        nisn: r.nisn,
        is_aktif: true,
      }));

      const { data: insertedSiswa, error: e1 } = await supabase
        .from("peserta_didik")
        .insert(siswaPayload)
        .select("id");

      if (e1) {
        const conflictNisn = parseUniqueNisnViolation(e1.message);
        if (conflictNisn) {
          throw new Error(
            `NISN "${conflictNisn}" sudah terdaftar (kemungkinan ada admin lain yang baru saja menambahkan siswa). Silakan refresh dan coba lagi.`
          );
        }
        throw new Error("Gagal insert siswa: " + e1.message);
      }

      if (!insertedSiswa || insertedSiswa.length === 0) {
        throw new Error("Gagal insert siswa: response kosong");
      }

      const enrollPayload = insertedSiswa.map((s, i) => ({
        peserta_didik_id: s.id,
        rombongan_belajar_id: payload.rows[i].rombongan_belajar_id,
        tahun_pelajaran_id: payload.tahun_pelajaran_id,
        status: "aktif" as const,
      }));

      const { error: e2 } = await supabase
        .from("enrollment")
        .insert(enrollPayload);

      if (e2) {
        const newIds = insertedSiswa.map((s) => s.id);
        await supabase.from("peserta_didik").delete().in("id", newIds);
        throw new Error("Gagal enroll siswa: " + e2.message);
      }

      return { inserted: insertedSiswa.length };
    },
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: ["enrollment"] });
      const uniqueKelas = [
        ...new Set(vars.rows.map((r) => r.rombongan_belajar_id)),
      ];
      uniqueKelas.forEach((kid) => {
        qc.invalidateQueries({ queryKey: QK.byKelas(kid) });
      });
      toast.success(`${result.inserted} siswa berhasil diimport & di-enroll`);
    },
    onError: (err: Error) => toast.error("Gagal import: " + err.message),
  });
}
