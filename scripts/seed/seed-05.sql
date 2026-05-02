-- ============================================================
-- E-RAPORT PKBM — SEED 5: DATA OPERASIONAL
-- ============================================================
-- Mengisi semua tabel transaksi untuk development:
--   1. satuan_pendidikan (1 PKBM)
--   2. tahun_pelajaran   (2024/2025 sem 1)
--   3. rombongan_belajar (6 kelas lintas paket)
--   4. peserta_didik     (30 siswa, semua Islam)
--   5. enrollment        (30 rows)
--   6. nilai_mapel       (~350 rows, auto-generated via hashtext)
--   7. penilaian_p5      (30 × 42 = 1260 rows, auto-generated)
--   8. catatan_p5        (30 rows)
--   9. catatan_wali_kelas(30 rows)
--  10. ketidakhadiran    (30 rows)
--  11. ekstrakurikuler   (60 rows, 2 per siswa)
--  12. rapor_header      (30 rows, mix draft & published)
--
-- Skip: user_profiles / input_by (handled Node/Auth seed)
-- Semua input_by / published_by → NULL
-- ============================================================


-- ============================================================
-- SECTION 1 — SATUAN PENDIDIKAN
-- ============================================================

INSERT INTO public.satuan_pendidikan
  (nama, npsn, alamat, kelurahan, kecamatan, kabupaten, provinsi,
   kode_pos, telepon, email, kota, kepala_pkbm, nip_kepala)
VALUES
  ('PKBM AL BARAKAH', '20565817',
   'JL. SULAWESI, RT. 09 RW. 05', 'Grobogan', 'Jiwan',
   'Madiun', 'Jawa Timur', '63161',
   '(0351) 123456', 'pkbm.albarakah@gmail.com', 'Madiun',
   'TUTIK ROFIATI, M.Pd.I', '-');


-- ============================================================
-- SECTION 2 — TAHUN PELAJARAN
-- ============================================================

INSERT INTO public.tahun_pelajaran (nama, semester, is_aktif, tanggal_cetak)
VALUES
  ('2024/2025', 1, true,  '2024-12-20'),
  ('2024/2025', 2, false, NULL);


-- ============================================================
-- SECTION 3 — ROMBONGAN BELAJAR
-- ============================================================
-- 6 kelas: PA kelas I & II, PB kelas VII & VIII, PC kelas X & XII A

INSERT INTO public.rombongan_belajar
  (tahun_pelajaran_id, nama_kelas, tingkat, kelas_paralel, paket, fase, wali_kelas)
SELECT
  tp.id,
  rb.nama_kelas, rb.tingkat, rb.kelas_paralel,
  rb.paket, rb.fase, rb.wali_kelas
FROM public.tahun_pelajaran tp
CROSS JOIN (VALUES
  ('Kelas I',    1::smallint, 'Tidak ada', 'Paket A', 'Fase A', 'SUGENG NURHADI, S.Pd'),
  ('Kelas II',   2::smallint, 'Tidak ada', 'Paket A', 'Fase A', 'SHAFA ZANUBA TASYA UMUL IZZATI, S.Pd'),
  ('Kelas VII',  7::smallint, 'Tidak ada', 'Paket B', 'Fase D', 'EKA PUJI LESTARI, S.Tr.Sos.'),
  ('Kelas VIII', 8::smallint, 'Tidak ada', 'Paket B', 'Fase D', 'YUNI MAHARANI, S.Pd'),
  ('Kelas X',   10::smallint, 'Tidak ada', 'Paket C', 'Fase E', 'BAMBANG SETIAWAN, S.Pd'),
  ('Kelas XII A',12::smallint, 'A',        'Paket C', 'Fase F', 'WAHYU RATNA NINGRUM')
) AS rb(nama_kelas, tingkat, kelas_paralel, paket, fase, wali_kelas)
WHERE tp.semester = 1 AND tp.nama = '2024/2025';


-- ============================================================
-- SECTION 4 — PESERTA DIDIK (30 siswa)
-- ============================================================
-- NIS unik dipakai sebagai key untuk INSERT selanjutnya.
-- Semua siswa Islam → satu pola mapel per paket, lebih clean.

INSERT INTO public.peserta_didik
  (nisn, nis, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir,
   agama, alamat, rt, rw, kelurahan, kecamatan, kabupaten, provinsi,
   nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_telp_ortu)
VALUES
  -- ── PAKET A KELAS I ────────────────────────────────────────
  ('3210000001','001','Ahmad Faiz Maulana',      'L','Madiun','2018-01-12',
   'Islam','Jl. Melati No. 3','02','01','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Slamet Riyadi','Sunarti','Petani','Ibu Rumah Tangga','081234500001'),
  ('3210000002','002','Siti Nur Aini',            'P','Madiun','2018-03-25',
   'Islam','Jl. Kenanga No. 7','03','02','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Bambang Sutrisno','Warsini','Wiraswasta','Pedagang','081234500002'),
  ('3210000003','003','Budi Santoso',             'L','Madiun','2017-07-07',
   'Islam','Jl. Anggrek No. 12','04','01','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Sugiono','Maryati','Buruh','Ibu Rumah Tangga','081234500003'),
  ('3210000004','004','Dewi Rahayu',              'P','Madiun','2018-09-19',
   'Islam','Jl. Mawar No. 5','02','03','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Supriadi','Sumiati','Petani','Pedagang','081234500004'),
  ('3210000005','005','Rizky Pratama',            'L','Madiun','2017-11-30',
   'Islam','Jl. Dahlia No. 9','05','02','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Eko Wahyudi','Siti Rahayu','Wiraswasta','Ibu Rumah Tangga','081234500005'),

  -- ── PAKET A KELAS II ───────────────────────────────────────
  ('3210000006','006','Nur Hidayah',              'P','Madiun','2017-02-14',
   'Islam','Jl. Flamboyan No. 2','01','01','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Poniman','Sukarti','Tani','Pedagang','081234500006'),
  ('3210000007','007','Muhammad Iqbal',           'L','Madiun','2017-04-22',
   'Islam','Jl. Cempaka No. 15','03','04','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Abdul Rahman','Nurjanah','Supir','Ibu Rumah Tangga','081234500007'),
  ('3210000008','008','Fitriani Dewi',            'P','Madiun','2016-08-05',
   'Islam','Jl. Nusa Indah No. 8','06','02','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Suharto','Mardiyah','Buruh','Pedagang','081234500008'),
  ('3210000009','009','Dicky Kurniawan',          'L','Madiun','2016-10-18',
   'Islam','Jl. Teratai No. 11','04','03','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Wiyono','Sri Wahyuni','Wiraswasta','Ibu Rumah Tangga','081234500009'),
  ('3210000010','010','Yuliana Putri',            'P','Madiun','2017-12-09',
   'Islam','Jl. Seruni No. 4','02','01','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Agus Santoso','Retno Wulandari','Pegawai Swasta','Ibu Rumah Tangga','081234500010'),

  -- ── PAKET B KELAS VII ──────────────────────────────────────
  ('3210000011','011','Aditya Nugroho',           'L','Madiun','2012-01-11',
   'Islam','Jl. Diponegoro No. 6','07','02','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Heru Nugroho','Puji Astuti','Wiraswasta','Pedagang','081234500011'),
  ('3210000012','012','Sari Wulandari',           'P','Madiun','2012-03-24',
   'Islam','Jl. Sudirman No. 10','05','01','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Tri Handoyo','Yayuk Sulistyowati','Petani','Ibu Rumah Tangga','081234500012'),
  ('3210000013','013','Fajar Setiawan',           'L','Madiun','2011-06-16',
   'Islam','Jl. Ahmad Yani No. 3','08','03','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Joko Setiawan','Siti Aminah','Buruh','Pedagang','081234500013'),
  ('3210000014','014','Rina Kusuma Dewi',         'P','Madiun','2012-08-28',
   'Islam','Jl. Pahlawan No. 14','06','04','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Dwi Kusuma','Endang Sulastri','Pegawai Swasta','Ibu Rumah Tangga','081234500014'),
  ('3210000015','015','Hendra Wijaya',            'L','Madiun','2011-10-03',
   'Islam','Jl. Kartini No. 7','03','02','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Budi Wijaya','Umi Kulsum','Supir','Ibu Rumah Tangga','081234500015'),

  -- ── PAKET B KELAS VIII ─────────────────────────────────────
  ('3210000016','016','Maya Anggraini',           'P','Madiun','2011-01-17',
   'Islam','Jl. Hayam Wuruk No. 9','09','01','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Suparno','Ngatirah','Petani','Pedagang','081234500016'),
  ('3210000017','017','Wahyu Hidayat',            'L','Madiun','2011-04-29',
   'Islam','Jl. Gajahmada No. 13','04','05','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Hariyono','Suwarni','Buruh','Ibu Rumah Tangga','081234500017'),
  ('3210000018','018','Dini Rahmawati',           'P','Madiun','2010-07-12',
   'Islam','Jl. Majapahit No. 5','07','03','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Suyitno','Sriningsih','Wiraswasta','Pedagang','081234500018'),
  ('3210000019','019','Bagas Prasetyo',           'L','Madiun','2010-09-25',
   'Islam','Jl. Sriwijaya No. 8','02','06','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Mujiono','Parti','Petani','Ibu Rumah Tangga','081234500019'),
  ('3210000020','020','Indah Permata Sari',       'P','Madiun','2011-12-08',
   'Islam','Jl. Mataram No. 16','05','02','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Agus Permana','Kusniati','Pegawai Swasta','Pedagang','081234500020'),

  -- ── PAKET C KELAS X ────────────────────────────────────────
  ('3210000021','021','Rizal Ahmad Fauzi',        'L','Madiun','2009-02-15',
   'Islam','Jl. Veteran No. 4','01','07','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Ahmad Taufiq','Rini Astuti','Wiraswasta','Pedagang','081234500021'),
  ('3210000022','022','Nadia Kusumawati',         'P','Madiun','2009-05-27',
   'Islam','Jl. Kepodang No. 11','08','04','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Triyono','Nurul Hidayah','Pegawai Swasta','Ibu Rumah Tangga','081234500022'),
  ('3210000023','023','Deni Firmansyah',          'L','Madiun','2008-08-09',
   'Islam','Jl. Merpati No. 6','03','08','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Firmanto','Wahyu Ning','Buruh','Pedagang','081234500023'),
  ('3210000024','024','Ayu Lestari',              'P','Madiun','2009-10-21',
   'Islam','Jl. Perkutut No. 2','06','03','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Sulistyo','Erna Wati','Petani','Ibu Rumah Tangga','081234500024'),
  ('3210000025','025','Eko Prasetyo',             'L','Madiun','2008-12-14',
   'Islam','Jl. Cendrawasih No. 7','09','05','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Prasetiyo','Siti Maimunah','Supir','Pedagang','081234500025'),

  -- ── PAKET C KELAS XII A ────────────────────────────────────
  ('3210000026','026','Dimas Arya Pratama',       'L','Madiun','2007-01-06',
   'Islam','Jl. Kutilang No. 5','04','09','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Arya Wibowo','Iin Purwati','Pegawai Swasta','Pedagang','081234500026'),
  ('3210000027','027','Sinta Dewi Rahayu',        'P','Madiun','2007-04-18',
   'Islam','Jl. Jalak No. 9','07','06','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Raharjo','Nining Suryani','Wiraswasta','Ibu Rumah Tangga','081234500027'),
  ('3210000028','028','Febri Nugroho',            'L','Madiun','2006-07-30',
   'Islam','Jl. Rajawali No. 3','02','04','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Nugroho Santoso','Miatun','Petani','Pedagang','081234500028'),
  ('3210000029','029','Anis Kurniawati',          'P','Madiun','2007-10-12',
   'Islam','Jl. Elang No. 14','05','07','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Kurniatun','Lasmi','Buruh','Ibu Rumah Tangga','081234500029'),
  ('3210000030','030','Yoga Satria Wibawa',       'L','Madiun','2006-12-24',
   'Islam','Jl. Nuri No. 8','08','02','Grobogan','Jiwan','Madiun','Jawa Timur',
   'Satria Wibawa','Yuni Astuti','Wiraswasta','Pedagang','081234500030');


-- ============================================================
-- SECTION 5 — ENROLLMENT
-- ============================================================
-- Menghubungkan setiap siswa ke rombel aktif berdasarkan NIS.
-- NIS 001-005 → Kelas I, 006-010 → Kelas II, dst.

INSERT INTO public.enrollment (peserta_didik_id, rombongan_belajar_id, tahun_pelajaran_id, status)
SELECT pd.id, rb.id, tp.id, 'aktif'
FROM public.peserta_didik pd
JOIN public.rombongan_belajar rb ON rb.tahun_pelajaran_id = (
  SELECT id FROM public.tahun_pelajaran WHERE is_aktif = true LIMIT 1
)
JOIN public.tahun_pelajaran tp ON tp.is_aktif = true
WHERE
  -- Kelas I  → NIS 001-005
  (pd.nis IN ('001','002','003','004','005') AND rb.nama_kelas = 'Kelas I')
  OR
  -- Kelas II → NIS 006-010
  (pd.nis IN ('006','007','008','009','010') AND rb.nama_kelas = 'Kelas II')
  OR
  -- Kelas VII → NIS 011-015
  (pd.nis IN ('011','012','013','014','015') AND rb.nama_kelas = 'Kelas VII')
  OR
  -- Kelas VIII → NIS 016-020
  (pd.nis IN ('016','017','018','019','020') AND rb.nama_kelas = 'Kelas VIII')
  OR
  -- Kelas X → NIS 021-025
  (pd.nis IN ('021','022','023','024','025') AND rb.nama_kelas = 'Kelas X')
  OR
  -- Kelas XII A → NIS 026-030
  (pd.nis IN ('026','027','028','029','030') AND rb.nama_kelas = 'Kelas XII A');


-- ============================================================
-- SECTION 6 — NILAI MAPEL
-- ============================================================
-- Formula nilai: 70 + (hashtext(enrollment_id || mapel_id) % 28)
-- Rentang: 70–97 → cover predikat A (90-100), B (75-89), C (60-74)
-- Capaian kompetensi diambil dari KD urutan pertama, level sesuai predikat.

WITH scored AS (
  SELECT
    e.id                                                             AS enrollment_id,
    mp.id                                                            AS mata_pelajaran_id,
    (70 + (abs(hashtext(e.id::text || mp.id::text)) % 28))::smallint AS nilai_akhir
  FROM public.enrollment e
  JOIN public.rombongan_belajar  rb ON e.rombongan_belajar_id = rb.id
  JOIN public.peserta_didik      pd ON e.peserta_didik_id     = pd.id
  JOIN public.mata_pelajaran     mp ON mp.paket = rb.paket
                                   AND mp.fase  = rb.fase
                                   AND (mp.agama IS NULL OR mp.agama = pd.agama)
  WHERE e.status = 'aktif'
),
with_predikat AS (
  SELECT s.*, pg.predikat
  FROM scored s
  JOIN public.predikat_global pg
    ON s.nilai_akhir BETWEEN pg.nilai_min AND pg.nilai_max
)
INSERT INTO public.nilai_mapel
  (enrollment_id, mata_pelajaran_id, nilai_akhir, predikat, capaian_kompetensi)
SELECT
  wp.enrollment_id,
  wp.mata_pelajaran_id,
  wp.nilai_akhir,
  wp.predikat,
  CASE wp.predikat
    WHEN 'A' THEN kd.deskripsi_a
    WHEN 'B' THEN kd.deskripsi_b
    WHEN 'C' THEN kd.deskripsi_c
    ELSE          kd.deskripsi_d
  END AS capaian_kompetensi
FROM with_predikat wp
LEFT JOIN LATERAL (
  SELECT deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d
  FROM public.kompetensi_dasar
  WHERE mata_pelajaran_id = wp.mata_pelajaran_id AND is_aktif = true
  ORDER BY urutan
  LIMIT 1
) kd ON true;


-- ============================================================
-- SECTION 7 — PENILAIAN P5
-- ============================================================
-- Setiap siswa dinilai untuk semua sub-elemen sesuai fase rombel.
-- Distribusi: 20% MB, 30% SB, 30% BSH, 20% SAB (via hashtext % 10)

INSERT INTO public.penilaian_p5 (enrollment_id, sub_elemen_id, predikat)
SELECT
  e.id AS enrollment_id,
  se.id AS sub_elemen_id,
  CASE (abs(hashtext(e.id::text || se.id::text)) % 10)
    WHEN 0 THEN 'MB'
    WHEN 1 THEN 'MB'
    WHEN 2 THEN 'SB'
    WHEN 3 THEN 'SB'
    WHEN 4 THEN 'SB'
    WHEN 5 THEN 'BSH'
    WHEN 6 THEN 'BSH'
    WHEN 7 THEN 'BSH'
    WHEN 8 THEN 'SAB'
    WHEN 9 THEN 'SAB'
  END AS predikat
FROM public.enrollment e
JOIN public.rombongan_belajar rb ON e.rombongan_belajar_id = rb.id
JOIN public.p5_sub_elemen     se ON se.fase = rb.fase
WHERE e.status = 'aktif';


-- ============================================================
-- SECTION 8 — CATATAN P5
-- ============================================================
-- 5 variasi catatan, dipilih berdasarkan hashtext % 5

INSERT INTO public.catatan_p5 (enrollment_id, catatan)
SELECT
  e.id,
  CASE (abs(hashtext(e.id::text || 'p5cat')) % 5)
    WHEN 0 THEN
      'Siswa menunjukkan perkembangan yang sangat baik dalam semua dimensi Profil Pelajar Pancasila. Ananda telah mampu menginternalisasi nilai-nilai Pancasila dan menjadi contoh yang baik bagi teman-temannya.'
    WHEN 1 THEN
      'Siswa berada pada tahap berkembang sesuai harapan pada sebagian besar dimensi. Perlu pembiasaan yang lebih konsisten untuk menginternalisasi seluruh dimensi Profil Pelajar Pancasila dalam kehidupan sehari-hari.'
    WHEN 2 THEN
      'Siswa berada pada tahap mulai berkembang. Perlu pembiasaan yang konsisten dan bimbingan aktif agar enam dimensi Profil Pelajar Pancasila dapat terinternalisasi dengan baik pada kegiatan sehari-hari.'
    WHEN 3 THEN
      'Siswa menunjukkan perkembangan yang baik pada beberapa dimensi, terutama bergotong royong dan mandiri. Diharapkan dapat lebih mengembangkan dimensi bernalar kritis dan kreatif.'
    WHEN 4 THEN
      'Siswa sangat aktif mengembangkan diri dalam berbagai dimensi Profil Pelajar Pancasila. Semangat belajar dan kepedulian sosial ananda patut diapresiasi dan terus dikembangkan.'
  END
FROM public.enrollment e
WHERE e.status = 'aktif';


-- ============================================================
-- SECTION 9 — CATATAN WALI KELAS
-- ============================================================
-- 5 variasi catatan + tanggapan ortu untuk ~33% siswa

INSERT INTO public.catatan_wali_kelas (enrollment_id, catatan, tanggapan_ortu)
SELECT
  e.id,
  CASE (abs(hashtext(e.id::text || 'wkcat')) % 5)
    WHEN 0 THEN
      'Siswa menunjukkan perkembangan yang sangat baik pada semester ini. Ananda tekun, disiplin, dan aktif dalam setiap kegiatan pembelajaran. Diharapkan dapat mempertahankan dan terus meningkatkan prestasi yang sudah baik ini.'
    WHEN 1 THEN
      'Siswa menunjukkan perkembangan yang baik pada semester ini. Ananda mampu mengikuti pembelajaran dengan cukup baik. Diharapkan dapat lebih meningkatkan partisipasi dan kemandirian dalam belajar ke depannya.'
    WHEN 2 THEN
      'Siswa menunjukkan perkembangan bertahap pada semester ini. Ananda mampu mengikuti pembelajaran, namun masih perlu meningkatkan ketekunan dan kedisiplinan. Kerja sama orang tua dan guru sangat diharapkan untuk mendukung kemajuan ananda.'
    WHEN 3 THEN
      'Siswa memiliki potensi yang baik dan aktif dalam kegiatan kelompok. Ananda perlu meningkatkan konsistensi dalam mengerjakan tugas-tugas yang diberikan. Diharapkan ke depan dapat lebih mandiri dan percaya diri dalam belajar.'
    WHEN 4 THEN
      'Siswa sangat antusias dan bersemangat dalam mengikuti pembelajaran. Ananda menunjukkan kreativitas yang baik dalam berbagai tugas. Terus pertahankan semangat belajar dan jadikan pengalaman ini sebagai bekal untuk masa depan yang cerah.'
  END AS catatan,
  CASE WHEN (abs(hashtext(e.id::text || 'ortu')) % 3) = 0
    THEN 'Kami sebagai orang tua mendukung penuh program sekolah dan akan terus membimbing anak kami di rumah agar perkembangannya semakin baik.'
    WHEN (abs(hashtext(e.id::text || 'ortu')) % 3) = 1
    THEN 'Terima kasih atas perhatian dan bimbingan bapak/ibu guru. Kami akan lebih memperhatikan perkembangan belajar anak di rumah.'
    ELSE NULL
  END AS tanggapan_ortu
FROM public.enrollment e
WHERE e.status = 'aktif';


-- ============================================================
-- SECTION 10 — KETIDAKHADIRAN
-- ============================================================
-- sakit: 0-2 hari, izin: 0-2 hari, alpha: 0-1 hari

INSERT INTO public.ketidakhadiran (enrollment_id, sakit, izin, alpha)
SELECT
  e.id,
  (abs(hashtext(e.id::text || 'sakit')) % 3)::smallint  AS sakit,
  (abs(hashtext(e.id::text || 'izin'))  % 3)::smallint  AS izin,
  (abs(hashtext(e.id::text || 'alpha')) % 2)::smallint  AS alpha
FROM public.enrollment e
WHERE e.status = 'aktif';


-- ============================================================
-- SECTION 11 — EKSTRAKURIKULER
-- ============================================================
-- Setiap siswa dapat 2 ekskul:
-- (1) Pramuka → semua siswa
-- (2) Komputer untuk laki-laki, Seni Musik untuk perempuan

INSERT INTO public.ekstrakurikuler (enrollment_id, nama_ekskul, predikat, keterangan)
SELECT
  e.id,
  'Pramuka',
  CASE (abs(hashtext(e.id::text || 'pramuka')) % 3)
    WHEN 0 THEN 'A'
    ELSE         'B'
  END,
  CASE (abs(hashtext(e.id::text || 'pramuka')) % 3)
    WHEN 0 THEN 'Telah menunjukkan kepemimpinan dan tanggung jawab yang sangat baik dalam kegiatan Pramuka.'
    WHEN 1 THEN 'Telah menunjukkan tanggung jawab yang baik dalam menjalankan tugas dan peran sebagai anggota Pramuka.'
    ELSE         'Aktif mengikuti kegiatan Pramuka dan menunjukkan semangat yang baik.'
  END
FROM public.enrollment e
WHERE e.status = 'aktif';

INSERT INTO public.ekstrakurikuler (enrollment_id, nama_ekskul, predikat, keterangan)
SELECT
  e.id,
  CASE pd.jenis_kelamin
    WHEN 'L' THEN 'Komputer'
    ELSE          'Seni Musik'
  END,
  CASE (abs(hashtext(e.id::text || 'ekskul2')) % 4)
    WHEN 0 THEN 'A'
    WHEN 1 THEN 'A'
    ELSE         'B'
  END,
  CASE pd.jenis_kelamin
    WHEN 'L' THEN
      CASE (abs(hashtext(e.id::text || 'eks2k')) % 2)
        WHEN 0 THEN 'Menunjukkan kemampuan yang sangat baik dalam penggunaan komputer dan aplikasi produktivitas.'
        ELSE         'Menunjukkan kemampuan yang baik dalam penggunaan komputer dan aplikasi perkantoran.'
      END
    ELSE
      CASE (abs(hashtext(e.id::text || 'eks2k')) % 2)
        WHEN 0 THEN 'Aktif dan kreatif dalam kegiatan seni musik serta menunjukkan bakat yang berkembang dengan baik.'
        ELSE         'Menunjukkan minat dan partisipasi yang baik dalam kegiatan seni musik.'
      END
  END
FROM public.enrollment e
JOIN public.peserta_didik pd ON e.peserta_didik_id = pd.id
WHERE e.status = 'aktif';


-- ============================================================
-- SECTION 12 — RAPOR HEADER
-- ============================================================
-- Kelas I   : published  ✓
-- Kelas II  : draft
-- Kelas VII : published  ✓
-- Kelas VIII: published  ✓
-- Kelas X   : draft
-- Kelas XII A: published ✓

INSERT INTO public.rapor_header (enrollment_id, status, published_at)
SELECT
  e.id,
  CASE rb.nama_kelas
    WHEN 'Kelas I'    THEN 'published'
    WHEN 'Kelas VII'  THEN 'published'
    WHEN 'Kelas VIII' THEN 'published'
    WHEN 'Kelas XII A'THEN 'published'
    ELSE                   'draft'
  END AS status,
  CASE rb.nama_kelas
    WHEN 'Kelas I'    THEN NOW() - INTERVAL '5 days'
    WHEN 'Kelas VII'  THEN NOW() - INTERVAL '3 days'
    WHEN 'Kelas VIII' THEN NOW() - INTERVAL '2 days'
    WHEN 'Kelas XII A'THEN NOW() - INTERVAL '1 day'
    ELSE NULL
  END AS published_at
FROM public.enrollment e
JOIN public.rombongan_belajar rb ON e.rombongan_belajar_id = rb.id
WHERE e.status = 'aktif';


-- ============================================================
-- SECTION 13 — VERIFIKASI
-- ============================================================

DO $$
DECLARE
  v_satpen    INT; v_tp       INT; v_rombel   INT;
  v_siswa     INT; v_enroll   INT;
  v_nilai     INT; v_p5       INT;
  v_cat_p5    INT; v_cat_wk   INT;
  v_absen     INT; v_ekskul   INT;
  v_rapor     INT; v_rapor_pub INT;
  v_nilai_a   INT; v_nilai_b  INT; v_nilai_c  INT;
  v_p5_mb     INT; v_p5_sb    INT; v_p5_bsh   INT; v_p5_sab INT;
BEGIN
  SELECT COUNT(*) INTO v_satpen  FROM public.satuan_pendidikan;
  SELECT COUNT(*) INTO v_tp      FROM public.tahun_pelajaran;
  SELECT COUNT(*) INTO v_rombel  FROM public.rombongan_belajar;
  SELECT COUNT(*) INTO v_siswa   FROM public.peserta_didik;
  SELECT COUNT(*) INTO v_enroll  FROM public.enrollment;
  SELECT COUNT(*) INTO v_nilai   FROM public.nilai_mapel;
  SELECT COUNT(*) INTO v_p5      FROM public.penilaian_p5;
  SELECT COUNT(*) INTO v_cat_p5  FROM public.catatan_p5;
  SELECT COUNT(*) INTO v_cat_wk  FROM public.catatan_wali_kelas;
  SELECT COUNT(*) INTO v_absen   FROM public.ketidakhadiran;
  SELECT COUNT(*) INTO v_ekskul  FROM public.ekstrakurikuler;
  SELECT COUNT(*) INTO v_rapor   FROM public.rapor_header;
  SELECT COUNT(*) INTO v_rapor_pub FROM public.rapor_header WHERE status = 'published';

  SELECT COUNT(*) INTO v_nilai_a FROM public.nilai_mapel WHERE predikat = 'A';
  SELECT COUNT(*) INTO v_nilai_b FROM public.nilai_mapel WHERE predikat = 'B';
  SELECT COUNT(*) INTO v_nilai_c FROM public.nilai_mapel WHERE predikat = 'C';

  SELECT COUNT(*) INTO v_p5_mb  FROM public.penilaian_p5 WHERE predikat = 'MB';
  SELECT COUNT(*) INTO v_p5_sb  FROM public.penilaian_p5 WHERE predikat = 'SB';
  SELECT COUNT(*) INTO v_p5_bsh FROM public.penilaian_p5 WHERE predikat = 'BSH';
  SELECT COUNT(*) INTO v_p5_sab FROM public.penilaian_p5 WHERE predikat = 'SAB';

  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'SEED 5 — DATA OPERASIONAL VERIFIKASI';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '── Master ─────────────────────────────────────';
  RAISE NOTICE 'Satuan Pendidikan        : %  (expected 1)',   v_satpen;
  RAISE NOTICE 'Tahun Pelajaran          : %  (expected 2)',   v_tp;
  RAISE NOTICE 'Rombongan Belajar        : %  (expected 6)',   v_rombel;
  RAISE NOTICE '── Siswa & Enrollment ─────────────────────────';
  RAISE NOTICE 'Peserta Didik            : %  (expected 30)',  v_siswa;
  RAISE NOTICE 'Enrollment aktif         : %  (expected 30)',  v_enroll;
  RAISE NOTICE '── Nilai Mapel ────────────────────────────────';
  RAISE NOTICE 'Nilai Mapel total        : %',                 v_nilai;
  RAISE NOTICE '  Predikat A (90-100)    : %',                 v_nilai_a;
  RAISE NOTICE '  Predikat B (75-89)     : %',                 v_nilai_b;
  RAISE NOTICE '  Predikat C (60-74)     : %',                 v_nilai_c;
  RAISE NOTICE '── Penilaian P5 ───────────────────────────────';
  RAISE NOTICE 'Penilaian P5 total       : %  (expected 1260)',v_p5;
  RAISE NOTICE '  MB (Mulai Berkembang)  : %',                 v_p5_mb;
  RAISE NOTICE '  SB (Sedang Berkembang) : %',                 v_p5_sb;
  RAISE NOTICE '  BSH (Berkembang SH)    : %',                 v_p5_bsh;
  RAISE NOTICE '  SAB (Sangat Berkembang): %',                 v_p5_sab;
  RAISE NOTICE '── Tabel Pendukung ────────────────────────────';
  RAISE NOTICE 'Catatan P5               : %  (expected 30)',  v_cat_p5;
  RAISE NOTICE 'Catatan Wali Kelas       : %  (expected 30)',  v_cat_wk;
  RAISE NOTICE 'Ketidakhadiran           : %  (expected 30)',  v_absen;
  RAISE NOTICE 'Ekstrakurikuler          : %  (expected 60)',  v_ekskul;
  RAISE NOTICE '── Rapor Header ───────────────────────────────';
  RAISE NOTICE 'Rapor Header total       : %  (expected 30)',  v_rapor;
  RAISE NOTICE '  Published              : %  (expected 20)',  v_rapor_pub;
  RAISE NOTICE '  Draft                  : %  (expected 10)',  (v_rapor - v_rapor_pub);
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'SEED 5 selesai. Database dev siap digunakan!';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;