"use client";

import React from "react";
import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";
import { RaporPDFDocument } from "@/components/features/rapor/rapor-pdf-document";
import { buildP5Tree, buildPenilaianP5Map } from "@/lib/p5-tree";
import type { PredikatP5 } from "@/types";

// ============================================================
// TYPES
// ============================================================

export interface KelasGroup {
  namaKelas: string;
  enrollmentIds: string[];
  enrollmentNames: Map<string, string>;
}

export interface ExportContextSingle {
  enrollmentIds: string[];
  enrollmentNames: Map<string, string>;
  kelasInfo: {
    namaKelas: string;
    paket: string;
    fase: string;
    tahunNama: string;
    semester: number;
  };
}

export interface ExportContextMulti {
  paketInfo: {
    paket: string;
    tahunNama: string;
    semester: number;
  };
  kelasGroups: KelasGroup[];
}

export type ExportContext = ExportContextSingle | ExportContextMulti;

export interface ExportProgress {
  phase: "fetching" | "rendering" | "zipping" | "done";
  current: number;
  currentName?: string;
  currentKelasName?: string;
}

export interface ExportFailedItem {
  enrollmentId: string;
  namaSiswa: string;
  reason: string;
}

export function isMulti(ctx: ExportContext): ctx is ExportContextMulti {
  return "kelasGroups" in ctx;
}

// ============================================================
// MAIN ENTRY
// ============================================================

export async function exportRaporZip(opts: {
  ctx: ExportContext;
  signal?: AbortSignal;
  onProgress?: (p: ExportProgress) => void;
}): Promise<void> {
  const { ctx, signal, onProgress } = opts;

  onProgress?.({ phase: "fetching", current: 0 });
  const sharable = await fetchSharableData();
  if (signal?.aborted) throw createAbortError();

  const zip = new JSZip();
  const failed: ExportFailedItem[] = [];
  let processed = 0;

  if (isMulti(ctx)) {
    for (const kg of ctx.kelasGroups) {
      const folder = zip.folder(sanitizeFolderName(kg.namaKelas));
      if (!folder) continue;

      for (let i = 0; i < kg.enrollmentIds.length; i++) {
        if (signal?.aborted) throw createAbortError();
        const enrollmentId = kg.enrollmentIds[i];
        const namaSiswa =
          kg.enrollmentNames.get(enrollmentId) ?? `Siswa ${i + 1}`;

        onProgress?.({
          phase: "rendering",
          current: processed,
          currentName: namaSiswa,
          currentKelasName: kg.namaKelas,
        });

        try {
          const blob = await renderSiswaPDF(enrollmentId, sharable);
          const safe = sanitizeFileName(namaSiswa);
          folder.file(`${String(i + 1).padStart(2, "0")}_${safe}.pdf`, blob);
        } catch (err) {
          failed.push({
            enrollmentId,
            namaSiswa,
            reason: err instanceof Error ? err.message : "Unknown error",
          });
        }
        processed++;
      }
    }
  } else {
    for (let i = 0; i < ctx.enrollmentIds.length; i++) {
      if (signal?.aborted) throw createAbortError();
      const enrollmentId = ctx.enrollmentIds[i];
      const namaSiswa =
        ctx.enrollmentNames.get(enrollmentId) ?? `Siswa ${i + 1}`;

      onProgress?.({
        phase: "rendering",
        current: processed,
        currentName: namaSiswa,
      });

      try {
        const blob = await renderSiswaPDF(enrollmentId, sharable);
        const safe = sanitizeFileName(namaSiswa);
        zip.file(`${String(i + 1).padStart(2, "0")}_${safe}.pdf`, blob);
      } catch (err) {
        failed.push({
          enrollmentId,
          namaSiswa,
          reason: err instanceof Error ? err.message : "Unknown error",
        });
      }
      processed++;
    }
  }

  onProgress?.({ phase: "zipping", current: processed });
  const zipBlob = await zip.generateAsync({ type: "blob" });

  const filename = buildZipFilename(ctx);
  triggerDownload(zipBlob, filename);

  onProgress?.({ phase: "done", current: processed });

  if (failed.length > 0) {
    console.warn(`Export selesai dengan ${failed.length} gagal:`, failed);
  }
}

// ============================================================
// HELPERS
// ============================================================

function createAbortError(): Error {
  const e = new Error("Aborted");
  e.name = "AbortError";
  return e;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
}

function sanitizeFolderName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, "-").trim() || "Kelas";
}

function buildZipFilename(ctx: ExportContext): string {
  if (isMulti(ctx)) {
    const safePaket = ctx.paketInfo.paket.replace(/\s+/g, "");
    const safeTahun = ctx.paketInfo.tahunNama.replace("/", "-");
    return `Rapor_${safePaket}_${safeTahun}_Sem${ctx.paketInfo.semester}.zip`;
  }
  const safeKelas = sanitizeFolderName(ctx.kelasInfo.namaKelas).replace(
    /\s+/g,
    ""
  );
  const safeTahun = ctx.kelasInfo.tahunNama.replace("/", "-");
  return `Rapor_${safeKelas}_${safeTahun}_Sem${ctx.kelasInfo.semester}.zip`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface SharableData {
  sekolah: Awaited<ReturnType<typeof fetchSekolah>>;
  p5Dimensi: Awaited<ReturnType<typeof fetchP5Dimensi>>;
  p5Elemen: Awaited<ReturnType<typeof fetchP5Elemen>>;
}

async function fetchSharableData(): Promise<SharableData> {
  const [sekolah, p5Dimensi, p5Elemen] = await Promise.all([
    fetchSekolah(),
    fetchP5Dimensi(),
    fetchP5Elemen(),
  ]);
  return { sekolah, p5Dimensi, p5Elemen };
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

// ============================================================
// PER-SISWA FETCH + RENDER
// ============================================================

async function fetchEnrollmentFullData(
  enrollmentId: string,
  sharable: SharableData
) {
  const supabase = createClient();

  const { data: enrollment, error: enrErr } = await supabase
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
  if (enrErr) throw enrErr;

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
      "Data enrollment tidak lengkap (paket atau tahun pelajaran missing)."
    );
  }

  const [
    nilaiList,
    p5SubElemen,
    penilaianP5,
    catatanP5,
    ekskulList,
    absensi,
    catatan,
    tanggalCetakRaw,
  ] = await Promise.all([
    fetchNilaiList(enrollmentId),
    fetchP5SubElemen(fase),
    fetchPenilaianP5(enrollmentId),
    fetchCatatanP5(enrollmentId),
    fetchEkskul(enrollmentId),
    fetchAbsensi(enrollmentId),
    fetchCatatan(enrollmentId),
    fetchTanggalCetakPaket(tp.id, paket),
  ]);

  if (!tanggalCetakRaw) {
    throw new Error(
      `Tanggal cetak ${paket} belum di-set untuk ${tp.nama} semester ${tp.semester}. Hubungi admin untuk set di tab Tahun & Semester.`
    );
  }

  return {
    enrollment,
    sekolah: sharable.sekolah,
    nilaiList,
    p5Dimensi: sharable.p5Dimensi,
    p5Elemen: sharable.p5Elemen,
    p5SubElemen,
    penilaianP5,
    catatanP5,
    ekskulList,
    absensi,
    catatan,
    tanggalCetak: tanggalCetakRaw,
  };
}

async function fetchNilaiList(enrollmentId: string) {
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

async function renderSiswaPDF(
  enrollmentId: string,
  sharable: SharableData
): Promise<Blob> {
  const data = await fetchEnrollmentFullData(enrollmentId, sharable);

  const p5Tree = buildP5Tree(data.p5Dimensi, data.p5Elemen, data.p5SubElemen);
  const penilaianP5Map = buildPenilaianP5Map(
    data.penilaianP5 as Array<{
      sub_elemen_id: number;
      predikat: PredikatP5 | null;
    }>
  );

  const element = React.createElement(RaporPDFDocument, {
    enrollment: data.enrollment as never,
    sekolah: data.sekolah,
    nilaiList: data.nilaiList as never,
    p5Tree,
    penilaianP5Map,
    catatanP5: data.catatanP5,
    ekskulList: data.ekskulList,
    absensi: data.absensi,
    catatan: data.catatan,
    tanggalCetak: data.tanggalCetak,
  });

  // Cast ke `never` karena type `pdf()` strict ke DocumentProps,
  // sedangkan komponen kita pakai props sendiri.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(element as any).toBlob();
  return blob;
}

// ============================================================
// SUMMARY HELPER (opsional, dipakai kalau caller mau buat toast manual)
// ============================================================

export function buildExportSummary(succeeded: number, failed: ExportFailedItem[]): string {
  const total = succeeded + failed.length;
  if (failed.length === 0) {
    return `Berhasil export ${succeeded} dari ${total} rapor.`;
  }
  const failedList = failed
    .slice(0, 5)
    .map((f) => `${f.namaSiswa} (${f.reason})`)
    .join("; ");
  const more = failed.length > 5 ? ` dan ${failed.length - 5} lainnya` : "";
  return `Export selesai: ${succeeded} berhasil, ${failed.length} gagal dari ${total}. Gagal: ${failedList}${more}.`;
}