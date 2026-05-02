-- ============================================================
-- E-RAPORT PKBM — DROP TABLES (Fresh start helper)
-- ============================================================
-- Versi  : Compatible v2.x → v2.2
-- Urutan : drop-table.sql → setup.sql → seed.sql
--
-- File ini WIPE semua object e-rapor di public schema:
--   1. Triggers (otomatis ikut DROP TABLE CASCADE)
--   2. Tables e-rapor (urutan: child first, parent last)
--   3. user_profiles (auth profile)
--   4. RPC functions
--   5. Helper function handle_updated_at
--
-- AMAN dijalankan multiple kali (semua DROP IF EXISTS).
-- ============================================================
-- ⚠️  PERINGATAN:
--   File ini NGAPUS SEMUA DATA & SEMUA USER PROFILE.
--   auth.users (Supabase Auth) TIDAK di-drop — admin harus manual
--   re-create user_profiles row untuk akun yang sudah ada di auth.
--
--   Setelah jalanin file ini:
--     1. Run setup.sql v2.2 untuk re-create schema
--     2. Run seed.sql untuk isi master data
--     3. Manual create admin user_profile via SQL:
--        INSERT INTO public.user_profiles (id, full_name, role, is_active)
--        SELECT id, raw_user_meta_data->>'full_name', 'super_admin', TRUE
--        FROM auth.users WHERE email = 'admin@pkbm.com';
-- ============================================================


-- ─── DROP TABLES (CASCADE — child first by FK dependency) ───
DROP TABLE IF EXISTS public.rapor_header        CASCADE;
DROP TABLE IF EXISTS public.catatan_wali_kelas  CASCADE;
DROP TABLE IF EXISTS public.ketidakhadiran      CASCADE;
DROP TABLE IF EXISTS public.ekstrakurikuler     CASCADE;
DROP TABLE IF EXISTS public.ekskul_preset       CASCADE;
DROP TABLE IF EXISTS public.catatan_p5          CASCADE;
DROP TABLE IF EXISTS public.penilaian_p5        CASCADE;
DROP TABLE IF EXISTS public.p5_sub_elemen       CASCADE;
DROP TABLE IF EXISTS public.p5_elemen           CASCADE;
DROP TABLE IF EXISTS public.p5_dimensi          CASCADE;
DROP TABLE IF EXISTS public.nilai_mapel         CASCADE;
DROP TABLE IF EXISTS public.kompetensi_dasar    CASCADE;
DROP TABLE IF EXISTS public.predikat_global     CASCADE;
DROP TABLE IF EXISTS public.mata_pelajaran      CASCADE;
DROP TABLE IF EXISTS public.enrollment          CASCADE;
DROP TABLE IF EXISTS public.peserta_didik       CASCADE;
DROP TABLE IF EXISTS public.rombongan_belajar   CASCADE;
DROP TABLE IF EXISTS public.tahun_pelajaran     CASCADE;
DROP TABLE IF EXISTS public.satuan_pendidikan   CASCADE;

-- user_profiles dihapus juga biar fresh (schema v2.2 tambah kolom phone+is_active)
DROP TABLE IF EXISTS public.user_profiles       CASCADE;


-- ─── DROP FUNCTIONS ─────────────────────────────────────────
DROP FUNCTION IF EXISTS public.derive_predikat(INT)               CASCADE;
DROP FUNCTION IF EXISTS public.derive_predikat(SMALLINT)          CASCADE;  -- v2.0 legacy
DROP FUNCTION IF EXISTS public.get_capaian_kompetensi(INT, INT)   CASCADE;
DROP FUNCTION IF EXISTS public.get_capaian_kompetensi(INT, SMALLINT) CASCADE;  -- v2.0 legacy
DROP FUNCTION IF EXISTS public.get_my_role()                      CASCADE;
DROP FUNCTION IF EXISTS public.format_kelas_label(INT, TEXT)      CASCADE;
DROP FUNCTION IF EXISTS public.format_kelas_label(SMALLINT, TEXT) CASCADE;  -- v2.0 legacy
DROP FUNCTION IF EXISTS public.format_semester_label(INT)         CASCADE;
DROP FUNCTION IF EXISTS public.format_semester_label(SMALLINT)    CASCADE;  -- v2.0 legacy
DROP FUNCTION IF EXISTS public.enforce_paralel_consistency()      CASCADE;  -- v2.2
DROP FUNCTION IF EXISTS public.handle_updated_at()                CASCADE;


DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'DROP selesai. Schema bersih.';
  RAISE NOTICE 'Lanjutkan dengan setup.sql v2.2.';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;