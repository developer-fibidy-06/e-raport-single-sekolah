-- ============================================================
-- MIGRATION: v2.6 — enrollment.peserta_didik_id → ON DELETE CASCADE
-- ============================================================
-- Konteks: Hapus siswa (peserta_didik) sebelumnya gagal karena FK
-- enrollment.peserta_didik_id pakai ON DELETE RESTRICT.
-- Kita ubah jadi CASCADE supaya delete siswa otomatis nuke
-- enrollment, dan child enrollment lainnya (nilai_mapel,
-- penilaian_p5, ekstrakurikuler, ketidakhadiran, catatan_p5,
-- catatan_wali_kelas, rapor_header) ikut ke-cascade-delete
-- karena FK mereka SUDAH CASCADE ke enrollment.
--
-- Konsisten dengan pola v2.5 (rombongan_belajar). Sekarang admin
-- bisa hard delete siswa lewat tab Siswa, dengan impact preview
-- (jumlah enrollment + nilai + rapor published) muncul di confirm
-- dialog sebelum klik Hapus.
--
-- Safety:
--   - Operasi reversible (kalau mau strict lagi, ubah balik ke RESTRICT)
--   - Idempotent: drop dulu lalu add, jadi aman di-rerun
--   - DO block bungkus IF EXISTS untuk handle env yang mungkin
--     belum punya constraint (mis. fresh setup)
--
-- UX di app:
--   - Single delete: kebab menu di tiap row siswa → confirm dialog
--     dengan impact pre-fetch (warna severity + warning rapor published)
--   - Bulk delete: select multiple via checkbox → action bar muncul
--     di top → tombol "Hapus Terpilih" → confirm dialog dengan
--     aggregate impact dari semua siswa terpilih
--
-- Test setelah migration:
--   1. Hapus siswa baru (no enrollment) → langsung sukses
--   2. Hapus siswa dengan enrollment + nilai → semua ikut hapus
--   3. Bulk delete 5 siswa sekaligus → 1 query DELETE, CASCADE
--      handle children
--   4. Verifikasi: SELECT count(*) FROM enrollment WHERE
--      peserta_didik_id = '<uuid>' harus 0 setelah delete
-- ============================================================

DO $$
BEGIN
  -- Drop existing FK kalau ada
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'enrollment_peserta_didik_id_fkey'
      AND table_name = 'enrollment'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.enrollment
      DROP CONSTRAINT enrollment_peserta_didik_id_fkey;
    RAISE NOTICE 'Dropped existing FK enrollment_peserta_didik_id_fkey';
  END IF;

  -- Re-add dengan ON DELETE CASCADE
  ALTER TABLE public.enrollment
    ADD CONSTRAINT enrollment_peserta_didik_id_fkey
    FOREIGN KEY (peserta_didik_id)
    REFERENCES public.peserta_didik(id)
    ON DELETE CASCADE;

  RAISE NOTICE 'Added FK enrollment_peserta_didik_id_fkey with ON DELETE CASCADE';
END $$;

-- ============================================================
-- DONE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'MIGRATION v2.6 selesai.';
  RAISE NOTICE '';
  RAISE NOTICE 'Sekarang hapus peserta_didik akan auto-cascade:';
  RAISE NOTICE '  peserta_didik';
  RAISE NOTICE '    └── enrollment (CASCADE) ✓ NEW';
  RAISE NOTICE '          ├── nilai_mapel (CASCADE)';
  RAISE NOTICE '          ├── penilaian_p5 (CASCADE)';
  RAISE NOTICE '          ├── catatan_p5 (CASCADE)';
  RAISE NOTICE '          ├── ekstrakurikuler (CASCADE)';
  RAISE NOTICE '          ├── ketidakhadiran (CASCADE)';
  RAISE NOTICE '          ├── catatan_wali_kelas (CASCADE)';
  RAISE NOTICE '          └── rapor_header (CASCADE)';
  RAISE NOTICE '';
  RAISE NOTICE 'Bulk delete via .in() query juga otomatis CASCADE';
  RAISE NOTICE 'untuk semua siswa terpilih dalam 1 statement DELETE.';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;
