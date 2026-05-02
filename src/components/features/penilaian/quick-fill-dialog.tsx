// ============================================================
// FILE PATH: src/components/features/penilaian/quick-fill-dialog.tsx
// ============================================================
// Reusable dialog konfirmasi untuk SEMUA flow Quick-Fill:
//   - Nilai Mapel
//   - P5 (dengan opsi catatan)
//   - Absensi (dengan opsi catatan wali) — nanti
//   - Ekskul — nanti
//
// Pola konsisten:
//   1. Konfirmasi SELALU muncul (walau data kosong) → predictable
//   2. Kalau ada data existing → tampilkan counter "X dari Y sudah terisi"
//   3. Radio: "Timpa semua" vs "Hanya isi yang kosong"
//   4. (Optional) toggle "Generate catatan sekalian" — default ON
// ============================================================

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Wand2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickFillDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  /** Judul dialog, misal "Isi Cepat Nilai Mapel" atau "Isi Cepat P5" */
  title: string;
  /** Level yang aktif, misal "BSH" atau "Biasa" — untuk tampilan */
  levelLabel: string;
  /** Short description level, misal "Berkembang Sesuai Harapan" */
  levelDesc?: string;

  /** Counter: total item yang akan diisi */
  totalItems: number;
  /** Counter: jumlah item yang sudah terisi */
  filledItems: number;
  /** Unit item untuk label, misal "mapel", "sub-elemen", "ekskul" */
  itemLabel: string;

  /** Kalau true, munculkan toggle catatan. Kalau false, tidak ada toggle. */
  showCatatanToggle?: boolean;
  /** Label toggle catatan, misal "Generate catatan naratif sekalian" */
  catatanToggleLabel?: string;

  /** Apakah proses sedang berjalan (spinner di button confirm) */
  isLoading?: boolean;

  /** Callback konfirmasi. `overwrite`=true berarti timpa semua. `withCatatan` hanya relevan kalau showCatatanToggle */
  onConfirm: (opts: { overwrite: boolean; withCatatan: boolean }) => void;
}

export function QuickFillDialog({
  open,
  onOpenChange,
  title,
  levelLabel,
  levelDesc,
  totalItems,
  filledItems,
  itemLabel,
  showCatatanToggle = false,
  catatanToggleLabel = "Generate catatan naratif sekalian",
  isLoading = false,
  onConfirm,
}: QuickFillDialogProps) {
  const emptyItems = totalItems - filledItems;
  const hasExisting = filledItems > 0;

  // Default: kalau ada existing → "kosong saja" (aman).
  // Kalau memang kosong semua → "timpa" (tidak relevan, tapi biar button siap).
  const [overwrite, setOverwrite] = useState<boolean>(!hasExisting);
  const [withCatatan, setWithCatatan] = useState<boolean>(true);

  // Reset state tiap kali dialog open
  useEffect(() => {
    if (open) {
      setOverwrite(!hasExisting);
      setWithCatatan(true);
    }
  }, [open, hasExisting]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Target level:{" "}
            <span className="font-semibold text-foreground font-mono">
              {levelLabel}
            </span>
            {levelDesc && (
              <span className="text-muted-foreground"> — {levelDesc}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status counter */}
          <div
            className={cn(
              "rounded-lg border p-3 space-y-1",
              hasExisting
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            )}
          >
            <div className="flex items-center gap-2">
              {hasExisting ? (
                <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">
                {hasExisting
                  ? `${filledItems} dari ${totalItems} ${itemLabel} sudah terisi`
                  : `${totalItems} ${itemLabel} siap diisi`}
              </p>
            </div>
            {hasExisting && (
              <p className="text-xs text-muted-foreground pl-6">
                Pilih strategi pengisian di bawah.
              </p>
            )}
          </div>

          {/* Radio: overwrite vs kosong saja */}
          {hasExisting ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Strategi
              </p>

              <RadioCard
                checked={!overwrite}
                onChange={() => setOverwrite(false)}
                title={`Hanya isi yang kosong (${emptyItems} ${itemLabel})`}
                description="Data yang sudah terisi tidak akan diubah"
                recommended
              />

              <RadioCard
                checked={overwrite}
                onChange={() => setOverwrite(true)}
                title={`Timpa semua (${totalItems} ${itemLabel})`}
                description="Semua data akan di-generate ulang"
                danger
              />
            </div>
          ) : (
            // Kalau kosong semua, tidak perlu radio — implisit overwrite=true
            <div className="text-xs text-muted-foreground px-1">
              Semua {itemLabel} kosong. Akan diisi dengan level{" "}
              <span className="font-mono font-semibold">{levelLabel}</span>.
            </div>
          )}

          {/* Toggle catatan */}
          {showCatatanToggle && (
            <label
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer select-none",
                "hover:bg-muted/50 transition-colors",
                withCatatan && "border-primary/30 bg-primary/5"
              )}
            >
              <input
                type="checkbox"
                checked={withCatatan}
                onChange={(e) => setWithCatatan(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-input accent-primary cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {catatanToggleLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Catatan naratif akan dibuat berdasarkan level{" "}
                  <span className="font-mono">{levelLabel}</span>
                </p>
              </div>
            </label>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={() =>
              onConfirm({
                overwrite: hasExisting ? overwrite : true,
                withCatatan: showCatatanToggle ? withCatatan : false,
              })
            }
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Spinner className="size-3.5" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {isLoading ? "Memproses…" : "Ya, Isi Cepat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────
// Radio card — visually richer than plain radio input
// ────────────────────────────────────────────────────────────
function RadioCard({
  checked,
  onChange,
  title,
  description,
  recommended,
  danger,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  recommended?: boolean;
  danger?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer select-none transition-colors",
        "hover:bg-muted/50",
        checked && !danger && "border-primary bg-primary/5",
        checked && danger && "border-destructive/40 bg-destructive/5",
        !checked && "border-border"
      )}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 mt-0.5 accent-primary cursor-pointer flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{title}</span>
          {recommended && (
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              disarankan
            </Badge>
          )}
          {danger && checked && (
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 bg-red-50 text-red-700 border-red-200"
            >
              hati-hati
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </label>
  );
}