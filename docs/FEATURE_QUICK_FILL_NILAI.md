# 🚀 Feature Proposal: Quick-Fill Nilai Mapel via Predikat Perkembangan

**Status:** Nice-to-have
**Area:** `src/components/features/penilaian/nilai-form.tsx`
**Target user:** Operator / wali kelas yang input nilai ratusan siswa tiap semester

---

## 1. Konteks & Masalah

### Flow sekarang (manual, per-field)

Untuk **1 siswa**, operator harus isi per mapel:

| Field | Input |
|---|---|
| Nilai akhir | Ketik angka 0–100 |
| Predikat | Pilih A/B/C/D dari dropdown *(auto-derive jalan tapi tetap re-render)* |
| KD | Pilih dari dropdown |
| Capaian kompetensi | Klik "Auto dari KD" atau ketik manual |
| Simpan | Klik tombol Simpan |

**Kalikan 12–15 mapel × 30 siswa × 2 semester = ribuan klik + ketik angka.**

Problem nyata di lapangan:

- Operator capek → nilai sering typo (angka 85 jadi 58)
- Banyak siswa "rata-rata" dapat nilai mirip-mirip, tapi tetap diketik satu-satu
- Tidak ada shortcut untuk pola umum ("siswa ini BSH semua" — paling common)
- Flow keyboard-heavy padahal data mostly patterned

### Konvensi nilai di PKBM Al Barakah

> Semua siswa layak dapat **nilai ≥ 70**. Tidak ada nilai di bawah 70 di rapor.

Artinya ruang nilai efektif cuma **70–100**, dan mayoritas siswa ada di satu dari empat "kategori perkembangan":

| Predikat | Arti | Kondisi siswa |
|---|---|---|
| **SAB** | Sangat Berkembang | Ideal / siswa menonjol |
| **BSH** | Berkembang Sesuai Harapan | Normal / mayoritas |
| **SB** | Sedang Berkembang | Rata-rata / masih progress |
| **MB** | Mulai Berkembang | Sedikit di bawah rata-rata |

Predikat MB/SB/BSH/SAB ini **sudah familiar** karena dipakai di form Profil Pelajar Pancasila (P5). Operator udah terbiasa.

---

## 2. Solusi yang Diusulkan

### Ide inti

> **Satu klik predikat perkembangan → auto-fill semua field nilai mapel** dengan angka yang masuk range predikat tersebut.

Operator tinggal pilih "siswa ini tipenya apa", sistem yang isi angka, predikat (A/B/C/D), dan capaian kompetensi.

### Dua level quick-fill

**Level 1 — Per-siswa (global, paling impactful)**

Di atas form nilai, taruh 4 tombol besar:

```
┌─ Isi Cepat Semua Mapel ──────────────────────────────┐
│                                                       │
│   [ MB ]   [ SB ]   [ BSH ]   [ SAB ]                │
│   Mulai    Sedang   Sesuai    Sangat                 │
│   Berkemb. Berkemb. Harapan   Berkembang             │
│                                                       │
└───────────────────────────────────────────────────────┘
```

Klik sekali → **semua mapel kelompok umum + peminatan + khusus** ke-fill dengan sedikit variasi angka (biar tidak flat 85-85-85 semua).

**Level 2 — Per-mapel (fine-tune)**

Di tiap `NilaiRow`, tambahkan row kecil:

```
Nilai Akhir: [___] | Predikat: [_]  · Quick: [MB][SB][BSH][SAB]
```

Dipakai kalau operator udah global-fill "BSH" tapi mapel Matematika si siswa sebetulnya "SB".

---

## 3. Mapping Predikat → Range Nilai

Tujuan: angka realistis, tidak identical antar mapel, tapi masih dalam kategori yang sama.

| Predikat | Range nilai | Predikat A/B/C/D (auto-derive) | Tone |
|---|---|---|---|
| **SAB** | **90–96** | A (Sangat Baik) | Siswa menonjol di semua mapel |
| **BSH** | **82–88** | B (Baik) | Normal, mayoritas siswa |
| **SB** | **76–80** | B (Baik) / batas bawah | Rata-rata, masih in progress |
| **MB** | **70–74** | C (Cukup) | Sedikit di bawah, tapi masih lulus |

### Algoritma pengisian

Pseudo-code untuk tiap mapel saat "Isi Cepat" di-klik:

```ts
function quickFillValue(level: "MB" | "SB" | "BSH" | "SAB"): number {
  const RANGES = {
    MB:  { min: 70, max: 74 },
    SB:  { min: 76, max: 80 },
    BSH: { min: 82, max: 88 },
    SAB: { min: 90, max: 96 },
  };
  const { min, max } = RANGES[level];
  // Random integer dalam range — biar 12 mapel tidak semua 85 persis
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

**Catatan:** range dibuat sempit (5–7 poin) biar tetap konsisten dengan label predikatnya. Terlalu lebar → nilai bisa loncat dari kategori A ke C di mapel yang sama siswa.

> 💡 Range ini harus **bisa diedit admin** di menu "Predikat" kalau suatu saat PKBM mau ubah konvensi. Simpan di tabel `predikat_quickfill_range` atau extend `predikat_global`.

---

## 4. User Flow: Before vs After

### BEFORE — 1 siswa, 12 mapel, rata-rata BSH

```
1.  Scroll ke mapel #1 → klik field nilai → ketik "85" → tab
2.  Klik dropdown predikat → pilih "B"  (atau tunggu auto-derive)
3.  Klik dropdown KD → pilih KD pertama
4.  Klik "Auto dari KD" → capaian ke-fill
5.  Klik "Simpan Nilai"
6.  Ulang langkah 1–5 untuk mapel #2
7.  Ulang langkah 1–5 untuk mapel #3
... × 12 mapel

Estimasi: ~3 menit per siswa = 90 menit per kelas 30 siswa
```

### AFTER — Quick-fill

```
1.  Buka halaman siswa
2.  Klik tombol besar [ BSH ]
    → 12 mapel auto-fill semua (nilai 82–88, predikat B, capaian terisi)
3.  Scan cepat: ada mapel yang sebetulnya SB?
    → Klik [SB] di row Matematika → angka turun ke 77
4.  Klik "Simpan Semua"  ← tombol baru (batch save)

Estimasi: ~30 detik per siswa = 15 menit per kelas 30 siswa
```

**6× lebih cepat.** Dan yang lebih penting: operator tetap punya **kontrol** untuk override per mapel.

---

## 5. Desain UI

### Panel Quick-Fill Global

Taruh **di atas** section "Kelompok Mata Pelajaran Umum", sebelum list mapel.

```tsx
<Card className="border-dashed bg-muted/30">
  <CardContent className="py-4 space-y-3">
    <div className="flex items-center gap-2">
      <Zap className="h-4 w-4 text-amber-600" />
      <p className="text-sm font-medium">Isi Cepat Semua Mapel</p>
      <span className="text-xs text-muted-foreground">
        Pilih tipe perkembangan siswa — nilai akan auto-terisi
      </span>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <QuickFillButton level="MB"  label="Mulai Berkembang"      />
      <QuickFillButton level="SB"  label="Sedang Berkembang"     />
      <QuickFillButton level="BSH" label="Berkembang Sesuai Harapan" highlight />
      <QuickFillButton level="SAB" label="Sangat Berkembang"     />
    </div>

    <p className="text-xs text-muted-foreground">
      💡 Tombol ini mengisi semua mapel sekaligus. Kamu masih bisa
      edit per mapel setelahnya.
    </p>
  </CardContent>
</Card>
```

`BSH` di-highlight karena paling sering dipakai (default "normal").

### Inline Quick-Fill per Row

Tambahkan di `NilaiRow`, sebelah kanan input predikat:

```
┌──────────────────────────────────────────────────────────┐
│ 1. Bahasa Indonesia                                      │
│    Nilai: [85]  Predikat: [B]  · [MB][SB][BSH][SAB]     │
│    KD: [...]  Capaian: [....]                            │
└──────────────────────────────────────────────────────────┘
```

Tombol kecil (h-6, text-xs) biar tidak dominan.

---

## 6. Behavior Detail

### Apa yang di-fill saat quick-fill?

| Field | Behavior |
|---|---|
| `nilai_akhir` | Random integer di range predikat |
| `predikat` (A/B/C/D) | Auto-derive via `derivePredikat(nilai)` RPC existing |
| `kompetensi_dasar_id` | Pilih KD pertama (urutan=1) jika belum ada KD ter-pilih |
| `capaian_kompetensi` | Auto-fill via `getCapaianKompetensi(kdId, nilai)` RPC existing |

**Semua logika backend RPC sudah ada** — tinggal orchestrate di frontend.

### Overwrite policy

**Opsi A — Always overwrite** (simpler)
Klik quick-fill → semua field timpa nilai existing.
Risk: operator kehilangan data kalau salah klik.

**Opsi B — Empty-only (safer) ← recommended**
Klik quick-fill → hanya isi field yang masih kosong.
Kalau mau overwrite, tombol: `[Isi Cepat] [⟳ Timpa Ulang]`.

**Opsi C — Confirm dialog**
Setelah klik, munculkan `ConfirmDialog`: "X mapel sudah terisi. Timpa semua?"

Saran: **Opsi B** default, dengan checkbox "Timpa nilai yang sudah ada" di panel quick-fill.

### Dirty state & batch save

Setelah quick-fill, nilai **belum tersimpan ke DB** — masih di local state.

- Tampilkan badge `Belum disimpan` di tiap row yang ter-fill
- Tombol floating di bawah: `[Simpan Semua (12 perubahan)]`
- Kalau user navigate keluar tanpa save → prompt konfirmasi

Ini perubahan arsitektur kecil di `NilaiForm` — saat ini tiap row save independen. Perlu state manager lokal (useReducer atau Zustand slice) untuk track dirty rows.

---

## 7. Implementasi Teknis

### File yang perlu diubah

```
src/components/features/penilaian/nilai-form.tsx    ← main changes
src/hooks/use-nilai.ts                              ← add useBatchUpsertNilai
src/lib/validators.ts                               ← add quickFillRangeSchema (optional)
```

### Hook baru — `useBatchUpsertNilai`

```ts
// src/hooks/use-nilai.ts
export function useBatchUpsertNilai() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (rows: NilaiBatchInput[]) => {
      const payload = rows.map((r) => ({
        ...r,
        input_by: userId ?? null,
      }));
      const { error } = await supabase
        .from("nilai_mapel")
        .upsert(payload, { onConflict: "enrollment_id,mata_pelajaran_id" });
      if (error) throw error;
    },
    onSuccess: (_, rows) => {
      const enrollmentIds = [...new Set(rows.map((r) => r.enrollment_id))];
      enrollmentIds.forEach((id) =>
        qc.invalidateQueries({ queryKey: ["nilai_mapel", id] })
      );
      toast.success(`${rows.length} nilai berhasil disimpan`);
    },
    onError: (err: Error) => toast.error("Gagal simpan batch: " + err.message),
  });
}
```

### Sketsa komponen QuickFillPanel

```tsx
function QuickFillPanel({
  mapelList,
  onFill,
}: {
  mapelList: MataPelajaran[];
  onFill: (level: PredikatP5) => void;
}) {
  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="py-4">
        {/* ... UI seperti di section 5 ... */}
        {(["MB", "SB", "BSH", "SAB"] as const).map((level) => (
          <Button
            key={level}
            variant={level === "BSH" ? "default" : "outline"}
            onClick={() => onFill(level)}
          >
            <span className="font-bold">{level}</span>
            <span className="text-xs">{LABELS[level]}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Handler di `NilaiForm`

```tsx
const handleQuickFillAll = async (level: PredikatP5) => {
  const updates = await Promise.all(
    mapelList.map(async (mapel) => {
      const nilai = generateNilai(level);
      const predikat = await derivePredikat(nilai);
      const firstKd = kdByMapel.get(mapel.id)?.[0];
      const capaian = firstKd
        ? await getCapaianKompetensi(firstKd.id, nilai)
        : null;
      return {
        enrollment_id: enrollmentId,
        mata_pelajaran_id: mapel.id,
        kompetensi_dasar_id: firstKd?.id ?? null,
        nilai_akhir: nilai,
        predikat,
        capaian_kompetensi: capaian,
      };
    })
  );
  setDraftUpdates(updates); // local state, belum save
};
```

---

## 8. Edge Cases & Pertimbangan

| Case | Handling |
|---|---|
| Belum ada KD di mapel | Skip field KD & capaian, isi nilai + predikat saja |
| Mapel tidak aktif (`is_aktif = false`) | Skip, jangan ter-fill |
| Operator klik quick-fill 2× cepat | Debounce 300ms |
| User offline saat batch save | Sudah ada `OfflineDetector`, queue di local sampai online |
| Nilai existing di-overwrite tanpa sengaja | Opsi B (empty-only) default + undo toast 5 detik |
| Range predikat di-ubah admin | Quick-fill tetap pakai range baru — pull dari DB, jangan hard-code |

---

## 9. Nice-to-Have Extensions (Phase 2)

### A. Quick-fill kelas-wide

Di halaman list siswa per kelas (`SiswaList`), tambahkan tombol:
> "Isi semua siswa sebagai BSH"

Langsung isi default "BSH" untuk seluruh kelas 30 siswa. Operator tinggal override siswa yang berbeda. **Hemat waktu luar biasa untuk kelas yang homogen.**

### B. Import dari semester sebelumnya

"Copy nilai dari semester lalu" → pull nilai siswa semester sebelumnya, offset random ±3 poin, auto-fill.

### C. Template per-siswa

Operator tag siswa dengan label ("pintar", "normal", "perlu perhatian"). Quick-fill otomatis pick level sesuai label.

### D. Ekstensi ke P5 Form

Form P5 sekarang **sudah** pakai predikat MB/SB/BSH/SAB tapi manual klik tiap sub-elemen. Logika sama: satu klik global → semua sub-elemen di dimensi X ke-set BSH.

### E. Ekstensi ke Absensi

Tombol quick: "Siswa rajin" → sakit 0, izin 0, alpa 0. "Siswa lumayan" → sakit 1, izin 0, alpa 0.

---

## 10. Acceptance Criteria

Fitur ini dianggap "done" kalau:

- [ ] Panel quick-fill global muncul di atas `NilaiForm`
- [ ] 4 tombol (MB/SB/BSH/SAB) berfungsi, fill semua mapel dengan range sesuai
- [ ] Predikat (A/B/C/D) ter-derive otomatis dari nilai
- [ ] KD pertama otomatis terpilih kalau ada KD terdaftar
- [ ] Capaian kompetensi terisi otomatis dari RPC `get_capaian_kompetensi`
- [ ] Nilai existing **tidak tertimpa** tanpa konfirmasi user
- [ ] Batch save single API call (bukan 12× upsert)
- [ ] Ada undo toast setelah quick-fill (5 detik)
- [ ] Range nilai per predikat **bisa diedit admin**, bukan hard-code
- [ ] Mobile-friendly (tombol cukup besar, tidak overflow)
- [ ] Dokumen tertulis di README atau HELP admin

---

## 11. Estimasi Effort

| Task | Estimate |
|---|---|
| QuickFillPanel component + styling | 4 jam |
| Batch upsert hook + dirty state | 4 jam |
| Handler logic (derive predikat, KD, capaian) | 3 jam |
| Per-row inline quick-fill | 2 jam |
| Overwrite policy + confirm dialog | 2 jam |
| Range nilai dari DB (bukan hard-code) | 3 jam |
| Testing manual end-to-end | 2 jam |
| **Total** | **~20 jam (2–3 hari kerja)** |

ROI: kalau operator input 6 kelas × 30 siswa × 2 semester = **360 siswa/tahun**, hemat ~2.5 menit per siswa = **15 jam/tahun per operator**. Payback < 2 semester.

---

## 12. Risks & Mitigasi

| Risk | Mitigasi |
|---|---|
| Operator lupa review, semua siswa dapat BSH identik | Tampilkan varian nilai (bukan flat), tambah reminder di toast |
| Auto-fill dipakai untuk "cheat" — semua siswa dapat nilai bagus | Keputusan pedagogis, bukan teknis. Admin PKBM yang atur kebijakan |
| Random value bikin nilai tidak reproducible | Tidak masalah, draft bisa di-overwrite. Setelah save, nilai jadi fix |
| Konflik saat 2 operator edit siswa sama | Upsert dengan `onConflict` sudah handle last-write-wins |

---

## Kesimpulan

Fitur ini **bukan** sekadar cosmetic — ini benar-benar **ngejar efektivitas flow input nilai** yang jadi bottleneck utama di akhir semester. Pattern "satu klik kategori → auto-fill structured" sudah terbukti di tools data-entry lain (spreadsheet templates, payroll systems).

Predikat MB/SB/BSH/SAB **sudah familiar** di konteks PKBM (dipakai di P5), jadi curve adopsi rendah. Operator tinggal pakai mental model yang sama untuk nilai mapel.

Yang bikin fitur ini **nice-to-have** dan bukan must-have: sistem current sudah functional. Tapi kalau goal-nya adalah **scaling** (misal dari 1 PKBM ke banyak cabang), fitur ini jadi makin critical.
