// ============================================================
// FILE PATH: src/components/features/rapor/rapor-kelas-drawer.tsx
// ============================================================
// Drawer detail kelas (read-only mode untuk archive).
//
// Pattern: vaul Drawer responsive direction
//   - Desktop ≥768px: slide from right (max-w-md)
//   - Mobile <768px: slide from bottom (max 85vh)
//
// Header drawer:
//   - Tombol close
//   - Nama kelas + subtitle (paket · fase · stats)
//   - Tombol ZIP di pojok kanan (Package icon)
//
// Body:
//   - List siswa (numbered) dengan badge status rapor
//   - Klik siswa → router.push(/rapor/[enrollmentId]) (preview-only)
//
// Click ZIP → buka <ExportZipDialog />
// ============================================================

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { useEnrollmentByKelasId } from "@/hooks/use-enrollment";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportZipDialog } from "./export-zip-dialog";
import type { ExportContext } from "@/lib/export-rapor-zip";
import {
  X,
  ChevronRight,
  Package,
  FileCheck,
  FileClock,
  FileX,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface KelasInfo {
  id: number;
  nama_kelas: string;
  paket: string;
  fase: string;
  tahun_pelajaran_id: number;
  tahun_nama: string;
  tahun_semester: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kelas: KelasInfo | null;
}

// ============================================================
// Helper: extract rapor status (PostgREST 1:many)
// ============================================================
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

// ============================================================
// MAIN
// ============================================================

export function RaporKelasDrawer({ open, onOpenChange, kelas }: Props) {
  const isDesktop = useIsDesktop();
  const direction = isDesktop ? "right" : "bottom";

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={direction}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            "fixed z-50 flex flex-col bg-background outline-none",
            isDesktop &&
            "right-0 top-0 bottom-0 w-full max-w-md border-l shadow-xl",
            !isDesktop &&
            "left-0 right-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t shadow-xl"
          )}
        >
          <Drawer.Title className="sr-only">Detail Kelas</Drawer.Title>
          <Drawer.Description className="sr-only">
            Daftar siswa untuk preview rapor dan download ZIP arsip
          </Drawer.Description>

          {!isDesktop && (
            <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          {kelas ? (
            <DrawerBody kelas={kelas} onClose={() => onOpenChange(false)} />
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ============================================================
// DRAWER BODY
// ============================================================

function DrawerBody({
  kelas,
  onClose,
}: {
  kelas: KelasInfo;
  onClose: () => void;
}) {
  const router = useRouter();
  const [zipDialogOpen, setZipDialogOpen] = useState(false);

  const { data: enrollments = [], isLoading } = useEnrollmentByKelasId(kelas.id);

  // Stats
  const stats = useMemo(() => {
    let published = 0;
    let draft = 0;
    let belum = 0;
    enrollments.forEach((e) => {
      const status = getRaporStatus(e.rapor_header);
      if (status === "published") published++;
      else if (status === "draft") draft++;
      else belum++;
    });
    return { total: enrollments.length, published, draft, belum };
  }, [enrollments]);

  // Build export context — eligible: published + draft (yang belum dianggap belum siap)
  const exportCtx: ExportContext | null = useMemo(() => {
    if (enrollments.length === 0) return null;

    // Default: include published + draft (yg sudah ada rapor_header)
    // Belum (no rapor_header) di-skip karena emang belum di-touch
    const eligible = enrollments.filter((e) => {
      const status = getRaporStatus(e.rapor_header);
      return status === "published" || status === "draft";
    });

    if (eligible.length === 0) return null;

    const enrollmentIds: string[] = [];
    const enrollmentNames = new Map<string, string>();
    eligible.forEach((e) => {
      const siswa = e.peserta_didik as { nama_lengkap: string } | null;
      enrollmentIds.push(e.id);
      enrollmentNames.set(e.id, siswa?.nama_lengkap ?? "Siswa");
    });

    return {
      enrollmentIds,
      enrollmentNames,
      kelasInfo: {
        namaKelas: kelas.nama_kelas,
        paket: kelas.paket,
        fase: kelas.fase,
        tahunNama: kelas.tahun_nama,
        semester: kelas.tahun_semester,
      },
    };
  }, [enrollments, kelas]);

  const canExport = exportCtx !== null;

  const handleSiswaClick = (enrollmentId: string) => {
    router.push(ROUTES.RAPOR_DETAIL(enrollmentId));
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-2 border-b px-4 py-3 sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 -ml-1"
          onClick={onClose}
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-tight truncate">
            {kelas.nama_kelas}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {kelas.paket} · {kelas.fase}
          </p>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <Users className="inline h-3 w-3 mr-1 -mt-0.5" />
              {stats.total} siswa
              {stats.published > 0 && (
                <span> · {stats.published} published</span>
              )}
              {stats.draft > 0 && <span> · {stats.draft} draft</span>}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 gap-1.5"
          disabled={!canExport || isLoading}
          onClick={() => setZipDialogOpen(true)}
          title={
            !canExport
              ? "Tidak ada rapor yang bisa di-export"
              : "Download ZIP rapor"
          }
        >
          <Package className="h-3.5 w-3.5" />
          ZIP
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Belum ada siswa di kelas ini
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {enrollments.map((enr, idx) => {
              const siswa = enr.peserta_didik as {
                nama_lengkap: string;
                nisn?: string | null;
                jenis_kelamin: string;
              } | null;
              const status = getRaporStatus(enr.rapor_header);

              return (
                <button
                  key={enr.id}
                  type="button"
                  onClick={() => handleSiswaClick(enr.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-2.5 sm:px-5 text-left",
                    "hover:bg-muted/40 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  )}
                >
                  <span className="text-xs text-muted-foreground tabular-nums w-6 text-right flex-shrink-0">
                    {idx + 1}.
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {siswa?.nama_lengkap ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      NISN: {siswa?.nisn ?? "—"}
                    </p>
                  </div>

                  <StatusBadge status={status} />
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ZIP Export Dialog */}
      <ExportZipDialog
        open={zipDialogOpen}
        onOpenChange={setZipDialogOpen}
        ctx={exportCtx}
      />
    </>
  );
}

// ============================================================
// Status Badge
// ============================================================

function StatusBadge({ status }: { status: string | null }) {
  if (status === "published") {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-green-50 text-green-700 border-green-200 flex-shrink-0 gap-0.5"
      >
        <FileCheck className="h-3 w-3" />
        <span className="hidden sm:inline">Published</span>
      </Badge>
    );
  }
  if (status === "draft") {
    return (
      <Badge
        variant="outline"
        className="text-xs bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0 gap-0.5"
      >
        <FileClock className="h-3 w-3" />
        <span className="hidden sm:inline">Draft</span>
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-xs bg-muted text-muted-foreground flex-shrink-0 gap-0.5"
    >
      <FileX className="h-3 w-3" />
      <span className="hidden sm:inline">Belum</span>
    </Badge>
  );
}