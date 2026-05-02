// ============================================================
// FILE PATH: src/components/features/penilaian/nilai-form.tsx
// ============================================================
// REPLACE. Sync ke schema v2.1:
//   - CompactRow: drop kode logic, langsung pakai mapel.nama
//   - existingByMapel sync: kompetensi_dasar_id selalu init null
//     (field di-drop dari DB, transient client-side aja)
//   - handleSaveAll: drop kompetensi_dasar_id dari payload
//   - KELOMPOK_TITLE & KELOMPOK_ORDER: tambah "muatan_lokal"
//   - numberMap: umum + muatan_lokal + peminatan_ips share counter,
//     khusus reset to 1
// ============================================================

"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  useMataPelajaran,
  useNilaiByEnrollment,
  useBatchUpsertNilai,
  derivePredikat,
  getCapaianKompetensi,
  fetchFirstKdByMapel,
} from "@/hooks";
import type { MataPelajaran, KelompokMapel, PredikatP5 } from "@/types";
import {
  generateNilai,
  QUICK_FILL_LABELS,
  QUICK_FILL_LEVELS,
  QUICK_FILL_RANGES,
} from "@/lib/quick-fill";
import { QuickFillPanel, type QuickFillLevelOption } from "./quick-fill-panel";
import { QuickFillDialog } from "./quick-fill-dialog";
import {
  NilaiDetailDrawer,
  type NilaiDraftPartial,
} from "./nilai-detail-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const KELOMPOK_TITLE: Record<KelompokMapel, string> = {
  umum: "Kelompok Umum",
  muatan_lokal: "Muatan Lokal",
  peminatan_ips: "Peminatan IPS",
  khusus: "Kelompok Khusus",
};

const KELOMPOK_ORDER: KelompokMapel[] = [
  "umum",
  "muatan_lokal",
  "peminatan_ips",
  "khusus",
];

const NILAI_LEVELS: ReadonlyArray<QuickFillLevelOption<PredikatP5>> =
  QUICK_FILL_LEVELS.map((level) => {
    const meta = QUICK_FILL_LABELS[level];
    const range = QUICK_FILL_RANGES[level];
    return {
      value: level,
      label: meta.label,
      desc: `${meta.desc} (nilai ${range.min}-${range.max})`,
    };
  });

// ============================================================
// Types
// ============================================================

type NilaiDraft = NilaiDraftPartial & {
  mata_pelajaran_id: number;
  isDirty: boolean;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export function NilaiForm({
  enrollmentId,
  paket,
  siswaAgama,
}: {
  enrollmentId: string;
  paket: string;
  siswaAgama: string | null;
}) {
  const { data: mapelList = [], isLoading: loadingMapel } =
    useMataPelajaran(paket, undefined, siswaAgama);
  const { data: nilaiList = [], isLoading: loadingNilai } =
    useNilaiByEnrollment(enrollmentId);
  const batchUpsert = useBatchUpsertNilai();

  const [drafts, setDrafts] = useState<Map<number, NilaiDraft>>(new Map());
  const [quickFillLoading, setQuickFillLoading] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<PredikatP5 | null>(null);
  const [openMapelId, setOpenMapelId] = useState<number | null>(null);

  // Sync drafts dari server data.
  // v2.1: kompetensi_dasar_id field di-drop dari DB, jadi sync selalu null.
  // KD picker di drawer tetap berfungsi sebagai transient UX helper,
  // tapi pilihannya tidak persisted.
  useEffect(() => {
    if (loadingMapel || loadingNilai) return;
    setDrafts((prev) => {
      const next = new Map(prev);
      const existingByMapel = new Map<number, (typeof nilaiList)[number]>();
      nilaiList.forEach((n) => existingByMapel.set(n.mata_pelajaran_id, n));

      mapelList.forEach((mapel) => {
        const current = next.get(mapel.id);
        if (!current || !current.isDirty) {
          const existing = existingByMapel.get(mapel.id);
          next.set(mapel.id, {
            mata_pelajaran_id: mapel.id,
            kompetensi_dasar_id: null, // v2.1: transient only, never from DB
            nilai_akhir: existing?.nilai_akhir ?? null,
            predikat: existing?.predikat ?? null,
            capaian_kompetensi: existing?.capaian_kompetensi ?? null,
            capaianEditedManually: !!existing?.capaian_kompetensi,
            isDirty: false,
          });
        }
      });

      const mapelIds = new Set(mapelList.map((m) => m.id));
      next.forEach((_, id) => {
        if (!mapelIds.has(id)) next.delete(id);
      });

      return next;
    });
  }, [mapelList, nilaiList, loadingMapel, loadingNilai]);

  const patchDraft = useCallback(
    (mapelId: number, partial: NilaiDraftPartial) => {
      setDrafts((prev) => {
        const current = prev.get(mapelId);
        if (!current) return prev;
        const next = new Map(prev);
        next.set(mapelId, { ...current, ...partial, isDirty: true });
        return next;
      });
    },
    []
  );

  const markClean = useCallback((mapelId: number) => {
    setDrafts((prev) => {
      const current = prev.get(mapelId);
      if (!current || !current.isDirty) return prev;
      const next = new Map(prev);
      next.set(mapelId, { ...current, isDirty: false });
      return next;
    });
  }, []);

  const markAllClean = useCallback(() => {
    setDrafts((prev) => {
      const next = new Map(prev);
      next.forEach((d, k) => {
        if (d.isDirty) next.set(k, { ...d, isDirty: false });
      });
      return next;
    });
  }, []);

  const filledCount = useMemo(() => {
    let c = 0;
    drafts.forEach((d) => {
      if (
        d.nilai_akhir !== null ||
        !!d.predikat ||
        !!d.capaian_kompetensi
      )
        c++;
    });
    return c;
  }, [drafts]);

  const dirtyCount = useMemo(() => {
    let c = 0;
    drafts.forEach((d) => {
      if (d.isDirty) c++;
    });
    return c;
  }, [drafts]);

  // ─── Quick-fill batch ─────────────────────────────────────
  const handleConfirmQuickFill = async (opts: {
    overwrite: boolean;
    withCatatan: boolean;
  }) => {
    if (!pendingLevel || mapelList.length === 0 || quickFillLoading) return;
    const level = pendingLevel;
    setQuickFillLoading(true);
    const snapshot = new Map(drafts);

    try {
      const firstKdMap = await fetchFirstKdByMapel(mapelList.map((m) => m.id));
      const updates: Array<{ id: number; draft: NilaiDraft }> = [];

      for (const mapel of mapelList) {
        const current = drafts.get(mapel.id);
        if (!current) continue;

        const hasValue =
          current.nilai_akhir !== null ||
          !!current.predikat ||
          !!current.capaian_kompetensi;
        if (hasValue && !opts.overwrite) continue;

        const nilai = generateNilai(level);
        const predikat = (await derivePredikat(nilai)) ?? null;
        const kdId =
          current.kompetensi_dasar_id ?? firstKdMap.get(mapel.id) ?? null;

        let capaian = current.capaian_kompetensi;
        if (kdId) {
          const text = await getCapaianKompetensi(kdId, nilai);
          if (text) capaian = text;
        }

        updates.push({
          id: mapel.id,
          draft: {
            ...current,
            nilai_akhir: nilai,
            predikat,
            kompetensi_dasar_id: kdId, // transient, untuk UX next edit
            capaian_kompetensi: capaian,
            capaianEditedManually: false,
            isDirty: true,
          },
        });
      }

      setDrafts((prev) => {
        const next = new Map(prev);
        updates.forEach(({ id, draft }) => next.set(id, draft));
        return next;
      });

      setPendingLevel(null);

      if (updates.length === 0) {
        toast.info(
          opts.overwrite
            ? "Tidak ada mapel untuk diisi."
            : "Semua mapel sudah terisi. Pilih strategi 'Timpa Semua' untuk generate ulang."
        );
      } else {
        toast.success(
          `${updates.length} mapel diisi cepat sebagai ${level} (${QUICK_FILL_LABELS[level].desc})`,
          {
            action: { label: "Batal", onClick: () => setDrafts(snapshot) },
            duration: 5000,
          }
        );
      }
    } finally {
      setQuickFillLoading(false);
    }
  };

  // ─── Save semua ───────────────────────────────────────────
  // v2.1: drop kompetensi_dasar_id dari payload (kolom dihapus dari DB).
  const handleSaveAll = async () => {
    const rows: Array<{
      enrollment_id: string;
      mata_pelajaran_id: number;
      nilai_akhir: number | null;
      predikat: string | null;
      capaian_kompetensi: string | null;
    }> = [];
    drafts.forEach((d) => {
      if (!d.isDirty) return;
      rows.push({
        enrollment_id: enrollmentId,
        mata_pelajaran_id: d.mata_pelajaran_id,
        nilai_akhir: d.nilai_akhir,
        predikat: d.predikat,
        capaian_kompetensi: d.capaian_kompetensi,
      });
    });
    if (rows.length === 0) return;
    try {
      await batchUpsert.mutateAsync(rows);
      markAllClean();
    } catch {
      // toast handled
    }
  };

  // ─── Group by kelompok ────────────────────────────────────
  const grouped = useMemo(() => {
    const g: Record<KelompokMapel, MataPelajaran[]> = {
      umum: [],
      muatan_lokal: [],
      peminatan_ips: [],
      khusus: [],
    };
    mapelList.forEach((m) => {
      const k = (m.kelompok as KelompokMapel) ?? "umum";
      if (g[k]) g[k].push(m);
    });
    return g;
  }, [mapelList]);

  // ─── Compute global numbering ─────────────────────────────
  // Umum + Muatan Lokal + Peminatan IPS share counter.
  // Khusus reset to 1 (ikut konvensi rapor PKBM).
  const numberMap = useMemo(() => {
    const map = new Map<number, number>();
    let counter = 1;
    grouped.umum.forEach((m) => map.set(m.id, counter++));
    grouped.muatan_lokal.forEach((m) => map.set(m.id, counter++));
    grouped.peminatan_ips.forEach((m) => map.set(m.id, counter++));
    let khususCounter = 1;
    grouped.khusus.forEach((m) => map.set(m.id, khususCounter++));
    return map;
  }, [grouped]);

  // ─── Find open mapel ──────────────────────────────────────
  const openMapel = useMemo(
    () => mapelList.find((m) => m.id === openMapelId) ?? null,
    [mapelList, openMapelId]
  );
  const openDraft = openMapelId !== null ? drafts.get(openMapelId) : null;

  // ─── Loading & empty states ───────────────────────────────
  if (loadingMapel || loadingNilai) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat nilai…
      </div>
    );
  }

  if (mapelList.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Belum ada mata pelajaran untuk {paket}. Minta admin tambahkan di
          menu Administrasi → Mata Pelajaran.
        </CardContent>
      </Card>
    );
  }

  const isDrawerOpen = openMapelId !== null;

  return (
    <>
      <div
        className={cn(
          "space-y-4",
          dirtyCount > 0 && !isDrawerOpen && "pb-24"
        )}
      >
        {/* Warning kalau siswa belum punya agama */}
        {!siswaAgama && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-medium text-amber-900">
                Agama siswa belum diisi
              </p>
              <p className="text-amber-800 mt-0.5">
                Mapel Pendidikan Agama tidak muncul di list ini. Lengkapi data
                agama siswa via menu <strong>Administrasi → Siswa</strong>{" "}
                terlebih dahulu.
              </p>
            </div>
          </div>
        )}

        {/* Quick-fill panel */}
        <QuickFillPanel<PredikatP5>
          title="Isi Cepat Semua Mapel"
          itemLabel="mapel"
          totalItems={mapelList.length}
          filledItems={filledCount}
          levels={NILAI_LEVELS}
          onPickLevel={(level) => setPendingLevel(level)}
          isLoading={quickFillLoading}
          disabled={isDrawerOpen}
        />

        {/* Compact list per kelompok */}
        {KELOMPOK_ORDER.filter((k) => grouped[k].length > 0).map((kelompok) => (
          <div key={kelompok} className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {KELOMPOK_TITLE[kelompok]}
            </p>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 px-3 text-xs">#</TableHead>
                    <TableHead className="px-2 text-xs">
                      Mata Pelajaran
                    </TableHead>
                    <TableHead className="w-16 px-2 text-xs text-right">
                      Nilai
                    </TableHead>
                    <TableHead className="w-8 px-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped[kelompok].map((mapel) => {
                    const draft = drafts.get(mapel.id);
                    const nomor = numberMap.get(mapel.id) ?? 0;
                    return (
                      <CompactRow
                        key={mapel.id}
                        mapel={mapel}
                        nomor={nomor}
                        draft={draft}
                        onClick={() => setOpenMapelId(mapel.id)}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer detail per-mapel */}
      <NilaiDetailDrawer
        open={isDrawerOpen}
        onOpenChange={(v) => {
          if (!v) setOpenMapelId(null);
        }}
        mapel={openMapel}
        enrollmentId={enrollmentId}
        initialDraft={
          openDraft ?? {
            kompetensi_dasar_id: null,
            nilai_akhir: null,
            predikat: null,
            capaian_kompetensi: null,
            capaianEditedManually: false,
          }
        }
        onCommitDraft={(next) => {
          if (openMapelId !== null) patchDraft(openMapelId, next);
        }}
        onSaved={() => {
          if (openMapelId !== null) markClean(openMapelId);
        }}
      />

      {/* Dialog konfirmasi quick-fill */}
      <QuickFillDialog
        open={pendingLevel !== null}
        onOpenChange={(v) => {
          if (!v) setPendingLevel(null);
        }}
        title="Isi Cepat Nilai Mapel"
        levelLabel={pendingLevel ?? ""}
        levelDesc={pendingLevel ? QUICK_FILL_LABELS[pendingLevel].desc : ""}
        totalItems={mapelList.length}
        filledItems={filledCount}
        itemLabel="mapel"
        showCatatanToggle={false}
        isLoading={quickFillLoading}
        onConfirm={handleConfirmQuickFill}
      />

      {/* Floating Save All */}
      {dirtyCount > 0 && !isDrawerOpen && (
        <div
          className={cn(
            "fixed z-40 pointer-events-none",
            "bottom-20 md:bottom-6",
            "left-4 right-4 md:left-auto md:right-6 md:max-w-md"
          )}
        >
          <div className="pointer-events-auto rounded-xl border-2 border-primary/40 bg-background shadow-2xl flex items-center gap-3 p-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {dirtyCount} perubahan belum disimpan
              </p>
              <p className="text-xs text-muted-foreground">
                Simpan sekaligus agar tidak hilang
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={batchUpsert.isPending}
            >
              {batchUpsert.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1" />
              )}
              Simpan Semua
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// CompactRow — TableRow dalam list compact
// ============================================================
// v2.1: drop kode logic, langsung pakai mapel.nama dengan truncate.
// ============================================================

function CompactRow({
  mapel,
  nomor,
  draft,
  onClick,
}: {
  mapel: MataPelajaran;
  nomor: number;
  draft: NilaiDraft | undefined;
  onClick: () => void;
}) {
  const nilai = draft?.nilai_akhir;
  const isDirty = draft?.isDirty ?? false;

  return (
    <TableRow
      onClick={onClick}
      className={cn(
        "cursor-pointer",
        isDirty && "bg-amber-50/60 hover:bg-amber-100/70"
      )}
    >
      <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
        {nomor}.
      </TableCell>
      <TableCell className="px-2 py-2.5 max-w-0">
        <p className="text-sm truncate" title={mapel.nama}>
          {mapel.nama}
        </p>
      </TableCell>
      <TableCell className="w-16 px-2 py-2.5 text-right">
        <span
          className={cn(
            "text-sm tabular-nums",
            nilai !== null && nilai !== undefined
              ? "font-semibold"
              : "text-muted-foreground"
          )}
        >
          {nilai !== null && nilai !== undefined ? nilai : "—"}
        </span>
      </TableCell>
      <TableCell className="w-8 px-2 py-2.5">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </TableCell>
    </TableRow>
  );
}