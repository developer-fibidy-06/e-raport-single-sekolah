-- ============================================================
-- E-RAPORT PKBM — SEED DATA (File 2 dari 2)
-- ============================================================
-- Versi  : 2.2 (sama dengan v2.1 — schema fixes v2.2 gak ngaruh
--               ke master data)
-- Urutan : drop-table.sql → setup.sql → seed.sql
--
-- File ini ngisi master data:
--   1. Predikat global (A/B/C/D)
--   2. P5: 6 dimensi, 19 elemen, 42 sub-elemen × 6 fase = 252 rows
--   3. Mata pelajaran:
--      - Paket A Fase A (kelas 1-2): 15 mapel
--      - Paket B Fase D (kelas 7-9): 16 mapel
--      - Paket C Fase E (kelas 10) : 19 mapel
--      - Paket C Fase F (kelas 11-12): 19 mapel
--   4. Ekskul preset (10 ekskul)
--
-- Aman dijalankan setelah setup.sql v2.2.
-- ============================================================


-- ============================================================
-- SECTION 1 — SEED PREDIKAT GLOBAL
-- ============================================================

INSERT INTO public.predikat_global (predikat, nilai_min, nilai_max) VALUES
  ('A', 90, 100),
  ('B', 75,  89),
  ('C', 60,  74),
  ('D',  0,  59);


-- ============================================================
-- SECTION 2 — SEED P5 MASTER (semua fase A-F)
-- ============================================================

-- ─── 2.1 Dimensi (6 rows) ───────────────────────────────────
INSERT INTO public.p5_dimensi (nomor, nama, urutan) VALUES
  (1, 'Beriman, Bertaqwa kepada Tuhan Yang Maha Esa, dan Berakhlak Mulia', 1),
  (2, 'Berkebhinekaan Global', 2),
  (3, 'Bergotong Royong', 3),
  (4, 'Mandiri', 4),
  (5, 'Bernalar Kritis', 5),
  (6, 'Kreatif', 6);


-- ─── 2.2 Elemen (19 rows) ───────────────────────────────────
INSERT INTO public.p5_elemen (dimensi_id, nama, urutan)
SELECT d.id, e.nama, e.urutan
FROM (SELECT id FROM public.p5_dimensi WHERE nomor = 1) d,
     (VALUES
       ('akhlak beragama', 1),
       ('akhlak pribadi', 2),
       ('akhlak kepada manusia', 3),
       ('akhlak kepada alam', 4),
       ('akhlak kepada negara', 5)
     ) AS e(nama, urutan);

INSERT INTO public.p5_elemen (dimensi_id, nama, urutan)
SELECT d.id, e.nama, e.urutan
FROM (SELECT id FROM public.p5_dimensi WHERE nomor = 2) d,
     (VALUES
       ('mengenal dan menghargai budaya', 1),
       ('komunikasi dan interaksi antar budaya', 2),
       ('refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 3)
     ) AS e(nama, urutan);

INSERT INTO public.p5_elemen (dimensi_id, nama, urutan)
SELECT d.id, e.nama, e.urutan
FROM (SELECT id FROM public.p5_dimensi WHERE nomor = 3) d,
     (VALUES
       ('kolaborasi', 1),
       ('kepedulian', 2),
       ('berbagi', 3)
     ) AS e(nama, urutan);

INSERT INTO public.p5_elemen (dimensi_id, nama, urutan)
SELECT d.id, e.nama, e.urutan
FROM (SELECT id FROM public.p5_dimensi WHERE nomor = 4) d,
     (VALUES
       ('pemahaman diri dan situasi yang dihadapi', 1),
       ('regulasi diri', 2)
     ) AS e(nama, urutan);

INSERT INTO public.p5_elemen (dimensi_id, nama, urutan)
SELECT d.id, e.nama, e.urutan
FROM (SELECT id FROM public.p5_dimensi WHERE nomor = 5) d,
     (VALUES
       ('memperoleh dan memproses informasi dan gagasan', 1),
       ('menganalisis dan mengevaluasi penalaran dan prosedurnya', 2),
       ('refleksi pemikiran dan proses berpikir', 3)
     ) AS e(nama, urutan);

INSERT INTO public.p5_elemen (dimensi_id, nama, urutan)
SELECT d.id, e.nama, e.urutan
FROM (SELECT id FROM public.p5_dimensi WHERE nomor = 6) d,
     (VALUES
       ('menghasilkan gagasan yang orisinal', 1),
       ('menghasilkan karya dan tindakan yang orisinal', 2),
       ('memiliki keluwesan berpikir dalam mencari alternatif solusi permasalahan', 3)
     ) AS e(nama, urutan);


-- ─── 2.3 Sub-elemen (42 rows × 6 fase = 252 rows) ───────────
WITH elemen_map AS (
  SELECT e.id AS elemen_id, d.nomor AS dimensi_nomor, e.nama AS elemen_nama
  FROM public.p5_elemen e
  JOIN public.p5_dimensi d ON e.dimensi_id = d.id
),
fase_list(fase) AS (
  VALUES ('Fase A'),('Fase B'),('Fase C'),('Fase D'),('Fase E'),('Fase F')
),
seed_data(dimensi_nomor, elemen_nama, urutan, deskripsi) AS (
  VALUES
  -- ═══ DIMENSI 1 — Beriman, Bertaqwa ═══
  (1, 'akhlak beragama', 1, 'Memahami kehadiran Tuhan dalam kehidupan sehari-hari serta mengaitkan pemahamannya tentang kualitas atau sifat-sifat Tuhan dengan konsep peran manusia di bumi sebagai makhluk Tuhan yang bertanggung jawab.'),
  (1, 'akhlak beragama', 2, 'Memahami makna dan fungsi, unsur-unsur utama agama/kepercayaan dalam konteks Indonesia, membaca kitab suci, serta memahami ajaran agama/kepercayaan terkait hubungan sesama manusia dan alam semesta.'),
  (1, 'akhlak beragama', 3, 'Melaksanakan ibadah secara rutin dan mandiri sesuai dengan tuntunan agama/kepercayaan, serta berpartisipasi pada perayaan hari-hari besar.'),
  (1, 'akhlak pribadi', 1, 'Berani dan konsisten menyampaikan kebenaran atau fakta serta memahami konsekuensi-konsekuensinya untuk diri sendiri dan orang lain.'),
  (1, 'akhlak pribadi', 2, 'Mengidentifikasi pentingnya menjaga keseimbangan kesehatan jasmani, mental, dan rohani serta berupaya menyeimbangkan aktivitas fisik, sosial dan ibadah.'),
  (1, 'akhlak kepada manusia', 1, 'Mengenal perspektif dan emosi/perasaan dari sudut pandang orang atau kelompok lain yang tidak pernah dijumpai atau dikenalnya. Mengutamakan persamaan dan menghargai perbedaan sebagai alat pemersatu dalam keadaan konflik atau perdebatan.'),
  (1, 'akhlak kepada manusia', 2, 'Memahami perasaan dan sudut pandang orang dan/atau kelompok lain yang tidak pernah dikenalnya.'),
  (1, 'akhlak kepada alam', 1, 'Memahami konsep sebab akibat di antara berbagai ciptaan Tuhan dan mengidentifikasi berbagai sebab yang mempunyai dampak baik atau buruk, langsung maupun tidak langsung, terhadap alam semesta.'),
  (1, 'akhlak kepada alam', 2, 'Mewujudkan rasa syukur dengan berinisiatif untuk menyelesaikan permasalahan lingkungan alam sekitarnya dengan mengajukan alternatif solusi dan mulai menerapkan solusi tersebut.'),
  (1, 'akhlak kepada negara', 1, 'Menganalisis peran, hak, dan kewajiban sebagai warga negara, memahami perlunya mengutamakan kepentingan umum di atas kepentingan pribadi sebagai wujud dari keimanannya kepada Tuhan YME.'),

  -- ═══ DIMENSI 2 — Berkebhinekaan Global ═══
  (2, 'mengenal dan menghargai budaya', 1, 'Memahami perubahan budaya seiring waktu dan sesuai konteks, baik dalam skala lokal, regional, dan nasional. Menjelaskan identitas diri yang terbentuk dari budaya bangsa.'),
  (2, 'mengenal dan menghargai budaya', 2, 'Memahami dinamika budaya yang mencakup pemahaman, kepercayaan, dan praktik keseharian dalam konteks personal dan sosial.'),
  (2, 'mengenal dan menghargai budaya', 3, 'Memahami pentingnya melestarikan dan merayakan tradisi budaya untuk mengembangkan identitas pribadi, sosial, dan bangsa Indonesia serta mulai berupaya melestarikan budaya dalam kehidupan sehari-hari.'),
  (2, 'komunikasi dan interaksi antar budaya', 1, 'Mengeksplorasi pengaruh budaya terhadap penggunaan bahasa serta dapat mengenali risiko dalam berkomunikasi antar budaya.'),
  (2, 'komunikasi dan interaksi antar budaya', 2, 'Menjelaskan asumsi-asumsi yang mendasari perspektif tertentu. Memperkirakan dan mendeskripsikan perasaan serta motivasi komunitas yang berbeda dengan dirinya yang berada dalam situasi yang sulit.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 1, 'Mengidentifikasi masalah yang ada di sekitarnya sebagai akibat dari pilihan yang dilakukan oleh manusia, serta dampak masalah tersebut terhadap sistem ekonomi, sosial dan lingkungan, serta mencari solusi yang memperhatikan prinsip-prinsip keadilan terhadap manusia, alam dan masyarakat.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 2, 'Berpartisipasi dalam menentukan kriteria dan metode yang disepakati bersama untuk menentukan pilihan dan keputusan untuk kepentingan bersama melalui proses bertukar pikiran secara cermat dan terbuka dengan panduan pendidik.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 3, 'Merefleksikan secara kritis gambaran berbagai kelompok budaya yang ditemui dan cara meresponnya.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 4, 'Mengkonfirmasi, mengklarifikasi dan menunjukkan sikap menolak stereotip serta prasangka tentang gambaran identitas kelompok dan suku bangsa.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 5, 'Mengidentifikasi dan menyampaikan isu-isu tentang penghargaan terhadap keragaman dan kesetaraan budaya.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 6, 'Memahami konsep hak dan kewajiban serta implikasinya terhadap ekspresi dan perilakunya. Mulai aktif mengambil sikap dan langkah untuk melindungi hak orang/kelompok lain.'),

  -- ═══ DIMENSI 3 — Bergotong Royong ═══
  (3, 'kolaborasi', 1, 'Menyelaraskan tindakan sendiri dengan tindakan orang lain untuk melaksanakan kegiatan dan mencapai tujuan kelompok di lingkungan sekitar, serta memberi semangat kepada orang lain untuk bekerja efektif dan mencapai tujuan bersama.'),
  (3, 'kolaborasi', 2, 'Memahami informasi, gagasan, emosi, keterampilan dan keprihatinan yang diungkapkan oleh orang lain menggunakan berbagai simbol dan media secara efektif, serta memanfaatkannya untuk meningkatkan kualitas hubungan interpersonal guna mencapai tujuan bersama.'),
  (3, 'kolaborasi', 3, 'Mendemonstrasikan kegiatan kelompok yang menunjukkan bahwa anggota kelompok dengan kelebihan dan kekurangannya masing-masing perlu dan dapat saling membantu memenuhi kebutuhan.'),
  (3, 'kolaborasi', 4, 'Membagi peran dan menyelaraskan tindakan dalam kelompok serta menjaga tindakan agar selaras untuk mencapai tujuan bersama.'),
  (3, 'kepedulian', 1, 'Tanggap terhadap lingkungan sosial sesuai dengan tuntutan peran sosialnya dan berkontribusi sesuai dengan kebutuhan masyarakat.'),
  (3, 'kepedulian', 2, 'Menggunakan pengetahuan tentang sebab dan alasan orang lain menampilkan reaksi tertentu untuk menentukan tindakan yang tepat agar orang lain menampilkan respon yang diharapkan.'),
  (3, 'berbagi', 1, 'Mengupayakan memberi hal yang dianggap penting dan berharga kepada masyarakat yang membutuhkan bantuan di sekitar tempat tinggal.'),

  -- ═══ DIMENSI 4 — Mandiri ═══
  (4, 'pemahaman diri dan situasi yang dihadapi', 1, 'Membuat penilaian yang realistis terhadap kemampuan dan minat, serta prioritas pengembangan diri berdasarkan pengalaman belajar dan aktivitas lain yang dilakukannya.'),
  (4, 'pemahaman diri dan situasi yang dihadapi', 2, 'Memonitor kemajuan belajar yang dicapai serta memprediksi tantangan pribadi dan akademik yang akan muncul berlandaskan pada pengalamannya untuk mempertimbangkan strategi belajar yang sesuai.'),
  (4, 'regulasi diri', 1, 'Memahami dan memprediksi konsekuensi dari emosi dan pengekspresiannya dan menyusun langkah-langkah untuk mengelola emosinya dalam pelaksanaan belajar dan berinteraksi dengan orang lain.'),
  (4, 'regulasi diri', 2, 'Merancang strategi yang sesuai untuk menunjang pencapaian tujuan belajar, prestasi, dan pengembangan diri dengan mempertimbangkan kekuatan dan kelemahan dirinya, serta situasi yang dihadapi.'),
  (4, 'regulasi diri', 3, 'Mengkritisi efektivitas dirinya dalam bekerja secara mandiri dengan mengidentifikasi hal-hal yang menunjang maupun menghambat dalam mencapai tujuan.'),
  (4, 'regulasi diri', 4, 'Berkomitmen dan menjaga konsistensi pencapaian tujuan yang telah direncanakannya untuk mencapai tujuan belajar dan pengembangan diri yang diharapkannya.'),
  (4, 'regulasi diri', 5, 'Membuat rencana baru dengan mengadaptasi, dan memodifikasi strategi yang sudah dibuat ketika upaya sebelumnya tidak berhasil, serta menjalankan kembali tugasnya dengan keyakinan baru.'),

  -- ═══ DIMENSI 5 — Bernalar Kritis ═══
  (5, 'memperoleh dan memproses informasi dan gagasan', 1, 'Mengajukan pertanyaan untuk klarifikasi dan interpretasi informasi, serta mencari tahu penyebab dan konsekuensi dari informasi tersebut.'),
  (5, 'memperoleh dan memproses informasi dan gagasan', 2, 'Mengidentifikasi, mengklarifikasi, dan menganalisis informasi yang relevan serta memprioritaskan beberapa gagasan tertentu.'),
  (5, 'menganalisis dan mengevaluasi penalaran dan prosedurnya', 1, 'Menalar dengan berbagai argumen dalam mengambil suatu simpulan atau keputusan.'),
  (5, 'refleksi pemikiran dan proses berpikir', 1, 'Menjelaskan asumsi yang digunakan, menyadari kecenderungan dan konsekuensi bias pada pemikirannya, serta berusaha mempertimbangkan perspektif yang berbeda.'),

  -- ═══ DIMENSI 6 — Kreatif ═══
  (6, 'menghasilkan gagasan yang orisinal', 1, 'Menghubungkan gagasan yang ia miliki dengan informasi atau gagasan baru untuk menghasilkan kombinasi gagasan baru dan imajinatif untuk mengekspresikan pikiran dan/atau perasaannya.'),
  (6, 'menghasilkan karya dan tindakan yang orisinal', 1, 'Mengeksplorasi dan mengekspresikan pikiran dan/atau perasaannya dalam bentuk karya dan/atau tindakan, serta mengevaluasinya dan mempertimbangkan dampaknya bagi orang lain.'),
  (6, 'memiliki keluwesan berpikir dalam mencari alternatif solusi permasalahan', 1, 'Menghasilkan solusi alternatif dengan mengadaptasi berbagai gagasan dan umpan balik untuk menghadapi situasi dan permasalahan.')
)
INSERT INTO public.p5_sub_elemen (elemen_id, fase, deskripsi, urutan)
SELECT em.elemen_id, fl.fase, sd.deskripsi, sd.urutan
FROM seed_data sd
JOIN elemen_map em
  ON em.dimensi_nomor = sd.dimensi_nomor
 AND em.elemen_nama   = sd.elemen_nama
CROSS JOIN fase_list fl;


-- ============================================================
-- SECTION 3 — SEED MATA PELAJARAN
-- ============================================================

-- ─── 3.1 PAKET A FASE A (kelas 1-2) — 15 mapel──────────────
INSERT INTO public.mata_pelajaran (nama, paket, fase, kelompok, agama, urutan, is_aktif) VALUES
  ('Pendidikan Agama Islam dan Budi Pekerti',    'Paket A', 'Fase A', 'umum', 'Islam',    1, TRUE),
  ('Pendidikan Agama Kristen dan Budi Pekerti',  'Paket A', 'Fase A', 'umum', 'Kristen',  1, TRUE),
  ('Pendidikan Agama Katolik dan Budi Pekerti',  'Paket A', 'Fase A', 'umum', 'Katolik',  1, TRUE),
  ('Pendidikan Agama Hindu dan Budi Pekerti',    'Paket A', 'Fase A', 'umum', 'Hindu',    1, TRUE),
  ('Pendidikan Agama Buddha dan Budi Pekerti',   'Paket A', 'Fase A', 'umum', 'Buddha',   1, TRUE),
  ('Pendidikan Agama Konghucu dan Budi Pekerti', 'Paket A', 'Fase A', 'umum', 'Konghucu', 1, TRUE),
  ('Pendidikan Pancasila',                       'Paket A', 'Fase A', 'umum', NULL, 2, TRUE),
  ('Bahasa Indonesia',                           'Paket A', 'Fase A', 'umum', NULL, 3, TRUE),
  ('Matematika',                                 'Paket A', 'Fase A', 'umum', NULL, 4, TRUE),
  ('Ilmu Pengetahuan Sosial',                    'Paket A', 'Fase A', 'umum', NULL, 5, TRUE),
  ('Bahasa Inggris',                             'Paket A', 'Fase A', 'umum', NULL, 6, TRUE),
  ('Pendidikan Jasmani Olahraga dan Kesehatan',  'Paket A', 'Fase A', 'umum', NULL, 7, TRUE),
  ('Seni',                                       'Paket A', 'Fase A', 'umum', NULL, 8, TRUE),
  ('Pemberdayaan',                               'Paket A', 'Fase A', 'khusus', NULL, 1, TRUE),
  ('Keterampilan',                               'Paket A', 'Fase A', 'khusus', NULL, 2, TRUE);


-- ─── 3.2 PAKET B FASE D (kelas 7-9) — 16 mapel ──────────────
INSERT INTO public.mata_pelajaran (nama, paket, fase, kelompok, agama, urutan, is_aktif) VALUES
  ('Pendidikan Agama Islam dan Budi Pekerti',    'Paket B', 'Fase D', 'umum', 'Islam',    1, TRUE),
  ('Pendidikan Agama Kristen dan Budi Pekerti',  'Paket B', 'Fase D', 'umum', 'Kristen',  1, TRUE),
  ('Pendidikan Agama Katolik dan Budi Pekerti',  'Paket B', 'Fase D', 'umum', 'Katolik',  1, TRUE),
  ('Pendidikan Agama Hindu dan Budi Pekerti',    'Paket B', 'Fase D', 'umum', 'Hindu',    1, TRUE),
  ('Pendidikan Agama Buddha dan Budi Pekerti',   'Paket B', 'Fase D', 'umum', 'Buddha',   1, TRUE),
  ('Pendidikan Agama Konghucu dan Budi Pekerti', 'Paket B', 'Fase D', 'umum', 'Konghucu', 1, TRUE),
  ('Pendidikan Pancasila',                       'Paket B', 'Fase D', 'umum', NULL, 2, TRUE),
  ('Bahasa Indonesia',                           'Paket B', 'Fase D', 'umum', NULL, 3, TRUE),
  ('Matematika',                                 'Paket B', 'Fase D', 'umum', NULL, 4, TRUE),
  ('Ilmu Pengetahuan Alam',                      'Paket B', 'Fase D', 'umum', NULL, 5, TRUE),
  ('Ilmu Pengetahuan Sosial',                    'Paket B', 'Fase D', 'umum', NULL, 6, TRUE),
  ('Bahasa Inggris',                             'Paket B', 'Fase D', 'umum', NULL, 7, TRUE),
  ('Pendidikan Jasmani Olahraga dan Kesehatan',  'Paket B', 'Fase D', 'umum', NULL, 8, TRUE),
  ('Seni',                                       'Paket B', 'Fase D', 'umum', NULL, 9, TRUE),
  ('Pemberdayaan',                               'Paket B', 'Fase D', 'khusus', NULL, 1, TRUE),
  ('Keterampilan',                               'Paket B', 'Fase D', 'khusus', NULL, 2, TRUE);


-- ─── 3.3 PAKET C FASE E (kelas 10) — 19 mapel ───────────────
INSERT INTO public.mata_pelajaran (nama, paket, fase, kelompok, agama, urutan, is_aktif) VALUES
  ('Pendidikan Agama Islam dan Budi Pekerti',    'Paket C', 'Fase E', 'umum', 'Islam',    1, TRUE),
  ('Pendidikan Agama Kristen dan Budi Pekerti',  'Paket C', 'Fase E', 'umum', 'Kristen',  1, TRUE),
  ('Pendidikan Agama Katolik dan Budi Pekerti',  'Paket C', 'Fase E', 'umum', 'Katolik',  1, TRUE),
  ('Pendidikan Agama Hindu dan Budi Pekerti',    'Paket C', 'Fase E', 'umum', 'Hindu',    1, TRUE),
  ('Pendidikan Agama Buddha dan Budi Pekerti',   'Paket C', 'Fase E', 'umum', 'Buddha',   1, TRUE),
  ('Pendidikan Agama Konghucu dan Budi Pekerti', 'Paket C', 'Fase E', 'umum', 'Konghucu', 1, TRUE),
  ('Pendidikan Kewarganegaraan',                 'Paket C', 'Fase E', 'umum', NULL, 2, TRUE),
  ('Bahasa Indonesia',                           'Paket C', 'Fase E', 'umum', NULL, 3, TRUE),
  ('Matematika',                                 'Paket C', 'Fase E', 'umum', NULL, 4, TRUE),
  ('Sejarah Indonesia',                          'Paket C', 'Fase E', 'umum', NULL, 5, TRUE),
  ('Bahasa Inggris',                             'Paket C', 'Fase E', 'umum', NULL, 6, TRUE),
  ('Geografi',                                   'Paket C', 'Fase E', 'peminatan_ips', NULL, 1, TRUE),
  ('Sejarah',                                    'Paket C', 'Fase E', 'peminatan_ips', NULL, 2, TRUE),
  ('Sosiologi',                                  'Paket C', 'Fase E', 'peminatan_ips', NULL, 3, TRUE),
  ('Ekonomi',                                    'Paket C', 'Fase E', 'peminatan_ips', NULL, 4, TRUE),
  ('PJOK',                                       'Paket C', 'Fase E', 'khusus', NULL, 1, TRUE),
  ('Prakarya',                                   'Paket C', 'Fase E', 'khusus', NULL, 2, TRUE),
  ('Pemberdayaan',                               'Paket C', 'Fase E', 'khusus', NULL, 3, TRUE),
  ('Keterampilan',                               'Paket C', 'Fase E', 'khusus', NULL, 4, TRUE);


-- ─── 3.4 PAKET C FASE F (kelas 11-12) — 19 mapel ────────────
INSERT INTO public.mata_pelajaran (nama, paket, fase, kelompok, agama, urutan, is_aktif) VALUES
  ('Pendidikan Agama Islam dan Budi Pekerti',    'Paket C', 'Fase F', 'umum', 'Islam',    1, TRUE),
  ('Pendidikan Agama Kristen dan Budi Pekerti',  'Paket C', 'Fase F', 'umum', 'Kristen',  1, TRUE),
  ('Pendidikan Agama Katolik dan Budi Pekerti',  'Paket C', 'Fase F', 'umum', 'Katolik',  1, TRUE),
  ('Pendidikan Agama Hindu dan Budi Pekerti',    'Paket C', 'Fase F', 'umum', 'Hindu',    1, TRUE),
  ('Pendidikan Agama Buddha dan Budi Pekerti',   'Paket C', 'Fase F', 'umum', 'Buddha',   1, TRUE),
  ('Pendidikan Agama Konghucu dan Budi Pekerti', 'Paket C', 'Fase F', 'umum', 'Konghucu', 1, TRUE),
  ('Pendidikan Kewarganegaraan',                 'Paket C', 'Fase F', 'umum', NULL, 2, TRUE),
  ('Bahasa Indonesia',                           'Paket C', 'Fase F', 'umum', NULL, 3, TRUE),
  ('Matematika',                                 'Paket C', 'Fase F', 'umum', NULL, 4, TRUE),
  ('Sejarah Indonesia',                          'Paket C', 'Fase F', 'umum', NULL, 5, TRUE),
  ('Bahasa Inggris',                             'Paket C', 'Fase F', 'umum', NULL, 6, TRUE),
  ('Geografi',                                   'Paket C', 'Fase F', 'peminatan_ips', NULL, 1, TRUE),
  ('Sejarah',                                    'Paket C', 'Fase F', 'peminatan_ips', NULL, 2, TRUE),
  ('Sosiologi',                                  'Paket C', 'Fase F', 'peminatan_ips', NULL, 3, TRUE),
  ('Ekonomi',                                    'Paket C', 'Fase F', 'peminatan_ips', NULL, 4, TRUE),
  ('PJOK',                                       'Paket C', 'Fase F', 'khusus', NULL, 1, TRUE),
  ('Prakarya',                                   'Paket C', 'Fase F', 'khusus', NULL, 2, TRUE),
  ('Pemberdayaan',                               'Paket C', 'Fase F', 'khusus', NULL, 3, TRUE),
  ('Keterampilan',                               'Paket C', 'Fase F', 'khusus', NULL, 4, TRUE);


-- ============================================================
-- SECTION 4 — SEED EKSKUL PRESET
-- ============================================================

INSERT INTO public.ekskul_preset (nama_ekskul, gender, urutan, is_aktif) VALUES
  ('Pramuka',              'SEMUA', 1, TRUE),
  ('Komputer',             'SEMUA', 2, TRUE),
  ('Bahasa Inggris',       'SEMUA', 3, TRUE),
  ('Karya Tulis Ilmiah',   'SEMUA', 4, TRUE),
  ('Seni Musik',           'SEMUA', 5, TRUE),
  ('Futsal',               'L',     1, TRUE),
  ('Pencak Silat',         'L',     2, TRUE),
  ('Tata Rias',            'P',     1, TRUE),
  ('Menjahit',             'P',     2, TRUE),
  ('Tata Boga',            'P',     3, TRUE);


-- ============================================================
-- SECTION 5 — VERIFIKASI
-- ============================================================

DO $$
DECLARE
  v_predikat   INT;
  v_dimensi    INT;
  v_elemen     INT;
  v_sub_elemen_total INT;
  v_sub_elemen_per_fase INT;
  v_mapel_a_total  INT;
  v_mapel_b_total  INT;
  v_mapel_ce_total INT;
  v_mapel_cf_total INT;
  v_mapel_grand    INT;
  v_ekskul_semua INT;
  v_ekskul_l     INT;
  v_ekskul_p     INT;
  v_test_kelas    TEXT;
  v_test_semester TEXT;
BEGIN
  SELECT COUNT(*) INTO v_predikat   FROM public.predikat_global;
  SELECT COUNT(*) INTO v_dimensi    FROM public.p5_dimensi;
  SELECT COUNT(*) INTO v_elemen     FROM public.p5_elemen;
  SELECT COUNT(*) INTO v_sub_elemen_total    FROM public.p5_sub_elemen;
  SELECT COUNT(*) INTO v_sub_elemen_per_fase FROM public.p5_sub_elemen WHERE fase = 'Fase E';

  SELECT COUNT(*) INTO v_mapel_a_total  FROM public.mata_pelajaran
    WHERE paket = 'Paket A' AND fase = 'Fase A';
  SELECT COUNT(*) INTO v_mapel_b_total  FROM public.mata_pelajaran
    WHERE paket = 'Paket B' AND fase = 'Fase D';
  SELECT COUNT(*) INTO v_mapel_ce_total FROM public.mata_pelajaran
    WHERE paket = 'Paket C' AND fase = 'Fase E';
  SELECT COUNT(*) INTO v_mapel_cf_total FROM public.mata_pelajaran
    WHERE paket = 'Paket C' AND fase = 'Fase F';
  SELECT COUNT(*) INTO v_mapel_grand    FROM public.mata_pelajaran;

  SELECT COUNT(*) INTO v_ekskul_semua FROM public.ekskul_preset WHERE gender = 'SEMUA';
  SELECT COUNT(*) INTO v_ekskul_l     FROM public.ekskul_preset WHERE gender = 'L';
  SELECT COUNT(*) INTO v_ekskul_p     FROM public.ekskul_preset WHERE gender = 'P';

  v_test_kelas := public.format_kelas_label(12, 'Tidak ada')
               || ' | ' || public.format_kelas_label(12, 'A')
               || ' | ' || public.format_kelas_label(7, 'B');

  v_test_semester := public.format_semester_label(1)
                  || ' | ' || public.format_semester_label(2);

  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'SEED E-RAPORT PKBM v2.2 — VERIFIKASI';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'Predikat global         : %    (expected   4)',  v_predikat;
  RAISE NOTICE 'P5 Dimensi              : %    (expected   6)',  v_dimensi;
  RAISE NOTICE 'P5 Elemen               : %   (expected  19)',  v_elemen;
  RAISE NOTICE 'P5 Sub-elemen per fase  : %   (expected  42)',  v_sub_elemen_per_fase;
  RAISE NOTICE 'P5 Sub-elemen total     : %  (expected 252)',  v_sub_elemen_total;
  RAISE NOTICE 'Mapel Paket A Fase A    : %   (expected  15)',  v_mapel_a_total;
  RAISE NOTICE 'Mapel Paket B Fase D    : %   (expected  16)',  v_mapel_b_total;
  RAISE NOTICE 'Mapel Paket C Fase E    : %   (expected  19)',  v_mapel_ce_total;
  RAISE NOTICE 'Mapel Paket C Fase F    : %   (expected  19)',  v_mapel_cf_total;
  RAISE NOTICE 'Mapel TOTAL             : %   (expected  69)',  v_mapel_grand;
  RAISE NOTICE 'Ekskul SEMUA / L / P    : % / % / %    (expected 5/2/3)',  v_ekskul_semua, v_ekskul_l, v_ekskul_p;
  RAISE NOTICE 'format_kelas_label      : %', v_test_kelas;
  RAISE NOTICE 'format_semester_label   : %', v_test_semester;
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'Database siap dipakai. Jangan lupa create admin profile!';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;