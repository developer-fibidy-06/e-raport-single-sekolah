// ============================================================
// FILE PATH: src/components/features/penilaian/siswa-list.tsx
// ============================================================
// REPLACE. Perubahan tunggal dari versi sebelumnya:
//
//   List siswa (button stack divide-y) → <Table>
//   4 kolom: # | Siswa (nama + NISN · JK) | Status | chevron
//
//   Konsisten dengan kelas-list.tsx + rapor-kelas-list.tsx + admin
//   panel pattern: TableRow onClick=cursor-pointer, nomor mono+tabular,
//   main col px-2 py-2.5 max-w-0 + truncate, badge compact
//   text-[10px] h-4 px-1.5, chevron di kolom akhir.
//
// Yang TIDAK BERUBAH:
//   - Empty state (icon User + message)
//   - Loading skeleton
//   - getRaporStatus helper
//   - Navigation via router.push(ROUTES.PENILAIAN_SISWA)
//
// Avatar inisial circle (dekoratif) → DIHAPUS untuk match admin.
// ============================================================

"use client";

import { useRouter } from "next/navigation";
import { useEnrollmentByKelasId } from "@/hooks/use-enrollment";
import { ROUTES } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiswaListProps {
  kelasId: number;
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

export function SiswaList({ kelasId }: SiswaListProps) {
  const router = useRouter();
  const { data: enrollments = [], isLoading } = useEnrollmentByKelasId(kelasId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <User className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Belum ada siswa di kelas ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 px-3 text-xs">#</TableHead>
            <TableHead className="px-2 text-xs">Siswa</TableHead>
            <TableHead className="w-24 px-2 text-xs text-center">
              Status
            </TableHead>
            <TableHead className="w-8 px-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enr, idx) => {
            const siswa = enr.peserta_didik as {
              id: string;
              nama_lengkap: string;
              nisn?: string | null;
              jenis_kelamin: string;
            } | null;
            const isPublished =
              getRaporStatus(enr.rapor_header) === "published";

            return (
              <TableRow
                key={enr.id}
                onClick={() =>
                  router.push(ROUTES.PENILAIAN_SISWA(kelasId, enr.id))
                }
                className="cursor-pointer"
              >
                <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
                  {idx + 1}.
                </TableCell>
                <TableCell className="px-2 py-2.5 max-w-0">
                  <p className="text-sm font-medium truncate">
                    {siswa?.nama_lengkap ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    NISN: {siswa?.nisn ?? "-"} ·{" "}
                    {siswa?.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                  </p>
                </TableCell>
                <TableCell className="w-24 px-2 py-2.5 text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-4 px-1.5",
                      isPublished
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="w-8 px-2 py-2.5">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}