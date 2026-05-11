// ============================================================
// FILE PATH: src/lib/quick-fill-ekskul.ts
// ============================================================
// FULL REPLACE. Fix TS error di ekskul-form.tsx line 152:
//
//   "Type 'keterangan: string | null' not assignable to
//    type 'keterangan: string'"
//
// Root cause: return type generateEkskulRows pakai Pick<Ekstrakurikuler,
// "keterangan"> yang inherit `string | null` dari DB type. Tapi
// useBatchInsertEkskul expect `keterangan: string` (strict).
//
// Fix: ganti return type ke explicit interface EkskulBatchRow dengan
// `keterangan: string` non-nullable. Runtime memang selalu return
// string karena generateKeteranganEkskul ada generic fallback —
// jadi type ini akurat, bukan asumsi.
//
// Selain itu, EkskulBatchRow di-export supaya bisa di-reuse di
// ekskul-form.tsx kalau perlu explicit annotation.
// ============================================================

import type { EkskulPreset, Ekstrakurikuler } from "@/types";

export type EkskulPredikat = "A" | "B" | "C" | "D";

// ─── Row type untuk batch insert ──────────────────────────────
// Match dengan signature useBatchInsertEkskul di use-nilai.ts:
//   rows: Array<{
//     enrollment_id: string;
//     nama_ekskul: string;
//     predikat: "A" | "B";
//     keterangan: string;   ← strict string, NOT nullable
//   }>
// ─────────────────────────────────────────────────────────────

export interface EkskulBatchRow {
  enrollment_id: string;
  nama_ekskul: string;
  predikat: "A" | "B";
  keterangan: string;
}

// ─── GENERIC FALLBACK TEMPLATES ───────────────────────────────

const GENERIC_TEMPLATES: Record<EkskulPredikat, string> = {
  A: "Mengikuti kegiatan ekstrakurikuler dengan sangat aktif dan menunjukkan prestasi yang membanggakan.",
  B: "Mengikuti kegiatan ekstrakurikuler dengan baik dan menunjukkan perkembangan yang positif.",
  C: "Mengikuti kegiatan ekstrakurikuler dengan partisipasi cukup, perlu meningkatkan keaktifan dan keterampilan.",
  D: "Partisipasi di kegiatan ekstrakurikuler masih kurang, perlu motivasi dan pendampingan agar lebih aktif.",
};

// ─── filterPresetByGender ─────────────────────────────────────

export function filterPresetByGender(
  presets: EkskulPreset[],
  gender: "L" | "P"
): EkskulPreset[] {
  return presets.filter(
    (p) => p.is_aktif && (p.gender === gender || p.gender === "SEMUA")
  );
}

// ─── generateKeteranganEkskul ─────────────────────────────────
// Reads from preset.keterangan_X, falls back to GENERIC_TEMPLATES.
// ALWAYS returns string (non-nullable) karena fallback selalu ada.
// ─────────────────────────────────────────────────────────────

export function generateKeteranganEkskul(
  preset: EkskulPreset | undefined,
  predikat: EkskulPredikat
): string {
  if (preset) {
    const templateField =
      predikat === "A"
        ? preset.keterangan_a
        : predikat === "B"
          ? preset.keterangan_b
          : predikat === "C"
            ? preset.keterangan_c
            : preset.keterangan_d;

    if (templateField && templateField.trim().length > 0) {
      return templateField.trim();
    }
  }
  return GENERIC_TEMPLATES[predikat];
}

// ─── pickPredikatAB — random 70% A, 30% B ─────────────────────

function pickPredikatAB(): "A" | "B" {
  return Math.random() < 0.7 ? "A" : "B";
}

// ─── generateEkskulRows — batch quick-fill ────────────────────
// Return type EkskulBatchRow[] dengan keterangan: string (non-null).
// Runtime selalu safe karena generateKeteranganEkskul punya fallback.
// ─────────────────────────────────────────────────────────────

export function generateEkskulRows(
  presets: EkskulPreset[],
  gender: "L" | "P",
  enrollmentId: string
): EkskulBatchRow[] {
  const matched = filterPresetByGender(presets, gender);

  return matched.map((preset) => {
    const predikat = pickPredikatAB();
    return {
      enrollment_id: enrollmentId,
      nama_ekskul: preset.nama_ekskul,
      predikat,
      keterangan: generateKeteranganEkskul(preset, predikat),
    };
  });
}

// ─── findPresetByName ─────────────────────────────────────────
// Match preset by nama_ekskul (case-insensitive). Dipakai di
// EkskulRowSheet untuk auto-fill template sesuai predikat.
// ─────────────────────────────────────────────────────────────

export function findPresetByName(
  presets: EkskulPreset[],
  namaEkskul: string
): EkskulPreset | undefined {
  const target = namaEkskul.trim().toLowerCase();
  if (!target) return undefined;
  return presets.find((p) => p.nama_ekskul.toLowerCase() === target);
}

// Suppress unused warning untuk Ekstrakurikuler import — masih
// dipakai sebagai semantic reference walau gak di runtime.
export type { Ekstrakurikuler };