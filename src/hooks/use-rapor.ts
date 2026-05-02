// ============================================================
// FILE PATH: src/hooks/use-rapor.ts
// ============================================================
// REPLACE. v2.4 — validasi tanggal cetak per paket.
//
// Perubahan dari versi sebelumnya:
//
//   1. useRaporFullData: HARD VALIDATION tanggal cetak per paket
//      - Fetch tanggal dari tabel `tanggal_cetak_paket` berdasarkan
//        kombinasi (tahun_pelajaran_id, paket dari rombongan_belajar)
//      - Kalau row gak ada atau tanggal NULL → throw error eksplisit
//        dengan message yang jelas: "Belum bisa cetak rapor. Admin
//        belum set tanggal cetak {paket} untuk {nama TP} semester {n}.
//        Hubungi admin untuk set tanggal di tab Tahun & Semester."
//      - Tanggal di-inject ke return data sebagai field `tanggalCetak`
//        (string ISO YYYY-MM-DD), JANGAN ambil dari
//        tahun_pelajaran.tanggal_cetak (deprecated).
//
//   2. SELECT enrollment: HAPUS `tanggal_cetak` dari subquery
//      tahun_pelajaran (deprecated, pure noise sekarang).
//
//   3. RaporFullData type: tambah field `tanggalCetak: string`
//      yang dijamin non-null (kalau null, query throw, jadi data
//      cuma exist kalau tanggal ada).
//
// Filosofi:
//   - Atomic validation: validasi di queryFn = data gak pernah
//     ada di state app tanpa tanggal valid. PDFViewer + ExportZip
//     trust hook ini sepenuhnya.
//   - Single source of truth: PDF renderer GAK perlu tahu logic
//     fallback. Cuma consume `tanggalCetak` field.
//   - Error message human-friendly: include nama paket + TP +
//     semester biar admin tau persis dimana harus set.
//
// Hook lain (useRaporHeader, useEnsure, usePublish, useUnpublish)
// TIDAK BERUBAH dari versi sebelumnya.
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";

const QK = {
  header: (enrollmentId: string) => ["rapor_header", enrollmentId] as const,
  allHeaders: ["rapor_header"] as const,
  full: (enrollmentId: string) => ["rapor_full", enrollmentId] as const,
};

// ============================================================
// HEADER HOOKS — TIDAK BERUBAH
// ============================================================

export function useRaporHeader(enrollmentId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.header(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rapor_header")
        .select("*")
        .eq("enrollment_id", enrollmentId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useEnsureRaporHeader() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data: existing } = await supabase
        .from("rapor_header")
        .select("id")
        .eq("enrollment_id", enrollmentId)
        .maybeSingle();

      if (existing) return existing;

      const { data, error } = await supabase
        .from("rapor_header")
        .insert({ enrollment_id: enrollmentId, status: "draft" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, enrollmentId) => {
      qc.invalidateQueries({ queryKey: QK.header(enrollmentId) });
    },
    onError: (err: Error) =>
      toast.error("Gagal membuat draft rapor: " + err.message),
  });
}

export function usePublishRapor() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data: existing } = await supabase
        .from("rapor_header")
        .select("id, status")
        .eq("enrollment_id", enrollmentId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("rapor_header").insert({
          enrollment_id: enrollmentId,
          status: "published",
          published_at: new Date().toISOString(),
          published_by: userId ?? null,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("rapor_header")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            published_by: userId ?? null,
          })
          .eq("enrollment_id", enrollmentId);
        if (error) throw error;
      }
    },
    onSuccess: (_, enrollmentId) => {
      qc.invalidateQueries({ queryKey: QK.header(enrollmentId) });
      qc.invalidateQueries({ queryKey: QK.allHeaders });
      qc.invalidateQueries({ queryKey: ["enrollment"] });
      toast.success("Rapor berhasil dipublish");
    },
    onError: (err: Error) => toast.error("Gagal publish rapor: " + err.message),
  });
}

export function useUnpublishRapor() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from("rapor_header")
        .update({
          status: "draft",
          published_at: null,
          published_by: null,
        })
        .eq("enrollment_id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: (_, enrollmentId) => {
      qc.invalidateQueries({ queryKey: QK.header(enrollmentId) });
      qc.invalidateQueries({ queryKey: QK.allHeaders });
      qc.invalidateQueries({ queryKey: ["enrollment"] });
      toast.success("Rapor dikembalikan ke draft");
    },
    onError: (err: Error) => toast.error("Gagal unpublish: " + err.message),
  });
}

// ============================================================
// FULL RAPOR DATA — dengan validasi tanggal cetak per paket
// ============================================================
//
// PERUBAHAN UTAMA v2.4:
//
//   1. SELECT enrollment: drop `tanggal_cetak` dari subquery TP
//      (kolom DEPRECATED — gak dipake lagi).
//
//   2. NEW: Fetch `tanggal_cetak_paket` berdasarkan TP × paket
//      siswa, di parallel dengan query lain.
//
//   3. NEW: Validate after parallel queries:
//        - row found + tanggal_cetak NOT NULL → continue
//        - row null / tanggal null → THROW dengan pesan jelas
//
//   4. Return shape extended dengan `tanggalCetak: string`.
// ============================================================

export interface RaporFullData {
  enrollment: Awaited<ReturnType<typeof fetchEnrollment>>;
  sekolah: Awaited<ReturnType<typeof fetchSekolah>>;
  nilaiList: Awaited<ReturnType<typeof fetchNilai>>;
  p5Dimensi: Awaited<ReturnType<typeof fetchP5Dimensi>>;
  p5Elemen: Awaited<ReturnType<typeof fetchP5Elemen>>;
  p5SubElemen: Awaited<ReturnType<typeof fetchP5SubElemen>>;
  penilaianP5: Awaited<ReturnType<typeof fetchPenilaianP5>>;
  catatanP5: Awaited<ReturnType<typeof fetchCatatanP5>>;
  ekskulList: Awaited<ReturnType<typeof fetchEkskul>>;
  absensi: Awaited<ReturnType<typeof fetchAbsensi>>;
  catatan: Awaited<ReturnType<typeof fetchCatatan>>;
  raporHeader: Awaited<ReturnType<typeof fetchRaporHeader>>;
  /**
   * v2.4: Tanggal cetak rapor per paket (dari tabel tanggal_cetak_paket).
   * Format ISO YYYY-MM-DD. Dijamin non-null — kalau di DB belum di-set,
   * useRaporFullData throw error sebelum data ini sampai ke component.
   */
  tanggalCetak: string;
}

// ── Fetch helpers (declared as const fns biar bisa di-Awaited di type) ──

async function fetchEnrollment(enrollmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("enrollment")
    .select(`
      *,
      peserta_didik(*),
      rombongan_belajar(
        id, nama_kelas, tingkat, kelas_paralel, paket, fase, wali_kelas,
        tahun_pelajaran(id, nama, semester)
      )
    `)
    .eq("id", enrollmentId)
    .single();
  if (error) throw error;
  return data;
}

async function fetchSekolah() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("satuan_pendidikan")
    .select("*")
    .order("id")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function fetchNilai(enrollmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nilai_mapel")
    .select(`
      *,
      mata_pelajaran(id, nama, urutan, kelompok, agama)
    `)
    .eq("enrollment_id", enrollmentId);
  if (error) throw error;
  return data ?? [];
}

async function fetchP5Dimensi() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("p5_dimensi")
    .select("*")
    .eq("is_aktif", true)
    .order("urutan");
  if (error) throw error;
  return data ?? [];
}

async function fetchP5Elemen() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("p5_elemen")
    .select("*")
    .eq("is_aktif", true)
    .order("urutan");
  if (error) throw error;
  return data ?? [];
}

async function fetchP5SubElemen(fase: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("p5_sub_elemen")
    .select("*")
    .eq("fase", fase)
    .eq("is_aktif", true)
    .order("urutan");
  if (error) throw error;
  return data ?? [];
}

async function fetchPenilaianP5(enrollmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("penilaian_p5")
    .select("*")
    .eq("enrollment_id", enrollmentId);
  if (error) throw error;
  return data ?? [];
}

async function fetchCatatanP5(enrollmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("catatan_p5")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function fetchEkskul(enrollmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ekstrakurikuler")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("nama_ekskul");
  if (error) throw error;
  return data ?? [];
}

async function fetchAbsensi(enrollmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ketidakhadiran")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function fetchCatatan(enrollmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("catatan_wali_kelas")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function fetchRaporHeader(enrollmentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rapor_header")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// ── v2.4: Fetch tanggal cetak per paket (dipanggil setelah enrollment) ──

async function fetchTanggalCetakPaket(
  tahunPelajaranId: number,
  paket: string
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tanggal_cetak_paket")
    .select("tanggal_cetak")
    .eq("tahun_pelajaran_id", tahunPelajaranId)
    .eq("paket", paket)
    .maybeSingle();
  if (error) throw error;
  return data?.tanggal_cetak ?? null;
}

// ── Build error message untuk admin ──

function buildTanggalKosongErrorMessage(
  paket: string,
  tahunNama: string,
  semester: number
): string {
  return (
    `Belum bisa cetak rapor. ` +
    `Admin belum set tanggal cetak ${paket} untuk tahun pelajaran ` +
    `${tahunNama} semester ${semester}. ` +
    `Hubungi admin untuk set tanggal di tab Tahun & Semester.`
  );
}

// ============================================================
// MAIN HOOK — useRaporFullData
// ============================================================

export function useRaporFullData(enrollmentId: string | null) {
  return useQuery<RaporFullData>({
    queryKey: QK.full(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    // Penting: jangan retry hard validation error (tanggal kosong)
    // — itu data, bukan transient network error. Retry cuma akan
    // delay UI error message yang seharusnya muncul cepet.
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.startsWith("Belum bisa cetak")) {
        return false;
      }
      return failureCount < 1;
    },
    queryFn: async (): Promise<RaporFullData> => {
      // 1. Fetch enrollment dulu — kita butuh paket + tahun_pelajaran_id
      //    untuk validasi tanggal cetak.
      const enrollment = await fetchEnrollment(enrollmentId!);

      const rb = enrollment.rombongan_belajar as {
        paket?: string;
        fase?: string;
        tahun_pelajaran?: { id: number; nama: string; semester: number } | null;
      } | null;

      const paket = rb?.paket;
      const tp = rb?.tahun_pelajaran;
      const fase = rb?.fase ?? "Fase E";

      if (!paket || !tp) {
        throw new Error(
          "Data enrollment tidak lengkap. Pastikan siswa sudah ter-enroll di kelas dengan paket dan tahun pelajaran yang valid."
        );
      }

      // 2. Parallel queries — termasuk tanggal cetak per paket
      const [
        sekolah,
        nilaiList,
        p5Dimensi,
        p5Elemen,
        p5SubElemen,
        penilaianP5,
        catatanP5,
        ekskulList,
        absensi,
        catatan,
        raporHeader,
        tanggalCetakRaw,
      ] = await Promise.all([
        fetchSekolah(),
        fetchNilai(enrollmentId!),
        fetchP5Dimensi(),
        fetchP5Elemen(),
        fetchP5SubElemen(fase),
        fetchPenilaianP5(enrollmentId!),
        fetchCatatanP5(enrollmentId!),
        fetchEkskul(enrollmentId!),
        fetchAbsensi(enrollmentId!),
        fetchCatatan(enrollmentId!),
        fetchRaporHeader(enrollmentId!),
        fetchTanggalCetakPaket(tp.id, paket),
      ]);

      // 3. HARD VALIDATION — kalau tanggal kosong, tolak.
      //    Ini titik di mana fitur v2.4 punya teeth: tanpa tanggal,
      //    PDFViewer/ExportZip GAK PERNAH di-render.
      if (!tanggalCetakRaw) {
        throw new Error(
          buildTanggalKosongErrorMessage(paket, tp.nama, tp.semester)
        );
      }

      return {
        enrollment,
        sekolah,
        nilaiList,
        p5Dimensi,
        p5Elemen,
        p5SubElemen,
        penilaianP5,
        catatanP5,
        ekskulList,
        absensi,
        catatan,
        raporHeader,
        tanggalCetak: tanggalCetakRaw,
      };
    },
  });
}