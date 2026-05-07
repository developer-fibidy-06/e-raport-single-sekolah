// ============================================================
// FILE PATH: src/components/features/rapor/rapor-pdf-styles.ts
// ============================================================
// REPLACE. v2.11 — REVERT v2.10. `alignItems: "center"` di tr
// bikin border kanan tiap cell patah-patah (cell shrink ke tinggi
// konten, gak stretch ke tinggi row penuh). User reject visual-nya.
//
// Layout TOP-ALIGN (default flex stretch) tetep dipake — itu
// memang standar tabel rapor: text di kolom pendek mulai dari
// atas, sejajar dengan baris-1 kolom Capaian. Border kanan
// nyambung utuh dari atas ke bawah row.
//
// CHANGELOG v2.10 (REVERTED):
// Tambah `alignItems: "center"` di tr/trLast — DITOLAK karena
// merusak border. Lessons learned: di React-PDF, alignItems
// non-stretch di parent flex bikin child <Text> shrink ke
// content height, padahal border ikut child → patah.
//
// CHANGELOG v2.9 (preserved):
// TTD TABLE NO BORDER. Structure tabel tetap (cell widths,
// padding, alignment, jumlah baris/kolom), tapi garis hitamnya
// DIHILANGKAN — borderWidth set ke 0 di semua ttdTable* styles.
//
// Perubahan dari v2.8:
//
//   1. ttdTable          : borderWidth 1 → 0
//   2. ttdTr             : borderBottomWidth 1 → 0
//   3. ttdTdMain         : borderRightWidth 1 → 0
//   4. ttdTdGutter       : borderRightWidth 1 → 0
//
//   Style ttdTrLast & ttdTdMainLast tidak berubah (memang
//   udah no-border sejak v2.8).
//
//   Properti border lainnya (borderColor) dipertahankan
//   sebagai dokumentasi — tidak berdampak visual karena width=0.
//
//   Cell widths, padding, fontSize, textAlign, ttdSpaceTall
//   (minHeight 45), ttdNameBold, ttdNipSmall — SEMUA UTUH.
//
// CATATAN:
//   - Lembar 1 (Raport) & Lembar 2 (Propela) sama-sama pake
//     ttdTable, jadi perubahan ini berdampak ke KEDUA lembar.
//
// CHANGELOG v2.8 (preserved):
//   - TTD Lembar 2 jadi proper table grid 5×5 dengan border.
//     Border-nya sekarang dihapus di v2.9 per request user.
//
// CHANGELOG v2.7 (preserved):
//   - Lembar 2 TTD pake ttdWrap/ttdCol — DI-OVERRIDE v2.8
//
// CHANGELOG v2.6 (preserved):
//   - propelaTableWrapper tanpa border (anti garis-putus)
//   - sectionBannerCenter variant (Catatan Wali Kelas center)
//
// CHANGELOG v2.5 (preserved): banner section/sub rata kiri,
// thLeft variant, TTD propela compact.
// ============================================================

import { StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/NotoSans-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/NotoSans-Bold.ttf", fontWeight: "bold" },
    { src: "/fonts/NotoSans-Italic.ttf", fontStyle: "italic" },
  ],
});

export const COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  border: "#000000",
  borderLight: "#666666",
  bgHeader: "#FFD965",
  bgSection: "#FFE598",
  bgRow: "#F9FAFB",
  muted: "#6B7280",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 9,
    padding: 32,
    color: COLORS.black,
    lineHeight: 1.3,
  },

  // ── IDENTITAS (NO BORDER) ───────────────────────────────
  identitas: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 10,
    marginTop: 4,
  },
  identitasColLeft: {
    flex: 1.6,
    flexDirection: "column",
    gap: 3,
  },
  identitasColRight: {
    flex: 1,
    flexDirection: "column",
    gap: 3,
  },
  identitasCol: {
    flex: 1,
    flexDirection: "column",
    gap: 3,
  },
  identitasRow: {
    flexDirection: "row",
    fontSize: 9,
    minHeight: 12,
  },
  identitasLabel: {
    width: "40%",
    fontWeight: "bold",
  },
  identitasSep: {
    width: "3%",
  },
  identitasValue: {
    flex: 1,
  },

  // ── SECTION BANNER (rata KIRI — default) ──────────────
  sectionBanner: {
    backgroundColor: COLORS.bgHeader,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "left",
    borderWidth: 1,
    borderColor: COLORS.black,
    marginTop: 8,
    marginBottom: 0,
  },
  sectionBannerCenter: {
    backgroundColor: COLORS.bgHeader,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "center",
    borderWidth: 1,
    borderColor: COLORS.black,
    marginTop: 8,
    marginBottom: 0,
  },
  subBanner: {
    backgroundColor: COLORS.bgSection,
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontWeight: "bold",
    fontSize: 9,
    textAlign: "left",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.black,
  },

  // ── TABLE — STANDARD (Lembar 1) ────────────────────────
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.black,
    borderTopWidth: 0,
    marginBottom: 2,
  },
  tableStandalone: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.black,
    marginBottom: 4,
  },

  // ── TABLE — PROPELA (cross-page safe) ──────────────────
  propelaTableWrapper: {
    width: "100%",
    marginBottom: 8,
  },
  propelaHeaderRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.black,
  },
  propelaDataRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.black,
  },
  dimensiRow: {
    backgroundColor: COLORS.bgHeader,
    padding: 3,
    fontWeight: "bold",
    fontSize: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.black,
  },
  elemenRow: {
    backgroundColor: COLORS.bgSection,
    padding: 3,
    fontWeight: "bold",
    fontStyle: "italic",
    fontSize: 9,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.black,
  },

  // ── TR / TD ─────────────────────────────────────────────
  // CATATAN v2.11: TIDAK pake alignItems di sini. Default
  // flex `stretch` WAJIB supaya cell stretch ke tinggi row →
  // border kanan nyambung dari atas ke bawah. Coba `center`
  // di v2.10 → border patah, ditolak user. Revert.
  //
  // Konsekuensi: text di cell pendek (No, Mapel, NA) align
  // ke TOP relatif baris terpanjang (Capaian). Ini standar
  // layout tabel rapor, dan visual-nya rapi karena border
  // utuh.
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black,
  },
  trLast: {
    flexDirection: "row",
  },
  th: {
    padding: 3,
    fontWeight: "bold",
    fontSize: 8.5,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: COLORS.black,
    backgroundColor: COLORS.bgSection,
  },
  thLast: {
    padding: 3,
    fontWeight: "bold",
    fontSize: 8.5,
    textAlign: "center",
    backgroundColor: COLORS.bgSection,
  },
  thLeft: {
    padding: 3,
    paddingHorizontal: 6,
    fontWeight: "bold",
    fontSize: 8.5,
    textAlign: "left",
    borderRightWidth: 1,
    borderRightColor: COLORS.black,
    backgroundColor: COLORS.bgSection,
  },
  thLeftLast: {
    padding: 3,
    paddingHorizontal: 6,
    fontWeight: "bold",
    fontSize: 8.5,
    textAlign: "left",
    backgroundColor: COLORS.bgSection,
  },
  td: {
    padding: 3,
    fontSize: 8.5,
    borderRightWidth: 1,
    borderRightColor: COLORS.black,
  },
  tdLast: {
    padding: 3,
    fontSize: 8.5,
  },
  tdCenter: {
    textAlign: "center",
  },
  tdItalic: {
    fontStyle: "italic",
    color: COLORS.muted,
  },

  // ── Column widths (Mapel) ──────────────────────────────
  colNo: { width: "6%" },
  colNama: { width: "34%" },
  colNA: { width: "10%" },
  colCapaian: { width: "50%" },

  colEkskulNo: { width: "6%" },
  colEkskulNama: { width: "30%" },
  colEkskulPredikat: { width: "14%" },
  colEkskulKet: { width: "50%" },

  colAbsenNo: { width: "10%" },
  colAbsenLabel: { width: "60%" },
  colAbsenVal: { width: "30%" },

  colP5Desc: { width: "64%" },
  colP5Check: { width: "9%" },

  // ── TTD (Lembar 1 LAMA — flex no-border, DEAD CODE setelah v2.9
  //    karena Lembar 1 udah migrate ke ttdTable. Dipertahankan
  //    untuk kemudahan rollback.) ─────────────────────────
  ttdWrap: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  ttdCol: {
    flex: 1,
    alignItems: "center",
    fontSize: 9,
  },
  ttdColCenter: {
    flex: 1.2,
    alignItems: "center",
    fontSize: 9,
  },
  ttdLabel: {
    marginBottom: 4,
  },
  ttdSpace: {
    height: 50,
  },
  ttdName: {
    fontWeight: "bold",
    textDecoration: "underline",
    textAlign: "center",
  },
  ttdSub: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // ╔════════════════════════════════════════════════════╗
  // ║ v2.9: TTD TABLE — NO BORDER                        ║
  // ║                                                    ║
  // ║ Structure tabel UTUH (5 kolom × 5 baris, cell      ║
  // ║ widths, padding, alignment, ttdSpaceTall, dst).   ║
  // ║ Yang berubah cuma borderWidth → 0 di semua style. ║
  // ║                                                    ║
  // ║ Dipake di Lembar 1 (Raport) & Lembar 2 (Propela). ║
  // ╚════════════════════════════════════════════════════╝
  ttdTable: {
    width: "100%",
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 0,
    borderColor: COLORS.black,
  },
  ttdTr: {
    flexDirection: "row",
    borderBottomWidth: 0,
    borderBottomColor: COLORS.black,
  },
  ttdTrLast: {
    flexDirection: "row",
  },
  // Cell konten utama (Orang Tua/Wali, Mengetahui, Wali Kelas)
  ttdTdMain: {
    width: "31%",
    padding: 4,
    fontSize: 9,
    textAlign: "center",
    borderRightWidth: 0,
    borderRightColor: COLORS.black,
  },
  // Cell konten paling kanan — no border kanan (dihandle wrapper)
  ttdTdMainLast: {
    width: "31%",
    padding: 4,
    fontSize: 9,
    textAlign: "center",
  },
  // Cell gutter sempit antar kolom konten
  ttdTdGutter: {
    width: "3.5%",
    padding: 4,
    borderRightWidth: 0,
    borderRightColor: COLORS.black,
  },
  // Modifier untuk row signature space (taller height)
  ttdSpaceTall: {
    minHeight: 45,
  },
  // Variant nama bold (untuk row 4 di TTD table)
  ttdNameBold: {
    fontWeight: "bold",
  },
  // Variant NIP — smaller font, muted
  ttdNipSmall: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // ── TTD (Propela LAMA — DEAD CODE, dipertahankan utk rollback) ──
  ttdWrapRight: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  ttdColRightAligned: {
    width: "38%",
    alignItems: "flex-start",
    fontSize: 9,
  },
  ttdLabelLeft: {
    textAlign: "left",
    marginBottom: 0,
  },
  ttdNameLeft: {
    fontWeight: "bold",
    textAlign: "left",
  },
  ttdSpaceSmall: {
    height: 35,
  },

  // ── TANGGAL ────────────────────────────────────────────
  tglLine: {
    fontSize: 9,
    textAlign: "right",
    marginTop: 10,
    marginBottom: 4,
  },
  tglLineLeft: {
    fontSize: 9,
    textAlign: "left",
    marginBottom: 0,
  },

  // ── CATATAN BOX (Lembar 1 & Propela Catatan Proses) ───
  catatanBox: {
    borderWidth: 1,
    borderColor: COLORS.black,
    padding: 6,
    fontSize: 9,
    minHeight: 40,
    marginBottom: 8,
  },
  catatanBoxLarge: {
    borderWidth: 1,
    borderColor: COLORS.black,
    padding: 8,
    fontSize: 9,
    minHeight: 60,
    marginBottom: 10,
  },

  // ── LEGEND BOTTOM (PLAIN, NO BORDER) ──────────────────
  legendBoxBottom: {
    marginTop: 16,
    fontSize: 8.5,
  },
  legendTitleBottom: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 9,
  },
  legendItemBottom: {
    marginBottom: 3,
    lineHeight: 1.35,
  },

  // ── DEPRECATED but kept for compat ─────────────────────
  legendBox: {
    borderWidth: 1,
    borderColor: COLORS.black,
    padding: 5,
    marginBottom: 8,
    fontSize: 8.5,
  },
  legendTitle: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  legendItem: {
    marginBottom: 1,
  },
  legendLabel: {
    fontWeight: "bold",
  },
  dimensiTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 2,
    padding: 3,
    backgroundColor: COLORS.bgHeader,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  elemenTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 4,
    marginBottom: 2,
    fontStyle: "italic",
  },

  // ── UTILITY ────────────────────────────────────────────
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  textCenter: { textAlign: "center" },
  textRight: { textAlign: "right" },
  textLeft: { textAlign: "left" },
  muted: { color: COLORS.muted },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
});