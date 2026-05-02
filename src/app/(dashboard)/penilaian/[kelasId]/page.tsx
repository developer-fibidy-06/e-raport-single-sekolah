// ============================================================
// FILE PATH: src/app/(dashboard)/penilaian/[kelasId]/page.tsx
// ============================================================
// REPLACE. Perubahan:
//   - HAPUS judul "Kelas 12A · Paket C · Fase F · Pilih siswa..."
//   - SISAKAN stat counter "5 siswa · 0 published · 5 draft"
//   - Stat counter SEJAJAR dengan tombol Kembali (1 row)
//   - Tombol Kembali pakai teks "Kembali" (bukan icon-only)
//
// Layout:
//   [← Kembali]  ........  [5 siswa · 0 published · 5 draft]
//   [SiswaList — pure list, no header]
// ============================================================

"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEnrollmentByKelasId } from "@/hooks/use-enrollment";
import { SiswaList } from "@/components/features/penilaian";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileCheck, FileClock } from "lucide-react";

interface Props {
  params: Promise<{ kelasId: string }>;
}

// Helper: extract rapor status (PostgREST 1:many)
function getRaporStatus(raporHeader: unknown): string | null {
  if (Array.isArray(raporHeader) && raporHeader.length > 0) {
    return (raporHeader[0] as { status?: string })?.status ?? null;
  }
  if (
    raporHeader &&
    typeof raporHeader === "object" &&
    "status" in raporHeader
  ) {
    return (raporHeader as { status?: string }).status ?? null;
  }
  return null;
}

export default function PenilaianKelasPage({ params }: Props) {
  const { kelasId } = use(params);
  const router = useRouter();
  const kelasIdNum = parseInt(kelasId, 10);

  const { data: enrollments = [] } = useEnrollmentByKelasId(kelasIdNum);

  const stats = useMemo(() => {
    let published = 0;
    enrollments.forEach((e) => {
      if (getRaporStatus(e.rapor_header) === "published") published++;
    });
    return {
      total: enrollments.length,
      published,
      draft: enrollments.length - published,
    };
  }, [enrollments]);

  return (
    <div className="space-y-4">
      {/* Header row: [← Kembali] [stat counter sejajar] */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(ROUTES.PENILAIAN)}
          className="gap-1.5 px-2 h-9 flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        {enrollments.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground ml-auto">
            <span>
              <strong className="text-foreground">{stats.total}</strong> siswa
            </span>
            <span className="flex items-center gap-1">
              <FileCheck className="h-3.5 w-3.5 text-green-600" />
              {stats.published} published
            </span>
            <span className="flex items-center gap-1">
              <FileClock className="h-3.5 w-3.5 text-amber-600" />
              {stats.draft} draft
            </span>
          </div>
        )}
      </div>

      <SiswaList kelasId={kelasIdNum} />
    </div>
  );
}