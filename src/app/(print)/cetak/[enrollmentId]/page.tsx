// ============================================================
// FILE PATH: src/app/(print)/cetak/[enrollmentId]/page.tsx
// ============================================================
// REPLACE file lama. Sebelumnya file ini 190 baris berisi logika
// action bar (publish/unpublish) + <RaporPreview />. Itu sebetulnya
// milik rapor/[enrollmentId]/page.tsx — salah copy-paste.
//
// File ini sekarang cuma render <RaporPDFViewer /> full-screen
// tanpa sidebar/nav (karena pakai (print) layout group).
//
// Akses via ROUTES.CETAK(enrollmentId) → /cetak/<uuid>
// Dibuka via window.open di rapor detail page (new tab).
// ============================================================

"use client";

import { use } from "react";
import { RaporPDFViewer } from "@/components/features/rapor/rapor-pdf-viewer";

interface Props {
  params: Promise<{ enrollmentId: string }>;
}

export default function CetakPage({ params }: Props) {
  const { enrollmentId } = use(params);
  return <RaporPDFViewer enrollmentId={enrollmentId} />;
}