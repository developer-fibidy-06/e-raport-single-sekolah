// ============================================================
// FILE PATH: src/lib/quick-fill-absensi.ts
// ============================================================
// Logic quick-fill Ketidakhadiran + Catatan Wali Kelas.
//
// Konsep sama dengan quick-fill-p5: level target → acak dengan
// range yang sesuai level. Hasil natural, bukan flat.
//
// Level:
//   - rajin:  hampir tidak pernah absen (0–2 hari total)
//   - biasa:  absen wajar (0–6 hari total)
//   - sering: absensi cukup tinggi (perlu perhatian, 4–13 hari)
//
// + Generator catatan wali kelas template-based per level.
// ============================================================

export type AbsensiLevel = "rajin" | "biasa" | "sering";

export const ABSENSI_LEVELS: readonly AbsensiLevel[] = [
  "rajin",
  "biasa",
  "sering",
] as const;

export const ABSENSI_LABEL: Record<
  AbsensiLevel,
  { short: string; full: string; desc: string }
> = {
  rajin: {
    short: "Rajin",
    full: "Sangat Rajin",
    desc: "Hampir selalu hadir, 0–2 hari absen",
  },
  biasa: {
    short: "Biasa",
    full: "Kehadiran Wajar",
    desc: "Absensi normal, 0–6 hari total",
  },
  sering: {
    short: "Sering",
    full: "Sering Absen",
    desc: "Perlu perhatian, 4–13 hari",
  },
};

// ─── Range acak per level ────────────────────────────────────
// Tiap level punya range [min, max] (inclusive) untuk sakit/izin/alpha.
// Dipilih supaya kombinasi total realistis per semester ~6 bulan.
const ABSENSI_RANGES: Record<
  AbsensiLevel,
  { sakit: [number, number]; izin: [number, number]; alpha: [number, number] }
> = {
  rajin: { sakit: [0, 1], izin: [0, 1], alpha: [0, 0] },
  biasa: { sakit: [0, 3], izin: [0, 2], alpha: [0, 1] },
  sering: { sakit: [2, 6], izin: [1, 4], alpha: [1, 3] },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateAbsensi(level: AbsensiLevel): {
  sakit: number;
  izin: number;
  alpha: number;
} {
  const r = ABSENSI_RANGES[level];
  return {
    sakit: randInt(r.sakit[0], r.sakit[1]),
    izin: randInt(r.izin[0], r.izin[1]),
    alpha: randInt(r.alpha[0], r.alpha[1]),
  };
}

// ============================================================
// CATATAN WALI KELAS GENERATOR — template-based per level
// ============================================================

const CATATAN_TEMPLATES: Record<AbsensiLevel, string[]> = {
  rajin: [
    "{{nama}} menunjukkan semangat belajar yang tinggi dan disiplin yang sangat baik. Ananda rajin hadir, tertib mengikuti pembelajaran, serta aktif dalam kegiatan kelas. Pertahankan kebiasaan positif ini dan terus kembangkan potensi diri.",
    "{{nama}} tampil sebagai sosok peserta didik yang tekun dan bertanggung jawab. Kehadiran yang konsisten, sikap santun, dan kemauan belajar yang kuat menjadi modal penting untuk semester berikutnya. Lanjutkan dengan penuh semangat.",
    "Ananda {{nama}} memiliki sikap disiplin dan kemauan belajar yang patut diapresiasi. Semester ini ananda menunjukkan kemajuan yang baik di berbagai mata pelajaran. Tetap semangat dan jaga konsistensi belajar di rumah maupun di sekolah.",
  ],
  biasa: [
    "{{nama}} mengikuti pembelajaran dengan cukup baik selama semester ini. Ananda diharapkan lebih aktif bertanya dan mengerjakan tugas tepat waktu. Dukungan orang tua untuk memotivasi belajar di rumah sangat dibutuhkan.",
    "Kehadiran dan partisipasi {{nama}} berjalan wajar. Ananda perlu meningkatkan kemandirian belajar dan fokus di kelas. Tingkatkan semangat dalam menyelesaikan tugas agar capaian belajar lebih optimal.",
    "{{nama}} menunjukkan perkembangan bertahap pada semester ini. Ananda mampu mengikuti pembelajaran, namun masih perlu meningkatkan ketekunan dan kedisiplinan. Kerja sama orang tua dan guru sangat diharapkan untuk mendukung kemajuan ananda.",
  ],
  sering: [
    "{{nama}} tercatat beberapa kali tidak hadir pada semester ini. Hal ini perlu menjadi perhatian bersama antara sekolah dan orang tua agar pembelajaran ananda tidak terganggu. Mohon dukungan orang tua untuk memastikan ananda hadir secara rutin.",
    "Kehadiran {{nama}} pada semester ini masih perlu ditingkatkan. Ananda disarankan untuk lebih rutin mengikuti pembelajaran agar tidak tertinggal materi. Komunikasi yang aktif antara orang tua dan wali kelas sangat membantu.",
    "{{nama}} menunjukkan potensi belajar yang baik, namun kehadiran yang kurang konsisten mempengaruhi capaian. Mohon perhatian orang tua untuk mendampingi ananda agar semangat hadir dan belajar kembali meningkat di semester berikutnya.",
  ],
};

function firstName(namaLengkap: string): string {
  return namaLengkap.trim().split(/\s+/)[0] || namaLengkap;
}

export function generateCatatanWali(
  level: AbsensiLevel,
  namaLengkap: string
): string {
  const templates = CATATAN_TEMPLATES[level];
  const picked = templates[Math.floor(Math.random() * templates.length)];
  return picked.replace(/\{\{nama\}\}/g, firstName(namaLengkap));
}