// ============================================================
// FILE PATH: src/components/features/rapor/rapor-pdf-document.tsx
// ============================================================
// REPLACE. v2.13 — FORMAT NIS/NISN GABUNGAN (konsisten Lembar 1 & 2).
//
// Perubahan dari v2.12:
//
//   1. ADD helper `formatNomorInduk(nis, nisn)`:
//      - Output: "025/3170093456" (tanpa spasi separator)
//      - Edge case kosong: ganti dengan "-"
//        • "025/-"         (NIS ada, NISN kosong)
//        • "-/3170093456"  (NIS kosong, NISN ada)
//        • "-/-"           (dua-duanya kosong)
//      - Auto-trim whitespace dari input
//
//   2. LEMBAR 1 (LembarRaportPage):
//      Sebelumnya: value={`${pd?.nis ?? "-"} / ${pd?.nisn ?? "-"}`}
//                  → "025 / 3170093456" (dengan spasi)
//      Sekarang:   value={formatNomorInduk(pd?.nis, pd?.nisn)}
//                  → "025/3170093456" (tanpa spasi)
//
//   3. LEMBAR 2 (LembarPropelaPage):
//      Sebelumnya: value={pd?.nisn ?? "-"}
//                  → cuma NISN doang (BUG, inconsistent vs Lembar 1)
//      Sekarang:   value={formatNomorInduk(pd?.nis, pd?.nisn)}
//                  → "025/3170093456" (gabung NIS+NISN, sama dgn Lembar 1)
//
//   4. LABEL DIUBAH: "Nomor Induk / NISN" → "Nomor Induk/NISN"
//      (tanpa spasi di slash, match reference asli rapor PKBM)
//
//   Schema DB tetep 2 kolom terpisah (peserta_didik.nis + .nisn).
//   Form input + CSV import tetep 2 field. Cuma display rapor PDF
//   yang gabung jadi 1 baris.
//
// CHANGELOG v2.12 (preserved):
//   REPEATING TABLE HEADER di Lembar 2 (Propela) untuk handle tabel
//   yg pecah cross-page. Pake `fixed` prop di propelaHeaderRow.
//
// CHANGELOG v2.9 (preserved):
//   TTD Lembar 1 (Raport) NOW JUGA PAKE TABLE GRID dengan VISIBLE
//   BORDERS, persis sama kayak Lembar 2 (Propela).
//
// CHANGELOG v2.8 (preserved):
//   - Lembar 2 TTD pake ttdTable grid (5×5, border visible)
//   - Tanggal masuk Row 1 Kolom 5 di Lembar 2
//
// CHANGELOG v2.6 (preserved):
//   - Ketidakhadiran ALWAYS halaman 2 via <View break>
//   - Catatan Wali Kelas banner CENTER
//   - Propela tabel anti garis-putus (per-row borders)
//
// CHANGELOG v2.4 (preserved):
//   - tanggalCetak prop required (per-paket)
// ============================================================

import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  Enrollment,
  PesertaDidik,
  RombonganBelajar,
  TahunPelajaran,
  SatuanPendidikan,
  Ekstrakurikuler,
  Ketidakhadiran,
  CatatanWaliKelas,
  CatatanP5,
  P5DimensiTree,
  KelompokMapel,
  PredikatP5,
} from "@/types";
import { styles } from "./rapor-pdf-styles";

// ============================================================
// TYPES
// ============================================================

type NilaiRow = {
  id: string;
  nilai_akhir: number | null;
  predikat: string | null;
  capaian_kompetensi: string | null;
  mata_pelajaran: {
    id: number;
    nama: string;
    urutan: number;
    kelompok: string;
    agama: string | null;
  } | null;
};

type EnrollmentFull = Enrollment & {
  peserta_didik: PesertaDidik;
  rombongan_belajar:
  | (RombonganBelajar & {
    tahun_pelajaran: Pick<TahunPelajaran, "id" | "nama" | "semester">;
  })
  | null;
};

export interface RaporPDFDocumentProps {
  enrollment: EnrollmentFull;
  sekolah: SatuanPendidikan | null;
  nilaiList: NilaiRow[];
  p5Tree: P5DimensiTree[];
  penilaianP5Map: Map<number, PredikatP5>;
  catatanP5: CatatanP5 | null;
  ekskulList: Ekstrakurikuler[];
  absensi: Ketidakhadiran | null;
  catatan: CatatanWaliKelas | null;
  /**
   * Tanggal cetak rapor (ISO string YYYY-MM-DD).
   * Sumber: tabel `tanggal_cetak_paket` (per paket per TP).
   */
  tanggalCetak: string;
}

// ============================================================
// HELPERS
// ============================================================

const PREDIKAT_P5_ORDER: PredikatP5[] = ["MB", "SB", "BSH", "SAB"];
const CHECK_GLYPH = "V";

const KELOMPOK_TITLE: Record<KelompokMapel, string> = {
  umum: "Kelompok Mata Pelajaran Umum",
  muatan_lokal: "Muatan Lokal",
  peminatan_ips: "Peminatan Ilmu-ilmu Sosial",
  khusus: "Kelompok Khusus",
};

function formatTanggal(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function parseTanggalCetak(iso: string): Date {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    throw new Error(
      `Format tanggal cetak tidak valid: "${iso}". ` +
      `Hubungi admin — kemungkinan data DB corrupt.`
    );
  }
  return d;
}

function romawi(n: number): string {
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return ROMAN[n] ?? String(n);
}

function formatKelas(tingkat: number, paralel: string | null | undefined): string {
  const r = romawi(tingkat);
  if (!paralel || paralel === "Tidak ada") return r;
  return `${r} ${paralel}`;
}

function semesterLabel(s: number): string {
  return s === 1 ? "1 (Ganjil)" : "2 (Genap)";
}

/**
 * Format NIS/NISN untuk display di rapor.
 * Output: "025/3170093456" (tanpa spasi separator).
 * Kalau salah satu/dua-duanya kosong → ganti dengan "-".
 *   - "025/-"          (NIS ada, NISN kosong)
 *   - "-/3170093456"   (NIS kosong, NISN ada)
 *   - "-/-"            (dua-duanya kosong)
 *
 * Auto-trim whitespace dari input. Whitespace doang dianggap
 * kosong → ganti "-".
 *
 * Catatan: schema DB simpan 2 kolom terpisah (peserta_didik.nis +
 * .nisn). Helper ini cuma untuk display gabungan di rapor PDF.
 * Form input + CSV import tetep 2 field terpisah.
 */
function formatNomorInduk(
  nis: string | null | undefined,
  nisn: string | null | undefined
): string {
  const nisStr = nis?.trim() || "-";
  const nisnStr = nisn?.trim() || "-";
  return `${nisStr}/${nisnStr}`;
}

// ============================================================
// ROOT DOCUMENT
// ============================================================

export function RaporPDFDocument(props: RaporPDFDocumentProps) {
  return (
    <Document
      title={`Rapor ${props.enrollment.peserta_didik?.nama_lengkap ?? ""}`}
      author={props.sekolah?.nama ?? "PKBM AL BARAKAH"}
    >
      <LembarRaportPage {...props} />
      <LembarPropelaPage {...props} />
    </Document>
  );
}

// ============================================================
// LEMBAR 1 — RAPORT
// ============================================================

function LembarRaportPage({
  enrollment,
  sekolah,
  nilaiList,
  ekskulList,
  absensi,
  catatan,
  tanggalCetak,
}: RaporPDFDocumentProps) {
  const pd = enrollment.peserta_didik;
  const rb = enrollment.rombongan_belajar;
  const tp = rb?.tahun_pelajaran;

  const siswaAgama: string | null = pd?.agama ?? null;

  const byKelompok: Record<KelompokMapel, NilaiRow[]> = {
    umum: [],
    muatan_lokal: [],
    peminatan_ips: [],
    khusus: [],
  };
  nilaiList.forEach((n) => {
    const mapel = n.mata_pelajaran;
    if (!mapel) return;
    if (mapel.agama && mapel.agama !== siswaAgama) return;
    const k = (mapel.kelompok as KelompokMapel) ?? "umum";
    if (byKelompok[k]) byKelompok[k].push(n);
  });
  (Object.keys(byKelompok) as KelompokMapel[]).forEach((k) => {
    byKelompok[k].sort(
      (a, b) =>
        (a.mata_pelajaran?.urutan ?? 99) - (b.mata_pelajaran?.urutan ?? 99)
    );
  });

  const kepalaPkbm = sekolah?.kepala_pkbm ?? "........................";
  const nipKepala = sekolah?.nip_kepala ?? "-";
  const waliKelasNm = rb?.wali_kelas ?? "........................";
  const kota = sekolah?.kota ?? sekolah?.kabupaten ?? "Madiun";
  const tanggalCetakDate = parseTanggalCetak(tanggalCetak);

  const alamatFull = [
    sekolah?.alamat,
    sekolah?.kecamatan ? `KEC. ${sekolah.kecamatan}` : null,
    sekolah?.kabupaten ? `KAB. ${sekolah.kabupaten}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.identitas}>
        <View style={styles.identitasColLeft}>
          <IdRow label="Nama Satuan Pendidikan" value={sekolah?.nama ?? "-"} />
          <IdRow label="Alamat" value={alamatFull || "-"} />
          <IdRow
            label="Nama Peserta Didik"
            value={pd?.nama_lengkap ?? "-"}
            bold
          />
          <IdRow
            label="Nomor Induk/NISN"
            value={formatNomorInduk(pd?.nis, pd?.nisn)}
          />
        </View>
        <View style={styles.identitasColRight}>
          <IdRow
            label="Kelas"
            value={rb ? formatKelas(rb.tingkat, rb.kelas_paralel) : "-"}
          />
          <IdRow
            label="Semester"
            value={tp ? semesterLabel(tp.semester) : "-"}
          />
          <IdRow label="Fase" value={rb?.fase?.replace("Fase ", "") ?? "-"} />
          <IdRow label="Tahun Pelajaran" value={tp?.nama ?? "-"} />
        </View>
      </View>

      <Text style={styles.sectionBanner}>A. Lembar Isi Mata Pelajaran</Text>

      <MapelTable
        rows={byKelompok.umum}
        subtitle={KELOMPOK_TITLE.umum}
        startNomor={1}
        resetNomor={false}
      />
      <MapelTable
        rows={byKelompok.muatan_lokal}
        subtitle={KELOMPOK_TITLE.muatan_lokal}
        startNomor={byKelompok.umum.length + 1}
        resetNomor={false}
      />
      <MapelTable
        rows={byKelompok.peminatan_ips}
        subtitle={KELOMPOK_TITLE.peminatan_ips}
        startNomor={
          byKelompok.umum.length + byKelompok.muatan_lokal.length + 1
        }
        resetNomor={false}
      />
      <MapelTable
        rows={byKelompok.khusus}
        subtitle={KELOMPOK_TITLE.khusus}
        startNomor={1}
        resetNomor={true}
      />

      <Text style={[styles.sectionBanner, styles.mt8]}>
        Kegiatan Ekstrakurikuler
      </Text>
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, styles.colEkskulNo]}>No</Text>
          <Text style={[styles.th, styles.colEkskulNama]}>
            Kegiatan Ekstrakurikuler
          </Text>
          <Text style={[styles.th, styles.colEkskulPredikat]}>Predikat</Text>
          <Text style={[styles.thLast, styles.colEkskulKet]}>Keterangan</Text>
        </View>
        {ekskulList.length === 0 ? (
          <View style={styles.trLast}>
            <Text
              style={[
                styles.tdLast,
                styles.tdCenter,
                styles.tdItalic,
                { width: "100%" },
              ]}
            >
              Tidak ada ekstrakurikuler
            </Text>
          </View>
        ) : (
          ekskulList.map((e, i) => {
            const isLast = i === ekskulList.length - 1;
            const rowStyle = isLast ? styles.trLast : styles.tr;
            return (
              <View key={e.id} style={rowStyle}>
                <Text style={[styles.td, styles.tdCenter, styles.colEkskulNo]}>
                  {i + 1}
                </Text>
                <Text style={[styles.td, styles.colEkskulNama]}>
                  {e.nama_ekskul}
                </Text>
                <Text
                  style={[styles.td, styles.tdCenter, styles.colEkskulPredikat]}
                >
                  {e.predikat ?? "-"}
                </Text>
                <Text style={[styles.tdLast, styles.colEkskulKet]}>
                  {e.keterangan ?? "-"}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View break>
        <Text style={styles.sectionBanner}>Ketidakhadiran</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, styles.colAbsenNo]}>No</Text>
            <Text style={[styles.th, styles.colAbsenLabel]}>Keterangan</Text>
            <Text style={[styles.thLast, styles.colAbsenVal]}>Jumlah</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, styles.tdCenter, styles.colAbsenNo]}>1</Text>
            <Text style={[styles.td, styles.colAbsenLabel]}>Izin</Text>
            <Text style={[styles.tdLast, styles.tdCenter, styles.colAbsenVal]}>
              {absensi?.izin ?? 0} hari
            </Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, styles.tdCenter, styles.colAbsenNo]}>2</Text>
            <Text style={[styles.td, styles.colAbsenLabel]}>Sakit</Text>
            <Text style={[styles.tdLast, styles.tdCenter, styles.colAbsenVal]}>
              {absensi?.sakit ?? 0} hari
            </Text>
          </View>
          <View style={styles.trLast}>
            <Text style={[styles.td, styles.tdCenter, styles.colAbsenNo]}>3</Text>
            <Text style={[styles.td, styles.colAbsenLabel]}>Alpa</Text>
            <Text style={[styles.tdLast, styles.tdCenter, styles.colAbsenVal]}>
              {absensi?.alpha ?? 0} hari
            </Text>
          </View>
        </View>

        {catatan?.catatan && (
          <>
            <Text style={[styles.sectionBannerCenter, styles.mt8]}>
              Catatan Wali Kelas
            </Text>
            <View style={styles.catatanBox}>
              <Text>{catatan.catatan}</Text>
            </View>
          </>
        )}

        {/* TTD LEMBAR 1 — Table grid 5×5 (no border, dari v2.9) */}
        <View style={styles.ttdTable}>
          {/* Row 1: header labels + tanggal */}
          <View style={styles.ttdTr}>
            <Text style={styles.ttdTdMain}>Orang Tua/Wali</Text>
            <View style={styles.ttdTdGutter} />
            <Text style={styles.ttdTdMain}>Mengetahui</Text>
            <View style={styles.ttdTdGutter} />
            <Text style={styles.ttdTdMainLast}>
              {kota}, {formatTanggal(tanggalCetakDate)}
            </Text>
          </View>

          {/* Row 2: sub-header (Kepala PKBM + Wali Kelas) */}
          <View style={styles.ttdTr}>
            <Text style={styles.ttdTdMain}>{" "}</Text>
            <View style={styles.ttdTdGutter} />
            <Text style={styles.ttdTdMain}>
              Kepala {sekolah?.nama ?? "PKBM Al Barakah"}
            </Text>
            <View style={styles.ttdTdGutter} />
            <Text style={styles.ttdTdMainLast}>Wali Kelas</Text>
          </View>

          {/* Row 3: signature space (tall, empty) */}
          <View style={[styles.ttdTr, styles.ttdSpaceTall]}>
            <Text style={styles.ttdTdMain}>{" "}</Text>
            <View style={styles.ttdTdGutter} />
            <Text style={styles.ttdTdMain}>{" "}</Text>
            <View style={styles.ttdTdGutter} />
            <Text style={styles.ttdTdMainLast}>{" "}</Text>
          </View>

          {/* Row 4: nama (bold) */}
          <View style={styles.ttdTr}>
            <Text style={[styles.ttdTdMain, styles.ttdNameBold]}>
              ........................
            </Text>
            <View style={styles.ttdTdGutter} />
            <Text style={[styles.ttdTdMain, styles.ttdNameBold]}>
              {kepalaPkbm}
            </Text>
            <View style={styles.ttdTdGutter} />
            <Text style={[styles.ttdTdMainLast, styles.ttdNameBold]}>
              {waliKelasNm}
            </Text>
          </View>

          {/* Row 5: NIP (last row, no border bottom) */}
          <View style={styles.ttdTrLast}>
            <Text style={styles.ttdTdMain}>{" "}</Text>
            <View style={styles.ttdTdGutter} />
            <Text style={[styles.ttdTdMain, styles.ttdNipSmall]}>
              NIP. {nipKepala}
            </Text>
            <View style={styles.ttdTdGutter} />
            <Text style={styles.ttdTdMainLast}>{" "}</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

function IdRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.identitasRow}>
      <Text style={styles.identitasLabel}>{label}</Text>
      <Text style={styles.identitasSep}>:</Text>
      <Text style={[styles.identitasValue, bold ? styles.bold : {}]}>
        {value}
      </Text>
    </View>
  );
}

function MapelTable({
  rows,
  subtitle,
  startNomor,
  resetNomor,
}: {
  rows: NilaiRow[];
  subtitle: string;
  startNomor: number;
  resetNomor: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <>
      <Text style={styles.subBanner}>{subtitle}</Text>
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text style={[styles.th, styles.colNo]}>No</Text>
          <Text style={[styles.th, styles.colNama]}>Mata Pelajaran</Text>
          <Text style={[styles.th, styles.colNA]}>NA</Text>
          <Text style={[styles.thLast, styles.colCapaian]}>
            Capaian Kompetensi
          </Text>
        </View>
        {rows.map((n, i) => {
          const isLast = i === rows.length - 1;
          const rowStyle = isLast ? styles.trLast : styles.tr;
          const nomor = resetNomor ? i + 1 : startNomor + i;
          return (
            <View key={n.id} style={rowStyle}>
              <Text style={[styles.td, styles.tdCenter, styles.colNo]}>
                {nomor}
              </Text>
              <Text style={[styles.td, styles.colNama]}>
                {n.mata_pelajaran?.nama ?? "-"}
              </Text>
              <Text style={[styles.td, styles.tdCenter, styles.colNA]}>
                {n.nilai_akhir ?? "-"}
              </Text>
              <Text style={[styles.tdLast, styles.colCapaian]}>
                {n.capaian_kompetensi ?? "-"}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

// ============================================================
// LEMBAR 2 — PROPELA
// ============================================================

function LembarPropelaPage({
  enrollment,
  sekolah,
  p5Tree,
  penilaianP5Map,
  catatanP5,
  tanggalCetak,
}: RaporPDFDocumentProps) {
  const pd = enrollment.peserta_didik;
  const rb = enrollment.rombongan_belajar;
  const tp = rb?.tahun_pelajaran;
  const waliKelasNm = rb?.wali_kelas ?? "........................";
  const kepalaPkbm = sekolah?.kepala_pkbm ?? "........................";
  const nipKepala = sekolah?.nip_kepala ?? "-";
  const kota = sekolah?.kota ?? sekolah?.kabupaten ?? "Madiun";
  const tanggalCetakDate = parseTanggalCetak(tanggalCetak);

  const alamatFull = [
    sekolah?.alamat,
    sekolah?.kecamatan ? `KEC. ${sekolah.kecamatan}` : null,
    sekolah?.kabupaten ? `KAB. ${sekolah.kabupaten}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.identitas}>
        <View style={styles.identitasColLeft}>
          <IdRow label="Nama Satuan Pendidikan" value={sekolah?.nama ?? "-"} />
          <IdRow label="Alamat" value={alamatFull || "-"} />
          <IdRow
            label="Nama Peserta Didik"
            value={pd?.nama_lengkap ?? "-"}
            bold
          />
          <IdRow
            label="Nomor Induk/NISN"
            value={formatNomorInduk(pd?.nis, pd?.nisn)}
          />
        </View>
        <View style={styles.identitasColRight}>
          <IdRow
            label="Kelas"
            value={rb ? formatKelas(rb.tingkat, rb.kelas_paralel) : "-"}
          />
          <IdRow
            label="Semester"
            value={tp ? semesterLabel(tp.semester) : "-"}
          />
          <IdRow label="Fase" value={rb?.fase?.replace("Fase ", "") ?? "-"} />
          <IdRow label="Tahun Pelajaran" value={tp?.nama ?? "-"} />
        </View>
      </View>

      <Text style={styles.sectionBanner}>
        B. Lembar Isi Capaian Dimensi Profil Pelajar Pancasila
      </Text>
      <Text style={styles.subBanner}>
        pada Muatan Pemberdayaan dan Keterampilan
      </Text>

      <View style={styles.propelaTableWrapper}>
        {/* v2.12: `fixed` prop → header row OTOMATIS di-render
            ulang di tiap halaman saat tabel pecah cross-page. */}
        <View style={styles.propelaHeaderRow} fixed wrap={false}>
          <Text style={[styles.thLeft, styles.colP5Desc]}>Sub-elemen</Text>
          {PREDIKAT_P5_ORDER.map((p, idx) => {
            const isLast = idx === PREDIKAT_P5_ORDER.length - 1;
            return (
              <Text
                key={p}
                style={[
                  isLast ? styles.thLast : styles.th,
                  styles.colP5Check,
                ]}
              >
                {p}
              </Text>
            );
          })}
        </View>

        {p5Tree.map((dim) => (
          <View key={dim.id}>
            <View wrap={false}>
              <Text style={styles.dimensiRow}>
                {dim.nomor}. {dim.nama}
              </Text>
            </View>

            {dim.elemen.map((el) => (
              <View key={el.id}>
                <View wrap={false}>
                  <Text style={styles.elemenRow}>Elemen: {el.nama}</Text>
                </View>

                {el.sub_elemen.length === 0 ? (
                  <View style={styles.propelaDataRow} wrap={false}>
                    <Text
                      style={[
                        styles.tdLast,
                        styles.tdItalic,
                        { width: "100%", textAlign: "center" },
                      ]}
                    >
                      Belum ada sub-elemen untuk fase ini.
                    </Text>
                  </View>
                ) : (
                  el.sub_elemen.map((sub) => {
                    const predikat = penilaianP5Map.get(sub.id);
                    return (
                      <View
                        key={sub.id}
                        style={styles.propelaDataRow}
                        wrap={false}
                      >
                        <Text style={[styles.td, styles.colP5Desc]}>
                          {sub.deskripsi}
                        </Text>
                        {PREDIKAT_P5_ORDER.map((p, idx) => {
                          const isCheck = predikat === p;
                          const isLastCol =
                            idx === PREDIKAT_P5_ORDER.length - 1;
                          return (
                            <Text
                              key={p}
                              style={[
                                isLastCol ? styles.tdLast : styles.td,
                                styles.tdCenter,
                                styles.colP5Check,
                                isCheck
                                  ? { fontSize: 12, fontWeight: "bold" }
                                  : { fontSize: 9 },
                              ]}
                            >
                              {isCheck ? CHECK_GLYPH : ""}
                            </Text>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      <Text style={[styles.sectionBanner, styles.mt8]}>
        Catatan Proses Perkembangan Profil Pelajar Pancasila
      </Text>
      <View style={styles.catatanBoxLarge}>
        <Text>
          {catatanP5?.catatan ||
            "(Catatan belum diisi oleh wali kelas — silakan isi via menu Penilaian.)"}
        </Text>
      </View>

      {/* TTD LEMBAR 2 — Table grid 5×5 (no border, dari v2.9) */}
      <View style={styles.ttdTable}>
        {/* Row 1: header labels + tanggal */}
        <View style={styles.ttdTr}>
          <Text style={styles.ttdTdMain}>Orang Tua/Wali</Text>
          <View style={styles.ttdTdGutter} />
          <Text style={styles.ttdTdMain}>Mengetahui</Text>
          <View style={styles.ttdTdGutter} />
          <Text style={styles.ttdTdMainLast}>
            {kota}, {formatTanggal(tanggalCetakDate)}
          </Text>
        </View>

        {/* Row 2: sub-header (Kepala PKBM + Wali Kelas) */}
        <View style={styles.ttdTr}>
          <Text style={styles.ttdTdMain}>{" "}</Text>
          <View style={styles.ttdTdGutter} />
          <Text style={styles.ttdTdMain}>
            Kepala {sekolah?.nama ?? "PKBM Al Barakah"}
          </Text>
          <View style={styles.ttdTdGutter} />
          <Text style={styles.ttdTdMainLast}>Wali Kelas</Text>
        </View>

        {/* Row 3: signature space (tall, empty) */}
        <View style={[styles.ttdTr, styles.ttdSpaceTall]}>
          <Text style={styles.ttdTdMain}>{" "}</Text>
          <View style={styles.ttdTdGutter} />
          <Text style={styles.ttdTdMain}>{" "}</Text>
          <View style={styles.ttdTdGutter} />
          <Text style={styles.ttdTdMainLast}>{" "}</Text>
        </View>

        {/* Row 4: nama (bold) */}
        <View style={styles.ttdTr}>
          <Text style={[styles.ttdTdMain, styles.ttdNameBold]}>
            ........................
          </Text>
          <View style={styles.ttdTdGutter} />
          <Text style={[styles.ttdTdMain, styles.ttdNameBold]}>
            {kepalaPkbm}
          </Text>
          <View style={styles.ttdTdGutter} />
          <Text style={[styles.ttdTdMainLast, styles.ttdNameBold]}>
            {waliKelasNm}
          </Text>
        </View>

        {/* Row 5: NIP (last row, no border bottom) */}
        <View style={styles.ttdTrLast}>
          <Text style={styles.ttdTdMain}>{" "}</Text>
          <View style={styles.ttdTdGutter} />
          <Text style={[styles.ttdTdMain, styles.ttdNipSmall]}>
            NIP. {nipKepala}
          </Text>
          <View style={styles.ttdTdGutter} />
          <Text style={styles.ttdTdMainLast}>{" "}</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendBoxBottom}>
        <Text style={styles.legendTitleBottom}>Keterangan:</Text>
        <Text style={styles.legendItemBottom}>
          Dimensi, elemen dan subelemen yang dinilai adalah yang dilakukan pada
          muatan pemberdayaan dan atau keterampilan berbasis profil pelajar
          Pancasila.
        </Text>
        <Text style={styles.legendItemBottom}>
          Centang pada kolom, jika pada subelemen:
        </Text>
        <Text style={styles.legendItemBottom}>
          <Text style={styles.bold}>MB (Mulai Berkembang)</Text>, bila peserta
          didik melakukannya harus dengan bimbingan atau dicontohkan oleh guru.
        </Text>
        <Text style={styles.legendItemBottom}>
          <Text style={styles.bold}>SB (Sedang Berkembang)</Text>, bila peserta
          didik melakukannya masih harus diingatkan atau dibantu oleh guru.
        </Text>
        <Text style={styles.legendItemBottom}>
          <Text style={styles.bold}>BSH (Berkembang Sesuai Harapan)</Text>, bila
          peserta didik sudah dapat melakukannya secara mandiri dapat konsisten
          tanpa harus diingatkan atau dicontohkan oleh guru.
        </Text>
        <Text style={styles.legendItemBottom}>
          <Text style={styles.bold}>SAB (Sangat Berkembang)</Text>, bila peserta
          didik sudah dapat melakukannya secara mandiri dan sudah dapat membantu
          temannya yang belum mencapai kemampuan sesuai dengan indikator yang
          diharapkan.
        </Text>
      </View>
    </Page>
  );
}