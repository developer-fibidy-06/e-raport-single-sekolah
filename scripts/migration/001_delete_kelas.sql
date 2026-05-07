-- ============================================================
-- MIGRATION: v2.5 — enrollment.rombongan_belajar_id → ON DELETE CASCADE
-- ============================================================
-- Konteks: Hapus kelas (rombongan_belajar) sebelumnya gagal karena
-- FK enrollment.rombongan_belajar_id pakai ON DELETE RESTRICT.
-- Kita ubah jadi CASCADE supaya delete kelas otomatis nuke
-- enrollment, dan child enrollment lainnya (nilai_mapel,
-- penilaian_p5, ekstrakurikuler, ketidakhadiran, catatan_p5,
-- catatan_wali_kelas, rapor_header) ikut ke-cascade-delete
-- karena FK mereka SUDAH CASCADE ke enrollment.
--
-- Safety:
--   - Operasi reversible (kalau mau strict lagi, ubah balik ke RESTRICT)
--   - Idempotent: drop dulu lalu add, jadi aman di-rerun
--   - DO block bungkus IF EXISTS untuk handle env yang mungkin
--     belum punya constraint (mis. fresh setup)
--
-- Test setelah migration:
--   1. Hapus kelas kosong (no enrollment) → langsung sukses
--   2. Hapus kelas dengan siswa → enrollment + nilai ikut hapus
--   3. Verifikasi: SELECT count(*) FROM enrollment WHERE rombongan_belajar_id = <id>
--      harus 0 setelah delete.
-- ============================================================

DO $$
BEGIN
  -- Drop existing FK kalau ada
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'enrollment_rombongan_belajar_id_fkey'
      AND table_name = 'enrollment'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.enrollment
      DROP CONSTRAINT enrollment_rombongan_belajar_id_fkey;
    RAISE NOTICE 'Dropped existing FK enrollment_rombongan_belajar_id_fkey';
  END IF;

  -- Re-add dengan ON DELETE CASCADE
  ALTER TABLE public.enrollment
    ADD CONSTRAINT enrollment_rombongan_belajar_id_fkey
    FOREIGN KEY (rombongan_belajar_id)
    REFERENCES public.rombongan_belajar(id)
    ON DELETE CASCADE;

  RAISE NOTICE 'Added FK enrollment_rombongan_belajar_id_fkey with ON DELETE CASCADE';
END $$;

-- ============================================================
-- DONE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'MIGRATION v2.5 selesai.';
  RAISE NOTICE '';
  RAISE NOTICE 'Sekarang hapus rombongan_belajar akan auto-cascade:';
  RAISE NOTICE '  rombongan_belajar';
  RAISE NOTICE '    └── enrollment (CASCADE) ✓ NEW';
  RAISE NOTICE '          ├── nilai_mapel (CASCADE)';
  RAISE NOTICE '          ├── penilaian_p5 (CASCADE)';
  RAISE NOTICE '          ├── catatan_p5 (CASCADE)';
  RAISE NOTICE '          ├── ekstrakurikuler (CASCADE)';
  RAISE NOTICE '          ├── ketidakhadiran (CASCADE)';
  RAISE NOTICE '          ├── catatan_wali_kelas (CASCADE)';
  RAISE NOTICE '          └── rapor_header (CASCADE)';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;