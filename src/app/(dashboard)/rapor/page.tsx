// ============================================================
// FILE PATH: src/app/(dashboard)/rapor/page.tsx
// ============================================================
// REPLACE. Perubahan:
//   - HAPUS header "Rapor / Arsip rapor per kelas — preview &
//     download ZIP" karena sidebar nav udah jelas konteksnya.
//
// Page ini sekarang thin shell — render <RaporKelasList /> langsung.
// ============================================================

"use client";

import { RaporKelasList } from "@/components/features/rapor";

export default function RaporPage() {
  return <RaporKelasList />;
}