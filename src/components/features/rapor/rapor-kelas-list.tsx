// ============================================================
// FILE PATH: src/components/features/rapor/rapor-kelas-list.tsx
// ============================================================
// REPLACE. Perubahan tunggal dari versi sebelumnya:
//
//   Inner list per kelas (button stack divide-y) → <Table>
//   3 kolom: # | Kelas (nama + fase · wali_kelas) | chevron
//
//   Konsisten dengan pattern admin panel (tab-tahun-kelas,
//   tab-mata-pelajaran, tab-users): TableRow onClick=cursor-pointer,
//   nomor mono+tabular, main col px-2 py-2.5 max-w-0 + truncate,
//   chevron di kolom terakhir.
//
// Yang TIDAK BERUBAH:
//   - Accordion per Paket (A/B/C) + trigger w/ Layers icon + ZIP btn
//   - Info bar tahun aktif
//   - Empty/error states
//   - All hooks (useTahunPelajaranAktif, useAllKelas, handleZipPaket)
//   - RaporKelasDrawer + ExportZipDialog
// ============================================================

"use client";

import { useMemo, useState } from "react";
import { useTahunPelajaranAktif, useAllKelas } from "@/hooks";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RaporKelasDrawer } from "./rapor-kelas-drawer";
import { ExportZipDialog } from "./export-zip-dialog";
import type {
  ExportContext,
  ExportContextMulti,
  KelasGroup,
} from "@/lib/export-rapor-zip";
import {
  ChevronRight,
  Archive,
  AlertCircle,
  Calendar,
  Layers,
  Package,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAKET_ORDER = ["Paket A", "Paket B", "Paket C"] as const;
type Paket = (typeof PAKET_ORDER)[number];

const PAKET_ICON_BG: Record<Paket, string> = {
  "Paket A": "bg-green-50",
  "Paket B": "bg-blue-50",
  "Paket C": "bg-purple-50",
};

const PAKET_ICON_FG: Record<Paket, string> = {
  "Paket A": "text-green-700",
  "Paket B": "text-blue-700",
  "Paket C": "text-purple-700",
};

interface SelectedKelas {
  id: number;
  nama_kelas: string;
  paket: string;
  fase: string;
  tahun_pelajaran_id: number;
  tahun_nama: string;
  tahun_semester: number;
}

export function RaporKelasList() {
  const [selectedKelas, setSelectedKelas] = useState<SelectedKelas | null>(null);
  const [paketExportCtx, setPaketExportCtx] = useState<ExportContext | null>(
    null
  );
  const [loadingPaket, setLoadingPaket] = useState<Paket | null>(null);

  const { data: tahunAktif, isLoading: loadingTahun } = useTahunPelajaranAktif();
  const { data: kelasList = [], isLoading: loadingKelas } = useAllKelas();

  const isLoading = loadingTahun || loadingKelas;

  const kelasAktif = useMemo(
    () =>
      kelasList.filter(
        (k) => tahunAktif && k.tahun_pelajaran_id === tahunAktif.id
      ),
    [kelasList, tahunAktif]
  );

  // Group by Paket
  const grouped = useMemo(() => {
    const g: Record<Paket, typeof kelasAktif> = {
      "Paket A": [],
      "Paket B": [],
      "Paket C": [],
    };
    kelasAktif.forEach((k) => {
      const p = k.paket as Paket;
      if (g[p]) g[p].push(k);
    });
    (Object.keys(g) as Paket[]).forEach((p) => {
      g[p].sort((a, b) => {
        if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
        return a.kelas_paralel.localeCompare(b.kelas_paralel);
      });
    });
    return g;
  }, [kelasAktif]);

  const defaultOpen = useMemo(
    () => PAKET_ORDER.filter((p) => grouped[p].length > 0),
    [grouped]
  );

  // ─── Build multi-kelas export context untuk paket ────────
  // Fetch all enrollments yang punya rapor_header (published / draft)
  // dari semua kelas di paket itu, group per kelas.
  const handleZipPaket = async (paket: Paket) => {
    if (!tahunAktif) return;
    const kelasInPaket = grouped[paket];
    if (kelasInPaket.length === 0) return;

    setLoadingPaket(paket);

    try {
      const supabase = createClient();
      const kelasIds = kelasInPaket.map((k) => k.id);

      // Fetch enrollments + peserta_didik + rapor_header status untuk
      // semua kelas di paket sekaligus (1 query, bukan loop per kelas)
      const { data: enrollments, error } = await supabase
        .from("enrollment")
        .select(
          `id, rombongan_belajar_id,
           peserta_didik(id, nama_lengkap),
           rapor_header(status)`
        )
        .in("rombongan_belajar_id", kelasIds)
        .eq("status", "aktif");

      if (error) throw error;

      // Filter yang eligible: punya rapor_header (published / draft)
      // Skip yang belum di-touch (rapor_header null)
      const eligible = (enrollments ?? []).filter((e) => {
        const rh = e.rapor_header;
        if (Array.isArray(rh) && rh.length > 0) {
          return rh[0].status === "published" || rh[0].status === "draft";
        }
        if (rh && typeof rh === "object" && "status" in rh) {
          const status = (rh as { status?: string }).status;
          return status === "published" || status === "draft";
        }
        return false;
      });

      if (eligible.length === 0) {
        toast.info(
          `Tidak ada rapor yang bisa di-export di ${paket}. Pastikan minimal 1 siswa sudah punya draft/publish rapor.`
        );
        setLoadingPaket(null);
        return;
      }

      // Group by kelas
      const kelasMap = new Map<number, KelasGroup>();
      kelasInPaket.forEach((k) => {
        kelasMap.set(k.id, {
          namaKelas: k.nama_kelas,
          enrollmentIds: [],
          enrollmentNames: new Map(),
        });
      });

      eligible.forEach((e) => {
        const group = kelasMap.get(e.rombongan_belajar_id);
        if (!group) return;
        const siswa = e.peserta_didik as { nama_lengkap: string } | null;
        group.enrollmentIds.push(e.id);
        group.enrollmentNames.set(e.id, siswa?.nama_lengkap ?? "Siswa");
      });

      // Filter out kelas kosong
      const kelasGroups: KelasGroup[] = [];
      kelasMap.forEach((group) => {
        if (group.enrollmentIds.length > 0) kelasGroups.push(group);
      });

      const ctx: ExportContextMulti = {
        paketInfo: {
          paket,
          tahunNama: tahunAktif.nama,
          semester: tahunAktif.semester,
        },
        kelasGroups,
      };

      setPaketExportCtx(ctx);
    } catch (err) {
      const e = err as Error;
      toast.error(`Gagal mempersiapkan export: ${e.message}`);
    } finally {
      setLoadingPaket(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tahunAktif) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Belum ada tahun pelajaran aktif
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Minta admin untuk mengatur tahun pelajaran aktif di menu Admin.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (kelasAktif.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Archive className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Belum ada kelas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tahun pelajaran {tahunAktif.nama} Semester {tahunAktif.semester}{" "}
              belum memiliki kelas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info bar */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 flex-shrink-0" />
        <span>
          {tahunAktif.nama} · Semester {tahunAktif.semester} ·{" "}
          <strong className="text-foreground">{kelasAktif.length} kelas</strong>
        </span>
      </div>

      {/* Accordion by Paket */}
      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        className="space-y-2"
      >
        {PAKET_ORDER.map((paket) => {
          const items = grouped[paket];
          if (items.length === 0) return null;
          const isLoadingThisPaket = loadingPaket === paket;

          return (
            <AccordionItem
              key={paket}
              value={paket}
              className="rounded-xl border bg-background overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      PAKET_ICON_BG[paket]
                    )}
                  >
                    <Layers className={cn("h-4 w-4", PAKET_ICON_FG[paket])} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold">{paket}</p>
                    <p className="text-xs text-muted-foreground">
                      {items.length} kelas
                    </p>
                  </div>

                  {/* ZIP button — pojok kanan, sebelum chevron */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-disabled={isLoadingThisPaket}
                    aria-label={`Download ZIP semua rapor ${paket}`}
                    title={`Download ZIP semua rapor ${paket}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLoadingThisPaket) handleZipPaket(paket);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isLoadingThisPaket) handleZipPaket(paket);
                      }
                    }}
                    className={cn(
                      "ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md border bg-background text-xs font-medium",
                      "hover:bg-accent hover:text-accent-foreground transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isLoadingThisPaket && "opacity-50 pointer-events-none"
                    )}
                  >
                    {isLoadingThisPaket ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Package className="h-3.5 w-3.5" />
                    )}
                    ZIP
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-0 pb-0">
                <div className="border-t">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 px-3 text-xs">#</TableHead>
                        <TableHead className="px-2 text-xs">Kelas</TableHead>
                        <TableHead className="w-8 px-2" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((k, idx) => (
                        <TableRow
                          key={k.id}
                          onClick={() =>
                            setSelectedKelas({
                              id: k.id,
                              nama_kelas: k.nama_kelas,
                              paket: k.paket,
                              fase: k.fase,
                              tahun_pelajaran_id: k.tahun_pelajaran_id,
                              tahun_nama: tahunAktif.nama,
                              tahun_semester: tahunAktif.semester,
                            })
                          }
                          className="cursor-pointer"
                        >
                          <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
                            {idx + 1}.
                          </TableCell>
                          <TableCell className="px-2 py-2.5 max-w-0">
                            <p className="text-sm font-medium truncate">
                              {k.nama_kelas}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {k.fase}
                              {k.wali_kelas ? ` · ${k.wali_kelas}` : ""}
                            </p>
                          </TableCell>
                          <TableCell className="w-8 px-2 py-2.5">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Drawer detail kelas (single-kelas ZIP) */}
      <RaporKelasDrawer
        open={selectedKelas !== null}
        onOpenChange={(v) => {
          if (!v) setSelectedKelas(null);
        }}
        kelas={selectedKelas}
      />

      {/* ZIP Export Dialog (multi-kelas / paket level) */}
      <ExportZipDialog
        open={paketExportCtx !== null}
        onOpenChange={(v) => {
          if (!v) setPaketExportCtx(null);
        }}
        ctx={paketExportCtx}
      />
    </div>
  );
}