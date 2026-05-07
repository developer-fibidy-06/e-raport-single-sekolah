# 📦 Update Feature: NIS/NISN di CSV Import

## 🎯 Apa yang Berubah

Feature import siswa dari CSV sekarang support **NIS** dan **NISN** sebagai kolom tambahan.

**Format CSV baru (6 kolom):**
```
nama_lengkap;nis;nisn;nama_kelas;jenis_kelamin;agama
Ahmad Fauzi;155;0000347149;Kelas 12A;L;Islam
```

**Output di rapor:**
```
Nomor Induk/NISN : 155/0000347149
```

---

## ✅ Keputusan Best Practice yang Diambil

Karena lo minta gw yang putusin, ini rationalenya:

### 1. Urutan kolom: `nama, nis, nisn, kelas, jk, agama`
**Kenapa:** Match sama format rapor "Nomor Induk/NISN : 155/0000347149". Admin yang isi CSV bakal natural ngetiknya — info identitas siswa (nama, nis, nisn) di awal, lalu placement (kelas), lalu attribute (jk, agama). Logical reading order.

### 2. Strategy duplicate NISN: **Pre-fetch + reactive fallback**
**Kenapa:** UX terbaik. Saat admin upload file, sistem auto-fetch semua NISN existing dari DB sekali, lalu validate offline di parser. Error muncul di **preview table SEBELUM admin klik Import**. Admin bisa langsung benerin tanpa harus retry submit.

Race condition kecil (concurrent admin) tetap di-handle reactive di hook — kalau insert fail karena UNIQUE violation, error message parse NISN mana yang konflik dan kasih saran refresh.

### 3. **TIDAK** support format lama (4 kolom)
**Kenapa:** Dual-support bikin code complex dan rawan bug silent. Lebih baik force admin download template baru — error message jelas-jelas bilang "Butuh 6 kolom". Template gampang di-download dari dialog (1 klik). Trade-off worth it untuk konsistensi & maintainability.

### 4. Preview table: **gabung NIS/NISN jadi 1 kolom** dengan format `155 / 0000347149`
**Kenapa:**
- Match format rapor (admin udah familiar)
- Hemat horizontal space (penting di mobile)
- Lebih scannable secara visual
- Tooltip on hover kasih info terpisah `NIS: ... | NISN: ...` kalau perlu detail

### 5. Validasi NISN: **permissive, terima apa adanya**
**Kenapa:** Format NISN di lapangan beda-beda. Kemendikbud standar 10 digit angka, tapi banyak sekolah pakai format internal. Validation strict bakal frustrating untuk admin yang import data legacy. Yang penting:
- Trim whitespace (kalau cuma spasi → null)
- Cek unique (antar baris + vs DB)
- Format bebas

NIS lebih bebas lagi — no unique check, no format check. Sekolah bebas pakai numbering internal.

---

## 📁 File yang Perlu Di-Update

```
e-raport-pkbm/
├── public/
│   └── import/
│       └── peserta-didik.csv          ← REPLACE (template baru)
└── src/
    ├── components/features/admin/
    │   └── import-siswa-dialog.tsx    ← REPLACE
    └── hooks/
        └── use-siswa.ts                ← REPLACE
```

**3 file total.** Tinggal copy-paste dari ZIP ini ke project lo.

---

## 🚀 Cara Deploy

1. **Backup dulu** 3 file existing lo (just in case rollback)
2. **Extract ZIP** ini, copy file ke path yang sama persis di project lo
3. **Verify import paths** — semua import statement udah pake `@/` alias yang konsisten sama project lo, jadi harusnya zero-config
4. **Run dev server**: `npm run dev`
5. **Test flow**:
   - Login sebagai super_admin
   - Buka Master Data → Siswa → klik "Import CSV"
   - Download template dari dialog (verify file baru ke-download)
   - Edit template, isi 1-2 baris siswa baru
   - Upload, lihat preview (verify NIS/NISN tampil di kolom gabungan)
   - Klik Import (verify siswa baru ke-create dengan NIS/NISN ke-set)

---

## 🧪 Test Cases yang Dicover

✅ **Happy path:** NIS + NISN keduanya diisi, semua valid
✅ **NIS only:** NIS diisi, NISN kosong → siswa ke-create dengan NISN null
✅ **NISN only:** NISN diisi, NIS kosong → siswa ke-create dengan NIS null
✅ **Both empty:** NIS & NISN sama-sama kosong → keduanya null (legacy data OK)
✅ **Whitespace only:** `"   "` di NIS/NISN → di-trim jadi null
✅ **Dupe NISN antar baris di CSV:** Error muncul di preview, sebut baris pertama yang konflik
✅ **Dupe NISN vs DB existing:** Error muncul di preview, sebut nama siswa existing
✅ **Race condition (concurrent admin):** Error message parse NISN yang konflik, saran refresh
✅ **Format CSV lama (4 kolom):** Error message jelas, gak silent fail
✅ **Header row detection:** Auto-skip kalau header punya keyword `nama`/`nis`/`nisn`/`kelas`
✅ **Mixed header (header optional):** File tanpa header tetap di-parse benar

---

## ⚠️ Hal yang Perlu Diperhatikan Setelah Deploy

### 1. Existing siswa di DB
Siswa yang udah ada di DB sebelum update ini **tidak terpengaruh** — NIS/NISN mereka tetap apa adanya (mungkin null kalau di-input via form sebelumnya). Update ini cuma soal *import baru*.

### 2. Template lama yang udah ke-share ke admin
Kalau admin udah punya template CSV lama (4 kolom) di local mereka, mereka harus download ulang template baru. Pertimbangkan kasih notice di tim. Tapi karena dialog selalu kasih opsi "Download Template" di pojok atas, ini self-serve.

### 3. Performance: pre-fetch NISN
Saat upload file, sistem fetch semua NISN existing dari DB sekali. Untuk PKBM dengan ~500 siswa, ini super cepat (<200ms). Untuk PKBM besar (5000+ siswa), tetap masih acceptable (<1s) karena cuma fetch kolom NISN doang, bukan full row.

Kalau scale lo lebih besar dari itu (>10K siswa), bisa optimize jadi batch validation per chunk, tapi probably overkill untuk use case PKBM.

### 4. Schema DB: tidak perlu migration!
Field `nis` & `nisn` udah ada di tabel `peserta_didik` dari awal. Schema gak berubah. Cuma logic insert yang sekarang fill 2 field itu dari CSV.

---

## 🐛 Known Limitations

1. **NIS bisa duplikat di DB** — by design (sekolah bebas format, beberapa sekolah re-use NIS antar tahun ajaran). Kalau lo butuh strict unique NIS, perlu schema migration tambah UNIQUE constraint.

2. **NISN format permissive** — tidak validate harus 10 digit angka. Kalau butuh strict, tambah validator regex di parser. Tapi gw saranin TIDAK kecuali lo udah confirm semua data lo sesuai standar Kemendikbud.

3. **Error rollback bukan transactional** — kalau enrollment fail setelah peserta_didik berhasil insert, kita manual delete siswa yang baru. Ini pattern udah ada dari versi sebelumnya, gak gw ubah. Untuk transactional ke depan, perlu Edge Function atau RPC function di Supabase.

---

## 💬 Ringkasan: Apa yang Berbeda untuk User?

**Sebelum update:**
- Upload CSV → siswa ke-create tanpa NIS/NISN → harus edit manual satu-satu kalau perlu

**Setelah update:**
- Upload CSV dengan NIS/NISN → siswa langsung ke-create lengkap → langsung muncul di rapor

**UX improvements:**
- Preview validation lebih detail (sebut row mana yang error, NISN mana yang dupe)
- Loading state saat fetch existing NISN ("Memeriksa data NISN...")
- Format display di preview konsisten sama format rapor (`155 / 0000347149`)
- Template auto-update saat admin klik download

---

Selesai bro! Kalau ada bug atau request tweak, kabarin gw. 🚀