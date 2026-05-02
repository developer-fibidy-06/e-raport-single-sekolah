// ============================================================
// FILE PATH: src/app/(dashboard)/penilaian/page.tsx
// ============================================================
// REPLACE. Perubahan:
//   - HAPUS header "Penilaian / Pilih kelas untuk input nilai"
//     karena sidebar nav udah jelas konteksnya.
//   - Subtitle "{tahun} · Semester {n} · {N} kelas" pindah ke
//     dalam <KelasList /> sebagai info bar tipis.
//
// Page ini sekarang thin shell — render <KelasList /> langsung.
// ============================================================

"use client";

import { KelasList } from "@/components/features/penilaian";

export default function PenilaianPage() {
  return <KelasList />;
}