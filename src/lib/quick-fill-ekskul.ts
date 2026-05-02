// ============================================================
// FILE PATH: src/lib/quick-fill-ekskul.ts
// ============================================================
// Logic quick-fill ekskul per siswa:
//
// 1. Filter preset berdasarkan gender siswa (L/P) + SEMUA
// 2. Random predikat A/B weighted 70/30 (70% A, 30% B)
// 3. Generate payload rows untuk batch insert
//
// Semua konfig terpusat di file ini supaya mudah di-tweak.
// ============================================================

import type { EkskulPreset, GenderPreset } from "@/types";

// ─── Config ──────────────────────────────────────────────────

/** Bobot distribusi predikat ekskul. 70% A, 30% B. */
const PREDIKAT_WEIGHTS: Array<{ value: "A" | "B"; weight: number }> = [
  { value: "A", weight: 0.70 },
  { value: "B", weight: 0.30 },
];

/** Label UI untuk gender filter di admin panel. */
export const GENDER_LABEL: Record<GenderPreset, string> = {
  L: "Laki-laki",
  P: "Perempuan",
  SEMUA: "Semua (L & P)",
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Generate predikat random berbobot.
 * Pakai `Math.random` — tidak perlu crypto-secure, cukup untuk variasi.
 */
export function randomPredikatEkskul(): "A" | "B" {
  const r = Math.random();
  let cum = 0;
  for (const { value, weight } of PREDIKAT_WEIGHTS) {
    cum += weight;
    if (r < cum) return value;
  }
  return "A"; // fallback
}

/**
 * Filter preset list sesuai gender siswa.
 * - Gender L → ambil preset gender=L + SEMUA
 * - Gender P → ambil preset gender=P + SEMUA
 * Yang non-aktif di-skip.
 * Hasil di-sort by urutan.
 */
export function filterPresetByGender(
  presets: EkskulPreset[],
  gender: "L" | "P"
): EkskulPreset[] {
  return presets
    .filter((p) => p.is_aktif)
    .filter((p) => p.gender === gender || p.gender === "SEMUA")
    .sort((a, b) => a.urutan - b.urutan);
}

/**
 * Generate rows payload siap untuk insert ke `ekstrakurikuler`.
 * Satu siswa bisa dapat 2–3 ekskul (tergantung preset yang match gender-nya).
 */
export function generateEkskulRows(
  presets: EkskulPreset[],
  gender: "L" | "P",
  enrollmentId: string
): Array<{
  enrollment_id: string;
  nama_ekskul: string;
  predikat: "A" | "B";
  keterangan: null;
}> {
  return filterPresetByGender(presets, gender).map((p) => ({
    enrollment_id: enrollmentId,
    nama_ekskul: p.nama_ekskul,
    predikat: randomPredikatEkskul(),
    keterangan: null,
  }));
}