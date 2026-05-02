// ============================================================
// FILE PATH: src/components/features/rapor/rapor-pdf-styles.ts
// ============================================================
// FINAL VERSION. Perubahan dari sebelumnya:
//   1. PROPELA: tabel "nempel" — tambah style tableConnected,
//      trConnected, dimensiTitleConnected biar semua border
//      continuous dari dimensi → elemen → sub-elemen
//   2. TTD KANAN BAWAH: ttdColRightAligned — block di posisi kanan
//      halaman tapi isinya rata KIRI (bukan center)
//   3. LEGEND BOTTOM: hapus border, jadi plain text section
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

  // ── SECTION BANNER ─────────────────────────────────────
  sectionBanner: {
    backgroundColor: COLORS.bgHeader,
    padding: 4,
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
    padding: 3,
    fontWeight: "bold",
    fontSize: 9,
    textAlign: "center",
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

  // ── TABLE — CONNECTED (Propela, no gap antar section) ──
  // Container luar yang bungkus semua dimensi sebagai 1 kesatuan
  propelaTableWrapper: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.black,
    borderTopWidth: 0, // connect ke subBanner di atasnya
    marginBottom: 8,
  },
  // Dimensi title di dalam propela — jadi row header, bukan block terpisah
  dimensiRow: {
    backgroundColor: COLORS.bgHeader,
    padding: 3,
    fontWeight: "bold",
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black,
  },
  // Elemen title di dalam propela — row sub-header
  elemenRow: {
    backgroundColor: COLORS.bgSection,
    padding: 3,
    fontWeight: "bold",
    fontStyle: "italic",
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black,
  },

  // ── TR / TD ─────────────────────────────────────────────
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

  // ── TTD (Lembar 1 — 3 kolom center) ───────────────────
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

  // ── TTD (Propela — posisi KANAN, isi rata KIRI) ──────
  ttdWrapRight: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end", // push block ke kanan
  },
  ttdColRightAligned: {
    width: "45%", // lebar block ~45% halaman
    alignItems: "flex-start", // isi rata KIRI di dalam block
    fontSize: 9,
  },
  ttdLabelLeft: {
    textAlign: "left",
    marginBottom: 2,
  },
  ttdNameLeft: {
    fontWeight: "bold",
    textAlign: "left", // nama rata KIRI, bukan center
  },

  // ── TANGGAL ────────────────────────────────────────────
  tglLine: {
    fontSize: 9,
    textAlign: "right",
    marginTop: 10,
    marginBottom: 4,
  },
  // Untuk propela — tanggal di block TTD kanan, rata kiri
  tglLineLeft: {
    fontSize: 9,
    textAlign: "left",
    marginBottom: 2,
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
    // no border — plain text block
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