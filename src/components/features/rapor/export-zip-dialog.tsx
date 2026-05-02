// ============================================================
// FILE PATH: src/components/features/rapor/export-zip-dialog.tsx
// ============================================================
// REPLACE. Support 2 mode dari ExportContext:
//
//   1. SINGLE (single-kelas) — UI sama persis seperti sebelumnya:
//      "Kelas 12A · 5 rapor"
//
//   2. MULTI (per-paket) — UI baru:
//      "Paket C · 3 kelas · 87 rapor"
//      Progress nampilin nama kelas current saat lagi proses
//
// Type guard ada di lib (`isMulti`) — di sini kita cuma cek
// shape ctx pakai property check inline biar gak butuh import
// internal helper.
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  exportRaporZip,
  type ExportContext,
  type ExportProgress,
} from "@/lib/export-rapor-zip";
import { Download, Loader2, Package, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Phase = "confirm" | "progress" | "error";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ctx: ExportContext | null;
}

// ============================================================
// Helpers — derive UI info from ctx (handle both modes)
// ============================================================

interface CtxSummary {
  isMulti: boolean;
  title: string; // e.g. "Kelas 12A" / "Paket C"
  subtitle: string; // tahun + semester
  totalRapor: number;
  kelasCount: number; // for multi: jumlah kelas; for single: 1
}

function summarizeCtx(ctx: ExportContext): CtxSummary {
  if ("kelasGroups" in ctx) {
    // Multi
    const total = ctx.kelasGroups.reduce(
      (sum, kg) => sum + kg.enrollmentIds.length,
      0
    );
    return {
      isMulti: true,
      title: ctx.paketInfo.paket,
      subtitle: `${ctx.paketInfo.tahunNama} · Sem ${ctx.paketInfo.semester}`,
      totalRapor: total,
      kelasCount: ctx.kelasGroups.length,
    };
  }
  // Single
  return {
    isMulti: false,
    title: ctx.kelasInfo.namaKelas,
    subtitle: `${ctx.kelasInfo.tahunNama} · Sem ${ctx.kelasInfo.semester}`,
    totalRapor: ctx.enrollmentIds.length,
    kelasCount: 1,
  };
}

// ============================================================
// MAIN
// ============================================================

export function ExportZipDialog({ open, onOpenChange, ctx }: Props) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("confirm");
      setProgress(null);
      setErrorMsg(null);
    } else {
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [open]);

  if (!ctx) return null;

  const summary = summarizeCtx(ctx);

  const estimSec = Math.ceil(summary.totalRapor * 1.5);
  const estimText =
    estimSec < 60
      ? `~${estimSec} detik`
      : `~${Math.floor(estimSec / 60)} menit ${estimSec % 60} detik`;

  const handleStart = async () => {
    setPhase("progress");
    setErrorMsg(null);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await exportRaporZip({
        ctx,
        signal: ac.signal,
        onProgress: (p) => setProgress(p),
      });
      const successMsg = summary.isMulti
        ? `ZIP berhasil dibuat — ${summary.totalRapor} rapor dari ${summary.title} (${summary.kelasCount} kelas)`
        : `ZIP berhasil dibuat — ${summary.totalRapor} rapor dari ${summary.title}`;
      toast.success(successMsg);
      onOpenChange(false);
    } catch (err) {
      const e = err as Error;
      if (e.name === "AbortError") {
        toast.info("Export dibatalkan");
        onOpenChange(false);
        return;
      }
      setErrorMsg(e.message ?? "Terjadi kesalahan saat export.");
      setPhase("error");
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const dismissable = phase !== "progress";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !dismissable) return;
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => {
          if (!dismissable) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!dismissable) e.preventDefault();
        }}
      >
        {phase === "confirm" && (
          <ConfirmContent
            summary={summary}
            estimText={estimText}
            onStart={handleStart}
            onCancel={() => onOpenChange(false)}
          />
        )}

        {phase === "progress" && (
          <ProgressContent
            summary={summary}
            progress={progress}
            onCancel={handleCancel}
          />
        )}

        {phase === "error" && (
          <ErrorContent
            message={errorMsg ?? "Unknown error"}
            onRetry={handleStart}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// PHASE 1 — CONFIRM
// ============================================================

function ConfirmContent({
  summary,
  estimText,
  onStart,
  onCancel,
}: {
  summary: CtxSummary;
  estimText: string;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Download ZIP Rapor
        </DialogTitle>
        <DialogDescription>
          {summary.isMulti
            ? "Bundle rapor seluruh kelas di paket ini, terorganisir per folder kelas."
            : "Bundle rapor 1 kelas dalam 1 file ZIP untuk arsip."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-2">
        <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">
              {summary.isMulti ? "Paket" : "Kelas"}
            </span>
            <span className="font-medium">{summary.title}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Tahun Pelajaran</span>
            <span className="font-medium">{summary.subtitle}</span>
          </div>
          {summary.isMulti && (
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">Jumlah kelas</span>
              <span className="font-medium">{summary.kelasCount} kelas</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Jumlah rapor</span>
            <span className="font-medium">{summary.totalRapor} PDF</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Estimasi waktu</span>
            <span className="font-medium">{estimText}</span>
          </div>
        </div>

        {summary.isMulti && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            📁 Struktur ZIP: <code className="bg-white px-1 rounded">Kelas-XXX/</code>{" "}
            sebagai folder per kelas, isi PDF di dalamnya.
          </div>
        )}

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          ⚠️ Jangan tutup tab browser selama proses berjalan.
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button onClick={onStart} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Download ZIP
        </Button>
      </DialogFooter>
    </>
  );
}

// ============================================================
// PHASE 2 — PROGRESS
// ============================================================

const PHASE_LABEL: Record<ExportProgress["phase"], string> = {
  fetching: "Mengambil data",
  rendering: "Render PDF",
  zipping: "Kompres ZIP",
  done: "Selesai",
};

function ProgressContent({
  summary,
  progress,
  onCancel,
}: {
  summary: CtxSummary;
  progress: ExportProgress | null;
  onCancel: () => void;
}) {
  const total = summary.totalRapor;
  const current = progress?.current ?? 0;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const phase = progress?.phase ?? "fetching";

  const displayPct = phase === "zipping" || phase === "done" ? 100 : pct;
  const displayCurrent =
    phase === "zipping" || phase === "done" ? total : current;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Memproses Rapor…
        </DialogTitle>
        <DialogDescription>
          {summary.isMulti
            ? `${summary.title} · ${summary.kelasCount} kelas · ${total} rapor`
            : `${summary.title} · ${total} rapor`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {displayCurrent} / {total}
            </span>
            <span className="font-semibold tabular-nums">{displayPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-200 ease-out"
              style={{ width: `${displayPct}%` }}
            />
          </div>
        </div>

        {progress && progress.currentName && phase !== "zipping" && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            {progress.currentKelasName && (
              <div>
                <span className="text-foreground/60 mr-1">Kelas:</span>
                <span className="text-foreground font-medium">
                  {progress.currentKelasName}
                </span>
              </div>
            )}
            <div>
              <span className="text-foreground/60 mr-1">
                {PHASE_LABEL[phase]}:
              </span>
              <span className="text-foreground font-medium">
                {progress.currentName}
              </span>
            </div>
          </div>
        )}

        {phase === "zipping" && (
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">
              Membuat file ZIP…
            </span>
          </div>
        )}

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          ⚠️ Jangan tutup tab browser. Tunggu sampai selesai.
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={phase === "zipping" || phase === "done"}
          className="gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Batalkan
        </Button>
      </DialogFooter>
    </>
  );
}

// ============================================================
// PHASE 3 — ERROR
// ============================================================

function ErrorContent({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          Gagal Export
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-2 py-2">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {message}
        </div>
        <p className="text-xs text-muted-foreground">
          Coba lagi atau cek koneksi internet kalau masalah berlanjut.
        </p>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
        <Button onClick={onRetry} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Coba Lagi
        </Button>
      </DialogFooter>
    </>
  );
}