-- ============================================================
-- E-RAPORT PKBM — SEED 4: KOMPETENSI DASAR PAKET C
-- ============================================================
-- Mengisi tabel kompetensi_dasar untuk:
--   - Paket C Fase E : mapel id 32–50 (19 mapel × 4 KD = 76 rows)
--   - Paket C Fase F : mapel id 51–69 (19 mapel × 4 KD = 76 rows)
-- Total: 152 rows
--
-- Fase E setara SMA kelas X  → analitis, konseptual
-- Fase F setara SMA kelas XI-XII → evaluatif, sintesis, reflektif
-- ============================================================


-- ============================================================
-- PAKET C FASE E — PENDIDIKAN AGAMA (6 agama, id 32–37)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
SELECT
  mp.id,
  kd.nama_kompetensi, kd.urutan,
  kd.deskripsi_a, kd.deskripsi_b, kd.deskripsi_c, kd.deskripsi_d
FROM public.mata_pelajaran mp
CROSS JOIN (VALUES
  (1,
   'Memahami akidah dan sumber-sumber ajaran agama secara analitis',
   'Siswa sangat mampu menganalisis konsep akidah dan sumber-sumber ajaran agama secara mendalam serta mengaitkannya dengan kehidupan modern.',
   'Siswa mampu menganalisis konsep akidah dan sumber ajaran agama dengan baik.',
   'Siswa cukup memahami akidah namun masih perlu bimbingan dalam menganalisis sumber-sumber ajaran secara kritis.',
   'Siswa belum mampu menganalisis akidah dan sumber ajaran agama secara mandiri dan memerlukan bimbingan intensif.'
  ),
  (2,
   'Melaksanakan dan mengembangkan ibadah serta akhlak secara mandiri',
   'Siswa sangat tekun dan mandiri dalam melaksanakan ibadah serta secara aktif mengembangkan akhlak mulia sebagai cerminan keimanan.',
   'Siswa melaksanakan ibadah secara mandiri dan menunjukkan pengembangan akhlak mulia yang konsisten.',
   'Siswa melaksanakan ibadah namun pengembangan akhlak masih perlu dibimbing dan dibiasakan lebih lanjut.',
   'Siswa belum mandiri dalam melaksanakan ibadah dan masih memerlukan bimbingan dalam pembentukan akhlak.'
  ),
  (3,
   'Memahami fikih dan hukum-hukum agama dalam kehidupan sehari-hari',
   'Siswa sangat memahami fikih dan hukum-hukum agama serta mampu menerapkannya secara tepat dalam berbagai situasi kehidupan.',
   'Siswa memahami fikih dan hukum-hukum agama dan dapat menerapkannya dalam kehidupan sehari-hari.',
   'Siswa cukup memahami fikih dasar namun masih perlu bimbingan dalam menerapkan hukum-hukum agama secara tepat.',
   'Siswa belum memahami fikih dan hukum-hukum agama dengan baik serta memerlukan pendampingan intensif.'
  ),
  (4,
   'Mengintegrasikan nilai-nilai agama dalam kehidupan berbangsa dan bernegara',
   'Siswa sangat mampu mengintegrasikan nilai-nilai agama dalam seluruh dimensi kehidupan berbangsa dan menjadi teladan di lingkungannya.',
   'Siswa mampu mengintegrasikan nilai-nilai agama dalam konteks kehidupan berbangsa dan bernegara.',
   'Siswa mulai memahami keterkaitan nilai agama dengan kehidupan berbangsa namun integrasi dalam sikap masih perlu dikembangkan.',
   'Siswa belum mampu mengintegrasikan nilai agama dalam kehidupan berbangsa dan memerlukan pendampingan dari guru.'
  )
) AS kd(urutan, nama_kompetensi, deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase E' AND mp.agama IS NOT NULL;


-- ============================================================
-- PAKET C FASE E — PENDIDIKAN KEWARGANEGARAAN (id 38)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (38, 'Memahami Pancasila sebagai dasar negara dan pandangan hidup', 1,
   'Siswa sangat memahami Pancasila sebagai dasar negara dan pandangan hidup bangsa serta mampu menganalisis implementasinya.',
   'Siswa memahami Pancasila sebagai dasar negara dan dapat menjelaskan implementasinya dalam kehidupan.',
   'Siswa cukup memahami Pancasila namun masih perlu bimbingan dalam menganalisis penerapannya secara mendalam.',
   'Siswa belum memahami Pancasila sebagai dasar negara dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (38, 'Menganalisis sistem pemerintahan dan konstitusi Indonesia', 2,
   'Siswa sangat mampu menganalisis sistem pemerintahan Indonesia dan konstitusi negara secara kritis dan komprehensif.',
   'Siswa mampu menganalisis sistem pemerintahan dan konstitusi Indonesia dengan baik.',
   'Siswa cukup memahami sistem pemerintahan namun masih perlu bimbingan dalam menganalisis konstitusi secara mendalam.',
   'Siswa belum memahami sistem pemerintahan dan konstitusi Indonesia dengan baik dan perlu bimbingan intensif.'
  ),
  (38, 'Memahami hak dan kewajiban warga negara dalam bingkai NKRI', 3,
   'Siswa sangat memahami hak dan kewajiban warga negara dalam bingkai NKRI serta secara aktif menjalankan kewajibannya.',
   'Siswa memahami hak dan kewajiban warga negara dalam bingkai NKRI dan berupaya menjalankannya.',
   'Siswa cukup memahami hak dan kewajiban warga negara namun penerapannya masih perlu dikembangkan.',
   'Siswa belum memahami hak dan kewajiban warga negara dengan baik dan memerlukan bimbingan.'
  ),
  (38, 'Menganalisis wawasan kebangsaan dan persatuan Indonesia', 4,
   'Siswa sangat mampu menganalisis wawasan kebangsaan secara mendalam dan menunjukkan komitmen kuat terhadap persatuan Indonesia.',
   'Siswa mampu menganalisis wawasan kebangsaan dan menunjukkan sikap cinta tanah air yang baik.',
   'Siswa cukup memahami wawasan kebangsaan namun masih perlu bimbingan dalam menganalisis isu persatuan.',
   'Siswa belum memahami wawasan kebangsaan dengan baik dan memerlukan pendampingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE E — BAHASA INDONESIA (id 39)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (39, 'Memahami dan menganalisis berbagai jenis teks', 1,
   'Siswa sangat mampu memahami dan menganalisis berbagai jenis teks secara kritis dengan mengidentifikasi struktur, isi, dan unsur kebahasaannya.',
   'Siswa mampu memahami dan menganalisis berbagai jenis teks dengan baik.',
   'Siswa dapat memahami teks namun masih perlu bimbingan dalam menganalisis struktur dan unsur kebahasaan secara mendalam.',
   'Siswa belum mampu menganalisis berbagai jenis teks secara mandiri dan memerlukan bimbingan intensif.'
  ),
  (39, 'Memproduksi teks tulis dalam berbagai genre', 2,
   'Siswa sangat mampu memproduksi berbagai genre teks tulis dengan struktur yang tepat, diksi yang kaya, dan gaya bahasa yang efektif.',
   'Siswa mampu memproduksi berbagai genre teks tulis dengan struktur yang benar dan bahasa yang cukup efektif.',
   'Siswa mampu memproduksi teks sederhana namun masih perlu latihan dalam mengembangkan isi dan gaya bahasa.',
   'Siswa belum mampu memproduksi teks tulis secara mandiri dan memerlukan bimbingan intensif dari guru.'
  ),
  (39, 'Menyimak dan berbicara efektif dalam konteks formal', 3,
   'Siswa sangat aktif dan efektif dalam diskusi formal, mampu menyimak dengan kritis dan menyampaikan argumen yang terstruktur.',
   'Siswa aktif berpartisipasi dalam diskusi dan presentasi serta mampu menyampaikan ide dengan jelas dan sistematis.',
   'Siswa mulai aktif berbicara dalam diskusi namun masih perlu bimbingan dalam menyampaikan argumen secara terstruktur.',
   'Siswa belum aktif dalam diskusi formal dan masih memerlukan motivasi serta bimbingan dari guru.'
  ),
  (39, 'Mengapresiasi karya sastra modern dan klasik Indonesia', 4,
   'Siswa sangat mampu mengapresiasi dan menganalisis karya sastra secara mendalam, mengaitkannya dengan konteks sosial dan budaya.',
   'Siswa mampu mengapresiasi karya sastra dan menganalisis unsur-unsurnya dengan baik.',
   'Siswa mulai mampu mengapresiasi karya sastra namun masih perlu bimbingan dalam menganalisisnya secara mendalam.',
   'Siswa belum mampu mengapresiasi karya sastra secara mandiri dan memerlukan pendampingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE E — MATEMATIKA (id 40)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (40, 'Memahami fungsi, persamaan, dan pertidaksamaan', 1,
   'Siswa sangat menguasai konsep fungsi, persamaan, dan pertidaksamaan serta mampu menyelesaikan berbagai masalah matematis dengan tepat.',
   'Siswa menguasai konsep fungsi, persamaan, dan pertidaksamaan serta mampu menyelesaikan soal dengan baik.',
   'Siswa cukup memahami fungsi dan persamaan namun masih perlu latihan dalam menyelesaikan pertidaksamaan.',
   'Siswa belum menguasai konsep fungsi, persamaan, dan pertidaksamaan dengan baik serta perlu bimbingan intensif.'
  ),
  (40, 'Memahami trigonometri dan geometri analitik', 2,
   'Siswa sangat menguasai trigonometri dan geometri analitik serta mampu mengaplikasikannya dalam pemecahan masalah nyata.',
   'Siswa menguasai trigonometri dan geometri analitik serta mampu menyelesaikan soal dengan baik.',
   'Siswa cukup memahami trigonometri namun masih perlu latihan dalam mengaplikasikan geometri analitik.',
   'Siswa belum menguasai trigonometri dan geometri analitik serta memerlukan bimbingan intensif.'
  ),
  (40, 'Memahami statistika dan peluang', 3,
   'Siswa sangat menguasai konsep statistika dan peluang serta mampu menafsirkan data dan menghitung peluang kejadian dengan tepat.',
   'Siswa menguasai konsep statistika dan peluang serta mampu menyelesaikan soal-soal terkait dengan baik.',
   'Siswa cukup memahami statistika namun masih perlu latihan dalam menerapkan konsep peluang.',
   'Siswa belum menguasai statistika dan peluang dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (40, 'Memahami limit, turunan, dan aplikasinya', 4,
   'Siswa sangat menguasai konsep limit dan turunan serta mampu mengaplikasikannya dalam berbagai masalah seperti optimasi dan laju perubahan.',
   'Siswa menguasai konsep limit dan turunan serta mampu menyelesaikan soal-soal terkait dengan baik.',
   'Siswa cukup memahami limit namun masih perlu latihan dalam memahami dan mengaplikasikan turunan.',
   'Siswa belum menguasai limit dan turunan dengan baik dan memerlukan bimbingan intensif dari guru.'
  );


-- ============================================================
-- PAKET C FASE E — SEJARAH INDONESIA (id 41)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (41, 'Memahami konsep dasar sejarah dan sumber-sumber sejarah', 1,
   'Siswa sangat memahami konsep dasar sejarah dan mampu menganalisis berbagai sumber sejarah secara kritis dan metodologis.',
   'Siswa memahami konsep dasar sejarah dan dapat menganalisis berbagai sumber sejarah dengan baik.',
   'Siswa cukup memahami konsep sejarah namun masih perlu bimbingan dalam menganalisis sumber-sumber sejarah.',
   'Siswa belum memahami konsep dasar sejarah dan sumber sejarah dengan baik serta perlu bimbingan intensif.'
  ),
  (41, 'Menganalisis kehidupan praaksara dan kerajaan Hindu-Buddha', 2,
   'Siswa sangat mampu menganalisis kehidupan praaksara dan peradaban Hindu-Buddha di Indonesia serta dampaknya bagi kebudayaan bangsa.',
   'Siswa mampu menganalisis kehidupan praaksara dan kerajaan Hindu-Buddha di Indonesia dengan baik.',
   'Siswa cukup memahami materi praaksara dan Hindu-Buddha namun masih perlu bimbingan dalam analisisnya.',
   'Siswa belum mampu menganalisis kehidupan praaksara dan kerajaan Hindu-Buddha dengan baik serta perlu bimbingan.'
  ),
  (41, 'Menganalisis perkembangan kerajaan Islam dan pengaruhnya', 3,
   'Siswa sangat mampu menganalisis perkembangan kerajaan Islam di Indonesia dan pengaruhnya terhadap politik, budaya, dan masyarakat.',
   'Siswa mampu menganalisis perkembangan kerajaan Islam di Indonesia dan pengaruhnya dengan baik.',
   'Siswa cukup memahami kerajaan Islam namun masih perlu bimbingan dalam menganalisis pengaruhnya.',
   'Siswa belum mampu menganalisis kerajaan Islam dan pengaruhnya dengan baik serta memerlukan bimbingan.'
  ),
  (41, 'Menganalisis masa kolonialisme dan perlawanan bangsa', 4,
   'Siswa sangat mampu menganalisis masa kolonialisme dan bentuk-bentuk perlawanan bangsa secara komprehensif dan kritis.',
   'Siswa mampu menganalisis masa kolonialisme dan perlawanan bangsa Indonesia dengan baik.',
   'Siswa cukup memahami masa kolonialisme namun masih perlu bimbingan dalam menganalisis bentuk-bentuk perlawanan.',
   'Siswa belum mampu menganalisis masa kolonialisme dan perlawanan bangsa dengan baik serta perlu bimbingan.'
  );


-- ============================================================
-- PAKET C FASE E — BAHASA INGGRIS (id 42)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (42, 'Memahami dan menganalisis berbagai teks berbahasa Inggris', 1,
   'Siswa sangat mampu memahami dan menganalisis berbagai jenis teks berbahasa Inggris secara kritis dengan pemahaman yang sangat baik.',
   'Siswa mampu memahami dan menganalisis berbagai jenis teks berbahasa Inggris dengan baik.',
   'Siswa mampu memahami teks berbahasa Inggris namun masih perlu bimbingan dalam menganalisisnya secara kritis.',
   'Siswa belum mampu menganalisis teks berbahasa Inggris secara mandiri dan memerlukan bimbingan intensif.'
  ),
  (42, 'Memproduksi teks tulis dalam berbagai genre bahasa Inggris', 2,
   'Siswa sangat mampu memproduksi berbagai genre teks dalam bahasa Inggris dengan struktur dan tata bahasa yang akurat.',
   'Siswa mampu memproduksi berbagai genre teks dalam bahasa Inggris dengan baik.',
   'Siswa mampu menulis teks sederhana dalam bahasa Inggris namun masih perlu latihan dalam berbagai genre.',
   'Siswa belum mampu memproduksi teks dalam bahasa Inggris secara mandiri dan memerlukan bimbingan intensif.'
  ),
  (42, 'Berkomunikasi lisan secara efektif dalam berbagai situasi', 3,
   'Siswa sangat lancar dan percaya diri berkomunikasi lisan dalam bahasa Inggris pada berbagai situasi formal dan informal.',
   'Siswa aktif berpartisipasi dalam diskusi dan presentasi serta mampu menyampaikan ide dalam bahasa Inggris.',
   'Siswa mulai berani berkomunikasi lisan dalam bahasa Inggris namun masih perlu latihan untuk meningkatkan kelancaran.',
   'Siswa belum berani berkomunikasi lisan dalam bahasa Inggris dan sangat memerlukan bimbingan dari guru.'
  ),
  (42, 'Menguasai tata bahasa dan struktur bahasa Inggris secara akurat', 4,
   'Siswa sangat menguasai tata bahasa Inggris dan mampu menggunakannya dengan akurat dalam berbagai konteks komunikasi.',
   'Siswa menguasai tata bahasa Inggris dengan baik dan dapat menggunakannya dalam komunikasi.',
   'Siswa cukup memahami tata bahasa Inggris namun masih sering membuat kesalahan dalam penggunaannya.',
   'Siswa belum menguasai tata bahasa Inggris dengan baik dan memerlukan bimbingan intensif dari guru.'
  );


-- ============================================================
-- PAKET C FASE E — GEOGRAFI (id 43)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (43, 'Memahami konsep dasar geografi dan pemetaan', 1,
   'Siswa sangat memahami konsep dasar geografi dan pemetaan serta mampu menganalisis informasi dari peta dan citra penginderaan jauh.',
   'Siswa memahami konsep dasar geografi dan pemetaan serta dapat menganalisis informasi dari peta dengan baik.',
   'Siswa cukup memahami konsep geografi namun masih perlu bimbingan dalam membaca dan menganalisis peta.',
   'Siswa belum memahami konsep dasar geografi dan pemetaan dengan baik serta memerlukan bimbingan.'
  ),
  (43, 'Menganalisis atmosfer, hidrosfer, dan biosfer', 2,
   'Siswa sangat mampu menganalisis fenomena atmosfer, hidrosfer, dan biosfer serta mengaitkannya dengan kehidupan manusia.',
   'Siswa mampu menganalisis fenomena atmosfer, hidrosfer, dan biosfer dengan baik.',
   'Siswa cukup memahami atmosfer dan hidrosfer namun masih perlu bimbingan dalam menganalisis biosfer.',
   'Siswa belum mampu menganalisis atmosfer, hidrosfer, dan biosfer dengan baik serta perlu bimbingan.'
  ),
  (43, 'Menganalisis persebaran sumber daya alam dan pengelolaannya', 3,
   'Siswa sangat mampu menganalisis persebaran sumber daya alam Indonesia dan merumuskan strategi pengelolaan yang berkelanjutan.',
   'Siswa mampu menganalisis persebaran sumber daya alam Indonesia dan pengelolaannya dengan baik.',
   'Siswa cukup memahami persebaran SDA namun masih perlu bimbingan dalam menganalisis strategi pengelolaannya.',
   'Siswa belum mampu menganalisis persebaran SDA dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (43, 'Memahami dinamika kependudukan dan permasalahannya', 4,
   'Siswa sangat memahami dinamika kependudukan dan mampu menganalisis permasalahannya serta merancang solusi yang relevan.',
   'Siswa memahami dinamika kependudukan dan dapat menganalisis permasalahan terkait dengan baik.',
   'Siswa cukup memahami dinamika kependudukan namun masih perlu bimbingan dalam menganalisis permasalahannya.',
   'Siswa belum memahami dinamika kependudukan dengan baik dan memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE E — SEJARAH PEMINATAN (id 44)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (44, 'Memahami sejarah sebagai ilmu dan cara berpikir historis', 1,
   'Siswa sangat memahami sejarah sebagai ilmu dan mampu menerapkan cara berpikir historis secara kritis dan metodologis.',
   'Siswa memahami sejarah sebagai ilmu dan dapat menerapkan cara berpikir historis dengan baik.',
   'Siswa cukup memahami sejarah sebagai ilmu namun masih perlu bimbingan dalam menerapkan cara berpikir historis.',
   'Siswa belum memahami sejarah sebagai ilmu dengan baik dan memerlukan bimbingan intensif dari guru.'
  ),
  (44, 'Menganalisis peradaban dunia kuno dan abad pertengahan', 2,
   'Siswa sangat mampu menganalisis peradaban dunia kuno dan abad pertengahan serta mengaitkannya dengan perkembangan peradaban masa kini.',
   'Siswa mampu menganalisis peradaban dunia kuno dan abad pertengahan dengan baik.',
   'Siswa cukup memahami peradaban dunia kuno namun masih perlu bimbingan dalam menganalisis abad pertengahan.',
   'Siswa belum mampu menganalisis peradaban dunia kuno dengan baik dan memerlukan bimbingan intensif.'
  ),
  (44, 'Menganalisis revolusi besar dunia dan dampaknya', 3,
   'Siswa sangat mampu menganalisis revolusi besar dunia dan dampaknya terhadap perubahan tatanan global secara komprehensif.',
   'Siswa mampu menganalisis revolusi besar dunia dan dampaknya terhadap perubahan global dengan baik.',
   'Siswa cukup memahami revolusi dunia namun masih perlu bimbingan dalam menganalisis dampaknya secara mendalam.',
   'Siswa belum mampu menganalisis revolusi besar dunia dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (44, 'Menganalisis kolonialisme, imperialisme, dan perlawanannya', 4,
   'Siswa sangat mampu menganalisis kolonialisme dan imperialisme secara kritis serta mengkaji berbagai bentuk perlawanan rakyat tertindas.',
   'Siswa mampu menganalisis kolonialisme, imperialisme, dan perlawanan rakyat dengan baik.',
   'Siswa cukup memahami kolonialisme namun masih perlu bimbingan dalam menganalisis imperialisme dan dampaknya.',
   'Siswa belum mampu menganalisis kolonialisme dan imperialisme dengan baik serta perlu bimbingan intensif.'
  );


-- ============================================================
-- PAKET C FASE E — SOSIOLOGI (id 45)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (45, 'Memahami konsep dasar sosiologi dan fungsinya', 1,
   'Siswa sangat memahami konsep dasar sosiologi dan mampu menggunakannya untuk menganalisis fenomena sosial di sekitarnya.',
   'Siswa memahami konsep dasar sosiologi dan dapat menggunakannya untuk menganalisis gejala sosial.',
   'Siswa cukup memahami konsep sosiologi namun masih perlu bimbingan dalam menerapkannya pada analisis sosial.',
   'Siswa belum memahami konsep dasar sosiologi dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (45, 'Menganalisis interaksi sosial dan dinamika kelompok', 2,
   'Siswa sangat mampu menganalisis pola interaksi sosial dan dinamika kelompok serta mengaitkannya dengan fenomena sosial nyata.',
   'Siswa mampu menganalisis interaksi sosial dan dinamika kelompok dengan baik.',
   'Siswa cukup memahami interaksi sosial namun masih perlu bimbingan dalam menganalisis dinamika kelompok.',
   'Siswa belum mampu menganalisis interaksi sosial dan dinamika kelompok dengan baik serta perlu bimbingan.'
  ),
  (45, 'Memahami nilai, norma, dan lembaga sosial dalam masyarakat', 3,
   'Siswa sangat memahami nilai, norma, dan lembaga sosial serta mampu menganalisis fungsi dan perubahannya dalam masyarakat.',
   'Siswa memahami nilai, norma, dan lembaga sosial dalam masyarakat dengan baik.',
   'Siswa cukup memahami nilai dan norma sosial namun masih perlu bimbingan dalam menganalisis lembaga sosial.',
   'Siswa belum memahami nilai, norma, dan lembaga sosial dengan baik serta memerlukan pendampingan.'
  ),
  (45, 'Menganalisis permasalahan sosial dan alternatif solusinya', 4,
   'Siswa sangat mampu menganalisis permasalahan sosial secara kritis dan merancang alternatif solusi yang kreatif dan relevan.',
   'Siswa mampu menganalisis permasalahan sosial di masyarakat dan mengusulkan alternatif solusinya.',
   'Siswa cukup memahami permasalahan sosial namun masih perlu bimbingan dalam merumuskan solusinya.',
   'Siswa belum mampu menganalisis permasalahan sosial dengan baik dan memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE E — EKONOMI (id 46)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (46, 'Memahami konsep dasar ekonomi dan sistem ekonomi', 1,
   'Siswa sangat memahami konsep dasar ekonomi dan mampu membandingkan berbagai sistem ekonomi serta implikasinya bagi masyarakat.',
   'Siswa memahami konsep dasar ekonomi dan sistem ekonomi serta dapat menjelaskannya dengan baik.',
   'Siswa cukup memahami konsep dasar ekonomi namun masih perlu bimbingan dalam menganalisis sistem ekonomi.',
   'Siswa belum memahami konsep dasar ekonomi dan sistem ekonomi dengan baik serta perlu bimbingan intensif.'
  ),
  (46, 'Menganalisis permintaan, penawaran, dan keseimbangan pasar', 2,
   'Siswa sangat mampu menganalisis mekanisme permintaan, penawaran, dan keseimbangan harga serta mengaitkannya dengan kondisi pasar nyata.',
   'Siswa mampu menganalisis permintaan, penawaran, dan keseimbangan pasar dengan baik.',
   'Siswa cukup memahami permintaan dan penawaran namun masih perlu bimbingan dalam menganalisis keseimbangan pasar.',
   'Siswa belum mampu menganalisis permintaan, penawaran, dan harga pasar dengan baik serta perlu bimbingan.'
  ),
  (46, 'Memahami peran pelaku ekonomi dan kegiatan ekonomi', 3,
   'Siswa sangat memahami peran berbagai pelaku ekonomi dan dapat menganalisis interaksi serta dampaknya terhadap perekonomian.',
   'Siswa memahami peran pelaku ekonomi dan kegiatan ekonomi serta dapat menjelaskannya dengan baik.',
   'Siswa cukup memahami peran pelaku ekonomi namun masih perlu bimbingan dalam menganalisis kegiatan ekonominya.',
   'Siswa belum memahami peran pelaku ekonomi dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (46, 'Memahami uang, perbankan, dan lembaga keuangan', 4,
   'Siswa sangat memahami konsep uang, sistem perbankan, dan lembaga keuangan serta menganalisis perannya dalam perekonomian.',
   'Siswa memahami konsep uang, perbankan, dan lembaga keuangan serta dapat menjelaskannya dengan baik.',
   'Siswa cukup memahami uang dan perbankan namun masih perlu bimbingan dalam memahami lembaga keuangan.',
   'Siswa belum memahami uang, perbankan, dan lembaga keuangan dengan baik serta perlu bimbingan intensif.'
  );


-- ============================================================
-- PAKET C FASE E — PJOK (id 47)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (47, 'Menguasai teknik dan taktik dalam berbagai cabang olahraga', 1,
   'Siswa sangat menguasai teknik dan taktik berbagai cabang olahraga serta mampu mengaplikasikannya dalam situasi permainan nyata.',
   'Siswa menguasai teknik dan taktik dalam berbagai cabang olahraga serta menunjukkan penampilan yang baik.',
   'Siswa cukup menguasai teknik dasar olahraga namun masih perlu latihan dalam penerapan taktik permainan.',
   'Siswa belum menguasai teknik dan taktik olahraga dengan baik dan memerlukan bimbingan intensif.'
  ),
  (47, 'Mengembangkan kebugaran jasmani secara terprogram', 2,
   'Siswa sangat disiplin mengembangkan kebugaran jasmani secara terprogram dan menunjukkan peningkatan yang signifikan.',
   'Siswa mengembangkan kebugaran jasmani secara terprogram dengan disiplin dan menunjukkan kebugaran yang baik.',
   'Siswa mengikuti program kebugaran jasmani namun masih perlu motivasi untuk melaksanakannya secara konsisten.',
   'Siswa belum mengembangkan kebugaran jasmani secara terprogram dan memerlukan pendampingan dari guru.'
  ),
  (47, 'Memahami dan mempraktikkan senam dan aktivitas ritmik', 3,
   'Siswa sangat menguasai senam dan aktivitas ritmik dengan koordinasi dan keluwesan gerak yang sangat baik.',
   'Siswa menguasai senam dan aktivitas ritmik serta menunjukkan koordinasi gerak yang memadai.',
   'Siswa mengikuti senam dan aktivitas ritmik namun masih perlu latihan untuk meningkatkan koordinasi.',
   'Siswa belum menguasai senam dan aktivitas ritmik dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (47, 'Memahami kesehatan reproduksi remaja dan dampak gaya hidup', 4,
   'Siswa sangat memahami kesehatan reproduksi remaja dan gaya hidup sehat serta mampu mengambil keputusan yang bijak.',
   'Siswa memahami kesehatan reproduksi remaja dan menerapkan gaya hidup sehat dengan baik.',
   'Siswa cukup memahami kesehatan reproduksi namun masih perlu bimbingan dalam menerapkan gaya hidup sehat.',
   'Siswa belum memahami kesehatan reproduksi remaja dengan baik dan memerlukan pendampingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE E — PRAKARYA (id 48)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (48, 'Memahami desain dan proses produksi kerajinan', 1,
   'Siswa sangat memahami prinsip desain dan proses produksi kerajinan serta mampu menghasilkan karya berkualitas tinggi.',
   'Siswa memahami desain dan proses produksi kerajinan serta dapat menghasilkan karya yang baik.',
   'Siswa cukup memahami desain kerajinan namun masih perlu bimbingan dalam proses produksinya.',
   'Siswa belum memahami desain dan produksi kerajinan dengan baik dan memerlukan bimbingan intensif.'
  ),
  (48, 'Menerapkan proses rekayasa produk teknologi sederhana', 2,
   'Siswa sangat mampu menerapkan proses rekayasa produk teknologi secara mandiri dan menghasilkan produk yang fungsional.',
   'Siswa mampu menerapkan proses rekayasa produk teknologi sederhana dengan baik.',
   'Siswa mulai memahami rekayasa teknologi namun masih perlu bimbingan dalam proses pembuatannya.',
   'Siswa belum mampu menerapkan rekayasa teknologi sederhana secara mandiri dan perlu bimbingan.'
  ),
  (48, 'Memahami dan mempraktikkan budidaya tanaman atau hewan', 3,
   'Siswa sangat memahami teknik budidaya dan mampu mempraktikkannya secara mandiri dengan hasil yang memuaskan.',
   'Siswa memahami dan mampu mempraktikkan budidaya tanaman atau hewan dengan baik.',
   'Siswa mulai memahami budidaya namun masih perlu bimbingan dalam mempraktikkannya secara mandiri.',
   'Siswa belum memahami budidaya tanaman atau hewan dengan baik dan memerlukan pendampingan guru.'
  ),
  (48, 'Memahami pengolahan produk pangan berbahan lokal', 4,
   'Siswa sangat memahami teknik pengolahan pangan lokal dan mampu menghasilkan produk olahan yang higienis dan bernilai jual.',
   'Siswa memahami pengolahan produk pangan lokal dan dapat menghasilkan olahan yang baik.',
   'Siswa cukup memahami pengolahan pangan lokal namun masih perlu latihan dalam teknik pengolahannya.',
   'Siswa belum memahami pengolahan pangan lokal dengan baik dan memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE E — PEMBERDAYAAN (id 49)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (49, 'Menganalisis potensi diri dan lingkungan untuk pemberdayaan', 1,
   'Siswa sangat mampu menganalisis potensi diri dan lingkungan secara mendalam sebagai landasan perancangan program pemberdayaan.',
   'Siswa mampu menganalisis potensi diri dan lingkungan untuk tujuan pemberdayaan dengan baik.',
   'Siswa cukup mampu menganalisis potensi diri namun masih perlu bimbingan dalam menganalisis potensi lingkungan.',
   'Siswa belum mampu menganalisis potensi diri dan lingkungan secara mandiri serta perlu pendampingan.'
  ),
  (49, 'Merancang dan melaksanakan program pemberdayaan komunitas', 2,
   'Siswa sangat aktif berpartisipasi dalam kegiatan pemberdayaan di sekolah atau komunitas dan menunjukkan inisiatif yang tinggi.',
   'Siswa aktif berpartisipasi dalam kegiatan pemberdayaan di sekolah atau komunitas dengan baik.',
   'Siswa mulai berpartisipasi dalam kegiatan pemberdayaan namun masih perlu dorongan untuk lebih aktif.',
   'Siswa belum aktif dalam kegiatan pemberdayaan dan memerlukan motivasi serta bimbingan dari guru.'
  ),
  (49, 'Mengembangkan kecakapan hidup dan kemandirian', 3,
   'Siswa sangat menunjukkan kecakapan hidup yang tinggi dan kemandirian yang menonjol dalam berbagai aspek kehidupan.',
   'Siswa menunjukkan kecakapan hidup dan kemandirian yang baik dalam berbagai aktivitas.',
   'Siswa mulai mengembangkan kecakapan hidup namun masih perlu bimbingan dalam membangun kemandiriannya.',
   'Siswa belum menunjukkan kecakapan hidup dan kemandirian yang memadai serta perlu pendampingan.'
  ),
  (49, 'Membangun kolaborasi dan jejaring untuk pemberdayaan', 4,
   'Siswa sangat mampu membangun kolaborasi dan jejaring yang efektif untuk mendukung kegiatan pemberdayaan.',
   'Siswa mampu membangun kolaborasi dan jejaring untuk mendukung pemberdayaan dengan baik.',
   'Siswa mulai membangun kolaborasi namun masih perlu bimbingan dalam mengembangkan jejaring pemberdayaan.',
   'Siswa belum mampu membangun kolaborasi dan jejaring secara mandiri serta memerlukan pendampingan.'
  );


-- ============================================================
-- PAKET C FASE E — KETERAMPILAN (id 50)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (50, 'Menguasai teknik keterampilan pilihan secara mendalam', 1,
   'Siswa sangat menguasai teknik keterampilan pilihan dengan presisi tinggi dan mampu mengeksekusikannya secara konsisten.',
   'Siswa menguasai teknik keterampilan pilihan secara mendalam dan dapat melaksanakannya dengan baik.',
   'Siswa cukup menguasai teknik keterampilan namun masih perlu latihan untuk meningkatkan presisi.',
   'Siswa belum menguasai teknik keterampilan pilihan dengan baik dan memerlukan bimbingan intensif.'
  ),
  (50, 'Menghasilkan produk keterampilan yang bernilai ekonomi', 2,
   'Siswa sangat mampu menghasilkan produk keterampilan berkualitas tinggi yang bernilai ekonomi dan memiliki daya saing.',
   'Siswa dapat menerapkan konsep-konsep dasar dalam keterampilan yang dipelajari dalam pembuatan karya.',
   'Siswa dapat menghasilkan produk keterampilan sederhana namun kualitasnya masih perlu ditingkatkan.',
   'Siswa belum mampu menghasilkan produk keterampilan yang bernilai ekonomi dan perlu bimbingan intensif.'
  ),
  (50, 'Mengelola proses produksi secara efisien dan mandiri', 3,
   'Siswa sangat mampu mengelola proses produksi keterampilan secara efisien, terstruktur, dan penuh inisiatif.',
   'Siswa mampu mengelola proses produksi keterampilan dengan baik dan menunjukkan kemandirian.',
   'Siswa mulai mampu mengelola proses produksi namun masih perlu bimbingan di beberapa tahapan.',
   'Siswa belum mampu mengelola proses produksi secara mandiri dan perlu pendampingan di setiap tahap.'
  ),
  (50, 'Memahami dan menerapkan strategi pemasaran produk', 4,
   'Siswa sangat memahami strategi pemasaran dan mampu mempresentasikan serta memasarkan produknya dengan sangat efektif.',
   'Siswa memahami pemasaran produk keterampilan dan dapat menerapkan strategi dasar pemasaran.',
   'Siswa mulai memahami pemasaran produk namun masih perlu bimbingan dalam menerapkan strategi pemasaran.',
   'Siswa belum memahami strategi pemasaran produk keterampilan dan memerlukan pendampingan dari guru.'
  );


-- ============================================================
-- ============================================================
-- PAKET C FASE F — PENDIDIKAN AGAMA (6 agama, id 51–56)
-- ============================================================
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
SELECT
  mp.id,
  kd.nama_kompetensi, kd.urutan,
  kd.deskripsi_a, kd.deskripsi_b, kd.deskripsi_c, kd.deskripsi_d
FROM public.mata_pelajaran mp
CROSS JOIN (VALUES
  (1,
   'Menganalisis akidah dan menjawab tantangan pemikiran kontemporer',
   'Siswa sangat mampu menganalisis konsep akidah secara kritis dan memberikan argumen yang kuat dalam menjawab tantangan pemikiran modern.',
   'Siswa mampu menganalisis akidah dan merespons tantangan pemikiran kontemporer dengan baik.',
   'Siswa cukup memahami akidah namun masih perlu bimbingan dalam merespons tantangan pemikiran kontemporer.',
   'Siswa belum mampu menganalisis akidah secara kritis dan perlu bimbingan intensif dari guru.'
  ),
  (2,
   'Mengembangkan ibadah sebagai landasan akhlak dan kepribadian',
   'Siswa sangat menghayati ibadah sebagai landasan akhlak dan secara konsisten menampilkan kepribadian mulia yang menjadi teladan.',
   'Siswa menghayati ibadah sebagai landasan akhlak dan menampilkan kepribadian mulia dengan baik.',
   'Siswa melaksanakan ibadah dengan baik namun pengembangan akhlak sebagai kepribadian masih perlu ditingkatkan.',
   'Siswa belum menghayati ibadah sebagai landasan akhlak dan memerlukan bimbingan intensif dari guru.'
  ),
  (3,
   'Menganalisis sumber hukum agama dan penerapannya secara kontekstual',
   'Siswa sangat mampu menganalisis sumber-sumber hukum agama dan mengaplikasikannya secara kontekstual dengan argumen yang kuat.',
   'Siswa mampu menganalisis sumber hukum agama dan menerapkannya secara kontekstual dengan baik.',
   'Siswa cukup memahami sumber hukum agama namun masih perlu bimbingan dalam penerapannya secara kontekstual.',
   'Siswa belum mampu menganalisis sumber hukum agama secara kontekstual dan perlu bimbingan intensif.'
  ),
  (4,
   'Menjadi pelopor nilai-nilai agama dalam kehidupan global yang bermartabat',
   'Siswa sangat mampu menjadi pelopor dan teladan nilai-nilai agama di lingkungannya serta berkontribusi nyata dalam kehidupan bermartabat.',
   'Siswa menunjukkan komitmen yang kuat untuk menjadi pelopor nilai agama dalam kehidupan global.',
   'Siswa mulai menunjukkan sikap menjadi pelopor nilai agama namun konsistensinya masih perlu dikembangkan.',
   'Siswa belum menunjukkan peran sebagai pelopor nilai agama dan memerlukan bimbingan dari guru.'
  )
) AS kd(urutan, nama_kompetensi, deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase F' AND mp.agama IS NOT NULL;


-- ============================================================
-- PAKET C FASE F — PENDIDIKAN KEWARGANEGARAAN (id 57)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (57, 'Menganalisis Pancasila sebagai ideologi dan falsafah negara', 1,
   'Siswa sangat mampu menganalisis Pancasila sebagai ideologi terbuka dan falsafah negara serta mengkritisinya secara konstruktif.',
   'Siswa mampu menganalisis Pancasila sebagai ideologi dan falsafah negara dengan baik.',
   'Siswa cukup memahami Pancasila sebagai ideologi namun masih perlu bimbingan dalam analisis kritisnya.',
   'Siswa belum mampu menganalisis Pancasila sebagai ideologi secara mendalam dan perlu bimbingan.'
  ),
  (57, 'Mengevaluasi sistem pemerintahan dan demokrasi Indonesia', 2,
   'Siswa sangat mampu mengevaluasi sistem pemerintahan dan demokrasi Indonesia secara kritis serta memberikan rekomendasi yang konstruktif.',
   'Siswa mampu mengevaluasi sistem pemerintahan dan demokrasi Indonesia dengan baik.',
   'Siswa cukup memahami sistem pemerintahan namun masih perlu bimbingan dalam mengevaluasi demokratisasinya.',
   'Siswa belum mampu mengevaluasi sistem pemerintahan secara mandiri dan memerlukan bimbingan.'
  ),
  (57, 'Menganalisis dinamika hak dan kewajiban warga negara di era global', 3,
   'Siswa sangat mampu menganalisis dinamika hak dan kewajiban warga negara dalam konteks global dan menginternalisasikannya.',
   'Siswa mampu menganalisis hak dan kewajiban warga negara dalam konteks global dengan baik.',
   'Siswa cukup memahami hak dan kewajiban namun masih perlu bimbingan dalam menganalisis konteks globalnya.',
   'Siswa belum mampu menganalisis hak dan kewajiban warga negara secara global dan perlu bimbingan.'
  ),
  (57, 'Mengembangkan sikap demokratis dan berpartisipasi aktif dalam bernegara', 4,
   'Siswa sangat aktif berpartisipasi dalam kehidupan demokratis dan menjadi agen perubahan positif di lingkungannya.',
   'Siswa menunjukkan sikap demokratis dan berpartisipasi aktif dalam kehidupan bernegara dengan baik.',
   'Siswa mulai menunjukkan sikap demokratis namun partisipasi aktifnya masih perlu ditingkatkan.',
   'Siswa belum menunjukkan sikap demokratis yang aktif dan memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE F — BAHASA INDONESIA (id 58)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (58, 'Menganalisis dan mengevaluasi teks secara kritis', 1,
   'Siswa sangat mampu menganalisis dan mengevaluasi berbagai teks secara kritis dengan argumen yang tajam dan berbasis bukti.',
   'Siswa mampu menganalisis dan mengevaluasi teks secara kritis dengan baik.',
   'Siswa mampu menganalisis teks namun masih perlu bimbingan dalam mengevaluasinya secara kritis.',
   'Siswa belum mampu menganalisis dan mengevaluasi teks secara kritis serta perlu bimbingan intensif.'
  ),
  (58, 'Memproduksi teks kompleks dengan argumen yang efektif', 2,
   'Siswa sangat mampu memproduksi teks kompleks seperti esai argumentatif dengan argumen yang logis, kohesif, dan persuasif.',
   'Siswa mampu memproduksi teks kompleks dengan argumen yang cukup efektif dan terstruktur.',
   'Siswa mampu memproduksi teks namun masih perlu bimbingan dalam mengembangkan argumen yang efektif.',
   'Siswa belum mampu memproduksi teks kompleks secara mandiri dan memerlukan bimbingan intensif.'
  ),
  (58, 'Berkomunikasi efektif dalam konteks akademis dan profesional', 3,
   'Siswa sangat efektif berkomunikasi dalam konteks akademis dan profesional, mampu meyakinkan audiens dengan cara yang santun.',
   'Siswa mampu berkomunikasi efektif dalam konteks akademis dan profesional dengan baik.',
   'Siswa cukup mampu berkomunikasi dalam konteks akademis namun masih perlu latihan dalam konteks profesional.',
   'Siswa belum mampu berkomunikasi efektif dalam konteks akademis dan profesional serta perlu bimbingan.'
  ),
  (58, 'Mengapresiasi, menganalisis, dan menghasilkan karya sastra', 4,
   'Siswa sangat mampu mengapresiasi, menganalisis secara mendalam, dan menghasilkan karya sastra yang bermutu.',
   'Siswa mampu mengapresiasi dan menganalisis karya sastra serta mulai menghasilkan karya sastra sendiri.',
   'Siswa mampu mengapresiasi karya sastra namun masih perlu bimbingan dalam menganalisis dan menghasilkan karya.',
   'Siswa belum mampu mengapresiasi dan menganalisis karya sastra secara mandiri serta perlu bimbingan.'
  );


-- ============================================================
-- PAKET C FASE F — MATEMATIKA (id 59)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (59, 'Menguasai integral dan aplikasinya dalam pemecahan masalah', 1,
   'Siswa sangat menguasai konsep integral dan mampu mengaplikasikannya dalam pemecahan masalah matematika dan ilmu terapan.',
   'Siswa menguasai konsep integral dan dapat mengaplikasikannya dalam pemecahan masalah dengan baik.',
   'Siswa cukup memahami integral namun masih perlu latihan dalam mengaplikasikannya pada berbagai masalah.',
   'Siswa belum menguasai integral dengan baik dan memerlukan bimbingan intensif dari guru.'
  ),
  (59, 'Menguasai matriks, vektor, dan transformasi geometri', 2,
   'Siswa sangat menguasai matriks, vektor, dan transformasi geometri serta mampu menggunakannya dalam berbagai konteks matematis.',
   'Siswa menguasai matriks, vektor, dan transformasi geometri serta dapat menyelesaikan soal dengan baik.',
   'Siswa cukup menguasai matriks dan vektor namun masih perlu latihan dalam memahami transformasi geometri.',
   'Siswa belum menguasai matriks, vektor, dan transformasi geometri serta perlu bimbingan intensif.'
  ),
  (59, 'Menguasai barisan, deret, dan program linear', 3,
   'Siswa sangat menguasai barisan, deret, dan program linear serta mampu mengaplikasikannya dalam masalah optimasi.',
   'Siswa menguasai barisan, deret, dan program linear serta mampu menyelesaikan soal dengan baik.',
   'Siswa cukup memahami barisan dan deret namun masih perlu latihan dalam program linear.',
   'Siswa belum menguasai barisan, deret, dan program linear dengan baik serta perlu bimbingan.'
  ),
  (59, 'Menguasai geometri ruang dan menerapkan matematika secara integratif', 4,
   'Siswa sangat menguasai geometri ruang dan mampu menerapkan konsep matematika secara integratif dalam memecahkan masalah kompleks.',
   'Siswa menguasai geometri ruang dan dapat menerapkan matematika secara integratif dengan baik.',
   'Siswa cukup memahami geometri ruang namun masih perlu latihan dalam penerapan integratif.',
   'Siswa belum menguasai geometri ruang dengan baik dan memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE F — SEJARAH INDONESIA (id 60)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (60, 'Menganalisis pergerakan nasional dan proklamasi kemerdekaan', 1,
   'Siswa sangat mampu menganalisis dinamika pergerakan nasional dan proklamasi kemerdekaan secara kritis dan komprehensif.',
   'Siswa mampu menganalisis pergerakan nasional dan proklamasi kemerdekaan dengan baik.',
   'Siswa cukup memahami pergerakan nasional namun masih perlu bimbingan dalam menganalisis proklamasi.',
   'Siswa belum mampu menganalisis pergerakan nasional dan proklamasi kemerdekaan serta perlu bimbingan.'
  ),
  (60, 'Menganalisis perjuangan mempertahankan kemerdekaan Indonesia', 2,
   'Siswa sangat mampu menganalisis berbagai bentuk perjuangan mempertahankan kemerdekaan dan menilai signifikansinya.',
   'Siswa mampu menganalisis perjuangan mempertahankan kemerdekaan Indonesia dengan baik.',
   'Siswa cukup memahami perjuangan kemerdekaan namun masih perlu bimbingan dalam analisis mendalam.',
   'Siswa belum mampu menganalisis perjuangan mempertahankan kemerdekaan serta perlu bimbingan.'
  ),
  (60, 'Menganalisis perkembangan politik, ekonomi, dan sosial Indonesia', 3,
   'Siswa sangat mampu menganalisis dinamika politik, ekonomi, dan sosial Indonesia dari masa ke masa secara kritis.',
   'Siswa mampu menganalisis perkembangan politik, ekonomi, dan sosial Indonesia dengan baik.',
   'Siswa cukup memahami perkembangan Indonesia namun masih perlu bimbingan dalam analisis komprehensifnya.',
   'Siswa belum mampu menganalisis perkembangan Indonesia secara mendalam dan perlu bimbingan.'
  ),
  (60, 'Merefleksikan nilai-nilai sejarah untuk membangun masa depan bangsa', 4,
   'Siswa sangat mampu merefleksikan nilai-nilai perjuangan bangsa secara mendalam dan menginternalisasikannya untuk kontribusi nyata.',
   'Siswa mampu merefleksikan nilai-nilai sejarah perjuangan bangsa untuk kehidupan masa kini dengan baik.',
   'Siswa mulai merefleksikan nilai sejarah namun masih perlu bimbingan dalam menghubungkannya dengan masa kini.',
   'Siswa belum mampu merefleksikan nilai sejarah secara bermakna dan memerlukan bimbingan dari guru.'
  );


-- ============================================================
-- PAKET C FASE F — BAHASA INGGRIS (id 61)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (61, 'Menganalisis teks kompleks berbahasa Inggris secara kritis', 1,
   'Siswa sangat mampu menganalisis teks kompleks berbahasa Inggris secara kritis dan mendalam dengan interpretasi yang tajam.',
   'Siswa mampu menganalisis teks kompleks berbahasa Inggris secara kritis dengan baik.',
   'Siswa mampu memahami teks kompleks namun masih perlu bimbingan dalam menganalisisnya secara kritis.',
   'Siswa belum mampu menganalisis teks kompleks berbahasa Inggris secara mandiri dan perlu bimbingan.'
  ),
  (61, 'Memproduksi teks akademis dan profesional dalam bahasa Inggris', 2,
   'Siswa sangat mampu memproduksi teks akademis dan profesional dalam bahasa Inggris dengan kualitas yang sangat baik.',
   'Siswa mampu memproduksi teks akademis dan profesional dalam bahasa Inggris dengan baik.',
   'Siswa mampu menulis teks dalam bahasa Inggris namun masih perlu latihan untuk mencapai kualitas akademis.',
   'Siswa belum mampu memproduksi teks akademis dalam bahasa Inggris dan memerlukan bimbingan intensif.'
  ),
  (61, 'Berkomunikasi secara akademis dan profesional dalam bahasa Inggris', 3,
   'Siswa sangat fasih berkomunikasi secara akademis dan profesional dalam bahasa Inggris dengan kepercayaan diri tinggi.',
   'Siswa mampu berkomunikasi secara akademis dan profesional dalam bahasa Inggris dengan baik.',
   'Siswa mulai mampu berkomunikasi dalam konteks akademis bahasa Inggris namun masih perlu latihan.',
   'Siswa belum mampu berkomunikasi secara akademis dalam bahasa Inggris dan perlu bimbingan intensif.'
  ),
  (61, 'Menganalisis variasi bahasa dan konteks budaya dalam komunikasi', 4,
   'Siswa sangat mampu menganalisis variasi bahasa dan konteks budaya dalam komunikasi berbahasa Inggris secara kritis.',
   'Siswa mampu menganalisis variasi bahasa dan konteks budaya dalam komunikasi bahasa Inggris dengan baik.',
   'Siswa cukup memahami variasi bahasa namun masih perlu bimbingan dalam menganalisis konteks budayanya.',
   'Siswa belum mampu menganalisis variasi bahasa dan konteks budaya serta perlu bimbingan intensif.'
  );


-- ============================================================
-- PAKET C FASE F — GEOGRAFI (id 62)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (62, 'Menganalisis dinamika litosfer, pedosfer, dan mitigasi bencana', 1,
   'Siswa sangat mampu menganalisis dinamika litosfer dan pedosfer serta merumuskan strategi mitigasi bencana yang komprehensif.',
   'Siswa mampu menganalisis dinamika litosfer dan pedosfer serta memahami mitigasi bencana dengan baik.',
   'Siswa cukup memahami litosfer namun masih perlu bimbingan dalam menganalisis mitigasi bencana.',
   'Siswa belum mampu menganalisis litosfer dan mitigasi bencana secara mendalam serta perlu bimbingan.'
  ),
  (62, 'Menganalisis lingkungan hidup dan pembangunan berkelanjutan', 2,
   'Siswa sangat mampu menganalisis isu lingkungan hidup dan merancang solusi pembangunan berkelanjutan yang inovatif.',
   'Siswa mampu menganalisis lingkungan hidup dan konsep pembangunan berkelanjutan dengan baik.',
   'Siswa cukup memahami lingkungan hidup namun masih perlu bimbingan dalam menganalisis pembangunan berkelanjutan.',
   'Siswa belum mampu menganalisis lingkungan hidup secara mendalam dan memerlukan bimbingan.'
  ),
  (62, 'Menganalisis pola keruangan, interaksi wilayah, dan pewilayahan', 3,
   'Siswa sangat mampu menganalisis pola keruangan dan interaksi antarpusat pertumbuhan dengan penguasaan konsep yang sangat baik.',
   'Siswa mampu menganalisis pola keruangan dan interaksi wilayah serta pewilayahannya dengan baik.',
   'Siswa cukup memahami pola keruangan namun masih perlu bimbingan dalam menganalisis interaksi wilayah.',
   'Siswa belum mampu menganalisis pola keruangan dan pewilayahan secara mandiri serta perlu bimbingan.'
  ),
  (62, 'Menganalisis posisi dan peran Indonesia di tingkat global', 4,
   'Siswa sangat mampu menganalisis posisi strategis Indonesia dalam konteks geopolitik dan geostrategis global secara kritis.',
   'Siswa mampu menganalisis posisi dan peran Indonesia di tingkat global dengan baik.',
   'Siswa cukup memahami posisi Indonesia secara global namun masih perlu bimbingan dalam analisis mendalam.',
   'Siswa belum mampu menganalisis posisi Indonesia di tingkat global secara mandiri serta perlu bimbingan.'
  );


-- ============================================================
-- PAKET C FASE F — SEJARAH PEMINATAN (id 63)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (63, 'Menganalisis Perang Dunia I, II, dan dampaknya terhadap tatanan dunia', 1,
   'Siswa sangat mampu menganalisis Perang Dunia I dan II secara komprehensif serta mengkaji dampaknya terhadap tatanan dunia modern.',
   'Siswa mampu menganalisis Perang Dunia dan dampaknya terhadap tatanan dunia dengan baik.',
   'Siswa cukup memahami Perang Dunia namun masih perlu bimbingan dalam menganalisis dampak globalnya.',
   'Siswa belum mampu menganalisis Perang Dunia secara mendalam dan memerlukan bimbingan intensif.'
  ),
  (63, 'Menganalisis Perang Dingin dan proses dekolonisasi Asia-Afrika', 2,
   'Siswa sangat mampu menganalisis Perang Dingin dan dekolonisasi secara kritis serta mengaitkannya dengan perjuangan kemerdekaan Indonesia.',
   'Siswa mampu menganalisis Perang Dingin dan dekolonisasi Asia-Afrika dengan baik.',
   'Siswa cukup memahami Perang Dingin namun masih perlu bimbingan dalam menganalisis dekolonisasi.',
   'Siswa belum mampu menganalisis Perang Dingin dan dekolonisasi secara mendalam serta perlu bimbingan.'
  ),
  (63, 'Menganalisis perkembangan dunia pasca Perang Dingin hingga kini', 3,
   'Siswa sangat mampu menganalisis dinamika global pasca Perang Dingin termasuk globalisasi dan isu-isu kontemporer secara kritis.',
   'Siswa mampu menganalisis perkembangan dunia pasca Perang Dingin dengan baik.',
   'Siswa cukup memahami perkembangan dunia terkini namun masih perlu bimbingan dalam analisis kritisnya.',
   'Siswa belum mampu menganalisis perkembangan dunia terkini secara mendalam dan perlu bimbingan.'
  ),
  (63, 'Merefleksikan pelajaran sejarah dunia untuk masa depan global', 4,
   'Siswa sangat mampu merefleksikan pelajaran dari sejarah dunia secara mendalam dan menginternalisasikannya sebagai bekal menghadapi masa depan.',
   'Siswa mampu merefleksikan pelajaran sejarah dunia dan relevansinya bagi masa depan dengan baik.',
   'Siswa mulai merefleksikan sejarah dunia namun masih perlu bimbingan dalam mengaitkannya dengan masa depan.',
   'Siswa belum mampu merefleksikan pelajaran sejarah dunia secara bermakna dan perlu bimbingan.'
  );


-- ============================================================
-- PAKET C FASE F — SOSIOLOGI (id 64)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (64, 'Menganalisis perubahan sosial dan dampaknya terhadap masyarakat', 1,
   'Siswa sangat mampu menganalisis perubahan sosial dari berbagai perspektif dan mengkaji dampaknya secara komprehensif.',
   'Siswa mampu menganalisis perubahan sosial dan dampaknya terhadap masyarakat dengan baik.',
   'Siswa cukup memahami perubahan sosial namun masih perlu bimbingan dalam menganalisis dampaknya.',
   'Siswa belum mampu menganalisis perubahan sosial secara mendalam dan memerlukan bimbingan.'
  ),
  (64, 'Menganalisis konflik sosial dan mekanisme penyelesaiannya', 2,
   'Siswa sangat mampu menganalisis konflik sosial secara kritis dan merumuskan mekanisme penyelesaian yang konstruktif.',
   'Siswa mampu menganalisis konflik sosial dan mekanisme penyelesaiannya dengan baik.',
   'Siswa cukup memahami konflik sosial namun masih perlu bimbingan dalam menganalisis penyelesaiannya.',
   'Siswa belum mampu menganalisis konflik sosial secara mandiri dan memerlukan bimbingan dari guru.'
  ),
  (64, 'Menganalisis stratifikasi, mobilitas sosial, dan integrasi', 3,
   'Siswa sangat mampu menganalisis stratifikasi dan mobilitas sosial serta merumuskan strategi integrasi yang inklusif.',
   'Siswa mampu menganalisis stratifikasi dan mobilitas sosial serta memahami integrasi dengan baik.',
   'Siswa cukup memahami stratifikasi sosial namun masih perlu bimbingan dalam menganalisis mobilitas sosial.',
   'Siswa belum mampu menganalisis stratifikasi dan mobilitas sosial secara mendalam serta perlu bimbingan.'
  ),
  (64, 'Merancang dan melaksanakan penelitian sosial sederhana', 4,
   'Siswa sangat mampu merancang dan melaksanakan penelitian sosial sederhana secara mandiri dengan metodologi yang tepat.',
   'Siswa mampu merancang dan melaksanakan penelitian sosial sederhana dengan baik.',
   'Siswa mulai mampu merancang penelitian sosial namun masih perlu bimbingan dalam pelaksanaannya.',
   'Siswa belum mampu merancang penelitian sosial secara mandiri dan memerlukan pendampingan intensif.'
  );


-- ============================================================
-- PAKET C FASE F — EKONOMI (id 65)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (65, 'Menganalisis pendapatan nasional dan pertumbuhan ekonomi', 1,
   'Siswa sangat mampu menganalisis konsep pendapatan nasional dan pertumbuhan ekonomi serta mengaitkannya dengan kondisi riil Indonesia.',
   'Siswa mampu menganalisis pendapatan nasional dan pertumbuhan ekonomi dengan baik.',
   'Siswa cukup memahami pendapatan nasional namun masih perlu bimbingan dalam menganalisis pertumbuhan ekonomi.',
   'Siswa belum mampu menganalisis pendapatan nasional dan pertumbuhan ekonomi serta perlu bimbingan.'
  ),
  (65, 'Menganalisis ketenagakerjaan, pengangguran, dan inflasi', 2,
   'Siswa sangat mampu menganalisis permasalahan ketenagakerjaan, pengangguran, dan inflasi serta merumuskan solusi kebijakan.',
   'Siswa mampu menganalisis ketenagakerjaan, pengangguran, dan inflasi dengan baik.',
   'Siswa cukup memahami ketenagakerjaan namun masih perlu bimbingan dalam menganalisis pengangguran dan inflasi.',
   'Siswa belum mampu menganalisis ketenagakerjaan dan pengangguran secara mendalam serta perlu bimbingan.'
  ),
  (65, 'Menganalisis APBN, APBD, dan kebijakan fiskal-moneter', 3,
   'Siswa sangat mampu menganalisis APBN dan APBD serta mengevaluasi efektivitas kebijakan fiskal dan moneter pemerintah.',
   'Siswa mampu menganalisis APBN, APBD, dan kebijakan fiskal-moneter dengan baik.',
   'Siswa cukup memahami APBN namun masih perlu bimbingan dalam menganalisis kebijakan fiskal-moneter.',
   'Siswa belum mampu menganalisis APBN dan kebijakan fiskal-moneter secara mandiri serta perlu bimbingan.'
  ),
  (65, 'Menganalisis perdagangan internasional dan kerja sama ekonomi global', 4,
   'Siswa sangat mampu menganalisis mekanisme perdagangan internasional dan implikasi kerja sama ekonomi global bagi Indonesia.',
   'Siswa mampu menganalisis perdagangan internasional dan kerja sama ekonomi global dengan baik.',
   'Siswa cukup memahami perdagangan internasional namun masih perlu bimbingan dalam menganalisis kerja sama global.',
   'Siswa belum mampu menganalisis perdagangan internasional secara mendalam dan memerlukan bimbingan.'
  );


-- ============================================================
-- PAKET C FASE F — PJOK (id 66)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (66, 'Mengoptimalkan teknik dan strategi dalam olahraga kompetitif', 1,
   'Siswa sangat menguasai teknik dan strategi olahraga kompetitif serta mampu memimpin tim dengan kepemimpinan yang efektif.',
   'Siswa menguasai teknik dan strategi dalam olahraga kompetitif serta menunjukkan sportifitas yang tinggi.',
   'Siswa menguasai teknik dasar olahraga namun masih perlu latihan dalam strategi kompetitif.',
   'Siswa belum mengoptimalkan teknik olahraga kompetitif dan memerlukan bimbingan intensif dari guru.'
  ),
  (66, 'Merancang dan melaksanakan program latihan kebugaran mandiri', 2,
   'Siswa sangat mampu merancang dan melaksanakan program kebugaran mandiri yang terukur serta mengevaluasi perkembangannya.',
   'Siswa mampu merancang dan melaksanakan program latihan kebugaran secara mandiri dengan baik.',
   'Siswa mampu mengikuti program kebugaran namun masih perlu bimbingan dalam merancangnya secara mandiri.',
   'Siswa belum mampu merancang program kebugaran mandiri dan memerlukan pendampingan dari guru.'
  ),
  (66, 'Memahami dan menerapkan prinsip kesehatan holistik', 3,
   'Siswa sangat memahami prinsip kesehatan holistik dan secara konsisten menerapkannya dalam gaya hidup sehari-hari.',
   'Siswa memahami dan menerapkan prinsip-prinsip kesehatan holistik dalam kehidupannya dengan baik.',
   'Siswa cukup memahami kesehatan holistik namun penerapannya dalam gaya hidup masih perlu dikembangkan.',
   'Siswa belum memahami prinsip kesehatan holistik dengan baik dan memerlukan bimbingan dari guru.'
  ),
  (66, 'Memahami olahraga sebagai gaya hidup dan peluang karir', 4,
   'Siswa sangat memahami olahraga sebagai gaya hidup sehat dan mampu mengidentifikasi peluang karir di bidang olahraga secara realistis.',
   'Siswa memahami olahraga sebagai gaya hidup dan mengenal peluang karir di bidang olahraga.',
   'Siswa mulai memahami olahraga sebagai gaya hidup namun masih perlu bimbingan dalam mengidentifikasi peluang karir.',
   'Siswa belum memahami olahraga sebagai gaya hidup dan karir dengan baik serta perlu bimbingan.'
  );


-- ============================================================
-- PAKET C FASE F — PRAKARYA (id 67)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (67, 'Mengembangkan desain dan produksi kerajinan yang inovatif', 1,
   'Siswa sangat mampu mengembangkan desain inovatif dan menghasilkan produk kerajinan berkualitas tinggi dengan nilai estetika dan fungsi.',
   'Siswa mampu mengembangkan desain dan produksi kerajinan yang inovatif dengan baik.',
   'Siswa cukup mampu mengembangkan desain kerajinan namun masih perlu bimbingan dalam inovasi produksinya.',
   'Siswa belum mampu mengembangkan desain dan produksi kerajinan secara inovatif serta perlu bimbingan.'
  ),
  (67, 'Menerapkan rekayasa teknologi tepat guna', 2,
   'Siswa sangat mampu menerapkan rekayasa teknologi tepat guna yang inovatif dan memberikan solusi nyata bagi permasalahan.',
   'Siswa mampu menerapkan rekayasa teknologi tepat guna dengan baik.',
   'Siswa cukup memahami rekayasa teknologi tepat guna namun masih perlu bimbingan dalam penerapannya.',
   'Siswa belum mampu menerapkan rekayasa teknologi tepat guna secara mandiri serta perlu bimbingan.'
  ),
  (67, 'Mengembangkan budidaya berbasis ketahanan pangan', 3,
   'Siswa sangat mampu mengembangkan program budidaya yang berorientasi ketahanan pangan dengan inovasi yang nyata.',
   'Siswa mampu mengembangkan budidaya berbasis ketahanan pangan dengan baik.',
   'Siswa cukup memahami budidaya untuk ketahanan pangan namun masih perlu bimbingan dalam pengembangannya.',
   'Siswa belum mampu mengembangkan budidaya berbasis ketahanan pangan secara mandiri serta perlu bimbingan.'
  ),
  (67, 'Mengembangkan pengolahan pangan berbasis nilai tambah dan teknologi', 4,
   'Siswa sangat mampu mengembangkan produk olahan pangan berbasis teknologi dengan nilai tambah yang tinggi dan prospek pasar.',
   'Siswa mampu mengembangkan pengolahan pangan berbasis teknologi dengan nilai tambah yang baik.',
   'Siswa cukup mampu mengolah pangan namun masih perlu bimbingan dalam mengembangkan nilai tambah produk.',
   'Siswa belum mampu mengembangkan pengolahan pangan berbasis teknologi secara mandiri serta perlu bimbingan.'
  );


-- ============================================================
-- PAKET C FASE F — PEMBERDAYAAN (id 68)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (68, 'Mengevaluasi dan menyempurnakan program pemberdayaan', 1,
   'Siswa sangat mampu mengevaluasi program pemberdayaan secara kritis dan merancang penyempurnaan yang inovatif dan berkelanjutan.',
   'Siswa mampu mengevaluasi dan menyempurnakan program pemberdayaan dengan baik.',
   'Siswa cukup mampu mengevaluasi program pemberdayaan namun masih perlu bimbingan dalam penyempurnaannya.',
   'Siswa belum mampu mengevaluasi dan menyempurnakan program pemberdayaan serta memerlukan pendampingan.'
  ),
  (68, 'Mengembangkan dan mengelola kewirausahaan sosial', 2,
   'Siswa sangat mampu mengembangkan dan mengelola kewirausahaan sosial dengan visi yang jelas dan dampak yang terukur.',
   'Siswa mampu mengembangkan dan mengelola kewirausahaan sosial dengan baik.',
   'Siswa mulai mengembangkan kewirausahaan sosial namun masih perlu bimbingan dalam pengelolaannya.',
   'Siswa belum mampu mengembangkan kewirausahaan sosial secara mandiri dan memerlukan pendampingan.'
  ),
  (68, 'Memimpin dan mengelola program pemberdayaan komunitas', 3,
   'Siswa sangat aktif berpartisipasi dalam kegiatan pemberdayaan di sekolah atau komunitas dan menunjukkan jiwa kepemimpinan yang kuat.',
   'Siswa aktif berpartisipasi dalam kegiatan pemberdayaan dan mampu memimpin kegiatan kelompok dengan baik.',
   'Siswa berpartisipasi dalam pemberdayaan namun masih perlu bimbingan dalam mengembangkan kemampuan kepemimpinan.',
   'Siswa belum aktif dalam kegiatan pemberdayaan dan memerlukan motivasi serta bimbingan dari guru.'
  ),
  (68, 'Merefleksikan dampak dan keberlanjutan pemberdayaan', 4,
   'Siswa sangat mampu merefleksikan dampak pemberdayaan secara mendalam dan merancang strategi keberlanjutan yang komprehensif.',
   'Siswa mampu merefleksikan dampak pemberdayaan dan merumuskan strategi keberlanjutannya dengan baik.',
   'Siswa mulai merefleksikan dampak pemberdayaan namun masih perlu bimbingan dalam merancang keberlanjutannya.',
   'Siswa belum mampu merefleksikan dampak pemberdayaan secara bermakna dan memerlukan pendampingan.'
  );


-- ============================================================
-- PAKET C FASE F — KETERAMPILAN (id 69)
-- ============================================================

INSERT INTO public.kompetensi_dasar
  (mata_pelajaran_id, nama_kompetensi, urutan,
   deskripsi_a, deskripsi_b, deskripsi_c, deskripsi_d)
VALUES
  (69, 'Mengembangkan inovasi dalam bidang keterampilan pilihan', 1,
   'Siswa sangat mampu mengembangkan inovasi signifikan dalam keterampilan pilihan yang memiliki nilai tambah dan keunikan tersendiri.',
   'Siswa mampu mengembangkan inovasi dalam bidang keterampilan pilihan dengan baik.',
   'Siswa mulai mengembangkan inovasi namun masih perlu bimbingan untuk menghasilkan produk yang inovatif.',
   'Siswa belum mampu mengembangkan inovasi dalam keterampilan pilihan secara mandiri serta perlu bimbingan.'
  ),
  (69, 'Menghasilkan produk keterampilan yang kompetitif', 2,
   'Siswa sangat mampu menghasilkan produk keterampilan yang kompetitif, berkualitas tinggi, dan siap bersaing di pasar.',
   'Siswa mampu menghasilkan produk keterampilan yang kompetitif dengan kualitas yang baik.',
   'Siswa dapat menghasilkan produk keterampilan namun kualitas dan daya saingnya masih perlu ditingkatkan.',
   'Siswa belum mampu menghasilkan produk keterampilan yang kompetitif dan memerlukan bimbingan intensif.'
  ),
  (69, 'Mengelola usaha keterampilan secara profesional', 3,
   'Siswa sangat mampu mengelola usaha keterampilan secara profesional dengan manajemen yang efektif dan berorientasi hasil.',
   'Siswa mampu mengelola usaha keterampilan secara profesional dengan baik.',
   'Siswa mulai mampu mengelola usaha keterampilan namun masih perlu bimbingan dalam aspek manajerialnya.',
   'Siswa belum mampu mengelola usaha keterampilan secara profesional dan memerlukan pendampingan intensif.'
  ),
  (69, 'Merancang dan menerapkan strategi pemasaran produk yang efektif', 4,
   'Siswa sangat mampu merancang dan menerapkan strategi pemasaran yang kreatif dan efektif untuk meningkatkan penjualan produk.',
   'Siswa mampu merancang dan menerapkan strategi pemasaran produk keterampilan dengan baik.',
   'Siswa mulai memahami strategi pemasaran namun masih perlu bimbingan dalam merancang dan menerapkannya.',
   'Siswa belum mampu merancang strategi pemasaran secara mandiri dan memerlukan pendampingan dari guru.'
  );


-- ============================================================
-- VERIFIKASI
-- ============================================================

DO $$
DECLARE
  v_c_e_agama   INT;
  v_c_e_umum    INT;
  v_c_e_pem     INT;
  v_c_e_khusus  INT;
  v_c_e_total   INT;
  v_c_f_agama   INT;
  v_c_f_umum    INT;
  v_c_f_pem     INT;
  v_c_f_khusus  INT;
  v_c_f_total   INT;
  v_grand_total INT;
BEGIN
  SELECT COUNT(*) INTO v_c_e_agama
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase E' AND mp.agama IS NOT NULL;
  SELECT COUNT(*) INTO v_c_e_umum
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase E' AND mp.kelompok = 'umum' AND mp.agama IS NULL;
  SELECT COUNT(*) INTO v_c_e_pem
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase E' AND mp.kelompok = 'peminatan_ips';
  SELECT COUNT(*) INTO v_c_e_khusus
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase E' AND mp.kelompok = 'khusus';
  SELECT COUNT(*) INTO v_c_e_total
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase E';

  SELECT COUNT(*) INTO v_c_f_agama
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase F' AND mp.agama IS NOT NULL;
  SELECT COUNT(*) INTO v_c_f_umum
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase F' AND mp.kelompok = 'umum' AND mp.agama IS NULL;
  SELECT COUNT(*) INTO v_c_f_pem
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase F' AND mp.kelompok = 'peminatan_ips';
  SELECT COUNT(*) INTO v_c_f_khusus
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase F' AND mp.kelompok = 'khusus';
  SELECT COUNT(*) INTO v_c_f_total
    FROM public.kompetensi_dasar kd JOIN public.mata_pelajaran mp ON kd.mata_pelajaran_id = mp.id
    WHERE mp.paket = 'Paket C' AND mp.fase = 'Fase F';

  SELECT COUNT(*) INTO v_grand_total FROM public.kompetensi_dasar;

  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'SEED 4 — KD PAKET C VERIFIKASI';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '── Paket C Fase E ─────────────────────────────';
  RAISE NOTICE 'Agama (6×4)             : %  (expected 24)', v_c_e_agama;
  RAISE NOTICE 'Umum non-agama (5×4)    : %  (expected 20)', v_c_e_umum;
  RAISE NOTICE 'Peminatan IPS (4×4)     : %  (expected 16)', v_c_e_pem;
  RAISE NOTICE 'Khusus (4×4)            : %  (expected 16)', v_c_e_khusus;
  RAISE NOTICE 'Total Fase E            : %  (expected 76)', v_c_e_total;
  RAISE NOTICE '── Paket C Fase F ─────────────────────────────';
  RAISE NOTICE 'Agama (6×4)             : %  (expected 24)', v_c_f_agama;
  RAISE NOTICE 'Umum non-agama (5×4)    : %  (expected 20)', v_c_f_umum;
  RAISE NOTICE 'Peminatan IPS (4×4)     : %  (expected 16)', v_c_f_pem;
  RAISE NOTICE 'Khusus (4×4)            : %  (expected 16)', v_c_f_khusus;
  RAISE NOTICE 'Total Fase F            : %  (expected 76)', v_c_f_total;
  RAISE NOTICE '────────────────────────────────────────────────';
  RAISE NOTICE 'GRAND TOTAL KD          : %  (expected 261)', v_grand_total;
  RAISE NOTICE '(109 dari Seed 3 + 152 dari Seed 4)';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;