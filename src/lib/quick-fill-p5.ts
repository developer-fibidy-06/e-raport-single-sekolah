// ============================================================
// FILE PATH: src/lib/quick-fill-p5.ts
// ============================================================
// P5 quick-fill dengan slider level target.
//
// Konsep:
//   - User geser slider ke salah satu dari 4 level (MB/SB/BSH/SAB)
//   - Setiap sub-elemen diacak dengan BOBOT yang condong ke level target
//   - Hasil: tampilan "natural" — mayoritas di level target, sebagian
//     kecil spill ke level tetangga, hampir nol ke level jauh
//
// Contoh target = BSH:
//   ~60% sub-elemen jadi BSH
//   ~25% spill ke SB (tetangga bawah)
//   ~12% spill ke SAB (tetangga atas)
//   ~3% ke MB (jauh)
//
// + Generator catatan naratif template-based pakai nama siswa +
//   level target.
// ============================================================

import type { PredikatP5 } from "@/types";

// ─── Constants ───────────────────────────────────────────────

export const P5_LEVELS: readonly PredikatP5[] = ["MB", "SB", "BSH", "SAB"] as const;

export const P5_LABEL: Record<
  PredikatP5,
  { short: string; full: string; desc: string }
> = {
  MB: {
    short: "MB",
    full: "Mulai Berkembang",
    desc: "Perlu bimbingan intensif",
  },
  SB: {
    short: "SB",
    full: "Sedang Berkembang",
    desc: "Berkembang bertahap, perlu pendampingan",
  },
  BSH: {
    short: "BSH",
    full: "Berkembang Sesuai Harapan",
    desc: "Sesuai target usia & fase",
  },
  SAB: {
    short: "SAB",
    full: "Sangat Berkembang",
    desc: "Melampaui target, jadi teladan",
  },
};

// ─── Weighted distribution per target ────────────────────────
// Baris = level target (yang user pilih di slider)
// Kolom = probabilitas hasil acak untuk tiap sub-elemen
//
// Dominan ~60% di target, ~25% tetangga dekat, sisanya spill tipis.
// Total per row = 1.0
const WEIGHTS: Record<PredikatP5, Record<PredikatP5, number>> = {
  MB: { MB: 0.65, SB: 0.28, BSH: 0.06, SAB: 0.01 },
  SB: { MB: 0.15, SB: 0.58, BSH: 0.22, SAB: 0.05 },
  BSH: { MB: 0.03, SB: 0.25, BSH: 0.60, SAB: 0.12 },
  SAB: { MB: 0.01, SB: 0.07, BSH: 0.32, SAB: 0.60 },
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Ambil 1 predikat random yang weighted ke target.
 */
export function randomPredikatP5(target: PredikatP5): PredikatP5 {
  const row = WEIGHTS[target];
  const r = Math.random();
  let cum = 0;
  for (const level of P5_LEVELS) {
    cum += row[level];
    if (r < cum) return level;
  }
  return target; // fallback
}

/**
 * Generate batch predikat untuk N sub-elemen.
 * Return: array of { subElemenId, predikat }
 */
export function generateP5Batch(
  subElemenIds: number[],
  target: PredikatP5
): Array<{ sub_elemen_id: number; predikat: PredikatP5 }> {
  return subElemenIds.map((id) => ({
    sub_elemen_id: id,
    predikat: randomPredikatP5(target),
  }));
}

// ============================================================
// CATATAN P5 GENERATOR — template-based
// ============================================================

/**
 * Template catatan per level target.
 * Tiap level punya 3 variasi biar tidak identik antar siswa.
 * {{nama}} akan di-replace sama nama depan siswa.
 */
const CATATAN_TEMPLATES: Record<PredikatP5, string[]> = {
  MB: [
    "{{nama}} menunjukkan awal perkembangan profil pelajar Pancasila. Perlu bimbingan lebih intensif agar tumbuh karakter yang mandiri, bernalar kritis, dan berakhlak mulia. Diharapkan dukungan orang tua dan pendampingan guru dapat mempercepat proses perkembangannya.",
    "Proses perkembangan {{nama}} masih dalam tahap awal. Karakter Profil Pelajar Pancasila mulai terlihat namun belum konsisten. Perlu dampingan berkelanjutan dari guru dan orang tua untuk menguatkan nilai-nilai iman, mandiri, gotong royong, dan bernalar kritis.",
    "{{nama}} berada pada tahap mulai berkembang. Perlu pembiasaan yang konsisten dan bimbingan aktif agar enam dimensi Profil Pelajar Pancasila dapat terinternalisasi dengan baik pada kegiatan sehari-hari.",
  ],
  SB: [
    "{{nama}} memperlihatkan perkembangan yang baik pada Profil Pelajar Pancasila. Karakter mandiri, bernalar kritis, dan gotong royong sudah mulai tampak dalam keseharian. Perlu pendampingan lanjutan agar kemampuan tersebut semakin matang dan konsisten.",
    "Perkembangan {{nama}} berjalan sesuai proses. Nilai-nilai Profil Pelajar Pancasila terlihat berkembang bertahap, khususnya pada dimensi akhlak mulia dan gotong royong. Dengan dukungan yang berkesinambungan, ananda diharapkan mencapai tahap berkembang sesuai harapan.",
    "{{nama}} menunjukkan kemajuan positif dalam enam dimensi Profil Pelajar Pancasila. Beberapa aspek sudah terlihat baik, sementara aspek lain masih dalam tahap penguatan. Pendampingan lanjut dari guru dan orang tua sangat dibutuhkan.",
  ],
  BSH: [
    "{{nama}} telah menunjukkan perkembangan Profil Pelajar Pancasila sesuai harapan. Ananda tampak mandiri, mampu bekerja sama, bernalar kritis, serta menunjukkan akhlak mulia dalam kehidupan sehari-hari. Kekuatan ini perlu terus dipertahankan dan dikembangkan.",
    "Perkembangan {{nama}} sudah berada pada tahap sesuai harapan. Karakter beriman, mandiri, bergotong royong, dan bernalar kritis terlihat konsisten dalam berbagai kegiatan pembelajaran maupun non-akademik. Pertahankan capaian ini.",
    "{{nama}} menampilkan karakter Profil Pelajar Pancasila yang sesuai dengan target fase. Ananda aktif, kreatif, dan menunjukkan sikap kebhinekaan global yang baik. Semoga perkembangan ini terus berkelanjutan di semester berikutnya.",
  ],
  SAB: [
    "{{nama}} menunjukkan perkembangan Profil Pelajar Pancasila yang sangat baik dan melampaui target fase. Ananda menjadi teladan bagi teman-temannya dalam hal kemandirian, kreativitas, gotong royong, dan akhlak mulia. Capaian luar biasa ini patut diapresiasi.",
    "Perkembangan {{nama}} sangat membanggakan. Seluruh dimensi Profil Pelajar Pancasila — beriman, berkebhinekaan global, bergotong royong, mandiri, bernalar kritis, dan kreatif — tampil konsisten dan menonjol. Ananda dapat menjadi role model bagi peserta didik lainnya.",
    "{{nama}} tampil sangat menonjol dalam enam dimensi Profil Pelajar Pancasila. Kepemimpinan, inisiatif, dan empati ananda melampaui ekspektasi fase saat ini. Dukungan agar capaian ini terus terjaga sangat diharapkan dari lingkungan keluarga dan sekolah.",
  ],
};

/**
 * Ambil nama depan dari nama_lengkap.
 * "Muhammad Rizki Pratama" → "Muhammad"
 */
function firstName(namaLengkap: string): string {
  return namaLengkap.trim().split(/\s+/)[0] || namaLengkap;
}

/**
 * Generate catatan naratif berdasar level target + nama siswa.
 * Pilih 1 template random dari 3 variasi tiap level.
 */
export function generateCatatanP5(
  target: PredikatP5,
  namaLengkap: string
): string {
  const templates = CATATAN_TEMPLATES[target];
  const picked = templates[Math.floor(Math.random() * templates.length)];
  return picked.replace(/\{\{nama\}\}/g, firstName(namaLengkap));
}