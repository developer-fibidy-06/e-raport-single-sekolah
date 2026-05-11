-- ============================================================
-- MIGRATION: ekskul_preset — extend ke 4 predikat (A/B/C/D)
-- ============================================================
-- Filosofi:
--   Template keterangan harus cover semua predikat (A/B/C/D) yang
--   bisa di-assign manual via Edit Sheet di siswa-level. Quick-fill
--   batch tetep cuma random A/B (70/30), tapi operator yang manual
--   edit bisa downgrade ke C/D — dan template-nya harus ada.
--
-- Jalankan SETELAH migration 01 (yang nambah keterangan_a & b).
-- Kalau lo belum jalanin 01, jalanin 01 dulu baru 02 (atau merge
-- dua-duanya jadi satu — sama-sama idempotent karena IF NOT EXISTS).
--
-- Schema:
--   keterangan_a — template predikat A (Sangat Baik)
--   keterangan_b — template predikat B (Baik)
--   keterangan_c — template predikat C (Cukup)        ← NEW
--   keterangan_d — template predikat D (Perlu Bimbingan) ← NEW
-- ============================================================

ALTER TABLE public.ekskul_preset
  ADD COLUMN IF NOT EXISTS keterangan_c TEXT,
  ADD COLUMN IF NOT EXISTS keterangan_d TEXT;

COMMENT ON COLUMN public.ekskul_preset.keterangan_c IS
  'Template keterangan rapor ketika siswa mendapat predikat C pada ekskul ini. Kosong = pakai template generic dari kode.';

COMMENT ON COLUMN public.ekskul_preset.keterangan_d IS
  'Template keterangan rapor ketika siswa mendapat predikat D pada ekskul ini. Kosong = pakai template generic dari kode.';

-- ============================================================
-- SEED DATA (opsional) — backfill template C & D buat ekskul umum
-- ============================================================
-- Match by ILIKE supaya case-insensitive partial match.
-- Skip kalau lo mau admin isi sendiri dari awal.
-- ============================================================

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti kegiatan kepramukaan dengan kehadiran cukup, perlu meningkatkan keterlibatan dan keterampilan dasar.',
  keterangan_d = 'Partisipasi di kepramukaan masih kurang, perlu motivasi dan pendampingan agar lebih aktif mengikuti kegiatan.'
WHERE nama_ekskul ILIKE '%pramuka%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan pencak silat seadanya, perlu meningkatkan kedisiplinan dan penguasaan jurus dasar.',
  keterangan_d = 'Partisipasi di pencak silat masih kurang, perlu pendampingan agar lebih konsisten dalam latihan.'
WHERE (nama_ekskul ILIKE '%pencak silat%' OR nama_ekskul ILIKE '%silat%') AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti program tahfizh dengan kemajuan terbatas, perlu meningkatkan ketekunan dan rutinitas murajaah.',
  keterangan_d = 'Capaian hafalan masih jauh dari target, perlu pendampingan intensif dan motivasi untuk lebih konsisten.'
WHERE (nama_ekskul ILIKE '%tahfizh%' OR nama_ekskul ILIKE '%tahfidz%') AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Membaca Al-Qur''an dengan kemampuan dasar, perlu memperbaiki tajwid dan kelancaran bacaan.',
  keterangan_d = 'Bacaan Al-Qur''an masih perlu banyak perbaikan, terutama pada makharijul huruf dan tajwid dasar.'
WHERE (nama_ekskul ILIKE '%tilawah%' OR nama_ekskul ILIKE '%qori%') AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan futsal dengan partisipasi cukup, perlu meningkatkan teknik dan stamina permainan.',
  keterangan_d = 'Partisipasi di futsal masih kurang, perlu motivasi untuk lebih aktif dan menguasai teknik dasar.'
WHERE nama_ekskul ILIKE '%futsal%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan sepak bola dengan partisipasi cukup, perlu memperbaiki teknik dan kerja sama tim.',
  keterangan_d = 'Keaktifan di sepak bola masih kurang, perlu motivasi agar lebih konsisten dalam latihan.'
WHERE nama_ekskul ILIKE '%sepak bola%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan bola voli seadanya, perlu memperdalam teknik passing dan smash.',
  keterangan_d = 'Partisipasi di bola voli masih kurang, perlu pendampingan untuk menguasai teknik dasar.'
WHERE (nama_ekskul ILIKE '%voli%' OR nama_ekskul ILIKE '%volly%') AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan basket dengan partisipasi cukup, perlu meningkatkan teknik dribbling dan shooting.',
  keterangan_d = 'Keaktifan di basket masih kurang, perlu motivasi untuk lebih konsisten berlatih teknik dasar.'
WHERE nama_ekskul ILIKE '%basket%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan bulu tangkis dengan partisipasi cukup, perlu memperdalam teknik pukulan dan footwork.',
  keterangan_d = 'Partisipasi di bulu tangkis masih kurang, perlu motivasi untuk lebih konsisten berlatih.'
WHERE (nama_ekskul ILIKE '%badminton%' OR nama_ekskul ILIKE '%bulu tangkis%') AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan tari dengan partisipasi cukup, perlu memperdalam keluwesan gerak.',
  keterangan_d = 'Keaktifan di seni tari masih kurang, perlu motivasi dan pendampingan agar lebih percaya diri.'
WHERE nama_ekskul ILIKE '%tari%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti kegiatan musik dengan partisipasi cukup, perlu memperdalam penguasaan alat musik.',
  keterangan_d = 'Keaktifan di kegiatan musik masih kurang, perlu motivasi untuk berlatih lebih rutin.'
WHERE nama_ekskul ILIKE '%musik%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan nasyid dengan partisipasi cukup, perlu memperbaiki teknik vokal dan harmonisasi.',
  keterangan_d = 'Keaktifan di tim nasyid masih kurang, perlu pendampingan agar lebih konsisten berlatih.'
WHERE nama_ekskul ILIKE '%nasyid%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti kegiatan English Club dengan partisipasi cukup, perlu lebih percaya diri berkomunikasi.',
  keterangan_d = 'Keaktifan di English Club masih kurang, perlu motivasi untuk lebih berani berbicara dan berlatih.'
WHERE nama_ekskul ILIKE '%english%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti kegiatan PMR dengan partisipasi cukup, perlu memperdalam keterampilan pertolongan pertama.',
  keterangan_d = 'Keaktifan di PMR masih kurang, perlu pendampingan untuk menguasai keterampilan dasar pertolongan.'
WHERE nama_ekskul ILIKE '%pmr%' AND keterangan_c IS NULL;

UPDATE public.ekskul_preset
SET
  keterangan_c = 'Mengikuti latihan Paskibra dengan partisipasi cukup, perlu meningkatkan kedisiplinan baris-berbaris.',
  keterangan_d = 'Keaktifan di Paskibra masih kurang, perlu motivasi untuk lebih disiplin dan konsisten berlatih.'
WHERE nama_ekskul ILIKE '%paskibra%' AND keterangan_c IS NULL;