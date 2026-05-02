# E-Raport PKBM — Dokumentasi Teknis

> Sistem E-Raport digital untuk PKBM (Pusat Kegiatan Belajar Masyarakat) Yayasan Al Barakah.
> Dibangun dengan Next.js 16 + Supabase + TanStack Query.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| State — Auth | Zustand (global, client-side singleton) |
| State — Server | TanStack Query v5 (caching, invalidation, mutations) |
| Backend / DB | Supabase (PostgreSQL 15+, Auth, RLS, RPC) |
| Validasi | Zod (shared schema antara form dan API) |
| Icons | Lucide React |
| Notifikasi | Sonner (toast) |

---

## Arsitektur Direktori

```
src/
├── app/
│   ├── layout.tsx              ← Root layout (QueryProvider + AuthProvider + Toaster)
│   ├── page.tsx                ← "/" redirect ke /dashboard atau /login
│   ├── globals.css             ← Tailwind + CSS variables + custom styles
│   │
│   ├── (auth)/                 ← Route group: halaman publik
│   │   ├── layout.tsx          ← Centered gradient background
│   │   └── login/page.tsx      ← Login form
│   │
│   ├── (dashboard)/            ← Route group: halaman authenticated
│   │   ├── layout.tsx          ← Auth guard + sidebar + header + mobile nav
│   │   ├── dashboard/page.tsx  ← Welcome banner + quick info
│   │   ├── admin/page.tsx      ← Multi-tab admin panel (super_admin only)
│   │   ├── penilaian/          ← Nested: kelas → siswa → input nilai
│   │   │   ├── page.tsx
│   │   │   ├── [kelasId]/page.tsx
│   │   │   └── [kelasId]/[enrollmentId]/page.tsx
│   │   ├── rapor/              ← Nested: kelas list → preview + publish
│   │   │   ├── page.tsx
│   │   │   └── [enrollmentId]/page.tsx
│   │   ├── overview/page.tsx   ← Placeholder
│   │   ├── profile/page.tsx    ← Profil user
│   │   └── settings/page.tsx   ← Placeholder
│   │
│   ├── (print)/                ← Route group: halaman cetak (tanpa UI chrome)
│   │   ├── layout.tsx          ← Clean white background, no sidebar/nav
│   │   └── cetak/[enrollmentId]/page.tsx  ← Render rapor + auto window.print()
│   │
│   └── api/auth/callback/      ← OAuth callback handler
│
├── components/
│   ├── ui/                     ← shadcn/ui primitives (tidak diedit manual)
│   ├── shared/                 ← Reusable: LoadingSpinner, ConfirmDialog, OfflineDetector
│   ├── layout/                 ← AppSidebar, MobileBottomNav, Header, UserMenu, nav-config
│   ├── providers/              ← AuthProvider (shell), QueryProvider
│   └── features/
│       ├── auth/               ← LoginForm, LogoutButton
│       ├── admin/              ← TabProfilPkbm, TabTahunKelas, TabSiswa, TabMataPelajaran, TabPredikat
│       ├── penilaian/          ← KelasList, SiswaList, NilaiForm, P5Form, EkskulForm, AbsensiCatatanForm
│       └── rapor/              ← RaporKelasList, RaporPreview, RaporDocument
│
├── hooks/                      ← TanStack Query hooks per domain
│   ├── use-auth.ts
│   ├── use-satuan-pendidikan.ts
│   ├── use-tahun-pelajaran.ts
│   ├── use-kelas.ts
│   ├── use-siswa.ts
│   ├── use-mata-pelajaran.ts
│   ├── use-kompetensi.ts
│   ├── use-predikat.ts
│   ├── use-enrollment.ts
│   ├── use-nilai.ts
│   ├── use-rapor.ts
│   └── index.ts                ← Re-export semua
│
├── stores/
│   └── auth-store.ts           ← Zustand: user, isAdmin, fetchUser, logout
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← createBrowserClient (CSR)
│   │   ├── server.ts           ← createServerClient (SSR)
│   │   └── proxy.ts            ← Middleware session refresh
│   ├── query-client.ts         ← TanStack QueryClient singleton
│   ├── validators.ts           ← Zod schemas (shared form + API validation)
│   └── utils.ts                ← cn(), getInitials(), isAdminRole()
│
├── types/
│   ├── database.ts             ← Generated Supabase types (Row, Insert, Update)
│   └── index.ts                ← Entity types, union types, composite types
│
├── constants/
│   └── routes.ts               ← Centralized route constants + dynamic route helpers
│
└── proxy.ts                    ← Next.js middleware (auth redirect)
```

---

## Data Model (ERD Ringkas)

```
┌─────────────────────┐     ┌──────────────────────┐
│  satuan_pendidikan   │     │    user_profiles      │
│  (1 row, profil PKBM)│     │  (Supabase Auth)      │
└─────────────────────┘     └──────────┬───────────┘
                                       │ id (UUID)
                                       │
┌──────────────────┐         ┌─────────┴──────────┐
│ tahun_pelajaran  │◄────────┤  rombongan_belajar  │
│ (2025/2026, Sem1)│  1 : N  │  (Kelas 7A, Paket B)│
└───────┬──────────┘         └─────────┬──────────┘
        │                              │
        │          ┌───────────────────┤
        │          │                   │
        ▼          ▼                   ▼
┌───────────────────────┐    ┌─────────────────┐
│      enrollment        │    │  peserta_didik   │
│  (siswa × kelas × tp) │◄───┤  (data siswa)    │
│  UNIQUE(pd_id, tp_id) │    └─────────────────┘
└───────────┬───────────┘
            │ enrollment_id
            │
    ┌───────┼────────┬──────────┬───────────┬──────────┐
    ▼       ▼        ▼          ▼           ▼          ▼
┌────────┐┌────┐┌─────────┐┌────────┐┌──────────┐┌────────┐
│nilai   ││ P5 ││ ekskul  ││absensi ││ catatan  ││ rapor  │
│_mapel  ││    ││         ││        ││ wali     ││_header │
└────────┘└────┘└─────────┘└────────┘└──────────┘└────────┘

┌──────────────────┐     ┌──────────────────┐
│  mata_pelajaran  │◄────┤ kompetensi_dasar │
│  (B.Indo, MTK)   │ 1:N │ (deskripsi A/B/C/D)│
└──────────────────┘     └──────────────────┘

┌──────────────────┐
│  predikat_global │  (A: 90-100, B: 75-89, C: 60-74, D: 0-59)
└──────────────────┘
```

**Unique Constraints (kritis untuk upsert):**

| Tabel | Constraint | Dipakai oleh |
|-------|-----------|-------------|
| `nilai_mapel` | `(enrollment_id, mata_pelajaran_id)` | `useUpsertNilai` |
| `profil_pelajar_pancasila` | `NULLS NOT DISTINCT (enrollment_id, dimensi, sub_elemen)` | `useUpsertP5` |
| `ketidakhadiran` | `(enrollment_id)` | `useUpsertAbsensi` |
| `catatan_wali_kelas` | `(enrollment_id)` | `useUpsertCatatan` |
| `rapor_header` | `(enrollment_id)` | `usePublishRapor` |
| `predikat_global` | `(predikat)` | `useUpdatePredikat` |

Semua upsert di hooks **wajib** pakai `{ onConflict: "..." }` yang match constraint di atas.
Tanpa `onConflict`, Supabase default ke PK → unique constraint error pada save kedua.

---

## Auth Flow

```
Browser                      Supabase Auth              App
  │                              │                       │
  ├─── POST signInWithPassword ──►                       │
  │                              │                       │
  │◄─── session cookie ──────────┤                       │
  │                              │                       │
  ├─── GET /dashboard ───────────────────────────────────►│
  │                              │                       │
  │    middleware (proxy.ts):                             │
  │    - updateSession() → refresh token                 │
  │    - getUser() → check auth                          │
  │    - redirect /login if !user                        │
  │                              │                       │
  │    dashboard layout:                                 │
  │    - useAuthStore.fetchUser()                        │
  │    - query user_profiles table                       │
  │    - set user, isAdmin, isAuthenticated              │
  │    - onAuthStateChange listener (SIGNED_OUT → reset) │
  │                              │                       │
  ├─── Render dashboard ◄───────────────────────────────┤
```

**Aturan:**

1. Middleware (`proxy.ts`) → server-side guard, redirect ke `/login`
2. Dashboard layout → client-side guard, fetch profile + setup listener
3. Auth state disimpan di Zustand (`auth-store.ts`) — singleton, gak di-context
4. `onAuthStateChange` listener **hanya 1** di dashboard layout (bukan di AuthProvider)
5. Login form → reset `hasFetched` di store → trigger fresh fetch di dashboard

**Roles:**

| Role | Bisa Akses |
|------|-----------|
| `super_admin` | Semua halaman + Admin panel + Publish rapor |
| `user` | Dashboard, Penilaian, Rapor (read-only publish) |

RLS di database enforce ini secara independen dari UI.

---

## Feature Flows

### 1. Admin Panel (`/admin`)

Satu halaman, 5 tab via query param `?tab=`:

```
/admin?tab=profil         → TabProfilPkbm     (upsert 1 row satuan_pendidikan)
/admin?tab=tahun-kelas    → TabTahunKelas     (CRUD tahun + kelas, parent-child dalam 1 tab)
/admin?tab=siswa          → TabSiswa          (CRUD peserta_didik + search)
/admin?tab=mata-pelajaran → TabMataPelajaran  (CRUD mapel + kompetensi inline expandable)
/admin?tab=predikat       → TabPredikat       (range nilai A/B/C/D — upsert 4 row)
```

**Guard:** `useEffect` redirect ke `/dashboard` jika `!isAdmin`.

### 2. Penilaian (`/penilaian`)

Drill-down 3 level:

```
/penilaian
  └── KelasList (kelas di tahun aktif, grouped by tingkat)
        │ click
        ▼
/penilaian/[kelasId]
  └── SiswaList (enrollment aktif, sorted by nama, rapor status badge)
        │ click
        ▼
/penilaian/[kelasId]/[enrollmentId]
  └── 4 tab section:
      ├── NilaiForm      → input angka → RPC derive_predikat → auto capaian kompetensi
      ├── P5Form         → 6 dimensi Pancasila × predikat + deskripsi
      ├── EkskulForm     → add/delete ekskul dengan predikat
      └── AbsensiCatatanForm → sakit/izin/alpha + catatan wali + tanggapan ortu
```

**Auto-save:** Semua form save `onBlur` (bukan submit button). Indicator ✓ hijau muncul setelah save.

**RPC Calls (database functions):**

| Function | Input | Output | Dipanggil di |
|----------|-------|--------|-------------|
| `derive_predikat(nilai)` | `SMALLINT 0-100` | `TEXT A/B/C/D` | NilaiForm saat nilai berubah |
| `get_capaian_kompetensi(kd_id, nilai)` | `INT, SMALLINT` | `TEXT deskripsi` | NilaiForm saat KD dipilih atau nilai berubah |

### 3. Rapor (`/rapor`)

Drill-down 2 level:

```
/rapor
  └── RaporKelasList (kelas expandable → inline siswa list + status badge)
        │ click siswa
        ▼
/rapor/[enrollmentId]
  └── RaporPreview
      ├── RaporDocument (pure presentational — shared dengan cetak)
      ├── Tombol Cetak → window.open(/cetak/[enrollmentId])
      ├── Tombol Publish (admin only) → usePublishRapor
      └── Tombol Unpublish (admin only) → useUnpublishRapor
```

**Rapor Document sections:**

1. KOP SURAT — nama sekolah, NPSN, alamat (dari `satuan_pendidikan`)
2. IDENTITAS — nama siswa, NISN, kelas, tahun, semester
3. CAPAIAN HASIL BELAJAR — tabel nilai (mapel × nilai × predikat × capaian)
4. PROFIL PELAJAR PANCASILA — 6 dimensi × predikat × deskripsi
5. EKSTRAKURIKULER — tabel ekskul × predikat × keterangan
6. KETIDAKHADIRAN — sakit, izin, alpha, total
7. CATATAN WALI KELAS + TANGGAPAN ORANG TUA
8. TANDA TANGAN — orang tua (kiri) + kepala PKBM (kanan)

### 4. Cetak (`/cetak/[enrollmentId]`)

- Route group `(print)` — layout bersih tanpa sidebar/nav/header
- Client component, fetch via `useRaporFullData` (8 query parallel)
- Auto `window.print()` setelah data ready (delay 500ms)
- CSS `@page { size: A4; margin: 15mm }` + `@media print` rules
- Tombol "Cetak Rapor" floating (hidden saat print via `.no-print`)

---

## Route Map

| Path | Auth | Role | Komponen Utama |
|------|------|------|---------------|
| `/` | — | — | Redirect ke `/dashboard` atau `/login` |
| `/login` | Public | — | `LoginForm` |
| `/dashboard` | Required | All | Welcome banner + quick info |
| `/overview` | Required | All | Placeholder |
| `/profile` | Required | All | Info akun |
| `/settings` | Required | All | Placeholder |
| `/admin` | Required | `super_admin` | Multi-tab admin panel |
| `/penilaian` | Required | All | Kelas list |
| `/penilaian/[kelasId]` | Required | All | Siswa list |
| `/penilaian/[kelasId]/[enrollmentId]` | Required | All | Input nilai (4 section) |
| `/rapor` | Required | All | Kelas expandable + siswa status |
| `/rapor/[enrollmentId]` | Required | All | Preview rapor + publish |
| `/cetak/[enrollmentId]` | Required | All | Print-ready rapor |

---

## State Management Pattern

```
                    ┌──────────────────┐
                    │   Zustand Store   │
                    │   (auth-store)    │
                    │                  │
                    │  user, isAdmin   │
                    │  fetchUser()     │
                    │  logout()        │
                    └────────┬─────────┘
                             │ genuinely global, cross-route
                             │
  ┌──────────────────────────┼──────────────────────────┐
  │                          │                          │
  ▼                          ▼                          ▼
┌──────────┐  ┌─────────────────────────┐  ┌──────────────────┐
│ Sidebar  │  │  TanStack Query Cache    │  │  Dashboard Layout │
│ UserMenu │  │                         │  │  (auth listener)  │
│ NavGuard │  │  ["siswa"] → data[]     │  └──────────────────┘
└──────────┘  │  ["nilai", id] → data[] │
              │  ["rapor_full", id] → {} │
              │                         │
              │  Auto: stale, refetch,  │
              │  invalidation, retry    │
              └─────────────────────────┘
```

**Aturan:**
- Auth → Zustand (global, satu source of truth)
- Server data (CRUD) → TanStack Query (caching + invalidation)
- Tidak pakai React Context untuk state management
- Tidak pakai `localStorage` / `sessionStorage`

---

## RLS (Row Level Security) Summary

| Tabel | READ | WRITE |
|-------|------|-------|
| Master data (satuan_pendidikan, tahun_pelajaran, rombongan_belajar, peserta_didik, enrollment, mata_pelajaran, predikat_global, kompetensi_dasar) | All authenticated | `super_admin` only |
| Penilaian (nilai_mapel, profil_pelajar_pancasila, ekstrakurikuler, ketidakhadiran, catatan_wali_kelas) | All authenticated | All authenticated |
| rapor_header | All authenticated | INSERT draft: all auth, UPDATE draft: all auth (WITH CHECK status='draft'), UPDATE any: `super_admin` |

---

## Konvensi Kode

1. **File naming:** `kebab-case` untuk semua file
2. **Component naming:** `PascalCase` export
3. **Hook naming:** `use-` prefix, 1 file per domain entity
4. **Query keys:** Object `QK` di atas setiap hook file
5. **Form validation:** Zod schema di `validators.ts`, shared antara form dan hook
6. **Error handling:** `toast.error()` di `onError` mutation, `toast.success()` di `onSuccess`
7. **Loading states:** Skeleton shimmer (`bg-muted animate-pulse`)
8. **Auto-save:** `onBlur` handler untuk form penilaian
9. **Upsert:** Selalu pakai `{ onConflict: "..." }` yang match DB unique constraint
