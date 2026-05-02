// ============================================================
// FILE PATH: src/types/index.ts
// ============================================================
// REPLACE. Sync ke schema v2.1:
//   - KelompokMapel: tambah "muatan_lokal" (Paket B convention)
//   - NilaiMapelWithMapel: drop `kode` dari pick mata_pelajaran,
//     drop kompetensi_dasar relation (FK di-drop di v2.1)
// ============================================================

export type { Database, Tables, InsertDto, UpdateDto, Json } from "./database";

import type { Tables, InsertDto, UpdateDto } from "./database";

// ============================================================
// ENTITY TYPES (Row)
// ============================================================

export type UserProfile = Tables<"user_profiles">;
export type SatuanPendidikan = Tables<"satuan_pendidikan">;
export type TahunPelajaran = Tables<"tahun_pelajaran">;
export type RombonganBelajar = Tables<"rombongan_belajar">;
export type PesertaDidik = Tables<"peserta_didik">;
export type Enrollment = Tables<"enrollment">;
export type MataPelajaran = Tables<"mata_pelajaran">;
export type PredikatGlobal = Tables<"predikat_global">;
export type KompetensiDasar = Tables<"kompetensi_dasar">;
export type NilaiMapel = Tables<"nilai_mapel">;

// P5 master + penilaian
export type P5Dimensi = Tables<"p5_dimensi">;
export type P5Elemen = Tables<"p5_elemen">;
export type P5SubElemen = Tables<"p5_sub_elemen">;
export type PenilaianP5 = Tables<"penilaian_p5">;
export type CatatanP5 = Tables<"catatan_p5">;

export type Ekstrakurikuler = Tables<"ekstrakurikuler">;
export type EkskulPreset = Tables<"ekskul_preset">;
export type Ketidakhadiran = Tables<"ketidakhadiran">;
export type CatatanWaliKelas = Tables<"catatan_wali_kelas">;
export type RaporHeader = Tables<"rapor_header">;

// ============================================================
// INSERT DTO
// ============================================================

export type UserProfileInsert = InsertDto<"user_profiles">;
export type SatuanPendidikanInsert = InsertDto<"satuan_pendidikan">;
export type TahunPelajaranInsert = InsertDto<"tahun_pelajaran">;
export type RombonganBelajarInsert = InsertDto<"rombongan_belajar">;
export type PesertaDidikInsert = InsertDto<"peserta_didik">;
export type EnrollmentInsert = InsertDto<"enrollment">;
export type MataPelajaranInsert = InsertDto<"mata_pelajaran">;
export type PredikatGlobalInsert = InsertDto<"predikat_global">;
export type KompetensiDasarInsert = InsertDto<"kompetensi_dasar">;
export type NilaiMapelInsert = InsertDto<"nilai_mapel">;
export type P5DimensiInsert = InsertDto<"p5_dimensi">;
export type P5ElemenInsert = InsertDto<"p5_elemen">;
export type P5SubElemenInsert = InsertDto<"p5_sub_elemen">;
export type PenilaianP5Insert = InsertDto<"penilaian_p5">;
export type CatatanP5Insert = InsertDto<"catatan_p5">;
export type EkstrakurikulerInsert = InsertDto<"ekstrakurikuler">;
export type EkskulPresetInsert = InsertDto<"ekskul_preset">;
export type KetidakhadiranInsert = InsertDto<"ketidakhadiran">;
export type CatatanWaliKelasInsert = InsertDto<"catatan_wali_kelas">;
export type RaporHeaderInsert = InsertDto<"rapor_header">;

// ============================================================
// UPDATE DTO
// ============================================================

export type UserProfileUpdate = UpdateDto<"user_profiles">;
export type SatuanPendidikanUpdate = UpdateDto<"satuan_pendidikan">;
export type TahunPelajaranUpdate = UpdateDto<"tahun_pelajaran">;
export type RombonganBelajarUpdate = UpdateDto<"rombongan_belajar">;
export type PesertaDidikUpdate = UpdateDto<"peserta_didik">;
export type EnrollmentUpdate = UpdateDto<"enrollment">;
export type MataPelajaranUpdate = UpdateDto<"mata_pelajaran">;
export type PredikatGlobalUpdate = UpdateDto<"predikat_global">;
export type KompetensiDasarUpdate = UpdateDto<"kompetensi_dasar">;
export type NilaiMapelUpdate = UpdateDto<"nilai_mapel">;
export type P5DimensiUpdate = UpdateDto<"p5_dimensi">;
export type P5ElemenUpdate = UpdateDto<"p5_elemen">;
export type P5SubElemenUpdate = UpdateDto<"p5_sub_elemen">;
export type PenilaianP5Update = UpdateDto<"penilaian_p5">;
export type CatatanP5Update = UpdateDto<"catatan_p5">;
export type EkstrakurikulerUpdate = UpdateDto<"ekstrakurikuler">;
export type EkskulPresetUpdate = UpdateDto<"ekskul_preset">;
export type KetidakhadiranUpdate = UpdateDto<"ketidakhadiran">;
export type CatatanWaliKelasUpdate = UpdateDto<"catatan_wali_kelas">;
export type RaporHeaderUpdate = UpdateDto<"rapor_header">;

// ============================================================
// UNION / LITERAL TYPES
// ============================================================

export type UserRole = "super_admin" | "user";
export type Predikat = "A" | "B" | "C" | "D";

/** Predikat P5 sesuai template PKBM Al Barakah */
export type PredikatP5 = "MB" | "SB" | "BSH" | "SAB";

export type StatusEnrollment = "aktif" | "lulus" | "keluar" | "pindah";
export type StatusRapor = "draft" | "published";
export type Paket = "Paket A" | "Paket B" | "Paket C" | "Semua";
export type Fase = "Fase A" | "Fase B" | "Fase C" | "Fase D" | "Fase E" | "Fase F";
export type Semester = 1 | 2;
export type JenisKelamin = "L" | "P";
export type KelasParalel = "Tidak ada" | "A" | "B" | "C" | "D" | "E" | "F";

/** Kelompok mata pelajaran di rapor PKBM.
 *  v2.1: tambah "muatan_lokal" untuk Paket B convention. */
export type KelompokMapel = "umum" | "peminatan_ips" | "khusus" | "muatan_lokal";

/** Gender untuk ekskul preset (SEMUA = berlaku untuk L dan P) */
export type GenderPreset = "L" | "P" | "SEMUA";

// ============================================================
// COMPOSITE TYPES
// ============================================================

/** Enrollment lengkap dengan data siswa dan kelas */
export type EnrollmentWithDetail = Enrollment & {
  peserta_didik: Pick<PesertaDidik, "id" | "nama_lengkap" | "nisn" | "jenis_kelamin">;
  rombongan_belajar: Pick<RombonganBelajar, "id" | "nama_kelas" | "tingkat" | "paket" | "fase">;
};

/** Nilai mapel lengkap dengan nama mapel.
 *  v2.1: kompetensi_dasar relation di-drop (FK dihapus di schema). */
export type NilaiMapelWithMapel = NilaiMapel & {
  mata_pelajaran: Pick<MataPelajaran, "id" | "nama" | "urutan" | "kelompok"> | null;
};

/** Kelas dengan tahun pelajaran */
export type RombonganBelajarWithTahun = RombonganBelajar & {
  tahun_pelajaran: Pick<TahunPelajaran, "id" | "nama" | "semester">;
};

/** Rapor header dengan enrollment detail */
export type RaporWithEnrollment = RaporHeader & {
  enrollment: EnrollmentWithDetail;
};

/** Sub-elemen P5 lengkap dengan path ke elemen dan dimensi */
export type P5SubElemenWithPath = P5SubElemen & {
  elemen: P5Elemen & { dimensi: P5Dimensi };
};

/** Hierarki P5 master (dimensi → elemen → sub-elemen) untuk rendering form & rapor */
export interface P5DimensiTree extends P5Dimensi {
  elemen: Array<
    P5Elemen & {
      sub_elemen: P5SubElemen[];
    }
  >;
}

/** Penilaian P5 dengan sub-elemen terkait (untuk rapor) */
export type PenilaianP5WithSubElemen = PenilaianP5 & {
  p5_sub_elemen: P5SubElemen | null;
};