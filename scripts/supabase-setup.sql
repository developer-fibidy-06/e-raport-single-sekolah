-- ============================================================
-- E-RAPORT PKBM — SETUP (File 1 dari 2)
-- ============================================================
-- Versi  : 2.4 (v2.3 + tanggal cetak per paket)
-- Urutan : drop-table.sql → setup.sql → seed.sql
--
-- ────────────────────────────────────────────────────────────
-- CHANGELOG v2.3 → v2.4:
-- ────────────────────────────────────────────────────────────
--   F. tanggal_cetak_paket : NEW TABLE — tanggal cetak rapor
--                            per paket (A/B/C) per tahun pelajaran.
--                            Replaces tahun_pelajaran.tanggal_cetak
--                            (sekarang DEPRECATED).
--                            Real-world: PKBM cetak rapor Paket A
--                            di bulan beda dari Paket B/C.
--                            UNIQUE (tahun_pelajaran_id, paket).
--                            CHECK paket IN ('Paket A','B','C').
--                            ON DELETE CASCADE dari tahun_pelajaran.
--   G. tahun_pelajaran.tanggal_cetak : DEPRECATED — column dibiarkan
--                            untuk backward compat, tidak dipake app.
--                            Drop manual setelah 1 semester stable.
--
-- ────────────────────────────────────────────────────────────
-- CHANGELOG v2.2 → v2.3 (kept):
-- ────────────────────────────────────────────────────────────
--   D. mata_pelajaran   : partial unique index (LOWER(TRIM(nama)),
--                         paket, COALESCE(fase), COALESCE(agama))
--   E. nilai_mapel.mata_pelajaran_id FK : ON DELETE CASCADE
--
-- ────────────────────────────────────────────────────────────
-- CHANGELOG v2.1 → v2.2 (kept):
-- ────────────────────────────────────────────────────────────
--   A. user_profiles    : full_name NOT NULL, ADD phone, is_active,
--                         role 2-tier (super_admin, user)
--   B. rombongan_belajar: trigger enforce_paralel_consistency
--   C. ekstrakurikuler  : UNIQUE (enrollment_id, nama_ekskul)
--
-- KEEP from v2.1:
--   • predikat_global: predikat as PK
--   • mata_pelajaran: kelompok ('umum','peminatan_ips','khusus','muatan_lokal')
--   • mata_pelajaran: NO `kode` column
--   • nilai_mapel: NO `kompetensi_dasar_id` column
--   • peserta_didik.agama NOT NULL
--   • satuan_pendidikan.kota TEXT
--   • RPC: derive_predikat, get_capaian_kompetensi, get_my_role,
--          format_kelas_label, format_semester_label
-- ============================================================


-- ============================================================
-- SECTION 0 — PREREQUISITES (idempotent)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 0.1 user_profiles (v2.2 schema) ────────────────────────
CREATE TABLE public.user_profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'user'
                          CHECK (role IN ('super_admin', 'user')),
  phone       TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS
  'Extends auth.users dengan role + flag aktif. '
  'Role: super_admin (full write master data), user (input nilai). '
  'is_active=FALSE → user gak bisa login (auth-store filter).';

CREATE INDEX idx_user_profiles_active ON public.user_profiles(is_active);
CREATE INDEX idx_user_profiles_role   ON public.user_profiles(role);


-- ─── 0.2 handle_updated_at trigger function ─────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


-- ─── 0.3 get_my_role helper (untuk RLS) ─────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;


-- ─── 0.4 Trigger updated_at untuk user_profiles ─────────────
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- SECTION 1 — CREATE TABLES
-- ============================================================

-- ─── 1.1 satuan_pendidikan ──────────────────────────────────
CREATE TABLE public.satuan_pendidikan (
  id          SERIAL      PRIMARY KEY,
  nama        TEXT        NOT NULL,
  npsn        TEXT        UNIQUE,
  alamat      TEXT,
  kelurahan   TEXT,
  kecamatan   TEXT,
  kabupaten   TEXT,
  provinsi    TEXT,
  kode_pos    TEXT,
  telepon     TEXT,
  email       TEXT,
  website     TEXT,
  kota        TEXT,
  kepala_pkbm TEXT,
  nip_kepala  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.satuan_pendidikan.kota IS
  'Kota tempat rapor diterbitkan, dipake di TTD: "{kota}, {tanggal}". '
  'Sample: "Madiun". Kalau NULL, app fallback ke kabupaten.';


-- ─── 1.2 tahun_pelajaran ────────────────────────────────────
-- v2.4: tanggal_cetak DEPRECATED — dipindah ke tabel tanggal_cetak_paket.
--       Field ini dibiarkan ada untuk backward compat (rollback safety).
--       Drop manual setelah app stable minimal 1 semester:
--         ALTER TABLE tahun_pelajaran DROP COLUMN tanggal_cetak;
CREATE TABLE public.tahun_pelajaran (
  id              SERIAL      PRIMARY KEY,
  nama            TEXT        NOT NULL,
  semester        SMALLINT    NOT NULL CHECK (semester IN (1, 2)),
  is_aktif        BOOLEAN     NOT NULL DEFAULT FALSE,
  tanggal_cetak   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nama, semester)
);
CREATE INDEX idx_tp_aktif ON public.tahun_pelajaran(is_aktif);

COMMENT ON COLUMN public.tahun_pelajaran.tanggal_cetak IS
  '⚠️ DEPRECATED v2.4: Dipindah ke tabel tanggal_cetak_paket. '
  'Field ini gak dipake lagi di app, tapi dibiarkan buat backward compat. '
  'Drop manual setelah stable: ALTER TABLE tahun_pelajaran DROP COLUMN tanggal_cetak;';


-- ─── 1.2.1 tanggal_cetak_paket (v2.4) ───────────────────────
-- Tabel baru: tanggal cetak rapor per paket per tahun pelajaran.
--
-- Real-world need: PKBM Al Barakah cetak rapor Paket A bulan kemarin,
-- Paket B bulan ini, Paket C bulan depan. Schema lama maksa 1 tanggal
-- global per (TP, semester) — tidak fit dengan reality.
--
-- Constraints:
--   - UNIQUE (tahun_pelajaran_id, paket): max 1 row per kombinasi
--   - CHECK paket IN ('Paket A','B','C'): cuma 3 paket valid
--   - tanggal_cetak NOT NULL: kalau row ada, tanggal harus ada
--   - ON DELETE CASCADE: kalau TP dihapus, tanggal cetak ikut hapus
--
-- Behavior di app:
--   - Row ada → rapor bisa di-cetak dengan tanggal di TTD
--   - Row gak ada → app TOLAK CETAK (no silent fallback ke NOW())
--   - Validasi di useRaporFullData throw error eksplisit
-- ============================================================
CREATE TABLE public.tanggal_cetak_paket (
  id                  SERIAL      PRIMARY KEY,
  tahun_pelajaran_id  INT         NOT NULL
                                  REFERENCES public.tahun_pelajaran(id)
                                  ON DELETE CASCADE,
  paket               TEXT        NOT NULL
                                  CHECK (paket IN ('Paket A', 'Paket B', 'Paket C')),
  tanggal_cetak       DATE        NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tahun_pelajaran_id, paket)
);

CREATE INDEX idx_tcp_tp_paket
  ON public.tanggal_cetak_paket(tahun_pelajaran_id, paket);

COMMENT ON TABLE public.tanggal_cetak_paket IS
  'v2.4: Tanggal cetak rapor per paket per tahun pelajaran. '
  'Real-world: PKBM bisa cetak rapor Paket A/B/C di tanggal beda. '
  'Dipake di TTD rapor: "{kota}, {tanggal_cetak}". '
  'Kalau row gak ada untuk paket tertentu → app tolak cetak rapor '
  '(lihat hook useRaporFullData → throw error eksplisit).';

COMMENT ON COLUMN public.tanggal_cetak_paket.paket IS
  'Cocok dengan rombongan_belajar.paket. CHECK constraint enforce '
  'cuma 3 nilai valid (Paket A/B/C). Kalau ke depan ada Paket D, '
  'update CHECK + form di tab Tahun & Semester.';


-- ─── 1.3 rombongan_belajar ──────────────────────────────────
CREATE TABLE public.rombongan_belajar (
  id                 SERIAL      PRIMARY KEY,
  tahun_pelajaran_id INT         NOT NULL REFERENCES public.tahun_pelajaran(id) ON DELETE RESTRICT,
  nama_kelas         TEXT        NOT NULL,
  tingkat            SMALLINT    NOT NULL CHECK (tingkat BETWEEN 1 AND 12),
  kelas_paralel      TEXT        NOT NULL DEFAULT 'Tidak ada'
                                 CHECK (kelas_paralel = 'Tidak ada' OR kelas_paralel ~ '^[A-F]$'),
  paket              TEXT        NOT NULL CHECK (paket IN ('Paket A','Paket B','Paket C')),
  fase               TEXT        NOT NULL CHECK (fase IN ('Fase A','Fase B','Fase C','Fase D','Fase E','Fase F')),
  wali_kelas         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tahun_pelajaran_id, tingkat, kelas_paralel)
);
CREATE INDEX idx_rb_tp    ON public.rombongan_belajar(tahun_pelajaran_id);
CREATE INDEX idx_rb_paket ON public.rombongan_belajar(paket);


-- ─── 1.4 peserta_didik ──────────────────────────────────────
CREATE TABLE public.peserta_didik (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nisn            TEXT        UNIQUE,
  nis             TEXT,
  nama_lengkap    TEXT        NOT NULL,
  jenis_kelamin   TEXT        NOT NULL CHECK (jenis_kelamin IN ('L','P')),
  tempat_lahir    TEXT,
  tanggal_lahir   DATE,
  agama           TEXT        NOT NULL CHECK (agama IN ('Islam','Kristen','Katolik','Hindu','Buddha','Konghucu')),
  alamat          TEXT,
  rt              TEXT,
  rw              TEXT,
  kelurahan       TEXT,
  kecamatan       TEXT,
  kabupaten       TEXT,
  provinsi        TEXT,
  nama_ayah       TEXT,
  nama_ibu        TEXT,
  pekerjaan_ayah  TEXT,
  pekerjaan_ibu   TEXT,
  no_telp_ortu    TEXT,
  is_aktif        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pd_nama  ON public.peserta_didik(nama_lengkap);
CREATE INDEX idx_pd_agama ON public.peserta_didik(agama);


-- ─── 1.5 enrollment ─────────────────────────────────────────
CREATE TABLE public.enrollment (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  peserta_didik_id      UUID        NOT NULL REFERENCES public.peserta_didik(id) ON DELETE RESTRICT,
  rombongan_belajar_id  INT         NOT NULL REFERENCES public.rombongan_belajar(id) ON DELETE RESTRICT,
  tahun_pelajaran_id    INT         NOT NULL REFERENCES public.tahun_pelajaran(id) ON DELETE RESTRICT,
  status                TEXT        NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','lulus','keluar','pindah')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (peserta_didik_id, tahun_pelajaran_id)
);
CREATE INDEX idx_enr_pd ON public.enrollment(peserta_didik_id);
CREATE INDEX idx_enr_rb ON public.enrollment(rombongan_belajar_id);
CREATE INDEX idx_enr_tp ON public.enrollment(tahun_pelajaran_id);


-- ─── 1.6 mata_pelajaran ─────────────────────────────────────
CREATE TABLE public.mata_pelajaran (
  id          SERIAL      PRIMARY KEY,
  nama        TEXT        NOT NULL,
  paket       TEXT        NOT NULL CHECK (paket IN ('Paket A','Paket B','Paket C','Semua')),
  fase        TEXT,
  kelompok    TEXT        NOT NULL DEFAULT 'umum'
                          CHECK (kelompok IN ('umum','peminatan_ips','khusus','muatan_lokal')),
  agama       TEXT        CHECK (agama IS NULL OR agama IN ('Islam','Kristen','Katolik','Hindu','Buddha','Konghucu')),
  urutan      SMALLINT    NOT NULL DEFAULT 99,
  is_aktif    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mapel_paket    ON public.mata_pelajaran(paket, is_aktif);
CREATE INDEX idx_mapel_kelompok ON public.mata_pelajaran(kelompok, paket, urutan);
CREATE INDEX idx_mapel_agama    ON public.mata_pelajaran(agama) WHERE agama IS NOT NULL;

-- ─── 1.6.1 UNIQUE INDEX mata_pelajaran (v2.3) ───────────────
CREATE UNIQUE INDEX mata_pelajaran_unique_nama_paket_fase_agama
ON public.mata_pelajaran (
  LOWER(TRIM(nama)),
  paket,
  COALESCE(fase, '__NULL__'),
  COALESCE(agama, '__NULL__')
);

COMMENT ON INDEX public.mata_pelajaran_unique_nama_paket_fase_agama IS
  'v2.3: Cegah duplikat mapel via (LOWER(TRIM(nama)), paket, '
  'COALESCE(fase), COALESCE(agama)). Case-insensitive + NULL-aware.';


-- ─── 1.7 predikat_global ────────────────────────────────────
CREATE TABLE public.predikat_global (
  predikat    TEXT        PRIMARY KEY CHECK (predikat IN ('A','B','C','D')),
  nilai_min   SMALLINT    NOT NULL,
  nilai_max   SMALLINT    NOT NULL,
  CHECK (nilai_min <= nilai_max)
);


-- ─── 1.8 kompetensi_dasar (orphan reference) ────────────────
CREATE TABLE public.kompetensi_dasar (
  id                SERIAL      PRIMARY KEY,
  mata_pelajaran_id INT         NOT NULL REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  nama_kompetensi   TEXT        NOT NULL,
  urutan            SMALLINT    NOT NULL DEFAULT 99,
  deskripsi_a       TEXT        NOT NULL DEFAULT '',
  deskripsi_b       TEXT        NOT NULL DEFAULT '',
  deskripsi_c       TEXT        NOT NULL DEFAULT '',
  deskripsi_d       TEXT        NOT NULL DEFAULT '',
  is_aktif          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_kd_mapel ON public.kompetensi_dasar(mata_pelajaran_id);


-- ─── 1.9 nilai_mapel ────────────────────────────────────────
CREATE TABLE public.nilai_mapel (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id         UUID        NOT NULL REFERENCES public.enrollment(id) ON DELETE CASCADE,
  mata_pelajaran_id     INT         NOT NULL REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  nilai_akhir           SMALLINT    CHECK (nilai_akhir BETWEEN 0 AND 100),
  predikat              TEXT        CHECK (predikat IN ('A','B','C','D')),
  capaian_kompetensi    TEXT,
  input_by              UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, mata_pelajaran_id)
);
CREATE INDEX idx_nm_enrollment ON public.nilai_mapel(enrollment_id);
CREATE INDEX idx_nm_mapel      ON public.nilai_mapel(mata_pelajaran_id);


-- ─── 1.10 p5_dimensi ────────────────────────────────────────
CREATE TABLE public.p5_dimensi (
  id          SERIAL      PRIMARY KEY,
  nomor       SMALLINT    NOT NULL UNIQUE,
  nama        TEXT        NOT NULL,
  urutan      SMALLINT    NOT NULL DEFAULT 99,
  is_aktif    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 1.11 p5_elemen ─────────────────────────────────────────
CREATE TABLE public.p5_elemen (
  id          SERIAL      PRIMARY KEY,
  dimensi_id  INT         NOT NULL REFERENCES public.p5_dimensi(id) ON DELETE CASCADE,
  nama        TEXT        NOT NULL,
  urutan      SMALLINT    NOT NULL DEFAULT 99,
  is_aktif    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dimensi_id, nama)
);
CREATE INDEX idx_p5_elemen_dimensi ON public.p5_elemen(dimensi_id, urutan);


-- ─── 1.12 p5_sub_elemen ─────────────────────────────────────
CREATE TABLE public.p5_sub_elemen (
  id          SERIAL      PRIMARY KEY,
  elemen_id   INT         NOT NULL REFERENCES public.p5_elemen(id) ON DELETE CASCADE,
  fase        TEXT        NOT NULL CHECK (fase IN ('Fase A','Fase B','Fase C','Fase D','Fase E','Fase F')),
  deskripsi   TEXT        NOT NULL,
  urutan      SMALLINT    NOT NULL DEFAULT 99,
  is_aktif    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_p5_sub_elemen_elemen ON public.p5_sub_elemen(elemen_id, fase, urutan);


-- ─── 1.13 penilaian_p5 ──────────────────────────────────────
CREATE TABLE public.penilaian_p5 (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID        NOT NULL REFERENCES public.enrollment(id) ON DELETE CASCADE,
  sub_elemen_id   INT         NOT NULL REFERENCES public.p5_sub_elemen(id) ON DELETE CASCADE,
  predikat        TEXT        CHECK (predikat IN ('MB','SB','BSH','SAB')),
  input_by        UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, sub_elemen_id)
);
CREATE INDEX idx_penilaian_p5_enrollment ON public.penilaian_p5(enrollment_id);


-- ─── 1.14 catatan_p5 ────────────────────────────────────────
CREATE TABLE public.catatan_p5 (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID        NOT NULL REFERENCES public.enrollment(id) ON DELETE CASCADE,
  catatan         TEXT,
  input_by        UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id)
);


-- ─── 1.15 ekskul_preset ─────────────────────────────────────
CREATE TABLE public.ekskul_preset (
  id          SERIAL      PRIMARY KEY,
  nama_ekskul TEXT        NOT NULL,
  gender      TEXT        NOT NULL CHECK (gender IN ('L','P','SEMUA')),
  is_aktif    BOOLEAN     NOT NULL DEFAULT TRUE,
  urutan      SMALLINT    NOT NULL DEFAULT 99,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nama_ekskul, gender)
);
CREATE INDEX idx_ekskul_preset_aktif ON public.ekskul_preset(is_aktif, gender);


-- ─── 1.16 ekstrakurikuler ───────────────────────────────────
CREATE TABLE public.ekstrakurikuler (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID        NOT NULL REFERENCES public.enrollment(id) ON DELETE CASCADE,
  nama_ekskul     TEXT        NOT NULL,
  predikat        TEXT        CHECK (predikat IN ('A','B','C','D')),
  keterangan      TEXT,
  input_by        UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, nama_ekskul)
);
CREATE INDEX idx_ekskul_enrollment ON public.ekstrakurikuler(enrollment_id);


-- ─── 1.17 ketidakhadiran ────────────────────────────────────
CREATE TABLE public.ketidakhadiran (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID        NOT NULL REFERENCES public.enrollment(id) ON DELETE CASCADE,
  sakit           SMALLINT    NOT NULL DEFAULT 0,
  izin            SMALLINT    NOT NULL DEFAULT 0,
  alpha           SMALLINT    NOT NULL DEFAULT 0,
  input_by        UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id)
);


-- ─── 1.18 catatan_wali_kelas ────────────────────────────────
CREATE TABLE public.catatan_wali_kelas (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID        NOT NULL REFERENCES public.enrollment(id) ON DELETE CASCADE,
  catatan         TEXT,
  tanggapan_ortu  TEXT,
  input_by        UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id)
);


-- ─── 1.19 rapor_header ──────────────────────────────────────
CREATE TABLE public.rapor_header (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID        NOT NULL REFERENCES public.enrollment(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at    TIMESTAMPTZ,
  published_by    UUID        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id)
);
CREATE INDEX idx_rapor_status ON public.rapor_header(status);


-- ============================================================
-- SECTION 2 — TRIGGERS updated_at
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  tbl_list TEXT[] := ARRAY[
    'satuan_pendidikan', 'tahun_pelajaran', 'tanggal_cetak_paket',
    'rombongan_belajar', 'peserta_didik', 'enrollment',
    'mata_pelajaran', 'kompetensi_dasar', 'nilai_mapel',
    'p5_dimensi', 'p5_elemen', 'p5_sub_elemen',
    'penilaian_p5', 'catatan_p5', 'ekskul_preset', 'ekstrakurikuler',
    'ketidakhadiran', 'catatan_wali_kelas', 'rapor_header'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbl_list LOOP
    EXECUTE format('
      CREATE TRIGGER trg_%s_updated_at
      BEFORE UPDATE ON public.%s
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()
    ', tbl, tbl);
  END LOOP;
END $$;


-- ============================================================
-- SECTION 2.5 — TRIGGER ANTI-MIXING PARALEL (v2.2 fix)
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_paralel_consistency()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kelas_paralel = 'Tidak ada' THEN
    IF EXISTS (
      SELECT 1 FROM public.rombongan_belajar
      WHERE tahun_pelajaran_id = NEW.tahun_pelajaran_id
        AND tingkat = NEW.tingkat
        AND kelas_paralel <> 'Tidak ada'
        AND id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION USING
        MESSAGE = format(
          'Tingkat %s di tahun pelajaran ini sudah punya kelas paralel A-F. "Tidak ada" tidak bisa coexist dengan paralel.',
          NEW.tingkat
        ),
        ERRCODE = '23P01';
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM public.rombongan_belajar
      WHERE tahun_pelajaran_id = NEW.tahun_pelajaran_id
        AND tingkat = NEW.tingkat
        AND kelas_paralel = 'Tidak ada'
        AND id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION USING
        MESSAGE = format(
          'Tingkat %s di tahun pelajaran ini sudah punya kelas single ("Tidak ada"). Paralel A-F tidak bisa coexist dengan single.',
          NEW.tingkat
        ),
        ERRCODE = '23P01';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rb_enforce_paralel
  BEFORE INSERT OR UPDATE OF kelas_paralel, tingkat, tahun_pelajaran_id
  ON public.rombongan_belajar
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_paralel_consistency();


-- ============================================================
-- SECTION 3 — ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.satuan_pendidikan     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_pelajaran       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tanggal_cetak_paket   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rombongan_belajar     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta_didik         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mata_pelajaran        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predikat_global       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kompetensi_dasar      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai_mapel           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p5_dimensi            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p5_elemen             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p5_sub_elemen         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penilaian_p5          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_p5            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekskul_preset         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekstrakurikuler       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ketidakhadiran        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_wali_kelas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapor_header          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles         ENABLE ROW LEVEL SECURITY;

-- USER PROFILES — own row + super_admin
CREATE POLICY "user_read_own"   ON public.user_profiles FOR SELECT
  USING (auth.uid() = id OR public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write_users" ON public.user_profiles FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- READ: semua authenticated
CREATE POLICY "read_all_authenticated" ON public.satuan_pendidikan    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.tahun_pelajaran      FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.tanggal_cetak_paket  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.rombongan_belajar    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.peserta_didik        FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.enrollment           FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.mata_pelajaran       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.predikat_global      FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.kompetensi_dasar     FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.nilai_mapel          FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.p5_dimensi           FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.p5_elemen            FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.p5_sub_elemen        FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.penilaian_p5         FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.catatan_p5           FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.ekskul_preset        FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.ekstrakurikuler      FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.ketidakhadiran       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.catatan_wali_kelas   FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "read_all_authenticated" ON public.rapor_header         FOR SELECT USING (auth.uid() IS NOT NULL);

-- WRITE MASTER DATA: hanya super_admin
CREATE POLICY "admin_write" ON public.satuan_pendidikan      FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.tahun_pelajaran        FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.tanggal_cetak_paket    FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.rombongan_belajar      FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.peserta_didik          FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.enrollment             FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.mata_pelajaran         FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.predikat_global        FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.kompetensi_dasar       FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.p5_dimensi             FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.p5_elemen              FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.p5_sub_elemen          FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "admin_write" ON public.ekskul_preset          FOR ALL USING (public.get_my_role() = 'super_admin');

-- WRITE PENILAIAN: semua authenticated user (super_admin + user)
CREATE POLICY "user_write" ON public.nilai_mapel          FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "user_write" ON public.penilaian_p5         FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "user_write" ON public.catatan_p5           FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "user_write" ON public.ekstrakurikuler      FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "user_write" ON public.ketidakhadiran       FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "user_write" ON public.catatan_wali_kelas   FOR ALL USING (auth.uid() IS NOT NULL);

-- RAPOR
CREATE POLICY "user_draft"    ON public.rapor_header FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND status = 'draft');
CREATE POLICY "user_update"   ON public.rapor_header FOR UPDATE
  USING      (auth.uid() IS NOT NULL AND status = 'draft')
  WITH CHECK (auth.uid() IS NOT NULL AND status = 'draft');
CREATE POLICY "admin_publish" ON public.rapor_header FOR UPDATE
  USING (public.get_my_role() = 'super_admin');


-- ============================================================
-- SECTION 4 — GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ============================================================
-- SECTION 5 — RPC FUNCTIONS
-- ============================================================

-- ─── 5.1 derive_predikat ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.derive_predikat(p_nilai INT)
RETURNS TEXT AS $$
  SELECT predikat
  FROM public.predikat_global
  WHERE p_nilai BETWEEN nilai_min AND nilai_max
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- ─── 5.2 get_capaian_kompetensi ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_capaian_kompetensi(
  p_kd_id   INT,
  p_nilai   INT
)
RETURNS TEXT AS $$
DECLARE
  v_predikat  TEXT;
  v_deskripsi TEXT;
BEGIN
  v_predikat := public.derive_predikat(p_nilai);

  SELECT
    CASE v_predikat
      WHEN 'A' THEN deskripsi_a
      WHEN 'B' THEN deskripsi_b
      WHEN 'C' THEN deskripsi_c
      WHEN 'D' THEN deskripsi_d
    END
  INTO v_deskripsi
  FROM public.kompetensi_dasar
  WHERE id = p_kd_id;

  RETURN COALESCE(v_deskripsi, '');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;


-- ─── 5.3 format_kelas_label ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.format_kelas_label(
  p_tingkat INT,
  p_paralel TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_roman TEXT;
BEGIN
  v_roman := CASE p_tingkat
    WHEN 1  THEN 'I'
    WHEN 2  THEN 'II'
    WHEN 3  THEN 'III'
    WHEN 4  THEN 'IV'
    WHEN 5  THEN 'V'
    WHEN 6  THEN 'VI'
    WHEN 7  THEN 'VII'
    WHEN 8  THEN 'VIII'
    WHEN 9  THEN 'IX'
    WHEN 10 THEN 'X'
    WHEN 11 THEN 'XI'
    WHEN 12 THEN 'XII'
    ELSE p_tingkat::TEXT
  END;

  IF p_paralel IS NULL OR p_paralel = 'Tidak ada' THEN
    RETURN v_roman;
  ELSE
    RETURN v_roman || ' ' || p_paralel;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;


-- ─── 5.4 format_semester_label ──────────────────────────────
CREATE OR REPLACE FUNCTION public.format_semester_label(
  p_semester INT
)
RETURNS TEXT AS $$
  SELECT CASE p_semester
    WHEN 1 THEN '1 (Ganjil)'
    WHEN 2 THEN '2 (Genap)'
    ELSE p_semester::TEXT
  END;
$$ LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public;


-- ============================================================
-- DONE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'SETUP v2.4 selesai. Schema, RLS, RPC siap.';
  RAISE NOTICE '';
  RAISE NOTICE 'CHANGES v2.3 → v2.4:';
  RAISE NOTICE '  ✓ tanggal_cetak_paket: NEW table (per paket per TP)';
  RAISE NOTICE '  ✓ tahun_pelajaran.tanggal_cetak: DEPRECATED (kept for compat)';
  RAISE NOTICE '';
  RAISE NOTICE 'CHANGES v2.2 → v2.3 (kept):';
  RAISE NOTICE '  ✓ mata_pelajaran: unique index (nama, paket, fase, agama)';
  RAISE NOTICE '  ✓ nilai_mapel.mata_pelajaran_id: ON DELETE CASCADE';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT:';
  RAISE NOTICE '  1. Run seed.sql untuk isi master data';
  RAISE NOTICE '  2. Manual create admin profile (lihat komentar drop-table.sql)';
  RAISE NOTICE '  3. Set tanggal cetak per paket via tab Tahun & Semester';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;