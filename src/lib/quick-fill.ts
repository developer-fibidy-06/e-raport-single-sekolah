// ============================================================
// FILE PATH: src/lib/quick-fill.ts
// ============================================================
// Konfigurasi Quick-Fill Nilai Mapel.
//
// Semua angka di sini sengaja dikelompokkan di satu file supaya:
//   1. Mudah diubah kalau PKBM ganti konvensi.
//   2. Siap di-migrate ke tabel DB (`predikat_quickfill_range`) di masa depan
//      tanpa harus nyebar di banyak komponen.
//
// Range mengikuti konvensi PKBM Al Barakah: semua siswa layak ≥ 70,
// dan ruang nilai efektif 70–100 dipecah jadi 4 kategori perkembangan.
// ============================================================

import type { PredikatP5 } from "@/types";

/** Range nilai (inclusive) per predikat perkembangan. */
export const QUICK_FILL_RANGES: Record<PredikatP5, { min: number; max: number }> = {
  MB: { min: 70, max: 74 }, // Mulai Berkembang      → predikat C (Cukup)
  SB: { min: 76, max: 80 }, // Sedang Berkembang     → predikat B (batas bawah)
  BSH: { min: 82, max: 88 }, // Berkembang Sesuai Harapan → predikat B
  SAB: { min: 90, max: 96 }, // Sangat Berkembang     → predikat A
};

/** Label UI per predikat perkembangan. */
export const QUICK_FILL_LABELS: Record<PredikatP5, { label: string; desc: string }> = {
  MB: { label: "MB", desc: "Mulai Berkembang" },
  SB: { label: "SB", desc: "Sedang Berkembang" },
  BSH: { label: "BSH", desc: "Berkembang Sesuai Harapan" },
  SAB: { label: "SAB", desc: "Sangat Berkembang" },
};

/** Default level yang di-highlight di panel (paling sering dipakai). */
export const QUICK_FILL_DEFAULT: PredikatP5 = "BSH";

/**
 * Generate nilai random integer dalam range predikat tertentu.
 * Pakai `Math.random` — tidak perlu crypto-secure, cukup untuk variasi visual
 * biar 12 mapel tidak flat 85-85-85 semua.
 */
export function generateNilai(level: PredikatP5): number {
  const { min, max } = QUICK_FILL_RANGES[level];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const QUICK_FILL_LEVELS: readonly PredikatP5[] = ["MB", "SB", "BSH", "SAB"] as const;