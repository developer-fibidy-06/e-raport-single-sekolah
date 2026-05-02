-- ============================================================
-- E-RAPORT PKBM — SEED 3: KOMPETENSI DASAR PAKET A & B
-- ============================================================
-- Mengisi tabel kompetensi_dasar untuk:
--   - Paket A Fase A  : mapel id 1–15  (15 mapel × 3 KD = 45 rows)
--   - Paket B Fase D  : mapel id 16–31 (16 mapel × 4 KD = 64 rows)
-- Total: 109 rows
--
-- Pola deskripsi per KD:
--   A = Sangat Baik  (90–100) : sudah mandiri, konsisten, melampaui
--   B = Baik         (75–89)  : mampu, dapat melakukan dengan baik
--   C = Cukup        (60–74)  : mulai berkembang, perlu latihan
--   D = Perlu Bimbing (0–59)  : belum mandiri, perlu pendampingan
-- ============================================================


-- ============================================================
-- PAKET A — PENDIDIKAN AGAMA (6 agama, id 1–6)
-- KD identik untuk semua agama, dibedakan hanya oleh mapel id
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
SELECT
  mp.id,
  kd.nama_kompetensi,
  kd.urutan,
  kd.deskripsi_a, kd.deskripsi_b, kd.deskripsi_c, kd.deskripsi_d
FROM public.mata_pelajaran mp
CROSS JOIN (VALUES
  (1,
   'Mengenal ajaran pokok dan nilai-nilai agama',
   'Siswa sangat memahami ajaran pokok agama dan mampu menjelaskan nilai-nilai moral yang terkandung di dalamnya secara mandiri dan terperinci.',
   'Siswa memahami ajaran pokok agama dan dapat menjelaskan nilai-nilai moral yang diajarkan dengan baik.',
   'Siswa cukup memahami ajaran pokok agama namun masih perlu bimbingan dalam menjelaskan nilai-nilai moral secara lengkap.',
   'Siswa belum memahami ajaran pokok agama dengan baik dan memerlukan bimbingan intensif dari guru dan orang tua.'
  ),
  (2,
   'Mempraktikkan ibadah dan perilaku akhlak mulia',
   'Siswa sangat tekun melaksanakan ibadah sesuai tuntunan agama dan secara konsisten menunjukkan perilaku akhlak mulia dalam kehidupan sehari-hari.',
   'Siswa melaksanakan ibadah sesuai tuntunan agama dan menunjukkan perilaku akhlak mulia dalam keseharian.',
   'Siswa mulai melaksanakan ibadah dan menunjukkan beberapa perilaku akhlak mulia namun masih memerlukan pembiasaan.',
   'Siswa belum terbiasa melaksanakan ibadah secara mandiri dan memerlukan bimbingan untuk menerapkan akhlak mulia.'
  ),
  (3,
   'Menerapkan nilai agama dalam kehidupan sehari-hari',
   'Siswa sangat mampu menerapkan nilai-nilai agama dalam seluruh aspek kehidupan sehari-hari di lingkungan sekolah maupun rumah secara konsisten.',
   'Siswa mampu menerapkan nilai-nilai agama dalam kehidupan sehari-hari di lingkungan sekolah dengan baik.',
   'Siswa mulai menerapkan nilai-nilai agama dalam kehidupan sehari-hari namun belum konsisten dan perlu pembiasaan.',
   'Siswa belum mampu menerapkan nilai-nilai agama secara mandiri dalam kehidupan sehari-hari dan perlu pendampingan aktif.'
  )
) AS kd(urutan, nama_kompetensi, deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
WHERE mp.paket = 'Paket A' AND mp.kelompok = 'umum' AND mp.agama IS NOT NULL;


-- ============================================================
-- PAKET A — PENDIDIKAN PANCASILA (id 7)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (7, 'Mengenal simbol dan makna sila-sila Pancasila', 1,
   'Siswa sangat memahami simbol dan makna setiap sila Pancasila serta mampu mengaitkannya dengan contoh nyata dalam kehidupan sehari-hari.',
   'Siswa memahami simbol dan makna sila-sila Pancasila dan dapat memberikan contoh penerapannya.',
   'Siswa mengenal simbol Pancasila namun masih perlu bimbingan dalam memahami maknanya secara lengkap.',
   'Siswa belum mengenal dengan baik simbol dan makna Pancasila serta memerlukan pendampingan yang intensif.'
  ),
  (7, 'Menerapkan nilai persatuan dan gotong royong', 2,
   'Siswa sangat aktif menerapkan nilai persatuan dan gotong royong dalam kegiatan sekolah dan menginspirasi teman-temannya.',
   'Siswa aktif menerapkan nilai persatuan dan gotong royong dalam kegiatan di sekolah dengan baik.',
   'Siswa mulai menunjukkan sikap gotong royong namun masih perlu dorongan untuk berpartisipasi aktif.',
   'Siswa belum menunjukkan sikap gotong royong secara konsisten dan perlu bimbingan dari guru.'
  ),
  (7, 'Memahami hak dan kewajiban sebagai warga sekolah', 3,
   'Siswa sangat memahami hak dan kewajibannya sebagai warga sekolah dan secara mandiri menjalankan kewajibannya dengan penuh tanggung jawab.',
   'Siswa memahami hak dan kewajibannya sebagai warga sekolah dan berusaha menjalankan kewajibannya.',
   'Siswa mulai memahami hak dan kewajiban sebagai warga sekolah namun belum konsisten dalam menjalankannya.',
   'Siswa belum memahami hak dan kewajibannya sebagai warga sekolah dan memerlukan bimbingan.'
  );


-- ============================================================
-- PAKET A — BAHASA INDONESIA (id 8)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (8, 'Membaca dan memahami teks sederhana', 1,
   'Siswa sangat lancar membaca teks sederhana dan mampu memahami isi serta mengungkapkan kembali dengan kata-kata sendiri secara tepat.',
   'Siswa lancar membaca teks sederhana dan dapat memahami isi bacaan dengan baik.',
   'Siswa dapat membaca teks sederhana namun masih memerlukan bantuan dalam memahami isinya secara menyeluruh.',
   'Siswa belum lancar membaca teks sederhana dan masih memerlukan bimbingan intensif dari guru.'
  ),
  (8, 'Menulis kalimat dan paragraf sederhana', 2,
   'Siswa sangat mampu menulis kalimat dan paragraf sederhana dengan struktur yang benar, ejaan yang tepat, dan tulisan yang rapi.',
   'Siswa mampu menulis kalimat dan paragraf sederhana dengan struktur yang benar dan ejaan yang cukup tepat.',
   'Siswa mulai mampu menulis kalimat sederhana namun masih banyak kesalahan ejaan dan memerlukan bimbingan.',
   'Siswa belum mampu menulis kalimat sederhana secara mandiri dan memerlukan pendampingan intensif.'
  ),
  (8, 'Menyimak dan berbicara dalam komunikasi sehari-hari', 3,
   'Siswa sangat aktif dan percaya diri dalam berkomunikasi, mampu menyimak dengan seksama dan menyampaikan ide secara runtut dan jelas.',
   'Siswa aktif berkomunikasi, mampu menyimak dengan baik dan menyampaikan ide dengan cukup jelas.',
   'Siswa mulai berani berbicara di kelas namun masih perlu bimbingan dalam menyusun gagasan secara runtut.',
   'Siswa belum berani berbicara secara aktif dan masih sangat perlu dorongan serta bimbingan dari guru.'
  );


-- ============================================================
-- PAKET A — MATEMATIKA (id 9)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (9, 'Memahami bilangan dan operasi hitung dasar', 1,
   'Siswa sangat menguasai konsep bilangan dan operasi hitung dasar serta mampu menerapkannya dalam berbagai soal pemecahan masalah.',
   'Siswa menguasai konsep bilangan dan operasi hitung dasar dengan baik.',
   'Siswa cukup memahami bilangan dan operasi hitung dasar namun masih membuat kesalahan pada soal yang lebih kompleks.',
   'Siswa belum memahami operasi hitung dasar dengan baik dan memerlukan bimbingan dalam setiap langkah penyelesaian.'
  ),
  (9, 'Memahami pengukuran dan geometri dasar', 2,
   'Siswa sangat memahami konsep pengukuran dan geometri dasar serta mampu menggunakannya dalam situasi nyata dengan tepat.',
   'Siswa memahami konsep pengukuran dan geometri dasar serta dapat menggunakannya dengan baik.',
   'Siswa mulai memahami pengukuran dan geometri dasar namun masih perlu bimbingan pada beberapa konsep.',
   'Siswa belum memahami pengukuran dan geometri dasar serta memerlukan bimbingan intensif dari guru.'
  ),
  (9, 'Mengumpulkan dan menyajikan data sederhana', 3,
   'Siswa sangat mampu mengumpulkan, menyajikan, dan menafsirkan data sederhana dalam bentuk tabel atau diagram secara mandiri.',
   'Siswa mampu mengumpulkan dan menyajikan data sederhana dalam bentuk tabel dengan baik.',
   'Siswa mulai mampu menyajikan data sederhana namun masih memerlukan bimbingan dalam menafsirkan hasilnya.',
   'Siswa belum mampu menyajikan data secara mandiri dan memerlukan bimbingan dalam setiap langkahnya.'
  );


-- ============================================================
-- PAKET A — ILMU PENGETAHUAN SOSIAL (id 10)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (10, 'Mengenal lingkungan sosial dan alam sekitar', 1,
   'Siswa sangat mampu mendeskripsikan lingkungan sosial dan alam sekitar serta mengaitkannya dengan kehidupan sehari-hari secara mendalam.',
   'Siswa mampu mendeskripsikan lingkungan sosial dan alam sekitar dengan baik.',
   'Siswa mengenal lingkungan sosial dan alam sekitar namun masih memerlukan bimbingan dalam mendeskripsikannya.',
   'Siswa belum mengenal lingkungan sosial dan alam sekitar dengan baik dan memerlukan pendampingan.'
  ),
  (10, 'Memahami keragaman suku, budaya, dan adat istiadat', 2,
   'Siswa sangat memahami keragaman suku, budaya, dan adat istiadat Indonesia serta menunjukkan sikap menghargai perbedaan secara konsisten.',
   'Siswa memahami keragaman suku dan budaya Indonesia serta menunjukkan sikap menghargai perbedaan.',
   'Siswa mulai memahami keragaman budaya namun masih perlu bimbingan untuk menghargai perbedaan secara aktif.',
   'Siswa belum memahami keragaman budaya dengan baik dan memerlukan pendampingan dari guru.'
  ),
  (10, 'Mengenal tokoh dan peristiwa penting dalam sejarah', 3,
   'Siswa sangat menguasai pengetahuan tentang tokoh dan peristiwa penting dalam sejarah Indonesia serta mampu menganalisis maknanya.',
   'Siswa mengenal tokoh dan peristiwa penting dalam sejarah Indonesia dengan baik.',
   'Siswa mengenal beberapa tokoh sejarah namun masih perlu bantuan untuk mengingat peristiwa-peristiwa penting.',
   'Siswa belum mengenal tokoh dan peristiwa sejarah dengan baik dan memerlukan bimbingan intensif.'
  );


-- ============================================================
-- PAKET A — BAHASA INGGRIS (id 11)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (11, 'Mengenal kosakata dan ungkapan dasar', 1,
   'Siswa sangat menguasai kosakata dan ungkapan dasar bahasa Inggris serta mampu menggunakannya dalam konteks yang tepat.',
   'Siswa menguasai kosakata dan ungkapan dasar bahasa Inggris dengan baik.',
   'Siswa mengenal beberapa kosakata dasar namun masih memerlukan bantuan dalam penggunaannya.',
   'Siswa belum menguasai kosakata dasar bahasa Inggris dan memerlukan bimbingan intensif.'
  ),
  (11, 'Membaca dan memahami teks pendek berbahasa Inggris', 2,
   'Siswa sangat mampu membaca dan memahami teks pendek berbahasa Inggris serta dapat menjawab pertanyaan dengan tepat secara mandiri.',
   'Siswa mampu membaca dan memahami teks pendek berbahasa Inggris dengan baik.',
   'Siswa dapat membaca teks pendek namun masih memerlukan bantuan dalam memahami maknanya.',
   'Siswa belum dapat membaca teks berbahasa Inggris secara mandiri dan memerlukan bimbingan.'
  ),
  (11, 'Berkomunikasi lisan dan tulis dalam bahasa Inggris sederhana', 3,
   'Siswa sangat mampu berkomunikasi secara lisan dan tulis dalam bahasa Inggris sederhana dengan percaya diri.',
   'Siswa mampu berkomunikasi secara lisan dan menulis kalimat sederhana dalam bahasa Inggris.',
   'Siswa mulai berani berkomunikasi dalam bahasa Inggris namun masih banyak kesalahan dan perlu bimbingan.',
   'Siswa belum berani berkomunikasi dalam bahasa Inggris dan sangat memerlukan pendampingan dari guru.'
  );


-- ============================================================
-- PAKET A — PJOK (id 12)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (12, 'Menguasai gerak dasar dan kebugaran jasmani', 1,
   'Siswa sangat menguasai gerak dasar lokomotor, non-lokomotor, dan manipulatif serta memiliki kebugaran jasmani yang sangat baik.',
   'Siswa menguasai gerak dasar dengan baik dan memiliki kebugaran jasmani yang memadai.',
   'Siswa menguasai beberapa gerak dasar namun masih perlu latihan untuk meningkatkan koordinasi dan kebugaran.',
   'Siswa belum menguasai gerak dasar dengan baik dan memerlukan pendampingan intensif dari guru.'
  ),
  (12, 'Mengikuti permainan dan olahraga sederhana dengan sportif', 2,
   'Siswa sangat aktif dan sportif dalam mengikuti permainan dan olahraga, mampu bekerja sama dengan sangat baik dalam tim.',
   'Siswa aktif mengikuti permainan dan olahraga dengan sikap sportif dan mampu bekerja sama dalam tim.',
   'Siswa mengikuti permainan namun masih perlu bimbingan untuk menerapkan sikap sportif secara konsisten.',
   'Siswa belum aktif dalam permainan dan olahraga serta masih memerlukan motivasi dan bimbingan dari guru.'
  ),
  (12, 'Memahami dan menerapkan pola hidup sehat', 3,
   'Siswa sangat memahami pola hidup sehat dan secara konsisten menerapkannya dalam keseharian serta mampu menjelaskannya kepada teman.',
   'Siswa memahami pola hidup sehat dan menerapkannya dalam kehidupan sehari-hari dengan baik.',
   'Siswa mulai memahami pentingnya pola hidup sehat namun belum konsisten dalam penerapannya.',
   'Siswa belum memahami pola hidup sehat dan memerlukan bimbingan aktif dari guru dan orang tua.'
  );


-- ============================================================
-- PAKET A — SENI (id 13)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (13, 'Mengapresiasi karya seni dari berbagai bentuk', 1,
   'Siswa sangat mampu mengapresiasi karya seni dari berbagai bentuk dan memberikan tanggapan yang kaya serta berdasar.',
   'Siswa mampu mengapresiasi karya seni dan memberikan tanggapan yang bermakna.',
   'Siswa mulai mampu mengapresiasi karya seni namun masih perlu bimbingan dalam mengungkapkan pendapatnya.',
   'Siswa belum mampu mengapresiasi karya seni secara mandiri dan memerlukan pendampingan dari guru.'
  ),
  (13, 'Berkreasi dalam seni rupa, musik, atau gerak', 2,
   'Siswa sangat kreatif dalam berkarya seni, menghasilkan karya yang orisinal dengan teknik yang baik dan ekspresif.',
   'Siswa kreatif dalam berkarya seni dan menghasilkan karya yang menunjukkan ekspresi diri yang baik.',
   'Siswa mulai menunjukkan kreativitas dalam berkarya seni namun masih perlu bimbingan dalam tekniknya.',
   'Siswa belum menunjukkan kreativitas dalam berkarya seni dan memerlukan bimbingan intensif dari guru.'
  ),
  (13, 'Mengenal dan mempraktikkan seni dan budaya lokal', 3,
   'Siswa sangat antusias mengenal dan mempraktikkan berbagai bentuk seni budaya lokal serta mampu menjelaskan maknanya.',
   'Siswa mengenal dan mempraktikkan seni budaya lokal dengan baik dan menunjukkan apresiasi yang tinggi.',
   'Siswa mengenal seni budaya lokal namun masih perlu motivasi untuk mempraktikkannya secara aktif.',
   'Siswa belum mengenal seni budaya lokal dengan baik dan memerlukan pengenalan serta bimbingan dari guru.'
  );


-- ============================================================
-- PAKET A — PEMBERDAYAAN (id 14)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (14, 'Mengenal potensi diri dan lingkungan sekitar', 1,
   'Siswa sangat mampu mengidentifikasi potensi diri dan lingkungannya serta mampu menjelaskan cara mengembangkannya secara mandiri.',
   'Siswa mampu mengidentifikasi potensi diri dan lingkungannya dengan baik.',
   'Siswa mulai mengenal potensi diri namun masih memerlukan bimbingan dalam mengidentifikasi potensi lingkungan.',
   'Siswa belum mengenal potensi diri dan lingkungannya dengan baik dan memerlukan pendampingan dari guru.'
  ),
  (14, 'Berpartisipasi aktif dalam kegiatan pemberdayaan komunitas', 2,
   'Siswa sangat aktif berpartisipasi dalam kegiatan pemberdayaan di sekolah atau komunitas dan menunjukkan inisiatif yang tinggi.',
   'Siswa aktif berpartisipasi dalam kegiatan pemberdayaan di sekolah atau komunitas dengan baik.',
   'Siswa mulai berpartisipasi dalam kegiatan pemberdayaan namun masih perlu dorongan untuk lebih aktif.',
   'Siswa belum aktif berpartisipasi dalam kegiatan pemberdayaan dan memerlukan motivasi serta bimbingan.'
  ),
  (14, 'Menerapkan nilai gotong royong dan kerja sama', 3,
   'Siswa sangat konsisten menerapkan nilai gotong royong dan kerja sama dalam berbagai kegiatan serta menjadi teladan bagi teman.',
   'Siswa menerapkan nilai gotong royong dan kerja sama dalam kegiatan kelompok dengan baik.',
   'Siswa mulai menerapkan nilai gotong royong namun masih perlu bimbingan untuk konsisten dalam kerja sama.',
   'Siswa belum menerapkan nilai gotong royong secara aktif dan memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET A — KETERAMPILAN (id 15)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (15, 'Mengenal jenis-jenis keterampilan dasar', 1,
   'Siswa sangat menguasai pengetahuan tentang berbagai jenis keterampilan dasar dan mampu menjelaskannya dengan rinci.',
   'Siswa mengenal berbagai jenis keterampilan dasar dan dapat menjelaskannya dengan baik.',
   'Siswa mengenal beberapa jenis keterampilan dasar namun masih perlu bimbingan untuk memahami lebih lengkap.',
   'Siswa belum mengenal jenis-jenis keterampilan dasar dengan baik dan memerlukan pengenalan dari guru.'
  ),
  (15, 'Mempraktikkan keterampilan dasar dengan teknik yang benar', 2,
   'Siswa sangat terampil mempraktikkan keterampilan dasar dengan teknik yang benar dan menghasilkan produk berkualitas baik.',
   'Siswa terampil mempraktikkan keterampilan dasar dengan teknik yang cukup benar.',
   'Siswa mulai mempraktikkan keterampilan dasar namun masih perlu bimbingan dalam teknik pengerjaannya.',
   'Siswa belum terampil mempraktikkan keterampilan dasar dan memerlukan bimbingan intensif dari guru.'
  ),
  (15, 'Menghasilkan karya keterampilan secara kreatif', 3,
   'Siswa sangat kreatif dalam menghasilkan karya keterampilan yang orisinal, rapi, dan menunjukkan kebanggaan terhadap hasil karyanya.',
   'Siswa mampu menghasilkan karya keterampilan yang kreatif dan menunjukkan semangat dalam berkarya.',
   'Siswa dapat menghasilkan karya keterampilan sederhana namun masih memerlukan bimbingan untuk mengembangkan kreativitasnya.',
   'Siswa belum mampu menghasilkan karya keterampilan secara mandiri dan sangat memerlukan bimbingan guru.'
  );


-- ============================================================
-- PAKET B — PENDIDIKAN AGAMA (6 agama, id 16–21)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
SELECT
  mp.id,
  kd.nama_kompetensi,
  kd.urutan,
  kd.deskripsi_a, kd.deskripsi_b, kd.deskripsi_c, kd.deskripsi_d
FROM public.mata_pelajaran mp
CROSS JOIN (VALUES
  (1,
   'Memahami konsep akidah dan sumber ajaran agama',
   'Siswa sangat memahami konsep akidah dan sumber-sumber ajaran agama secara mendalam serta mampu menjelaskannya dengan sistematis.',
   'Siswa memahami konsep akidah dan sumber ajaran agama dengan baik.',
   'Siswa cukup memahami konsep akidah namun masih memerlukan bimbingan dalam menguraikan sumber-sumber ajaran agama.',
   'Siswa belum memahami konsep akidah dan sumber ajaran agama dengan baik serta memerlukan bimbingan intensif.'
  ),
  (2,
   'Melaksanakan ibadah dan mengembangkan akhlak mulia',
   'Siswa sangat tekun dan mandiri dalam melaksanakan ibadah serta secara konsisten menunjukkan akhlak mulia yang menjadi teladan.',
   'Siswa melaksanakan ibadah secara rutin dan mandiri serta menunjukkan akhlak mulia dalam keseharian.',
   'Siswa melaksanakan ibadah namun belum konsisten dan masih perlu pembiasaan dalam mengembangkan akhlak mulia.',
   'Siswa belum melaksanakan ibadah secara mandiri dan masih memerlukan bimbingan intensif dalam pembentukan akhlak.'
  ),
  (3,
   'Memahami ajaran agama tentang hubungan sosial dan kemasyarakatan',
   'Siswa sangat memahami ajaran agama tentang hubungan sosial dan mampu menerapkannya secara nyata dalam kehidupan bermasyarakat.',
   'Siswa memahami ajaran agama tentang hubungan sosial dan menerapkannya dengan baik dalam kehidupan.',
   'Siswa cukup memahami ajaran agama tentang hubungan sosial namun penerapannya masih perlu dikembangkan.',
   'Siswa belum memahami ajaran agama tentang hubungan sosial dengan baik dan memerlukan bimbingan.'
  ),
  (4,
   'Menerapkan nilai-nilai agama dalam kehidupan berbangsa dan bernegara',
   'Siswa sangat mampu mengintegrasikan nilai-nilai agama dalam kehidupan berbangsa dan bernegara serta menjadi contoh bagi lingkungannya.',
   'Siswa mampu menerapkan nilai-nilai agama dalam konteks kehidupan berbangsa dan bernegara dengan baik.',
   'Siswa mulai memahami keterkaitan nilai agama dengan kehidupan berbangsa namun penerapannya masih perlu bimbingan.',
   'Siswa belum mampu mengaitkan nilai-nilai agama dengan kehidupan berbangsa dan bernegara serta perlu pendampingan.'
  )
) AS kd(urutan, nama_kompetensi, deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
WHERE mp.paket = 'Paket B' AND mp.kelompok = 'umum' AND mp.agama IS NOT NULL;


-- ============================================================
-- PAKET B — PENDIDIKAN PANCASILA (id 22)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (22, 'Memahami nilai-nilai Pancasila dalam kehidupan berbangsa', 1,
   'Siswa sangat memahami nilai-nilai Pancasila dan mampu menganalisis penerapannya dalam berbagai situasi kehidupan berbangsa dan bernegara.',
   'Siswa memahami nilai-nilai Pancasila dan dapat menjelaskan penerapannya dalam kehidupan berbangsa.',
   'Siswa cukup memahami nilai-nilai Pancasila namun masih perlu bimbingan dalam menganalisis penerapannya.',
   'Siswa belum memahami nilai-nilai Pancasila dengan baik dan memerlukan bimbingan intensif dari guru.'
  ),
  (22, 'Menganalisis hak dan kewajiban warga negara', 2,
   'Siswa sangat mampu menganalisis hak dan kewajiban warga negara serta secara aktif menjalankan kewajibannya dengan penuh tanggung jawab.',
   'Siswa mampu menganalisis hak dan kewajiban warga negara dan berusaha menjalankan kewajibannya dengan baik.',
   'Siswa cukup memahami hak dan kewajiban warga negara namun masih perlu bimbingan dalam penerapannya.',
   'Siswa belum memahami hak dan kewajiban warga negara dengan baik dan memerlukan pendampingan dari guru.'
  ),
  (22, 'Memahami sistem pemerintahan dan demokrasi Indonesia', 3,
   'Siswa sangat memahami sistem pemerintahan dan demokrasi Indonesia serta mampu menjelaskan mekanismenya dengan tepat.',
   'Siswa memahami sistem pemerintahan dan demokrasi Indonesia dengan baik.',
   'Siswa cukup memahami sistem pemerintahan namun masih perlu bimbingan untuk memahami mekanisme demokrasi.',
   'Siswa belum memahami sistem pemerintahan dan demokrasi Indonesia dengan baik dan memerlukan bimbingan.'
  ),
  (22, 'Menerapkan nilai Bhinneka Tunggal Ika dalam kehidupan', 4,
   'Siswa sangat memahami dan menerapkan nilai Bhinneka Tunggal Ika secara konsisten serta aktif mempromosikan persatuan di lingkungannya.',
   'Siswa memahami dan menerapkan nilai Bhinneka Tunggal Ika dalam kehidupan sehari-hari dengan baik.',
   'Siswa memahami Bhinneka Tunggal Ika namun penerapannya dalam kehidupan sehari-hari masih perlu dikembangkan.',
   'Siswa belum memahami nilai Bhinneka Tunggal Ika dengan baik dan memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET B — BAHASA INDONESIA (id 23)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (23, 'Membaca dan menganalisis berbagai jenis teks', 1,
   'Siswa sangat mampu membaca dan menganalisis berbagai jenis teks secara kritis serta mengidentifikasi unsur-unsur teks dengan tepat.',
   'Siswa mampu membaca dan menganalisis berbagai jenis teks dengan baik.',
   'Siswa dapat membaca berbagai jenis teks namun masih perlu bimbingan dalam menganalisis unsur-unsurnya.',
   'Siswa belum mampu menganalisis teks secara mandiri dan memerlukan bimbingan intensif dari guru.'
  ),
  (23, 'Menulis teks dengan struktur dan kaidah bahasa yang tepat', 2,
   'Siswa sangat mampu menulis berbagai jenis teks dengan struktur yang benar, diksi yang tepat, dan kaidah penulisan yang sesuai.',
   'Siswa mampu menulis teks dengan struktur yang benar dan kaidah penulisan yang cukup tepat.',
   'Siswa mampu menulis teks sederhana namun masih banyak kesalahan struktur dan kaidah bahasa.',
   'Siswa belum mampu menulis teks dengan struktur yang benar dan memerlukan bimbingan intensif.'
  ),
  (23, 'Berbicara efektif dalam berbagai konteks komunikasi', 3,
   'Siswa sangat aktif dan efektif dalam berbicara pada berbagai konteks, menyampaikan gagasan dengan runtut, jelas, dan meyakinkan.',
   'Siswa aktif berbicara dalam diskusi dan presentasi serta mampu menyampaikan ide dengan cukup jelas dan sistematis.',
   'Siswa mulai aktif berbicara namun masih perlu bimbingan dalam menyampaikan gagasan secara runtut.',
   'Siswa belum aktif berbicara dalam diskusi dan memerlukan motivasi serta bimbingan dari guru.'
  ),
  (23, 'Mengapresiasi dan menganalisis karya sastra', 4,
   'Siswa sangat mampu mengapresiasi dan menganalisis karya sastra secara mendalam serta mengungkapkan pendapatnya dengan kaya.',
   'Siswa mampu mengapresiasi karya sastra dan memberikan analisis yang bermakna.',
   'Siswa mulai mampu mengapresiasi karya sastra namun masih memerlukan bimbingan dalam menganalisisnya.',
   'Siswa belum mampu mengapresiasi karya sastra secara mandiri dan memerlukan pendampingan dari guru.'
  );


-- ============================================================
-- PAKET B — MATEMATIKA (id 24)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (24, 'Menguasai bilangan bulat, pecahan, dan perbandingan', 1,
   'Siswa sangat menguasai konsep bilangan bulat, pecahan, dan perbandingan serta mampu menerapkannya dalam pemecahan masalah.',
   'Siswa menguasai bilangan bulat, pecahan, dan perbandingan serta dapat menyelesaikan soal-soal terkait dengan baik.',
   'Siswa cukup memahami bilangan bulat dan pecahan namun masih perlu latihan dalam menyelesaikan soal perbandingan.',
   'Siswa belum menguasai bilangan bulat, pecahan, dan perbandingan dengan baik dan memerlukan bimbingan intensif.'
  ),
  (24, 'Memahami dan menerapkan konsep aljabar dasar', 2,
   'Siswa sangat memahami konsep aljabar dasar dan mampu menerapkannya dalam menyelesaikan persamaan dan pertidaksamaan secara tepat.',
   'Siswa memahami konsep aljabar dasar dan mampu menyelesaikan persamaan linier dengan baik.',
   'Siswa mulai memahami aljabar dasar namun masih perlu latihan lebih banyak dalam menyelesaikan persamaan.',
   'Siswa belum memahami konsep aljabar dasar dan sangat memerlukan bimbingan dalam setiap langkah penyelesaian.'
  ),
  (24, 'Menguasai geometri dan pengukuran', 3,
   'Siswa sangat menguasai konsep geometri dan pengukuran serta mampu membuktikan sifat-sifat bangun dan menghitung dengan tepat.',
   'Siswa menguasai konsep geometri dan pengukuran serta mampu menyelesaikan soal dengan baik.',
   'Siswa cukup memahami geometri namun masih perlu latihan dalam menerapkan rumus pengukuran.',
   'Siswa belum menguasai geometri dan pengukuran dengan baik serta memerlukan bimbingan dari guru.'
  ),
  (24, 'Memahami dan menerapkan statistika dan peluang dasar', 4,
   'Siswa sangat memahami konsep statistika dan peluang serta mampu menafsirkan data dan menghitung peluang dengan tepat.',
   'Siswa memahami konsep statistika dan peluang dasar serta dapat menyelesaikan soal dengan baik.',
   'Siswa mulai memahami statistika namun masih perlu latihan dalam menghitung dan menafsirkan peluang.',
   'Siswa belum memahami statistika dan peluang dasar serta memerlukan bimbingan intensif dari guru.'
  );


-- ============================================================
-- PAKET B — ILMU PENGETAHUAN ALAM (id 25)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (25, 'Memahami materi dan perubahannya', 1,
   'Siswa sangat memahami konsep materi dan perubahannya serta mampu menjelaskan sifat-sifat zat dan mengaitkannya dengan fenomena nyata.',
   'Siswa memahami konsep materi dan perubahannya serta dapat menjelaskan sifat-sifat zat dengan baik.',
   'Siswa cukup memahami materi dan perubahannya namun masih perlu bimbingan dalam menganalisis sifat-sifat zat.',
   'Siswa belum memahami konsep materi dan perubahan zat dengan baik serta memerlukan bimbingan dari guru.'
  ),
  (25, 'Memahami makhluk hidup dan interaksinya dengan lingkungan', 2,
   'Siswa sangat memahami konsep makhluk hidup dan interaksinya dengan lingkungan serta mampu melakukan percobaan sederhana secara mandiri.',
   'Siswa memahami konsep makhluk hidup dan interaksinya dengan lingkungan serta mampu melakukan percobaan dengan baik.',
   'Siswa cukup memahami makhluk hidup dan lingkungannya namun masih perlu bimbingan dalam percobaan.',
   'Siswa belum memahami konsep makhluk hidup dan lingkungannya dengan baik serta perlu bimbingan intensif.'
  ),
  (25, 'Memahami konsep gaya, gerak, dan energi', 3,
   'Siswa sangat memahami konsep gaya, gerak, dan energi serta mampu mengaplikasikannya dalam pemecahan masalah ilmiah.',
   'Siswa memahami konsep gaya, gerak, dan energi serta mampu menyelesaikan soal terkait dengan baik.',
   'Siswa cukup memahami gaya dan gerak namun masih perlu latihan dalam memahami berbagai bentuk energi.',
   'Siswa belum memahami konsep gaya, gerak, dan energi dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (25, 'Memahami bumi, tata surya, dan gejala alam', 4,
   'Siswa sangat memahami konsep bumi, tata surya, dan gejala alam serta mampu menganalisis dampak gejala alam terhadap kehidupan.',
   'Siswa memahami konsep bumi, tata surya, dan gejala alam serta mampu menjelaskannya dengan baik.',
   'Siswa cukup memahami materi bumi dan tata surya namun masih perlu bimbingan dalam memahami gejala alam.',
   'Siswa belum memahami bumi, tata surya, dan gejala alam dengan baik serta memerlukan pendampingan.'
  );


-- ============================================================
-- PAKET B — ILMU PENGETAHUAN SOSIAL (id 26)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (26, 'Memahami kondisi geografis dan sumber daya alam Indonesia', 1,
   'Siswa sangat memahami kondisi geografis Indonesia dan mampu menganalisis persebaran sumber daya alam serta implikasinya.',
   'Siswa memahami kondisi geografis Indonesia dan dapat menganalisis sumber daya alam dengan baik.',
   'Siswa cukup memahami kondisi geografis Indonesia namun masih perlu bimbingan dalam menganalisis sumber daya alam.',
   'Siswa belum memahami kondisi geografis Indonesia dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (26, 'Memahami sejarah perjuangan bangsa Indonesia', 2,
   'Siswa sangat memahami sejarah perjuangan bangsa Indonesia dan mampu menganalisis nilai-nilai yang dapat diteladani dari tokoh-tokoh sejarah.',
   'Siswa memahami sejarah perjuangan bangsa Indonesia dan dapat menjelaskan peristiwa-peristiwa penting dengan baik.',
   'Siswa cukup memahami sejarah perjuangan bangsa namun masih perlu bantuan dalam menganalisis makna peristiwanya.',
   'Siswa belum memahami sejarah perjuangan bangsa Indonesia dengan baik dan memerlukan bimbingan intensif.'
  ),
  (26, 'Memahami keragaman sosial, budaya, dan ekonomi masyarakat', 3,
   'Siswa sangat memahami keragaman sosial, budaya, dan ekonomi masyarakat Indonesia serta menunjukkan sikap menghargai yang sangat baik.',
   'Siswa memahami keragaman sosial, budaya, dan ekonomi masyarakat Indonesia dengan baik.',
   'Siswa cukup memahami keragaman sosial dan budaya namun masih perlu bimbingan dalam memahami aspek ekonominya.',
   'Siswa belum memahami keragaman sosial, budaya, dan ekonomi dengan baik serta memerlukan pendampingan.'
  ),
  (26, 'Memahami sistem ekonomi dan perdagangan', 4,
   'Siswa sangat memahami sistem ekonomi dan perdagangan serta mampu menganalisis aktivitas ekonomi dalam kehidupan masyarakat.',
   'Siswa memahami sistem ekonomi dan perdagangan serta dapat menganalisis aktivitas ekonomi dengan baik.',
   'Siswa cukup memahami sistem ekonomi namun masih perlu bimbingan dalam memahami mekanisme perdagangan.',
   'Siswa belum memahami sistem ekonomi dan perdagangan dengan baik serta memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET B — BAHASA INGGRIS (id 27)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (27, 'Menguasai tata bahasa dan kosakata fungsional', 1,
   'Siswa sangat menguasai tata bahasa dan kosakata fungsional bahasa Inggris serta mampu menggunakannya dengan akurat dalam berbagai konteks.',
   'Siswa menguasai tata bahasa dan kosakata fungsional bahasa Inggris serta dapat menggunakannya dengan baik.',
   'Siswa cukup menguasai tata bahasa dasar namun masih perlu latihan dalam penggunaan kosakata yang lebih beragam.',
   'Siswa belum menguasai tata bahasa dan kosakata fungsional dengan baik serta memerlukan bimbingan intensif.'
  ),
  (27, 'Membaca dan memahami berbagai jenis teks berbahasa Inggris', 2,
   'Siswa sangat mampu membaca dan memahami berbagai jenis teks berbahasa Inggris serta menganalisis isinya dengan tepat.',
   'Siswa mampu membaca dan memahami berbagai jenis teks berbahasa Inggris dengan baik.',
   'Siswa mampu membaca teks berbahasa Inggris sederhana namun masih perlu bimbingan dalam memahami teks yang lebih kompleks.',
   'Siswa belum mampu membaca dan memahami teks berbahasa Inggris secara mandiri dan memerlukan bimbingan intensif.'
  ),
  (27, 'Menulis teks fungsional dan deskriptif dalam bahasa Inggris', 3,
   'Siswa sangat mampu menulis teks fungsional dan deskriptif dalam bahasa Inggris dengan struktur dan tata bahasa yang tepat.',
   'Siswa mampu menulis teks fungsional dan deskriptif dalam bahasa Inggris dengan baik.',
   'Siswa mulai mampu menulis teks sederhana dalam bahasa Inggris namun masih banyak kesalahan tata bahasa.',
   'Siswa belum mampu menulis teks dalam bahasa Inggris secara mandiri dan memerlukan bimbingan intensif.'
  ),
  (27, 'Berkomunikasi lisan dalam berbagai situasi sehari-hari', 4,
   'Siswa sangat lancar dan percaya diri berkomunikasi lisan dalam bahasa Inggris pada berbagai situasi sehari-hari.',
   'Siswa aktif berpartisipasi dalam diskusi dan presentasi serta mampu menyampaikan ide dalam bahasa Inggris.',
   'Siswa mulai berani berkomunikasi lisan dalam bahasa Inggris namun masih perlu latihan untuk meningkatkan kelancaran.',
   'Siswa belum berani berkomunikasi lisan dalam bahasa Inggris dan masih sangat memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET B — PJOK (id 28)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (28, 'Menguasai permainan dan olahraga beregu', 1,
   'Siswa sangat menguasai teknik permainan dan olahraga beregu serta mampu memimpin tim dengan semangat sportif yang tinggi.',
   'Siswa menguasai teknik permainan beregu dan menunjukkan sikap sportif serta kerja sama yang baik.',
   'Siswa mengikuti permainan beregu dengan baik namun masih perlu latihan dalam teknik dan kerja sama tim.',
   'Siswa belum menguasai teknik permainan beregu dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (28, 'Melaksanakan aktivitas kebugaran jasmani secara terprogram', 2,
   'Siswa sangat disiplin melaksanakan aktivitas kebugaran jasmani secara terprogram dan menunjukkan peningkatan kebugaran yang signifikan.',
   'Siswa melaksanakan aktivitas kebugaran jasmani dengan disiplin dan menunjukkan kebugaran yang baik.',
   'Siswa mengikuti aktivitas kebugaran jasmani namun masih perlu motivasi untuk melaksanakannya secara konsisten.',
   'Siswa belum melaksanakan aktivitas kebugaran secara terprogram dan memerlukan pendampingan dari guru.'
  ),
  (28, 'Memahami dan mempraktikkan senam dan gerak ritmik', 3,
   'Siswa sangat menguasai gerak senam dan ritmik serta mampu mengekspresikan gerakan dengan koordinasi dan keluwesan yang sangat baik.',
   'Siswa menguasai gerak senam dan ritmik dengan baik dan menunjukkan koordinasi yang memadai.',
   'Siswa mengikuti kegiatan senam dan ritmik namun masih perlu latihan untuk meningkatkan koordinasi gerak.',
   'Siswa belum menguasai gerak senam dan ritmik dengan baik serta memerlukan bimbingan dari guru.'
  ),
  (28, 'Memahami dan menerapkan konsep kesehatan pribadi dan lingkungan', 4,
   'Siswa sangat memahami konsep kesehatan pribadi dan lingkungan serta secara konsisten menerapkan pola hidup sehat.',
   'Siswa memahami konsep kesehatan pribadi dan lingkungan serta berusaha menerapkan pola hidup sehat.',
   'Siswa cukup memahami konsep kesehatan namun masih perlu bimbingan dalam menerapkan pola hidup sehat secara konsisten.',
   'Siswa belum memahami konsep kesehatan pribadi dan lingkungan dengan baik serta memerlukan bimbingan.'
  );


-- ============================================================
-- PAKET B — SENI (id 29)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (29, 'Mengapresiasi karya seni rupa, musik, tari, dan teater', 1,
   'Siswa sangat mampu mengapresiasi berbagai karya seni secara kritis dan mendalam serta mengungkapkan pendapatnya dengan sangat baik.',
   'Siswa mampu mengapresiasi karya seni dari berbagai bidang dan memberikan tanggapan yang bermakna.',
   'Siswa mulai mampu mengapresiasi karya seni namun masih perlu bimbingan dalam mengungkapkan pendapat secara kritis.',
   'Siswa belum mampu mengapresiasi karya seni secara mandiri dan memerlukan pendampingan dari guru.'
  ),
  (29, 'Berkreasi dalam seni rupa dua dan tiga dimensi', 2,
   'Siswa sangat kreatif dan terampil dalam berkarya seni rupa dua dan tiga dimensi dengan teknik yang dikuasai dengan sangat baik.',
   'Siswa kreatif dalam berkarya seni rupa dan menghasilkan karya yang menunjukkan penguasaan teknik yang baik.',
   'Siswa menunjukkan kreativitas dalam berkarya seni rupa namun masih perlu latihan untuk meningkatkan keterampilan teknis.',
   'Siswa belum menunjukkan kreativitas dalam berkarya seni dan sangat memerlukan bimbingan dari guru.'
  ),
  (29, 'Mengenal, mengapresiasi, dan mempraktikkan seni tradisional', 3,
   'Siswa sangat antusias mengenal dan mempraktikkan seni tradisional daerah serta mampu menjelaskan makna dan nilai budayanya.',
   'Siswa mengenal dan mampu mempraktikkan beberapa bentuk seni tradisional daerah dengan baik.',
   'Siswa mengenal seni tradisional namun masih perlu motivasi dan latihan untuk mempraktikkannya secara aktif.',
   'Siswa belum mengenal seni tradisional dengan baik dan memerlukan pengenalan serta bimbingan dari guru.'
  ),
  (29, 'Berkreasi dalam seni pertunjukan dan ekspresi diri', 4,
   'Siswa sangat mampu mengekspresikan diri melalui seni pertunjukan dengan percaya diri, kreatif, dan penuh penghayatan.',
   'Siswa mampu mengekspresikan diri melalui seni pertunjukan dengan baik dan menunjukkan kepercayaan diri.',
   'Siswa mulai berani mengekspresikan diri melalui seni pertunjukan namun masih perlu bimbingan dan dukungan.',
   'Siswa belum berani mengekspresikan diri melalui seni pertunjukan dan memerlukan motivasi serta bimbingan.'
  );


-- ============================================================
-- PAKET B — PEMBERDAYAAN (id 30)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (30, 'Mengidentifikasi potensi diri dan komunitas', 1,
   'Siswa sangat mampu mengidentifikasi dan menganalisis potensi diri serta komunitas secara mendalam sebagai dasar perencanaan pengembangan.',
   'Siswa mampu mengidentifikasi potensi diri dan komunitas dengan baik dan merumuskan langkah pengembangannya.',
   'Siswa cukup mampu mengidentifikasi potensi diri namun masih perlu bimbingan dalam menganalisis potensi komunitas.',
   'Siswa belum mampu mengidentifikasi potensi diri dan komunitas dengan baik serta memerlukan pendampingan.'
  ),
  (30, 'Merancang dan melaksanakan kegiatan pemberdayaan', 2,
   'Siswa sangat aktif berpartisipasi dalam kegiatan pemberdayaan di sekolah atau komunitas dan menunjukkan inisiatif yang tinggi.',
   'Siswa aktif berpartisipasi dalam kegiatan pemberdayaan di sekolah atau komunitas dengan baik.',
   'Siswa mulai berpartisipasi dalam kegiatan pemberdayaan namun masih perlu dorongan untuk lebih aktif.',
   'Siswa belum aktif berpartisipasi dalam kegiatan pemberdayaan dan memerlukan motivasi serta bimbingan.'
  ),
  (30, 'Mengevaluasi dan merefleksikan dampak kegiatan pemberdayaan', 3,
   'Siswa sangat mampu mengevaluasi dampak kegiatan pemberdayaan dan merefleksikannya untuk perbaikan program berikutnya.',
   'Siswa mampu mengevaluasi dan merefleksikan dampak kegiatan pemberdayaan dengan baik.',
   'Siswa mulai mampu mengevaluasi kegiatan pemberdayaan namun masih perlu bimbingan dalam merefleksikan hasilnya.',
   'Siswa belum mampu mengevaluasi kegiatan pemberdayaan secara mandiri dan memerlukan pendampingan.'
  ),
  (30, 'Mengembangkan jiwa kewirausahaan dan kemandirian', 4,
   'Siswa sangat menunjukkan jiwa kewirausahaan yang tinggi dan kemandirian yang luar biasa dalam berbagai aktivitas pemberdayaan.',
   'Siswa menunjukkan jiwa kewirausahaan dan kemandirian yang baik dalam kegiatan pemberdayaan.',
   'Siswa mulai menunjukkan jiwa kewirausahaan namun masih perlu bimbingan dalam mengembangkan kemandiriannya.',
   'Siswa belum menunjukkan jiwa kewirausahaan dan masih sangat bergantung pada bimbingan guru.'
  );


-- ============================================================
-- PAKET B — KETERAMPILAN (id 31)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (31, 'Menguasai teknik dasar keterampilan yang dipelajari', 1,
   'Siswa sangat menguasai teknik dasar keterampilan yang dipelajari dan mampu mengeksekusinya dengan presisi yang tinggi.',
   'Siswa menguasai teknik dasar keterampilan yang dipelajari dan dapat melaksanakannya dengan baik.',
   'Siswa cukup menguasai teknik dasar keterampilan namun masih perlu latihan untuk meningkatkan presisi.',
   'Siswa belum menguasai teknik dasar keterampilan dengan baik dan memerlukan bimbingan intensif dari guru.'
  ),
  (31, 'Menghasilkan produk keterampilan yang fungsional dan berkualitas', 2,
   'Siswa sangat terampil menghasilkan produk keterampilan yang fungsional, berkualitas, dan bernilai estetika tinggi.',
   'Siswa dapat menghasilkan produk keterampilan yang fungsional dengan kualitas yang baik.',
   'Siswa dapat menerapkan konsep-konsep dasar dalam keterampilan dan menghasilkan karya sederhana.',
   'Siswa belum mampu menghasilkan produk keterampilan yang fungsional secara mandiri dan perlu bimbingan.'
  ),
  (31, 'Mengelola proses produksi keterampilan secara mandiri', 3,
   'Siswa sangat mampu mengelola proses produksi keterampilan secara mandiri mulai dari perencanaan hingga evaluasi hasil.',
   'Siswa mampu mengelola proses produksi keterampilan dengan baik dan menunjukkan kemandirian yang memadai.',
   'Siswa mulai mampu mengelola proses produksi namun masih memerlukan bimbingan di beberapa tahapan.',
   'Siswa belum mampu mengelola proses produksi secara mandiri dan memerlukan pendampingan di setiap tahap.'
  ),
  (31, 'Memasarkan dan mempresentasikan hasil karya keterampilan', 4,
   'Siswa sangat mampu memasarkan dan mempresentasikan hasil karya keterampilan dengan percaya diri dan strategi yang efektif.',
   'Siswa mampu memasarkan dan mempresentasikan hasil karya keterampilan dengan baik.',
   'Siswa mulai mampu mempresentasikan hasil karya namun masih perlu bimbingan dalam strategi pemasaran.',
   'Siswa belum mampu memasarkan dan mempresentasikan hasil karya secara mandiri dan memerlukan pendampingan.'
  );


-- ============================================================
-- VERIFIKASI
-- ============================================================

DO $$
DECLARE
  v_paket_a_agama  INT;
  v_paket_a_nonag  INT;
  v_paket_a_total  INT;
  v_paket_b_agama  INT;
  v_paket_b_nonag  INT;
  v_paket_b_total  INT;
  v_grand_total    INT;
BEGIN
  SELECT COUNT(*) INTO v_paket_a_agama
    FROM public.kompetensi_dasar kd
    JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket A' AND mp.agama IS NOT NULL;

  SELECT COUNT(*) INTO v_paket_a_nonag
    FROM public.kompetensi_dasar kd
    JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket A' AND mp.agama IS NULL;

  SELECT COUNT(*) INTO v_paket_a_total
    FROM public.kompetensi_dasar kd
    JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket A';

  SELECT COUNT(*) INTO v_paket_b_agama
    FROM public.kompetensi_dasar kd
    JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket B' AND mp.agama IS NOT NULL;

  SELECT COUNT(*) INTO v_paket_b_nonag
    FROM public.kompetensi_dasar kd
    JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket B' AND mp.agama IS NULL;

  SELECT COUNT(*) INTO v_paket_b_total
    FROM public.kompetensi_dasar kd
    JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket B';

  SELECT COUNT(*) INTO v_grand_total FROM public.kompetensi_dasar;

  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'SEED 3 — KD PAKET A & B VERIFIKASI';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '── Paket A ────────────────────────────────────';
  RAISE NOTICE 'KD Mapel Agama (6×3)    : %  (expected 18)',  v_paket_a_agama;
  RAISE NOTICE 'KD Mapel Non-Agama (9×3): %  (expected 27)',  v_paket_a_nonag;
  RAISE NOTICE 'Total Paket A           : %  (expected 45)',  v_paket_a_total;
  RAISE NOTICE '── Paket B ────────────────────────────────────';
  RAISE NOTICE 'KD Mapel Agama (6×4)    : %  (expected 24)',  v_paket_b_agama;
  RAISE NOTICE 'KD Mapel Non-Agama (10×4): % (expected 40)', v_paket_b_nonag;
  RAISE NOTICE 'Total Paket B           : %  (expected 64)',  v_paket_b_total;
  RAISE NOTICE '────────────────────────────────────────────────';
  RAISE NOTICE 'GRAND TOTAL             : %  (expected 109)', v_grand_total;
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;