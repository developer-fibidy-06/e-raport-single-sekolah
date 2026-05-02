// ============================================================
// FILE PATH: src/components/features/penilaian/p5-form.tsx
// ============================================================
// REPLACE. Perubahan tunggal: compact list 6 dimensi
// (button stack + divide-y) → <Table> dengan TableHeader + TableRow.
//
// Pattern KONSISTEN dengan rapor-kelas-list, kelas-list, siswa-list:
//   - <Table> + <TableHeader>
//   - 4 kolom: # | Dimensi | Progres | chevron
//   - TableRow onClick=cursor-pointer
//   - Nomor mono+tabular (w-12 px-3)
//   - Main col px-2 py-2.5 max-w-0 + truncate
//   - Chevron di kolom terakhir (w-8)
//
// Yang TIDAK BERUBAH:
//   - SEMUA logic quick-fill batch (handleConfirmQuickFill,
//     handleGenerateCatatanOnly, saveCatatan, dst)
//   - Drawer wiring (P5DetailDrawer)
//   - QuickFillPanel + QuickFillDialog
//   - Catatan Proses Perkembangan card (auto-save on-blur)
//   - Counter logic (filled/total per dimensi)
// ============================================================

"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useP5Tree,
  usePenilaianP5ByEnrollment,
  useBatchUpsertPenilaianP5,
  useCatatanP5ByEnrollment,
  useUpsertCatatanP5,
} from "@/hooks";
import type { Fase, PredikatP5, P5DimensiTree } from "@/types";
import {
  P5_LEVELS,
  P5_LABEL,
  randomPredikatP5,
  generateCatatanP5,
} from "@/lib/quick-fill-p5";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { ChevronRight, Sparkles } from "lucide-react";
import { QuickFillPanel, type QuickFillLevelOption } from "./quick-fill-panel";
import { QuickFillDialog } from "./quick-fill-dialog";
import { P5DetailDrawer } from "./p5-detail-drawer";

// ============================================================
// Constants
// ============================================================

const P5_LEVEL_OPTIONS: ReadonlyArray<QuickFillLevelOption<PredikatP5>> =
  P5_LEVELS.map((level) => {
    const meta = P5_LABEL[level];
    return {
      value: level,
      label: meta.short,
      desc: meta.full,
    };
  });

// ============================================================
// Props
// ============================================================

interface P5FormProps {
  enrollmentId: string;
  fase: Fase;
  namaSiswa: string;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function P5Form({ enrollmentId, fase, namaSiswa }: P5FormProps) {
  const { data: tree, isLoading: loadingTree } = useP5Tree(fase);
  const { data: penilaianList } = usePenilaianP5ByEnrollment(enrollmentId);
  const { data: catatanRow } = useCatatanP5ByEnrollment(enrollmentId);
  const batchUpsert = useBatchUpsertPenilaianP5();
  const upsertCatatan = useUpsertCatatanP5();

  // Quick-fill state
  const [pendingLevel, setPendingLevel] = useState<PredikatP5 | null>(null);

  // Drawer state — dimensi yang lagi dibuka
  const [openDimensiId, setOpenDimensiId] = useState<number | null>(null);

  // ─── Derived: penilaian map (sub_elemen_id → predikat) ────
  const penilaianMap = useMemo(() => {
    const m = new Map<number, PredikatP5>();
    (penilaianList ?? []).forEach((p) => {
      if (p.predikat) m.set(p.sub_elemen_id, p.predikat as PredikatP5);
    });
    return m;
  }, [penilaianList]);

  // ─── All sub-elemen ids (untuk batch quick-fill) ──────────
  const allSubElemenIds = useMemo(() => {
    const ids: number[] = [];
    (tree ?? []).forEach((d) =>
      d.elemen.forEach((e) => e.sub_elemen.forEach((s) => ids.push(s.id)))
    );
    return ids;
  }, [tree]);

  // ─── Catatan local draft ──────────────────────────────────
  const [catatanDraft, setCatatanDraft] = useState("");
  useEffect(() => {
    setCatatanDraft(catatanRow?.catatan ?? "");
  }, [catatanRow?.catatan]);

  // ─── Stats global ─────────────────────────────────────────
  const totalSub = allSubElemenIds.length;
  const filledSub = penilaianMap.size;

  // ─── Find open dimensi ────────────────────────────────────
  const openDimensi = useMemo<P5DimensiTree | null>(() => {
    if (openDimensiId === null) return null;
    return (tree ?? []).find((d) => d.id === openDimensiId) ?? null;
  }, [tree, openDimensiId]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleConfirmQuickFill = (opts: {
    overwrite: boolean;
    withCatatan: boolean;
  }) => {
    if (!pendingLevel || allSubElemenIds.length === 0) {
      setPendingLevel(null);
      return;
    }
    const level = pendingLevel;

    const predikat_map = new Map<number, PredikatP5>();
    allSubElemenIds.forEach((id) => {
      predikat_map.set(id, randomPredikatP5(level));
    });

    batchUpsert.mutate(
      {
        enrollment_id: enrollmentId,
        predikat_map,
        overwriteExisting: opts.overwrite,
      },
      {
        onSuccess: () => {
          if (opts.withCatatan) {
            const generated = generateCatatanP5(level, namaSiswa);
            setCatatanDraft(generated);
            upsertCatatan.mutate({
              enrollment_id: enrollmentId,
              catatan: generated,
            });
          }
          setPendingLevel(null);
        },
      }
    );
  };

  const handleGenerateCatatanOnly = () => {
    // Pakai BSH sebagai default kalau belum pernah quick-fill
    const level: PredikatP5 = "BSH";
    const generated = generateCatatanP5(level, namaSiswa);
    setCatatanDraft(generated);
    upsertCatatan.mutate({
      enrollment_id: enrollmentId,
      catatan: generated,
    });
  };

  const saveCatatan = () => {
    if (catatanDraft === (catatanRow?.catatan ?? "")) return;
    upsertCatatan.mutate({
      enrollment_id: enrollmentId,
      catatan: catatanDraft || null,
    });
  };

  // ─── Loading & empty states ───────────────────────────────
  if (loadingTree) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Memuat struktur P5 untuk {fase}…
      </div>
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Belum ada data master Profil Pelajar Pancasila untuk {fase}.
        <br />
        Admin dapat menambahkannya di menu <strong>Profil Pancasila</strong>.
      </div>
    );
  }

  const isDrawerOpen = openDimensiId !== null;

  return (
    <>
      <div className="space-y-4">
        {/* Quick-fill panel — generic native select */}
        <QuickFillPanel<PredikatP5>
          title="Isi Cepat Semua Sub-elemen"
          itemLabel="sub-elemen"
          totalItems={totalSub}
          filledItems={filledSub}
          levels={P5_LEVEL_OPTIONS}
          onPickLevel={(level) => setPendingLevel(level)}
          isLoading={batchUpsert.isPending}
          disabled={isDrawerOpen}
        />

        {/* Compact list — 6 dimensi flat (Table pattern konsisten siswa-list) */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-3 text-xs">#</TableHead>
                <TableHead className="px-2 text-xs">Dimensi</TableHead>
                <TableHead className="w-20 px-2 text-xs text-center">
                  Progres
                </TableHead>
                <TableHead className="w-8 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tree.map((dimensi) => {
                const dimensiSubCount = dimensi.elemen.reduce(
                  (a, e) => a + e.sub_elemen.length,
                  0
                );
                const dimensiFilled = dimensi.elemen.reduce(
                  (a, e) =>
                    a +
                    e.sub_elemen.filter((s) => penilaianMap.has(s.id)).length,
                  0
                );
                return (
                  <CompactDimensiRow
                    key={dimensi.id}
                    nomor={dimensi.nomor}
                    nama={dimensi.nama}
                    filled={dimensiFilled}
                    total={dimensiSubCount}
                    onClick={() => setOpenDimensiId(dimensi.id)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Catatan Proses Perkembangan */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">
                  Catatan Proses Perkembangan
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Catatan naratif wali kelas yang muncul di lembar Propela.
                  Auto-save saat klik di luar textarea.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleGenerateCatatanOnly}
                disabled={upsertCatatan.isPending}
                className="h-7 text-xs gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Generate (BSH)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              id="catatan-p5"
              rows={6}
              value={catatanDraft}
              onChange={(e) => setCatatanDraft(e.target.value)}
              onBlur={saveCatatan}
              placeholder="Tulis catatan proses perkembangan siswa…"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={saveCatatan}
                disabled={
                  upsertCatatan.isPending ||
                  catatanDraft === (catatanRow?.catatan ?? "")
                }
              >
                {upsertCatatan.isPending ? "Menyimpan…" : "Simpan Catatan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drawer per-dimensi */}
      <P5DetailDrawer
        open={isDrawerOpen}
        onOpenChange={(v) => {
          if (!v) setOpenDimensiId(null);
        }}
        dimensi={openDimensi}
        enrollmentId={enrollmentId}
        penilaianMap={penilaianMap}
      />

      {/* Dialog konfirmasi quick-fill */}
      <QuickFillDialog
        open={pendingLevel !== null}
        onOpenChange={(v) => {
          if (!v) setPendingLevel(null);
        }}
        title="Isi Cepat Profil Pelajar Pancasila"
        levelLabel={pendingLevel ?? ""}
        levelDesc={pendingLevel ? P5_LABEL[pendingLevel].full : ""}
        totalItems={totalSub}
        filledItems={filledSub}
        itemLabel="sub-elemen"
        showCatatanToggle
        catatanToggleLabel="Generate catatan naratif sekalian"
        isLoading={batchUpsert.isPending || upsertCatatan.isPending}
        onConfirm={handleConfirmQuickFill}
      />
    </>
  );
}

// ============================================================
// CompactDimensiRow — TableRow untuk 1 dimensi P5
// ============================================================
// Pattern KONSISTEN dengan siswa-list:
//   <TableRow onClick={...} className="cursor-pointer">
//     <TableCell w-12 px-3 mono+tabular>nomor.</TableCell>
//     <TableCell px-2 max-w-0 truncate>nama dimensi</TableCell>
//     <TableCell w-20 text-center>Badge filled/total</TableCell>
//     <TableCell w-8>chevron</TableCell>
//   </TableRow>
// ============================================================

function CompactDimensiRow({
  nomor,
  nama,
  filled,
  total,
  onClick,
}: {
  nomor: number;
  nama: string;
  filled: number;
  total: number;
  onClick: () => void;
}) {
  const isComplete = total > 0 && filled === total;
  const isPartial = filled > 0 && filled < total;

  return (
    <TableRow onClick={onClick} className="cursor-pointer">
      <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
        {nomor}.
      </TableCell>
      <TableCell className="px-2 py-2.5 max-w-0">
        <p
          className="text-sm font-medium truncate"
          title={nama}
        >
          {nama}
        </p>
      </TableCell>
      <TableCell className="w-20 px-2 py-2.5 text-center">
        <Badge
          variant={
            isComplete ? "default" : isPartial ? "secondary" : "outline"
          }
          className={cn(
            "text-xs tabular-nums",
            !isComplete && !isPartial && "text-muted-foreground"
          )}
        >
          {filled}/{total}
        </Badge>
      </TableCell>
      <TableCell className="w-8 px-2 py-2.5">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </TableCell>
    </TableRow>
  );
}