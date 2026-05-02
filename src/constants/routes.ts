// ============================================================
// FILE PATH: src/constants/routes.ts
// ============================================================
// REPLACE. Restore ROUTES.RAPOR (list/archive entry point).
// ============================================================

export const ROUTES = {
  // ── Public ──────────────────────────────────────────
  HOME: "/",
  LOGIN: "/login",

  // ── Dashboard ───────────────────────────────────────
  PROFILE: "/profile",
  SETTINGS: "/settings",

  // ── Admin (multi-tab, 1 halaman) ────────────────────
  ADMIN: "/admin",
  ADMIN_SATUAN_PENDIDIKAN: "/admin?tab=profil",
  ADMIN_TAHUN_KELAS: "/admin?tab=tahun-kelas",
  ADMIN_SISWA: "/admin?tab=siswa",
  ADMIN_MATA_PELAJARAN: "/admin?tab=mata-pelajaran",
  ADMIN_PREDIKAT: "/admin?tab=predikat",

  // ── Penilaian (edit hub: kelas → siswa → action) ────
  PENILAIAN: "/penilaian",
  PENILAIAN_KELAS: (kelasId: number | string) =>
    `/penilaian/${kelasId}`,
  PENILAIAN_SISWA: (kelasId: number | string, enrollmentId: string) =>
    `/penilaian/${kelasId}/${enrollmentId}`,

  // ── Rapor (archive: read-only browse + download ZIP per kelas) ──
  RAPOR: "/rapor",
  RAPOR_DETAIL: (enrollmentId: string) =>
    `/rapor/${enrollmentId}`,

  // ── Cetak (outside dashboard layout, clean print) ──────────────
  CETAK: (enrollmentId: string) =>
    `/cetak/${enrollmentId}`,
} as const;

// Type helper untuk route dinamis
export type DynamicRoute = ((...args: (string | number)[]) => string);