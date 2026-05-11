// ============================================================
// FILE PATH: src/lib/validators.ts
// ============================================================
// REPLACE. Sync ke schema v2.1 + perubahan minor:
//   - mataPelajaranSchema.nama: tambah .transform(trim) supaya
//     whitespace tidak bocor ke DB & duplicate-check.
//   - typedResolver: drop FieldValues constraint biar compatible
//     sama Zod v4 internal types ($ZodType vs Zod3Type mismatch).
// ============================================================

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

// ============================================================
// TYPED RESOLVER
// ============================================================

export function typedResolver<T extends z.ZodType<Record<string, unknown>>>(
  schema: T
): Resolver<z.infer<T>> {
  return zodResolver(schema as any) as unknown as Resolver<z.infer<T>>;
}

// ============================================================
// SHARED ENUMS
// ============================================================

export const AGAMA_VALUES = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
] as const;

export const KELAS_PARALEL_VALUES = ["Tidak ada", "A", "B"] as const;

export const KELOMPOK_MAPEL_VALUES = [
  "umum",
  "peminatan_ips",
  "khusus",
  "muatan_lokal",
] as const;

// ============================================================
// AUTH
// ============================================================

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi").min(6, "Password minimal 6 karakter"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================
// SATUAN PENDIDIKAN
// ============================================================

export const satuanPendidikanSchema = z.object({
  nama: z.string().min(1, "Nama PKBM wajib diisi"),
  npsn: z.string().optional(),
  alamat: z.string().optional(),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  kabupaten: z.string().optional(),
  provinsi: z.string().optional(),
  kode_pos: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  website: z.string().optional(),
  kota: z.string().optional(),
  kepala_pkbm: z.string().optional(),
  nip_kepala: z.string().optional(),
});

export type SatuanPendidikanFormData = z.infer<typeof satuanPendidikanSchema>;

// ============================================================
// TAHUN PELAJARAN
// ============================================================

export const tahunPelajaranSchema = z.object({
  nama: z.string().min(1, "Nama tahun pelajaran wajib diisi")
    .regex(/^\d{4}\/\d{4}$/, "Format: YYYY/YYYY, misal 2025/2026"),
  semester: z.coerce.number().int().min(1).max(2),
  is_aktif: z.boolean().default(false),
  tanggal_cetak: z.string().optional().nullable(),
});

export type TahunPelajaranFormData = z.infer<typeof tahunPelajaranSchema>;

// ============================================================
// ROMBONGAN BELAJAR
// ============================================================

export const rombonganBelajarSchema = z.object({
  tahun_pelajaran_id: z.coerce.number().int().positive("Tahun pelajaran wajib dipilih"),
  nama_kelas: z.string().min(1, "Nama kelas wajib diisi"),
  tingkat: z.coerce.number().int().min(1).max(12),
  kelas_paralel: z.enum(KELAS_PARALEL_VALUES, {
    message: "Pilih paralel kelas",
  }),
  paket: z.enum(["Paket A", "Paket B", "Paket C"]),
  fase: z.enum(["Fase A", "Fase B", "Fase C", "Fase D", "Fase E", "Fase F"]),
  wali_kelas: z.string().trim().optional().nullable(),
});

export type RombonganBelajarFormData = z.infer<typeof rombonganBelajarSchema>;

// ============================================================
// PESERTA DIDIK
// ============================================================

export const pesertaDidikSchema = z.object({
  nisn: z.string().optional(),
  nis: z.string().optional(),
  nama_lengkap: z.string().min(1, "Nama lengkap wajib diisi"),
  jenis_kelamin: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
  tempat_lahir: z.string().optional(),
  tanggal_lahir: z.string().optional().nullable(),
  agama: z.enum(AGAMA_VALUES, {
    message: "Agama wajib dipilih (untuk filter mapel Pendidikan Agama)",
  }),
  alamat: z.string().optional(),
  rt: z.string().optional(),
  rw: z.string().optional(),
  kelurahan: z.string().optional(),
  kecamatan: z.string().optional(),
  kabupaten: z.string().optional(),
  provinsi: z.string().optional(),
  nama_ayah: z.string().optional(),
  nama_ibu: z.string().optional(),
  pekerjaan_ayah: z.string().optional(),
  pekerjaan_ibu: z.string().optional(),
  no_telp_ortu: z.string().optional(),
  is_aktif: z.boolean().default(true),
});

export type PesertaDidikFormData = z.infer<typeof pesertaDidikSchema>;

// ============================================================
// ENROLLMENT
// ============================================================

export const enrollmentSchema = z.object({
  peserta_didik_id: z.string().uuid("Siswa wajib dipilih"),
  rombongan_belajar_id: z.coerce.number().int().positive("Kelas wajib dipilih"),
  tahun_pelajaran_id: z.coerce.number().int().positive(),
  status: z.enum(["aktif", "lulus", "keluar", "pindah"]).default("aktif"),
});

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

// ============================================================
// MATA PELAJARAN
// ============================================================

export const mataPelajaranSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama mata pelajaran wajib diisi"),
  paket: z.enum(["Paket A", "Paket B", "Paket C", "Semua"]),
  fase: z.enum(["Fase A", "Fase B", "Fase C", "Fase D", "Fase E", "Fase F"]).optional().nullable(),
  kelompok: z.enum(KELOMPOK_MAPEL_VALUES).default("umum"),
  agama: z.enum(AGAMA_VALUES).optional().nullable(),
  urutan: z.coerce.number().int().min(1).max(99).default(99),
  is_aktif: z.boolean().default(true),
});

export type MataPelajaranFormData = z.infer<typeof mataPelajaranSchema>;

// ============================================================
// KOMPETENSI DASAR
// ============================================================

export const kompetensiDasarSchema = z.object({
  mata_pelajaran_id: z.coerce.number().int().positive(),
  nama_kompetensi: z.string().min(1, "Nama kompetensi wajib diisi"),
  urutan: z.coerce.number().int().min(1).max(99).default(99),
  deskripsi_a: z.string().min(1, "Deskripsi A wajib diisi"),
  deskripsi_b: z.string().min(1, "Deskripsi B wajib diisi"),
  deskripsi_c: z.string().min(1, "Deskripsi C wajib diisi"),
  deskripsi_d: z.string().min(1, "Deskripsi D wajib diisi"),
  is_aktif: z.boolean().default(true),
});

export type KompetensiDasarFormData = z.infer<typeof kompetensiDasarSchema>;

// ============================================================
// PREDIKAT GLOBAL
// ============================================================

export const predikatGlobalSchema = z.object({
  predikat: z.enum(["A", "B", "C", "D"]),
  nilai_min: z.coerce.number().int().min(0).max(100),
  nilai_max: z.coerce.number().int().min(0).max(100),
}).refine((d) => d.nilai_min <= d.nilai_max, {
  message: "Nilai minimum tidak boleh lebih besar dari nilai maksimum",
  path: ["nilai_min"],
});

export type PredikatGlobalFormData = z.infer<typeof predikatGlobalSchema>;

// ============================================================
// NILAI MAPEL
// ============================================================

export const nilaiMapelSchema = z.object({
  enrollment_id: z.string().uuid(),
  mata_pelajaran_id: z.coerce.number().int().positive(),
  nilai_akhir: z.coerce.number().int().min(0).max(100).optional().nullable(),
  predikat: z.enum(["A", "B", "C", "D"]).optional().nullable(),
  capaian_kompetensi: z.string().optional().nullable(),
});

export type NilaiMapelFormData = z.infer<typeof nilaiMapelSchema>;

// ============================================================
// P5 MASTER
// ============================================================

export const p5DimensiSchema = z.object({
  nomor: z.coerce.number().int().min(1).max(99),
  nama: z.string().min(1, "Nama dimensi wajib diisi"),
  urutan: z.coerce.number().int().min(1).max(99).default(99),
  is_aktif: z.boolean().default(true),
});

export type P5DimensiFormData = z.infer<typeof p5DimensiSchema>;

export const p5ElemenSchema = z.object({
  dimensi_id: z.coerce.number().int().positive(),
  nama: z.string().min(1, "Nama elemen wajib diisi"),
  urutan: z.coerce.number().int().min(1).max(99).default(99),
  is_aktif: z.boolean().default(true),
});

export type P5ElemenFormData = z.infer<typeof p5ElemenSchema>;

export const p5SubElemenSchema = z.object({
  elemen_id: z.coerce.number().int().positive(),
  fase: z.enum(["Fase A", "Fase B", "Fase C", "Fase D", "Fase E", "Fase F"]),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  urutan: z.coerce.number().int().min(1).max(99).default(99),
  is_aktif: z.boolean().default(true),
});

export type P5SubElemenFormData = z.infer<typeof p5SubElemenSchema>;

// ============================================================
// PENILAIAN P5
// ============================================================

export const penilaianP5Schema = z.object({
  enrollment_id: z.string().uuid(),
  sub_elemen_id: z.coerce.number().int().positive(),
  predikat: z.enum(["MB", "SB", "BSH", "SAB"]).optional().nullable(),
});

export type PenilaianP5FormData = z.infer<typeof penilaianP5Schema>;

// ============================================================
// CATATAN P5
// ============================================================

export const catatanP5Schema = z.object({
  enrollment_id: z.string().uuid(),
  catatan: z.string().optional().nullable(),
});

export type CatatanP5FormData = z.infer<typeof catatanP5Schema>;

// ============================================================
// PATCH untuk src/lib/validators.ts (v2 — 4-tier A/B/C/D)
// ============================================================
// Extend ekskulPresetSchema dengan 4 keterangan templates.
// Cari ekskulPresetSchema, replace dengan versi ini.
// ============================================================

export const ekskulPresetSchema = z.object({
  nama_ekskul: z
    .string()
    .min(1, "Nama ekskul wajib diisi")
    .max(100, "Nama ekskul maksimal 100 karakter")
    .trim(),
  gender: z.enum(["L", "P", "SEMUA"], {
    message: "Gender harus L, P, atau SEMUA",
  }),
  is_aktif: z.boolean().default(true),
  urutan: z
    .number()
    .int("Urutan harus bilangan bulat")
    .min(0, "Urutan tidak boleh negatif")
    .default(0),
  keterangan_a: z
    .string()
    .max(500, "Template A maksimal 500 karakter")
    .nullable()
    .optional(),
  keterangan_b: z
    .string()
    .max(500, "Template B maksimal 500 karakter")
    .nullable()
    .optional(),
  keterangan_c: z
    .string()
    .max(500, "Template C maksimal 500 karakter")
    .nullable()
    .optional(),
  keterangan_d: z
    .string()
    .max(500, "Template D maksimal 500 karakter")
    .nullable()
    .optional(),
});

export type EkskulPresetFormValues = z.infer<typeof ekskulPresetSchema>;

// ============================================================
// CATATAN WALI KELAS
// ============================================================

export const catatanWaliKelasSchema = z.object({
  enrollment_id: z.string().uuid(),
  catatan: z.string().optional().nullable(),
  tanggapan_ortu: z.string().optional().nullable(),
});

export type CatatanWaliKelasFormData = z.infer<typeof catatanWaliKelasSchema>;

// ============================================================
// USER MANAGEMENT
// ============================================================

export const userCreateSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  role: z.enum(["super_admin", "user"]).default("user"),
  phone: z.string().optional().nullable(),
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  role: z.enum(["super_admin", "user"]),
  phone: z.string().optional().nullable(),
  is_active: z.boolean(),
});

export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;

export const userResetPasswordSchema = z.object({
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type UserResetPasswordFormData = z.infer<typeof userResetPasswordSchema>;