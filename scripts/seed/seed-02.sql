-- ============================================================
-- E-RAPORT PKBM — SEED 2: P5 SUB-ELEMEN COMPLETION
-- ============================================================
-- Melengkapi p5_sub_elemen untuk semua fase yang belum ada.
-- Seed 1 sudah mengisi Fase E. File ini mengisi:
--   - Fase A  → Paket A kelas I–II
--   - Fase B  → Paket A kelas III–IV
--   - Fase C  → Paket A kelas V–VI
--   - Fase D  → Paket B kelas VII–IX
--   - Fase F  → Paket C kelas XI–XII
--
-- Masing-masing fase: 42 sub-elemen
-- Total insert: 210 rows
-- ============================================================


-- ============================================================
-- FASE A
-- ============================================================

WITH elemen_map AS (
  SELECT e.id AS elemen_id, d.nomor AS dimensi_nomor, e.nama AS elemen_nama
  FROM public.p5_elemen e
  JOIN public.p5_dimensi d ON e.dimensi_id = d.id
),
seed_data(dimensi_nomor, elemen_nama, urutan, deskripsi) AS (
  VALUES
  -- ── DIMENSI 1 ──────────────────────────────────────────────
  (1, 'akhlak beragama', 1,
   'Mengenal dan menyebut nama Tuhan serta mengetahui bahwa Tuhan menciptakan alam dan seluruh isinya termasuk manusia.'),
  (1, 'akhlak beragama', 2,
   'Mengenal ibadah sederhana sesuai agama yang dianut dan mulai meniru perilaku baik yang diajarkan agama dalam kehidupan sehari-hari.'),
  (1, 'akhlak beragama', 3,
   'Melakukan ibadah sederhana sesuai tuntunan agama dengan bimbingan guru atau orang tua dan ikut serta dalam kegiatan hari besar.'),

  (1, 'akhlak pribadi', 1,
   'Mengenal dan mulai mempraktikkan sikap jujur dalam kehidupan sehari-hari dengan bimbingan orang dewasa.'),
  (1, 'akhlak pribadi', 2,
   'Mengenal pentingnya menjaga kebersihan dan kesehatan diri sendiri sebagai bentuk syukur kepada Tuhan.'),

  (1, 'akhlak kepada manusia', 1,
   'Mengenal perasaan diri sendiri dan orang lain serta mulai belajar berempati kepada teman di sekitarnya.'),
  (1, 'akhlak kepada manusia', 2,
   'Menunjukkan sikap mau berbagi dan bersahabat dengan siapa saja tanpa membeda-bedakan teman.'),

  (1, 'akhlak kepada alam', 1,
   'Mengenal ciptaan Tuhan di lingkungan sekitar dan mulai terbiasa menjaga kebersihan lingkungan.'),
  (1, 'akhlak kepada alam', 2,
   'Menunjukkan rasa syukur atas keindahan alam dengan cara sederhana seperti merawat tanaman atau tidak membuang sampah sembarangan.'),

  (1, 'akhlak kepada negara', 1,
   'Mengenal aturan sederhana di rumah dan sekolah serta terbiasa mematuhinya sebagai bentuk tanggung jawab.'),

  -- ── DIMENSI 2 ──────────────────────────────────────────────
  (2, 'mengenal dan menghargai budaya', 1,
   'Mengenal keragaman budaya di lingkungan terdekat seperti makanan, pakaian, dan permainan tradisional.'),
  (2, 'mengenal dan menghargai budaya', 2,
   'Mengenal dan bangga dengan identitas diri sebagai bagian dari keluarga dan komunitas tempat tinggal.'),
  (2, 'mengenal dan menghargai budaya', 3,
   'Mengenal perayaan hari besar dan tradisi keluarga serta ikut berpartisipasi dengan penuh kegembiraan.'),

  (2, 'komunikasi dan interaksi antar budaya', 1,
   'Mengenal bahwa orang-orang di sekitarnya dapat berbeda bahasa, kebiasaan, dan cara berpakaian.'),
  (2, 'komunikasi dan interaksi antar budaya', 2,
   'Mulai belajar berkomunikasi dengan teman yang memiliki latar belakang berbeda secara ramah dan menyenangkan.'),

  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 1,
   'Mengenal akibat dari pilihan atau tindakan sederhana terhadap perasaan orang lain di sekitarnya.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 2,
   'Mulai belajar membuat keputusan sederhana bersama teman dengan bimbingan guru.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 3,
   'Mengenal perbedaan yang ada di sekitarnya dan menunjukkan sikap mau berteman dengan semua orang.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 4,
   'Menunjukkan sikap tidak membeda-bedakan teman berdasarkan penampilan atau latar belakang keluarga.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 5,
   'Mengenal bahwa semua orang berhak diperlakukan dengan baik dan penuh kasih sayang.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 6,
   'Memahami bahwa setiap anak memiliki hak yang sama untuk bermain, belajar, dan mendapat perlindungan.'),

  -- ── DIMENSI 3 ──────────────────────────────────────────────
  (3, 'kolaborasi', 1,
   'Mulai belajar bekerja bersama teman dalam permainan atau tugas kelompok sederhana dengan gembira.'),
  (3, 'kolaborasi', 2,
   'Mau mendengarkan teman saat berbicara dan sabar menunggu giliran dalam kegiatan bersama.'),
  (3, 'kolaborasi', 3,
   'Menunjukkan kesediaan membantu teman yang kesulitan dalam kegiatan belajar atau bermain.'),
  (3, 'kolaborasi', 4,
   'Mau membagi peran kecil dalam kelompok dengan bimbingan guru dan berusaha menjalankannya.'),

  (3, 'kepedulian', 1,
   'Menunjukkan kepedulian terhadap teman yang sedih atau sakit dengan cara yang sederhana dan tulus.'),
  (3, 'kepedulian', 2,
   'Mulai mengenal kebutuhan orang lain dan mau membantu sesuai kemampuan yang dimiliki.'),

  (3, 'berbagi', 1,
   'Menunjukkan kebiasaan berbagi makanan, alat belajar, atau mainan dengan teman di sekitarnya.'),

  -- ── DIMENSI 4 ──────────────────────────────────────────────
  (4, 'pemahaman diri dan situasi yang dihadapi', 1,
   'Mengenal kelebihan dan hal yang disukai dari diri sendiri melalui kegiatan bermain dan belajar.'),
  (4, 'pemahaman diri dan situasi yang dihadapi', 2,
   'Mulai mengenal cara belajar yang membuatnya senang dan mudah memahami pelajaran baru.'),

  (4, 'regulasi diri', 1,
   'Mulai mengenal perasaan senang, sedih, marah, dan takut serta belajar mengungkapkannya dengan tepat.'),
  (4, 'regulasi diri', 2,
   'Mulai belajar mengikuti aturan kelas dan menyelesaikan tugas sederhana hingga selesai.'),
  (4, 'regulasi diri', 3,
   'Mengenal pentingnya mencoba lagi ketika gagal dalam suatu kegiatan dan tidak mudah menyerah.'),
  (4, 'regulasi diri', 4,
   'Mulai terbiasa menyelesaikan tugas yang sudah dimulai hingga tuntas sebelum bermain.'),
  (4, 'regulasi diri', 5,
   'Menunjukkan kemampuan mencoba cara lain yang berbeda ketika cara pertama tidak berhasil.'),

  -- ── DIMENSI 5 ──────────────────────────────────────────────
  (5, 'memperoleh dan memproses informasi dan gagasan', 1,
   'Mampu mengajukan pertanyaan sederhana tentang hal-hal yang belum dipahami dari cerita atau penjelasan.'),
  (5, 'memperoleh dan memproses informasi dan gagasan', 2,
   'Mampu menemukan informasi dasar dari gambar, cerita bergambar, atau penjelasan guru.'),

  (5, 'menganalisis dan mengevaluasi penalaran dan prosedurnya', 1,
   'Mampu memberikan alasan sederhana atas pilihan atau pendapat yang disampaikannya.'),

  (5, 'refleksi pemikiran dan proses berpikir', 1,
   'Mulai mengenal bahwa dirinya bisa berbuat salah dan mau belajar dari kesalahan dengan sikap positif.'),

  -- ── DIMENSI 6 ──────────────────────────────────────────────
  (6, 'menghasilkan gagasan yang orisinal', 1,
   'Mampu mengungkapkan ide atau gagasan sederhana dalam kegiatan bermain, menggambar, atau bercerita.'),

  (6, 'menghasilkan karya dan tindakan yang orisinal', 1,
   'Mampu membuat karya sederhana seperti gambar, kolase, atau kerajinan tangan dengan kreativitas sendiri.'),

  (6, 'memiliki keluwesan berpikir dalam mencari alternatif solusi permasalahan', 1,
   'Menunjukkan kemampuan mencoba berbagai cara dalam menyelesaikan permainan atau tugas sederhana.')
)
INSERT INTO public.p5_sub_elemen (elemen_id, fase, deskripsi, urutan)
SELECT em.elemen_id, 'Fase A', sd.deskripsi, sd.urutan
FROM seed_data sd
JOIN elemen_map em
  ON em.dimensi_nomor = sd.dimensi_nomor
 AND em.elemen_nama   = sd.elemen_nama;


-- ============================================================
-- FASE B
-- ============================================================

WITH elemen_map AS (
  SELECT e.id AS elemen_id, d.nomor AS dimensi_nomor, e.nama AS elemen_nama
  FROM public.p5_elemen e
  JOIN public.p5_dimensi d ON e.dimensi_id = d.id
),
seed_data(dimensi_nomor, elemen_nama, urutan, deskripsi) AS (
  VALUES
  -- ── DIMENSI 1 ──────────────────────────────────────────────
  (1, 'akhlak beragama', 1,
   'Memahami bahwa Tuhan Maha Esa dan menunjukkan rasa syukur melalui perilaku baik dalam kehidupan sehari-hari.'),
  (1, 'akhlak beragama', 2,
   'Mengetahui pokok ajaran agama tentang hubungan sesama manusia dan alam semesta serta mulai menerapkannya.'),
  (1, 'akhlak beragama', 3,
   'Melaksanakan ibadah sederhana secara rutin dengan bimbingan dan mulai membangun kemandirian dalam beribadah.'),

  (1, 'akhlak pribadi', 1,
   'Menunjukkan keberanian menyampaikan kebenaran dan mulai memahami konsekuensinya bagi diri sendiri.'),
  (1, 'akhlak pribadi', 2,
   'Mulai memahami pentingnya menjaga keseimbangan antara aktivitas fisik, belajar, dan istirahat.'),

  (1, 'akhlak kepada manusia', 1,
   'Memahami perasaan orang lain dan menunjukkan empati yang tulus dalam situasi keseharian.'),
  (1, 'akhlak kepada manusia', 2,
   'Menghargai perbedaan teman dan menunjukkan sikap ramah dan inklusif kepada semua orang.'),

  (1, 'akhlak kepada alam', 1,
   'Memahami hubungan sebab akibat sederhana antara perilaku manusia dan kondisi alam sekitar.'),
  (1, 'akhlak kepada alam', 2,
   'Menunjukkan kepedulian terhadap lingkungan dengan tindakan nyata seperti tidak membuang sampah sembarangan.'),

  (1, 'akhlak kepada negara', 1,
   'Memahami aturan di sekolah dan komunitas serta mulai memahami alasan di balik pentingnya aturan tersebut.'),

  -- ── DIMENSI 2 ──────────────────────────────────────────────
  (2, 'mengenal dan menghargai budaya', 1,
   'Memahami keragaman budaya di Indonesia dan mulai menjelaskan budaya daerah asalnya sendiri.'),
  (2, 'mengenal dan menghargai budaya', 2,
   'Mengenal kebiasaan dan tradisi di lingkungan yang lebih luas dari keluarga, seperti di lingkungan RT atau sekolah.'),
  (2, 'mengenal dan menghargai budaya', 3,
   'Ikut berpartisipasi aktif dalam pelestarian budaya melalui kegiatan di sekolah atau komunitas.'),

  (2, 'komunikasi dan interaksi antar budaya', 1,
   'Memahami bahwa penggunaan bahasa bisa berbeda-beda antardaerah dan mulai belajar menghargainya.'),
  (2, 'komunikasi dan interaksi antar budaya', 2,
   'Mampu memahami sudut pandang orang lain yang berbeda dengan dirinya dalam situasi sederhana.'),

  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 1,
   'Memahami bahwa tindakannya dapat berdampak pada perasaan orang lain dan lingkungan di sekitarnya.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 2,
   'Mulai belajar bermusyawarah dalam kelompok kecil untuk mengambil keputusan yang adil bersama.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 3,
   'Mengenal berbagai kelompok budaya yang ada di sekitarnya dan menunjukkan sikap menghargai perbedaan.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 4,
   'Menunjukkan sikap menolak perundungan atau perlakuan tidak adil terhadap teman manapun.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 5,
   'Memahami bahwa semua budaya memiliki nilai dan layak untuk dihargai dan diperlakukan setara.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 6,
   'Memahami hak-hak dasar yang dimiliki setiap anak dan mulai belajar menghormati hak orang lain.'),

  -- ── DIMENSI 3 ──────────────────────────────────────────────
  (3, 'kolaborasi', 1,
   'Mampu bekerja sama dalam kelompok untuk menyelesaikan tugas dengan saling mendukung dan melengkapi.'),
  (3, 'kolaborasi', 2,
   'Mampu mendengarkan dan memahami informasi yang disampaikan teman dalam kegiatan kelompok.'),
  (3, 'kolaborasi', 3,
   'Menunjukkan kemampuan membantu anggota kelompok yang mengalami kesulitan dalam belajar.'),
  (3, 'kolaborasi', 4,
   'Mampu membagi tugas sederhana dalam kelompok dan berusaha menyelesaikan bagiannya dengan baik.'),

  (3, 'kepedulian', 1,
   'Menunjukkan kepedulian terhadap teman atau warga sekolah yang membutuhkan bantuan.'),
  (3, 'kepedulian', 2,
   'Memahami perasaan orang lain dan mau memberikan dukungan yang sesuai dengan situasinya.'),

  (3, 'berbagi', 1,
   'Terbiasa berbagi barang atau pengetahuan kepada teman yang membutuhkan di lingkungan sekolah.'),

  -- ── DIMENSI 4 ──────────────────────────────────────────────
  (4, 'pemahaman diri dan situasi yang dihadapi', 1,
   'Mengenal kelebihan dan kekurangan diri melalui pengalaman belajar dan kegiatan sehari-hari.'),
  (4, 'pemahaman diri dan situasi yang dihadapi', 2,
   'Mulai memantau perkembangan belajarnya dan mengenali hal yang paling membantunya belajar lebih baik.'),

  (4, 'regulasi diri', 1,
   'Memahami berbagai jenis emosi yang dirasakan dan mulai belajar mengelolanya dengan cara yang positif.'),
  (4, 'regulasi diri', 2,
   'Mampu menyusun langkah sederhana untuk menyelesaikan tugas yang diberikan guru.'),
  (4, 'regulasi diri', 3,
   'Mengenal hal-hal yang membantu dan menghambat dirinya dalam belajar dan mulai menyikapinya.'),
  (4, 'regulasi diri', 4,
   'Mulai membangun kebiasaan menyelesaikan tugas sesuai waktu yang diberikan oleh guru.'),
  (4, 'regulasi diri', 5,
   'Mampu mencoba pendekatan baru ketika strategi belajar sebelumnya kurang berhasil.'),

  -- ── DIMENSI 5 ──────────────────────────────────────────────
  (5, 'memperoleh dan memproses informasi dan gagasan', 1,
   'Mampu mengajukan pertanyaan untuk memahami informasi dari berbagai sumber sederhana seperti buku atau cerita.'),
  (5, 'memperoleh dan memproses informasi dan gagasan', 2,
   'Mampu memilih dan menyampaikan kembali informasi yang relevan dari teks atau penjelasan yang diterima.'),

  (5, 'menganalisis dan mengevaluasi penalaran dan prosedurnya', 1,
   'Mampu memberikan pendapat disertai alasan sederhana yang dapat dipahami orang lain.'),

  (5, 'refleksi pemikiran dan proses berpikir', 1,
   'Mulai memahami bahwa cara berpikirnya dapat dipengaruhi oleh pengalaman dan lingkungan di sekitarnya.'),

  -- ── DIMENSI 6 ──────────────────────────────────────────────
  (6, 'menghasilkan gagasan yang orisinal', 1,
   'Mampu menggabungkan ide dari berbagai sumber untuk menghasilkan gagasan baru dalam berkarya.'),

  (6, 'menghasilkan karya dan tindakan yang orisinal', 1,
   'Mampu membuat karya yang mencerminkan ekspresi diri dengan kreativitas yang terus berkembang.'),

  (6, 'memiliki keluwesan berpikir dalam mencari alternatif solusi permasalahan', 1,
   'Mampu mengajukan beberapa alternatif solusi untuk masalah sederhana dalam belajar atau bermain.')
)
INSERT INTO public.p5_sub_elemen (elemen_id, fase, deskripsi, urutan)
SELECT em.elemen_id, 'Fase B', sd.deskripsi, sd.urutan
FROM seed_data sd
JOIN elemen_map em
  ON em.dimensi_nomor = sd.dimensi_nomor
 AND em.elemen_nama   = sd.elemen_nama;


-- ============================================================
-- FASE C
-- ============================================================

WITH elemen_map AS (
  SELECT e.id AS elemen_id, d.nomor AS dimensi_nomor, e.nama AS elemen_nama
  FROM public.p5_elemen e
  JOIN public.p5_dimensi d ON e.dimensi_id = d.id
),
seed_data(dimensi_nomor, elemen_nama, urutan, deskripsi) AS (
  VALUES
  -- ── DIMENSI 1 ──────────────────────────────────────────────
  (1, 'akhlak beragama', 1,
   'Memahami sifat-sifat Tuhan dan mengaitkannya dengan tanggung jawab manusia sebagai makhluk Tuhan di bumi.'),
  (1, 'akhlak beragama', 2,
   'Memahami ajaran agama tentang hubungan antarsesama manusia dan alam semesta secara lebih mendalam dan menerapkannya.'),
  (1, 'akhlak beragama', 3,
   'Melaksanakan ibadah secara rutin dan mandiri serta aktif ikut serta dalam perayaan hari-hari besar agama.'),

  (1, 'akhlak pribadi', 1,
   'Secara konsisten menyampaikan kebenaran meskipun sulit dan memahami dampaknya bagi diri sendiri dan orang lain.'),
  (1, 'akhlak pribadi', 2,
   'Memahami pentingnya menjaga keseimbangan kesehatan jasmani dan mental dalam kehidupan sehari-hari.'),

  (1, 'akhlak kepada manusia', 1,
   'Memahami perasaan dan sudut pandang orang lain dari berbagai latar belakang yang belum pernah dikenal sebelumnya.'),
  (1, 'akhlak kepada manusia', 2,
   'Mengutamakan persamaan dan menghargai perbedaan sebagai dasar dalam kehidupan berkelompok yang harmonis.'),

  (1, 'akhlak kepada alam', 1,
   'Memahami hubungan sebab akibat antara kegiatan manusia dan dampaknya terhadap kondisi alam sekitar.'),
  (1, 'akhlak kepada alam', 2,
   'Mulai berinisiatif menyelesaikan masalah lingkungan sederhana di sekitar sekolah atau rumah secara nyata.'),

  (1, 'akhlak kepada negara', 1,
   'Memahami hak dan kewajiban sebagai warga sekolah dan komunitas serta mulai mengutamakan kepentingan bersama.'),

  -- ── DIMENSI 2 ──────────────────────────────────────────────
  (2, 'mengenal dan menghargai budaya', 1,
   'Memahami perubahan budaya dari waktu ke waktu dan menjelaskan identitas diri yang terbentuk dari budaya bangsa.'),
  (2, 'mengenal dan menghargai budaya', 2,
   'Memahami berbagai praktik dan kepercayaan budaya dalam kehidupan sehari-hari di masyarakat yang lebih luas.'),
  (2, 'mengenal dan menghargai budaya', 3,
   'Mulai aktif melestarikan budaya lokal dalam kehidupan sehari-hari dan kegiatan di sekolah.'),

  (2, 'komunikasi dan interaksi antar budaya', 1,
   'Memahami pengaruh budaya terhadap cara berkomunikasi dan mengenali potensi kesalahpahaman antarbudaya.'),
  (2, 'komunikasi dan interaksi antar budaya', 2,
   'Mampu mendeskripsikan perasaan dan sudut pandang komunitas yang berbeda dari dirinya dalam berbagai situasi.'),

  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 1,
   'Memahami dampak pilihan manusia terhadap lingkungan sosial dan alam serta mulai memikirkan solusinya.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 2,
   'Berpartisipasi aktif dalam musyawarah kelompok untuk mengambil keputusan yang adil dan demokratis.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 3,
   'Mengidentifikasi cara merespons perbedaan budaya secara bijak, terbuka, dan penuh rasa hormat.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 4,
   'Menolak stereotip dan prasangka negatif terhadap kelompok budaya manapun secara tegas.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 5,
   'Memahami pentingnya kesetaraan dan keadilan dalam kehidupan bermasyarakat yang majemuk.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 6,
   'Memahami hak dan kewajiban dalam bermasyarakat dan mulai aktif melindungi hak orang lain.'),

  -- ── DIMENSI 3 ──────────────────────────────────────────────
  (3, 'kolaborasi', 1,
   'Mampu menyelaraskan tindakan dengan anggota kelompok untuk mencapai tujuan bersama secara efektif.'),
  (3, 'kolaborasi', 2,
   'Mampu memahami dan memanfaatkan informasi dari orang lain untuk meningkatkan kualitas kerja kelompok.'),
  (3, 'kolaborasi', 3,
   'Mendemonstrasikan kemampuan saling melengkapi kekurangan antar anggota dalam kerja kelompok.'),
  (3, 'kolaborasi', 4,
   'Mampu membagi peran secara adil dalam kelompok dan menjaga konsistensi kinerja hingga selesai.'),

  (3, 'kepedulian', 1,
   'Tanggap terhadap kebutuhan lingkungan sosial di sekitarnya dan mengambil tindakan yang sesuai.'),
  (3, 'kepedulian', 2,
   'Mampu memahami alasan di balik reaksi orang lain dan merespons dengan cara yang tepat.'),

  (3, 'berbagi', 1,
   'Aktif berbagi pengetahuan dan sumber daya kepada orang yang membutuhkan di lingkungan sekitar.'),

  -- ── DIMENSI 4 ──────────────────────────────────────────────
  (4, 'pemahaman diri dan situasi yang dihadapi', 1,
   'Mampu menilai kemampuan dan minat diri secara lebih realistis berdasarkan pengalaman belajar yang dialami.'),
  (4, 'pemahaman diri dan situasi yang dihadapi', 2,
   'Mampu memantau kemajuan belajar dan mulai memprediksi tantangan yang mungkin akan dihadapi ke depan.'),

  (4, 'regulasi diri', 1,
   'Memahami dampak emosi terhadap perilaku dan belajar menyusun strategi pengelolaan emosi yang sehat.'),
  (4, 'regulasi diri', 2,
   'Mampu merancang langkah-langkah sederhana untuk mencapai tujuan belajar yang telah ditetapkan sendiri.'),
  (4, 'regulasi diri', 3,
   'Mampu mengevaluasi efektivitas cara belajar mandiri dan mengidentifikasi faktor pendukung dan penghambat.'),
  (4, 'regulasi diri', 4,
   'Menunjukkan konsistensi dalam menyelesaikan tujuan yang sudah direncanakan hingga tercapai.'),
  (4, 'regulasi diri', 5,
   'Mampu memodifikasi rencana belajar ketika menghadapi hambatan dan melanjutkan dengan semangat yang baru.'),

  -- ── DIMENSI 5 ──────────────────────────────────────────────
  (5, 'memperoleh dan memproses informasi dan gagasan', 1,
   'Mampu mengajukan pertanyaan kritis untuk memahami informasi dari berbagai sumber secara akurat.'),
  (5, 'memperoleh dan memproses informasi dan gagasan', 2,
   'Mampu mengidentifikasi dan menganalisis informasi yang relevan dari berbagai sumber bacaan dan referensi.'),

  (5, 'menganalisis dan mengevaluasi penalaran dan prosedurnya', 1,
   'Mampu memberikan argumen yang logis dan terstruktur dalam mendukung pendapat atau keputusan.'),

  (5, 'refleksi pemikiran dan proses berpikir', 1,
   'Mulai memahami asumsi yang mendasari pemikirannya dan menyadari kemungkinan adanya bias dalam cara berpikir.'),

  -- ── DIMENSI 6 ──────────────────────────────────────────────
  (6, 'menghasilkan gagasan yang orisinal', 1,
   'Mampu menghubungkan berbagai informasi dari sumber yang beragam untuk menghasilkan gagasan baru yang imajinatif.'),

  (6, 'menghasilkan karya dan tindakan yang orisinal', 1,
   'Mampu mengeksplorasi berbagai medium ekspresi untuk menghasilkan karya yang mencerminkan pikiran dan perasaan.'),

  (6, 'memiliki keluwesan berpikir dalam mencari alternatif solusi permasalahan', 1,
   'Mampu mengajukan solusi alternatif dari berbagai sudut pandang untuk masalah yang dihadapi dalam belajar.')
)
INSERT INTO public.p5_sub_elemen (elemen_id, fase, deskripsi, urutan)
SELECT em.elemen_id, 'Fase C', sd.deskripsi, sd.urutan
FROM seed_data sd
JOIN elemen_map em
  ON em.dimensi_nomor = sd.dimensi_nomor
 AND em.elemen_nama   = sd.elemen_nama;


-- ============================================================
-- FASE D
-- ============================================================

WITH elemen_map AS (
  SELECT e.id AS elemen_id, d.nomor AS dimensi_nomor, e.nama AS elemen_nama
  FROM public.p5_elemen e
  JOIN public.p5_dimensi d ON e.dimensi_id = d.id
),
seed_data(dimensi_nomor, elemen_nama, urutan, deskripsi) AS (
  VALUES
  -- ── DIMENSI 1 ──────────────────────────────────────────────
  (1, 'akhlak beragama', 1,
   'Memahami kehadiran Tuhan dalam kehidupan sehari-hari dan mengaitkan sifat-sifat Tuhan dengan tanggung jawab manusia sebagai khalifah di bumi.'),
  (1, 'akhlak beragama', 2,
   'Memahami makna, fungsi, dan unsur-unsur utama agama dalam konteks Indonesia serta hubungannya dengan sesama manusia dan alam semesta.'),
  (1, 'akhlak beragama', 3,
   'Melaksanakan ibadah secara rutin dan mandiri serta aktif berpartisipasi dalam perayaan hari-hari besar keagamaan.'),

  (1, 'akhlak pribadi', 1,
   'Berani dan konsisten menyampaikan kebenaran meski menghadapi tekanan sosial serta memahami konsekuensinya bagi diri dan orang lain.'),
  (1, 'akhlak pribadi', 2,
   'Mengidentifikasi pentingnya keseimbangan kesehatan jasmani, mental, dan rohani dalam kehidupan sebagai remaja.'),

  (1, 'akhlak kepada manusia', 1,
   'Mengenal perspektif dan emosi dari sudut pandang orang atau kelompok yang berbeda serta mengutamakan persamaan dalam situasi konflik.'),
  (1, 'akhlak kepada manusia', 2,
   'Memahami perasaan dan sudut pandang orang lain yang belum pernah dikenal dan menunjukkan empati yang tulus.'),

  (1, 'akhlak kepada alam', 1,
   'Memahami konsep sebab akibat antara berbagai ciptaan Tuhan dan mengidentifikasi dampaknya yang baik atau buruk terhadap alam semesta.'),
  (1, 'akhlak kepada alam', 2,
   'Mewujudkan syukur dengan berinisiatif menyelesaikan masalah lingkungan sekitar dan mulai menerapkan solusinya secara nyata.'),

  (1, 'akhlak kepada negara', 1,
   'Menganalisis peran, hak, dan kewajiban sebagai warga negara muda serta memahami pentingnya mendahulukan kepentingan umum.'),

  -- ── DIMENSI 2 ──────────────────────────────────────────────
  (2, 'mengenal dan menghargai budaya', 1,
   'Memahami perubahan budaya seiring waktu dalam konteks lokal, regional, dan nasional serta menjelaskan identitas diri dari budaya bangsa.'),
  (2, 'mengenal dan menghargai budaya', 2,
   'Memahami dinamika budaya termasuk kepercayaan dan praktik keseharian dalam konteks personal dan sosial.'),
  (2, 'mengenal dan menghargai budaya', 3,
   'Memahami pentingnya melestarikan tradisi budaya dan mulai berupaya aktif melestarikannya dalam kehidupan sehari-hari.'),

  (2, 'komunikasi dan interaksi antar budaya', 1,
   'Mengeksplorasi pengaruh budaya terhadap penggunaan bahasa dan mengenali risiko yang muncul dalam komunikasi antarbudaya.'),
  (2, 'komunikasi dan interaksi antar budaya', 2,
   'Menjelaskan asumsi di balik perspektif tertentu dan memperkirakan perasaan komunitas yang berbeda dalam situasi yang sulit.'),

  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 1,
   'Mengidentifikasi masalah di sekitarnya sebagai akibat pilihan manusia serta dampaknya terhadap sistem ekonomi, sosial, dan lingkungan.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 2,
   'Berpartisipasi dalam menentukan kriteria dan metode pengambilan keputusan bersama melalui diskusi yang terbuka dan cermat.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 3,
   'Merefleksikan secara kritis gambaran berbagai kelompok budaya yang ditemui dan cara meresponsnya dengan bijak.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 4,
   'Mengkonfirmasi dan menunjukkan sikap menolak stereotip serta prasangka terhadap kelompok identitas manapun.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 5,
   'Mengidentifikasi dan menyampaikan isu-isu tentang penghargaan terhadap keragaman dan kesetaraan budaya.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 6,
   'Memahami konsep hak dan kewajiban serta implikasinya dan mulai aktif melindungi hak orang atau kelompok lain.'),

  -- ── DIMENSI 3 ──────────────────────────────────────────────
  (3, 'kolaborasi', 1,
   'Menyelaraskan tindakan sendiri dengan orang lain untuk mencapai tujuan kelompok dan memberi semangat kepada rekan.'),
  (3, 'kolaborasi', 2,
   'Memahami informasi, gagasan, dan keprihatinan yang diungkapkan orang lain menggunakan berbagai media secara efektif.'),
  (3, 'kolaborasi', 3,
   'Mendemonstrasikan kegiatan kelompok yang menunjukkan bahwa anggota dengan kelebihan dan kekurangan masing-masing dapat saling membantu.'),
  (3, 'kolaborasi', 4,
   'Membagi peran dan menyelaraskan tindakan dalam kelompok agar tujuan bersama dapat tercapai secara optimal.'),

  (3, 'kepedulian', 1,
   'Tanggap terhadap lingkungan sosial sesuai peran sosialnya dan berkontribusi sesuai kebutuhan masyarakat.'),
  (3, 'kepedulian', 2,
   'Menggunakan pemahaman tentang sebab dan alasan reaksi orang lain untuk menentukan tindakan yang tepat.'),

  (3, 'berbagi', 1,
   'Mengupayakan memberi hal yang dianggap berharga kepada masyarakat yang membutuhkan di sekitar tempat tinggal.'),

  -- ── DIMENSI 4 ──────────────────────────────────────────────
  (4, 'pemahaman diri dan situasi yang dihadapi', 1,
   'Membuat penilaian yang realistis terhadap kemampuan dan minat berdasarkan pengalaman belajar dan aktivitas lain.'),
  (4, 'pemahaman diri dan situasi yang dihadapi', 2,
   'Memonitor kemajuan belajar dan memprediksi tantangan pribadi dan akademik berdasarkan pengalaman sebelumnya.'),

  (4, 'regulasi diri', 1,
   'Memahami dan memprediksi konsekuensi emosi serta menyusun langkah pengelolaan emosi dalam belajar dan berinteraksi.'),
  (4, 'regulasi diri', 2,
   'Merancang strategi yang sesuai untuk mencapai tujuan belajar dengan mempertimbangkan kekuatan dan kelemahan diri.'),
  (4, 'regulasi diri', 3,
   'Mengkritisi efektivitas diri dalam bekerja mandiri dan mengidentifikasi faktor yang menunjang maupun menghambat.'),
  (4, 'regulasi diri', 4,
   'Berkomitmen menjaga konsistensi dalam mencapai tujuan belajar dan pengembangan diri yang diharapkan.'),
  (4, 'regulasi diri', 5,
   'Membuat rencana baru dengan memodifikasi strategi yang tidak berhasil dan menjalankan tugas dengan keyakinan yang baru.'),

  -- ── DIMENSI 5 ──────────────────────────────────────────────
  (5, 'memperoleh dan memproses informasi dan gagasan', 1,
   'Mengajukan pertanyaan untuk klarifikasi dan interpretasi informasi serta mencari penyebab dan konsekuensinya.'),
  (5, 'memperoleh dan memproses informasi dan gagasan', 2,
   'Mengidentifikasi, mengklarifikasi, dan menganalisis informasi yang relevan serta memprioritaskan beberapa gagasan tertentu.'),

  (5, 'menganalisis dan mengevaluasi penalaran dan prosedurnya', 1,
   'Menalar dengan berbagai argumen dalam mengambil simpulan atau keputusan yang logis dan bertanggung jawab.'),

  (5, 'refleksi pemikiran dan proses berpikir', 1,
   'Menjelaskan asumsi yang digunakan, menyadari kecenderungan bias dalam pemikiran, dan berupaya mempertimbangkan perspektif berbeda.'),

  -- ── DIMENSI 6 ──────────────────────────────────────────────
  (6, 'menghasilkan gagasan yang orisinal', 1,
   'Menghubungkan gagasan yang dimiliki dengan informasi baru untuk menghasilkan kombinasi gagasan yang imajinatif dan bermanfaat.'),

  (6, 'menghasilkan karya dan tindakan yang orisinal', 1,
   'Mengeksplorasi dan mengekspresikan pikiran dan perasaan dalam bentuk karya atau tindakan serta mengevaluasi dampaknya bagi orang lain.'),

  (6, 'memiliki keluwesan berpikir dalam mencari alternatif solusi permasalahan', 1,
   'Menghasilkan solusi alternatif dengan mengadaptasi berbagai gagasan dan umpan balik untuk menghadapi situasi dan permasalahan.')
)
INSERT INTO public.p5_sub_elemen (elemen_id, fase, deskripsi, urutan)
SELECT em.elemen_id, 'Fase D', sd.deskripsi, sd.urutan
FROM seed_data sd
JOIN elemen_map em
  ON em.dimensi_nomor = sd.dimensi_nomor
 AND em.elemen_nama   = sd.elemen_nama;


-- ============================================================
-- FASE F
-- ============================================================

WITH elemen_map AS (
  SELECT e.id AS elemen_id, d.nomor AS dimensi_nomor, e.nama AS elemen_nama
  FROM public.p5_elemen e
  JOIN public.p5_dimensi d ON e.dimensi_id = d.id
),
seed_data(dimensi_nomor, elemen_nama, urutan, deskripsi) AS (
  VALUES
  -- ── DIMENSI 1 ──────────────────────────────────────────────
  (1, 'akhlak beragama', 1,
   'Menganalisis dan menghayati kehadiran Tuhan dalam setiap aspek kehidupan serta merefleksikan tanggung jawab sebagai makhluk Tuhan yang berintegritas.'),
  (1, 'akhlak beragama', 2,
   'Menganalisis makna ajaran agama secara mendalam dan mengaplikasikannya secara konsisten dalam relasi sosial dan pelestarian alam semesta.'),
  (1, 'akhlak beragama', 3,
   'Melaksanakan ibadah sebagai kebutuhan pribadi yang mandiri dan konsisten serta menjadi teladan positif dalam komunitas.'),

  (1, 'akhlak pribadi', 1,
   'Secara konsisten menyampaikan kebenaran berdasarkan integritas dan mampu menganalisis konsekuensi jangka panjang bagi diri dan orang lain.'),
  (1, 'akhlak pribadi', 2,
   'Merancang gaya hidup sehat yang menyeimbangkan kesehatan jasmani, mental, dan rohani secara berkelanjutan.'),

  (1, 'akhlak kepada manusia', 1,
   'Menganalisis perspektif dan emosi dari sudut pandang berbagai kelompok sosial dan budaya serta menjadi mediator dalam situasi konflik.'),
  (1, 'akhlak kepada manusia', 2,
   'Mengembangkan empati yang mendalam terhadap berbagai kelompok yang tidak dikenal dan menerapkannya dalam tindakan nyata yang bermakna.'),

  (1, 'akhlak kepada alam', 1,
   'Menganalisis sistem sebab akibat kompleks antara tindakan manusia dan dampaknya terhadap ekosistem serta keberlanjutan alam.'),
  (1, 'akhlak kepada alam', 2,
   'Menjadi agen perubahan dalam penyelesaian masalah lingkungan dengan merancang dan menerapkan solusi inovatif berbasis nilai keimanan.'),

  (1, 'akhlak kepada negara', 1,
   'Menganalisis secara kritis peran, hak, dan kewajiban warga negara serta berkontribusi aktif dalam kehidupan bermasyarakat sebagai wujud keimanan.'),

  -- ── DIMENSI 2 ──────────────────────────────────────────────
  (2, 'mengenal dan menghargai budaya', 1,
   'Menganalisis perubahan budaya dalam konteks lokal, nasional, dan global serta merefleksikan identitas diri sebagai bagian dari peradaban bangsa.'),
  (2, 'mengenal dan menghargai budaya', 2,
   'Menganalisis dinamika budaya secara kritis termasuk kepercayaan dan praktik sosial dari berbagai perspektif yang beragam.'),
  (2, 'mengenal dan menghargai budaya', 3,
   'Menjadi pelopor pelestarian budaya bangsa dan menginspirasi orang-orang di sekitarnya untuk ikut menjaga warisan budaya.'),

  (2, 'komunikasi dan interaksi antar budaya', 1,
   'Menganalisis pengaruh mendalam budaya terhadap komunikasi dan merancang strategi komunikasi lintas budaya yang efektif.'),
  (2, 'komunikasi dan interaksi antar budaya', 2,
   'Menganalisis asumsi di balik berbagai perspektif dan mengembangkan kemampuan memediasi antarkomunitas yang berbeda secara konstruktif.'),

  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 1,
   'Menganalisis secara mendalam masalah sosial dan lingkungan akibat pilihan manusia serta merancang solusi yang berkeadilan dan berkelanjutan.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 2,
   'Memimpin proses pengambilan keputusan kolektif yang demokratis dan inklusif dalam berbagai konteks sosial.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 3,
   'Menganalisis dan merefleksikan secara kritis gambaran berbagai kelompok budaya serta membangun respons yang konstruktif.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 4,
   'Menjadi agen yang aktif menolak dan melawan stereotip serta prasangka di lingkungan sosial secara konsisten.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 5,
   'Memimpin diskusi tentang isu keragaman dan kesetaraan budaya serta menginspirasi tindakan positif yang berdampak nyata.'),
  (2, 'refleksi dan bertanggung jawab terhadap pengalaman kebinekaan', 6,
   'Menganalisis secara kritis hak dan kewajiban dalam berbagai konteks dan secara aktif membela hak kelompok yang rentan.'),

  -- ── DIMENSI 3 ──────────────────────────────────────────────
  (3, 'kolaborasi', 1,
   'Memimpin penyelarasan tindakan kelompok yang kompleks untuk mencapai tujuan bersama dan menginspirasi semangat kolektif.'),
  (3, 'kolaborasi', 2,
   'Mengintegrasikan informasi, gagasan, dan emosi dari berbagai sumber untuk membangun hubungan interpersonal yang berkualitas tinggi.'),
  (3, 'kolaborasi', 3,
   'Memfasilitasi dinamika kelompok yang inklusif sehingga setiap anggota dapat berkontribusi secara optimal sesuai potensinya.'),
  (3, 'kolaborasi', 4,
   'Merancang sistem pembagian peran yang efektif dalam kelompok dan memastikan sinergi yang kuat menuju tujuan bersama.'),

  (3, 'kepedulian', 1,
   'Mengambil inisiatif aktif dalam merespons kebutuhan lingkungan sosial yang kompleks dan memberikan kontribusi yang bermakna.'),
  (3, 'kepedulian', 2,
   'Menganalisis dinamika sosial secara mendalam untuk merancang pendekatan yang tepat dalam mempengaruhi respons komunitas.'),

  (3, 'berbagi', 1,
   'Merancang dan melaksanakan program berbagi yang sistematis dan berkelanjutan bagi masyarakat yang membutuhkan.'),

  -- ── DIMENSI 4 ──────────────────────────────────────────────
  (4, 'pemahaman diri dan situasi yang dihadapi', 1,
   'Menganalisis secara mendalam kemampuan, minat, dan nilai diri untuk merancang jalur pengembangan diri yang strategis dan bermakna.'),
  (4, 'pemahaman diri dan situasi yang dihadapi', 2,
   'Memonitor dan mengevaluasi kemajuan belajar secara komprehensif serta merancang strategi adaptif menghadapi tantangan yang kompleks.'),

  (4, 'regulasi diri', 1,
   'Menganalisis pola emosi dan dampaknya secara mendalam serta merancang sistem pengelolaan emosi yang efektif dan berkelanjutan.'),
  (4, 'regulasi diri', 2,
   'Merancang strategi pengembangan diri yang komprehensif berdasarkan analisis mendalam terhadap kekuatan, kelemahan, dan peluang yang ada.'),
  (4, 'regulasi diri', 3,
   'Mengevaluasi secara kritis efektivitas kerja mandiri dan mengembangkan sistem peningkatan diri yang berkelanjutan.'),
  (4, 'regulasi diri', 4,
   'Membangun komitmen yang kuat dan sistem akuntabilitas pribadi untuk mencapai tujuan jangka panjang secara konsisten.'),
  (4, 'regulasi diri', 5,
   'Merancang dan mengimplementasikan rencana adaptif yang inovatif ketika menghadapi kegagalan dengan kematangan dan keyakinan tinggi.'),

  -- ── DIMENSI 5 ──────────────────────────────────────────────
  (5, 'memperoleh dan memproses informasi dan gagasan', 1,
   'Mengajukan pertanyaan analitis dan kritis untuk menginterpretasi informasi kompleks serta mengeksplorasi implikasi dan konsekuensinya secara menyeluruh.'),
  (5, 'memperoleh dan memproses informasi dan gagasan', 2,
   'Menganalisis, mengklarifikasi, dan mengevaluasi informasi dari berbagai sumber secara kritis serta mensintesis gagasan-gagasan prioritas.'),

  (5, 'menganalisis dan mengevaluasi penalaran dan prosedurnya', 1,
   'Mengevaluasi berbagai argumen secara kritis dan membangun penalaran yang koheren dalam pengambilan keputusan yang kompleks.'),

  (5, 'refleksi pemikiran dan proses berpikir', 1,
   'Menganalisis asumsi-asumsi yang mendasari pemikiran, mengidentifikasi bias sistemik, dan secara aktif mengembangkan perspektif yang lebih komprehensif.'),

  -- ── DIMENSI 6 ──────────────────────────────────────────────
  (6, 'menghasilkan gagasan yang orisinal', 1,
   'Mensintesis pengetahuan dari berbagai bidang untuk menghasilkan gagasan inovatif yang bernilai tinggi dan berdampak luas bagi masyarakat.'),

  (6, 'menghasilkan karya dan tindakan yang orisinal', 1,
   'Merancang dan menghasilkan karya atau tindakan yang inovatif, mengevaluasi dampaknya bagi masyarakat luas, dan terus meningkatkan kualitasnya.'),

  (6, 'memiliki keluwesan berpikir dalam mencari alternatif solusi permasalahan', 1,
   'Merancang solusi inovatif yang komprehensif dengan mengintegrasikan berbagai perspektif dan umpan balik untuk menghadapi tantangan yang kompleks.')
)
INSERT INTO public.p5_sub_elemen (elemen_id, fase, deskripsi, urutan)
SELECT em.elemen_id, 'Fase F', sd.deskripsi, sd.urutan
FROM seed_data sd
JOIN elemen_map em
  ON em.dimensi_nomor = sd.dimensi_nomor
 AND em.elemen_nama   = sd.elemen_nama;


-- ============================================================
-- VERIFIKASI
-- ============================================================

DO $$
DECLARE
  v_fase_a INT; v_fase_b INT; v_fase_c INT;
  v_fase_d INT; v_fase_e INT; v_fase_f INT;
  v_total  INT;
BEGIN
  SELECT COUNT(*) INTO v_fase_a FROM public.p5_sub_elemen WHERE fase = 'Fase A';
  SELECT COUNT(*) INTO v_fase_b FROM public.p5_sub_elemen WHERE fase = 'Fase B';
  SELECT COUNT(*) INTO v_fase_c FROM public.p5_sub_elemen WHERE fase = 'Fase C';
  SELECT COUNT(*) INTO v_fase_d FROM public.p5_sub_elemen WHERE fase = 'Fase D';
  SELECT COUNT(*) INTO v_fase_e FROM public.p5_sub_elemen WHERE fase = 'Fase E';
  SELECT COUNT(*) INTO v_fase_f FROM public.p5_sub_elemen WHERE fase = 'Fase F';
  SELECT COUNT(*) INTO v_total  FROM public.p5_sub_elemen;

  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'SEED 2 — P5 SUB-ELEMEN VERIFIKASI';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'Fase A  : %  (expected 42)', v_fase_a;
  RAISE NOTICE 'Fase B  : %  (expected 42)', v_fase_b;
  RAISE NOTICE 'Fase C  : %  (expected 42)', v_fase_c;
  RAISE NOTICE 'Fase D  : %  (expected 42)', v_fase_d;
  RAISE NOTICE 'Fase E  : %  (expected 42)', v_fase_e;
  RAISE NOTICE 'Fase F  : %  (expected 42)', v_fase_f;
  RAISE NOTICE '────────────────────────────────────────────────';
  RAISE NOTICE 'TOTAL   : %  (expected 252)', v_total;
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;