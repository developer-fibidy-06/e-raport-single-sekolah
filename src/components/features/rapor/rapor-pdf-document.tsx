// ============================================================
// FILE PATH: src/components/features/rapor/rapor-pdf-document.tsx
// ============================================================
// REPLACE. v2.4 — sync ke validasi tanggal cetak per paket.
//
// Perubahan dari versi sebelumnya:
//
//   1. RaporPDFDocumentProps: ADD field `tanggalCetak: string`
//      (dari `tanggal_cetak_paket` via useRaporFullData).
//
//   2. parseTanggalCetak() helper: SIMPLIFIED — tidak ada fallback
//      ke `new Date()`. Caller (useRaporFullData) GUARANTEE field
//      ini non-null + valid ISO string. Kalau parse fail (corrupt
//      data dari DB), tetap throw — gak silent fallback.
//
//   3. tahun_pelajaran subquery: HAPUS `tanggal_cetak`. Sekarang
//      tanggal cetak dari prop `tanggalCetak`, BUKAN dari TP.
//
//   4. Komentar deprecated dihapus, ganti dengan komentar v2.4.
//
//   5. Render TTD line: pakai `props.tanggalCetak` langsung,
//      gak lagi `tp?.tanggal_cetak`.
//
// Filosofi:
//   - PDF doc sekarang DUMB COMPONENT. Trust caller 100% untuk
//     validasi & data correctness.
//   - Tidak ada fallback NOW() yang bikin output "look fine"
//     padahal data hilang.
//
// Sisa logic (formatKelas, religion isolation, mapel grouping,
// PROPELA rendering) TIDAK BERUBAH dari versi sebelumnya.
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
   * v2.4: Tanggal cetak rapor (ISO string YYYY-MM-DD).
   * Dijamin non-null oleh caller (useRaporFullData throw error
   * sebelum data sampai ke component kalau tanggal kosong).
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

/**
 * v2.4: Parse ISO date string (YYYY-MM-DD) jadi Date object.
 *
 * Caller (useRaporFullData) GUARANTEE input non-null & format valid.
 * Kalau parse fail (data corrupt di DB / format aneh), throw error
 * eksplisit BUKAN fallback ke new Date() — biar bug ke-detect early.
 */
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

  // Religion isolation — siswa cuma liat mapel agama yang match
  const siswaAgama: string | null = pd?.agama ?? null;

  // Group mapel by kelompok
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
      {/* Identitas */}
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
            label="Nomor Induk / NISN"
            value={`${pd?.nis ?? "-"} / ${pd?.nisn ?? "-"}`}
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

      {/* Section A */}
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

      {/* Ekstrakurikuler */}
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

      {/* Ketidakhadiran */}
      <Text style={[styles.sectionBanner, styles.mt8]}>Ketidakhadiran</Text>
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
          <Text style={[styles.sectionBanner, styles.mt8]}>
            Catatan Wali Kelas
          </Text>
          <View style={styles.catatanBox}>
            <Text>{catatan.catatan}</Text>
          </View>
        </>
      )}

      {/* Tanggal cetak — v2.4: dari prop tanggalCetak (per paket) */}
      <Text style={styles.tglLine}>
        {kota}, {formatTanggal(tanggalCetakDate)}
      </Text>

      {/* TTD lembar 1 */}
      <View style={styles.ttdWrap}>
        <View style={styles.ttdCol}>
          <Text style={styles.ttdLabel}>Orang Tua/Wali</Text>
          <View style={styles.ttdSpace} />
          <Text style={styles.ttdName}>{"........................"}</Text>
        </View>
        <View style={styles.ttdColCenter}>
          <Text style={styles.ttdLabel}>Mengetahui</Text>
          <Text style={styles.ttdLabel}>
            Kepala {sekolah?.nama ?? "PKBM Al Barakah"}
          </Text>
          <View style={styles.ttdSpace} />
          <Text style={styles.ttdName}>{kepalaPkbm}</Text>
          <Text style={styles.ttdSub}>NIP. {nipKepala}</Text>
        </View>
        <View style={styles.ttdCol}>
          <Text style={styles.ttdLabel}>Wali Kelas</Text>
          <View style={styles.ttdSpace} />
          <Text style={styles.ttdName}>{waliKelasNm}</Text>
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
          <IdRow label="Nomor Induk / NISN" value={pd?.nisn ?? "-"} />
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
        <View style={styles.tr}>
          <Text style={[styles.th, styles.colP5Desc]}>Sub-elemen</Text>
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

        {p5Tree.map((dim, dimIdx) => {
          const isLastDim = dimIdx === p5Tree.length - 1;
          return (
            <View key={dim.id}>
              <Text style={styles.dimensiRow}>
                {dim.nomor}. {dim.nama}
              </Text>

              {dim.elemen.map((el, elIdx) => {
                const isLastEl = elIdx === dim.elemen.length - 1;
                return (
                  <View key={el.id}>
                    <Text style={styles.elemenRow}>Elemen: {el.nama}</Text>

                    {el.sub_elemen.length === 0 ? (
                      <View
                        style={
                          isLastDim && isLastEl ? styles.trLast : styles.tr
                        }
                      >
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
                      el.sub_elemen.map((sub, i) => {
                        const isLastSub = i === el.sub_elemen.length - 1;
                        const isAbsoluteLast =
                          isLastDim && isLastEl && isLastSub;
                        const rowStyle = isAbsoluteLast
                          ? styles.trLast
                          : styles.tr;
                        const predikat = penilaianP5Map.get(sub.id);
                        return (
                          <View key={sub.id} style={rowStyle}>
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
                );
              })}
            </View>
          );
        })}
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

      {/* TTD Wali Kelas — v2.4: tanggal dari prop tanggalCetak */}
      <View style={styles.ttdWrapRight}>
        <View style={styles.ttdColRightAligned}>
          <Text style={styles.tglLineLeft}>
            {kota}, {formatTanggal(tanggalCetakDate)}
          </Text>
          <Text style={styles.ttdLabelLeft}>Wali Kelas</Text>
          <View style={styles.ttdSpace} />
          <Text style={styles.ttdNameLeft}>{waliKelasNm}</Text>
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