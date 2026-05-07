// ============================================================
// FILE PATH: src/hooks/index.ts
// ============================================================
// REPLACE versi sebelumnya. Tambah export use-siswa-deletion-impact
// + 2 hook delete dari use-siswa.
//
// CHANGELOG:
//   v2.6: + useDeletePesertaDidik, useBulkDeletePesertaDidik (single
//         + bulk hard delete untuk siswa, dengan CASCADE)
//         + useSiswaDeletionImpact, useBulkSiswaDeletionImpact
//         + type SiswaDeletionImpact (impact pre-check buat confirm)
//   v2.5: + useKelasDeletionImpact (pre-fetch impact count buat
//         confirm dialog hapus kelas)
//   v2.4: + useTanggalCetakByTP, useTanggalCetakByTPDanPaket,
//         useTPMissingTanggalCetak, useUpsertTanggalCetak,
//         useDeleteTanggalCetak (tanggal cetak per paket)
// ============================================================

export { useAuth } from "./use-auth";
export {
  useSatuanPendidikan,
  useUpsertSatuanPendidikan,
} from "./use-satuan-pendidikan";
export {
  useTahunPelajaran,
  useTahunPelajaranAktif,
  useCreateTahunPelajaran,
  useSetTahunPelajaranAktif,
  useDeleteTahunPelajaran,
} from "./use-tahun-pelajaran";
export {
  useKelasByTahun,
  useAllKelas,
  useCreateKelas,
  useUpdateKelas,
  useDeleteKelas,
} from "./use-kelas";
export {
  usePesertaDidik,
  usePesertaDidikById,
  useCreatePesertaDidik,
  useUpdatePesertaDidik,
  useDeletePesertaDidik,
  useBulkDeletePesertaDidik,
  useEnrollmentByKelas,
  useCreateEnrollment,
  useUpdateEnrollmentStatus,
  useBulkImportSiswa,
} from "./use-siswa";
export {
  useMataPelajaran,
  useAllMataPelajaran,
  useCreateMataPelajaran,
  useUpdateMataPelajaran,
  useDeleteMataPelajaran,
  useNilaiCountByMapel,
} from "./use-mata-pelajaran";
export {
  useKompetensiByMapel,
  useCreateKompetensi,
  useUpdateKompetensi,
  useDeleteKompetensi,
} from "./use-kompetensi";
export { usePredikatGlobal, useUpdatePredikat } from "./use-predikat";

// Enrollment
export {
  useEnrollmentById,
  useEnrollmentByKelasId,
  useEnrollmentByKelasAll,
  useUnenrolledSiswa,
  useEnrollSiswa,
  useSetEnrollmentStatus,
  useCreateSiswaAndEnroll,
} from "./use-enrollment";

// Nilai + penilaian P5 + catatan P5 + ekskul + absensi + catatan wali
export {
  derivePredikat,
  getCapaianKompetensi,
  fetchFirstKdByMapel,
  useNilaiByEnrollment,
  useUpsertNilai,
  useBatchUpsertNilai,
  usePenilaianP5ByEnrollment,
  useUpsertPenilaianP5,
  useBatchUpsertPenilaianP5,
  useCatatanP5ByEnrollment,
  useUpsertCatatanP5,
  useEkskulByEnrollment,
  useUpsertEkskul,
  useBatchInsertEkskul,
  useDeleteEkskul,
  useAbsensiByEnrollment,
  useUpsertAbsensi,
  useCatatanByEnrollment,
  useUpsertCatatan,
} from "./use-nilai";

// P5 Master (admin-editable hierarki)
export {
  useP5Tree,
  useP5Dimensi,
  useCreateDimensi,
  useUpdateDimensi,
  useDeleteDimensi,
  useP5ElemenByDimensi,
  useCreateElemen,
  useUpdateElemen,
  useDeleteElemen,
  useP5SubElemenByElemen,
  useCreateSubElemen,
  useUpdateSubElemen,
  useDeleteSubElemen,
} from "./use-p5-master";

// Ekskul preset (global admin-editable list)
export {
  useEkskulPresets,
  useActiveEkskulPresets,
  useCreateEkskulPreset,
  useUpdateEkskulPreset,
  useDeleteEkskulPreset,
} from "./use-ekskul-preset";

// Rapor
export {
  useRaporHeader,
  useEnsureRaporHeader,
  usePublishRapor,
  useUnpublishRapor,
  useRaporFullData,
} from "./use-rapor";

// User Management (super-admin only, via API route)
export {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useToggleUserActive,
  useResetUserPassword,
  useDeleteUser,
  type AdminUser,
} from "./use-users";

// Tanggal cetak per paket
export {
  useTanggalCetakByTP,
  useTanggalCetakByTPDanPaket,
  useTPMissingTanggalCetak,
  useUpsertTanggalCetak,
  useDeleteTanggalCetak,
  PAKET_LIST,
  type PaketType,
  type TanggalCetakMap,
  type TanggalCetakRow,
} from "./use-tanggal-cetak-paket";

// Kelas deletion impact pre-check (v2.5)
export {
  useKelasDeletionImpact,
  type KelasDeletionImpact,
} from "./use-kelas-deletion-impact";

// ── NEW v2.6: Siswa deletion impact pre-check ───────────────
export {
  useSiswaDeletionImpact,
  useBulkSiswaDeletionImpact,
  type SiswaDeletionImpact,
} from "./use-siswa-deletion-impact";
