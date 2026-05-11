-- ============================================================
-- MIGRATION: ekskul_preset — add keterangan template columns
-- ============================================================
-- Filosofi:
--   Pindahkan template keterangan dari hardcode di kode JS ke DB
--   supaya admin bisa edit langsung tanpa redeploy. Match dengan
--   pola tabel master lain (predikat_global, p5_dimensi, dll).
--
-- Schema:
--   keterangan_a — template kalau quick-fill assign predikat A
--   keterangan_b — template kalau quick-fill assign predikat B
--   Default NULL (kosong) → fallback ke generic template di kode.
--
-- Rollback aman: kolom nullable, kode lama (sebelum patch) tetap
-- jalan dengan NULL value.
-- ============================================================

ALTER TABLE public.ekskul_preset
  ADD COLUMN IF NOT EXISTS keterangan_a TEXT,
  ADD COLUMN IF NOT EXISTS keterangan_b TEXT;

COMMENT ON COLUMN public.ekskul_preset.keterangan_a IS
  'Template keterangan rapor ketika siswa mendapat predikat A pada ekskul ini. Kosong = pakai template generic dari kode.';

COMMENT ON COLUMN public.ekskul_preset.keterangan_b IS
  'Template keterangan rapor ketika siswa mendapat predikat B pada ekskul ini. Kosong = pakai template generic dari kode.';

-- ============================================================
-- SEED DATA (opsional, jalankan kalau mau backfill ekskul umum)
-- ============================================================
-- Hanya update row yang udah ada di DB. Match by lowercase nama_ekskul
-- pakai ILIKE supaya "Pramuka" / "PRAMUKA" / "pramuka" semua kena.
--
-- Run kalau lo mau auto-fill template buat preset yang sudah ada.
-- Skip section ini kalau lo mau admin isi sendiri dari awal.
-- ============================================================

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Aktif mengikuti kegiatan kepramukaan dengan disiplin tinggi dan menunjukkan jiwa kepemimpinan yang baik.',
  keterangan_b = 'Mengikuti kegiatan kepramukaan dengan cukup baik dan perlu meningkatkan kedisiplinan saat latihan rutin.'
WHERE nama_ekskul ILIKE '%pramuka%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat menguasai jurus dasar pencak silat dan menunjukkan ketangkasan yang baik dalam setiap latihan.',
  keterangan_b = 'Mengikuti latihan pencak silat dengan cukup baik, perlu memperdalam penguasaan jurus dan teknik dasar.'
WHERE (nama_ekskul ILIKE '%pencak silat%' OR nama_ekskul ILIKE '%silat%') AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat baik dalam menghafal Al-Qur''an dengan tartil dan makharijul huruf yang tepat.',
  keterangan_b = 'Mengikuti program tahfizh dengan baik, perlu meningkatkan kelancaran dan murajaah hafalan.'
WHERE (nama_ekskul ILIKE '%tahfizh%' OR nama_ekskul ILIKE '%tahfidz%') AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Membaca Al-Qur''an dengan sangat baik, tajwid dan makharijul huruf sudah tepat dan fasih.',
  keterangan_b = 'Membaca Al-Qur''an dengan cukup baik, perlu memperbaiki tajwid dan kelancaran tilawah.'
WHERE (nama_ekskul ILIKE '%tilawah%' OR nama_ekskul ILIKE '%qori%') AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat terampil bermain futsal, menunjukkan teknik dan kerja sama tim yang sangat baik.',
  keterangan_b = 'Mengikuti latihan futsal dengan baik, perlu meningkatkan kerja sama tim dan teknik dasar.'
WHERE nama_ekskul ILIKE '%futsal%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat terampil bermain sepak bola dengan teknik dan kerja sama tim yang baik.',
  keterangan_b = 'Mengikuti latihan sepak bola dengan baik, perlu meningkatkan teknik dan stamina.'
WHERE nama_ekskul ILIKE '%sepak bola%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat terampil dalam bola voli, menguasai teknik passing, smash, dan blocking dengan baik.',
  keterangan_b = 'Mengikuti latihan bola voli dengan baik, perlu memperdalam teknik dasar passing dan smash.'
WHERE (nama_ekskul ILIKE '%voli%' OR nama_ekskul ILIKE '%volly%') AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat terampil bermain basket dengan teknik dribbling, shooting, dan passing yang baik.',
  keterangan_b = 'Mengikuti latihan basket dengan baik, perlu meningkatkan teknik dasar dan kerja sama tim.'
WHERE nama_ekskul ILIKE '%basket%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat terampil dalam bulu tangkis, menguasai teknik pukulan dan footwork yang baik.',
  keterangan_b = 'Mengikuti latihan bulu tangkis dengan baik, perlu memperdalam teknik smash dan netting.'
WHERE (nama_ekskul ILIKE '%badminton%' OR nama_ekskul ILIKE '%bulu tangkis%') AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat terampil menari, menguasai gerakan dengan luwes dan ekspresif.',
  keterangan_b = 'Mengikuti latihan tari dengan baik, perlu memperdalam keluwesan gerak dan ekspresi.'
WHERE nama_ekskul ILIKE '%tari%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat terampil dalam bermusik, menguasai alat musik dengan baik dan memiliki musikalitas yang tinggi.',
  keterangan_b = 'Mengikuti kegiatan musik dengan baik, perlu memperdalam penguasaan alat musik.'
WHERE nama_ekskul ILIKE '%musik%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat terampil dalam bernasyid, suara merdu dan harmonisasi vokal yang sangat baik.',
  keterangan_b = 'Mengikuti latihan nasyid dengan baik, perlu memperdalam teknik vokal dan harmonisasi.'
WHERE nama_ekskul ILIKE '%nasyid%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat aktif di English Club, kemampuan berbahasa Inggris menonjol dan percaya diri.',
  keterangan_b = 'Mengikuti kegiatan English Club dengan baik, perlu meningkatkan kepercayaan diri berbicara.'
WHERE nama_ekskul ILIKE '%english%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat aktif dalam PMR, menguasai keterampilan pertolongan pertama dengan baik.',
  keterangan_b = 'Mengikuti kegiatan PMR dengan baik, perlu memperdalam keterampilan pertolongan pertama.'
WHERE nama_ekskul ILIKE '%pmr%' AND keterangan_a IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_a = 'Sangat disiplin dan terampil dalam baris-berbaris, menunjukkan jiwa kepemimpinan yang baik.',
  keterangan_b = 'Mengikuti latihan Paskibra dengan baik, perlu meningkatkan kedisiplinan dan ketegasan gerak.'
WHERE nama_ekskul ILIKE '%paskibra%' AND keterangan_a IS NULL;