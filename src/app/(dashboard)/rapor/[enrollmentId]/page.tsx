// ============================================================
// FILE PATH: src/app/(dashboard)/rapor/[enrollmentId]/page.tsx
// ============================================================
// REPLACE. Perubahan tunggal: drop prop `embedded` dari
// <RaporPDFViewer> karena tidak ada di RaporPDFViewerProps.
// Default mode-nya "embed" jadi tetap render iframe inline.
//
// Sisa logic TIDAK BERUBAH:
//   - PDF embed = single source of truth
//   - Header minimalis: back + nama siswa
//   - Tidak ada action button (publish/cetak/download)
//   - Action publish/cetak/download ada di /penilaian → File menu
// ============================================================

"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEnrollmentById } from "@/hooks";
import { RaporPDFViewer } from "@/components/features/rapor/rapor-pdf-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ enrollmentId: string }>;
}

export default function RaporDetailPage({ params }: Props) {
  const { enrollmentId } = use(params);
  const router = useRouter();

  const { data: enrollment } = useEnrollmentById(enrollmentId);
  const siswa = enrollment?.peserta_didik as
    | { nama_lengkap?: string }
    | null;

  return (
    <div className="space-y-4">
      {/* Header: tombol Kembali + nama siswa */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 px-2 h-9 flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-base font-semibold truncate">
          {siswa?.nama_lengkap ?? "Memuat…"}
        </h1>
      </div>

      {/* PDF preview = single source of truth */}
      <RaporPDFViewer enrollmentId={enrollmentId} />
    </div>
  );
}