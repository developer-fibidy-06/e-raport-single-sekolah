-- ============================================================
-- MIGRATION 001 — wali_kelas jadi text field manual
-- ============================================================
-- Run di Supabase SQL Editor. Idempotent: aman di-run ulang.
--
-- Perubahan:
--   1. Drop FK `rombongan_belajar.wali_kelas_id` → user_profiles
--   2. Drop kolom `wali_kelas_id`
--   3. Tambah kolom `wali_kelas TEXT` (nullable, admin isi manual)
--
-- Data loss note:
--   Kalau ada data wali_kelas_id existing, nama akan di-migrate dulu
--   ke kolom text baru sebelum FK di-drop.
-- ============================================================

BEGIN;

-- Step 1: tambah kolom text baru (kalau belum ada)
ALTER TABLE rombongan_belajar
  ADD COLUMN IF NOT EXISTS wali_kelas TEXT;

-- Step 2: migrate nama dari user_profiles → kolom text (kalau masih ada data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rombongan_belajar' AND column_name = 'wali_kelas_id'
  ) THEN
    UPDATE rombongan_belajar rb
    SET wali_kelas = up.full_name
    FROM user_profiles up
    WHERE rb.wali_kelas_id = up.id
      AND rb.wali_kelas IS NULL;
  END IF;
END $$;

-- Step 3: drop FK constraint (kalau ada)
ALTER TABLE rombongan_belajar
  DROP CONSTRAINT IF EXISTS rombongan_belajar_wali_kelas_id_fkey;

-- Step 4: drop kolom wali_kelas_id
ALTER TABLE rombongan_belajar
  DROP COLUMN IF EXISTS wali_kelas_id;

COMMIT;

-- ============================================================
-- VERIFY
-- ============================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'rombongan_belajar'
-- ORDER BY ordinal_position;
