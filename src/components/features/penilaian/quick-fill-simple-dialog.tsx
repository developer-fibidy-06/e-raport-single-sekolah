// ============================================================
// FILE PATH: src/components/features/penilaian/quick-fill-simple-dialog.tsx
// ============================================================
// Dialog konfirmasi sederhana — untuk flow quick-fill yang TIDAK
// punya konsep "timpa" (misal: ekskul, yang auto-skip duplicate).
//
// Cukup: preview list item + counter "X akan ditambah, Y sudah ada"
// + tombol Batal / Lanjut.
//
// Pisah dari <QuickFillDialog /> yang lebih kompleks (radio + toggle)
// biar komponennya ringkas & fokus.
// ============================================================

"use client";

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
import { Wand2, Plus, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PreviewItem {
  key: string;
  label: string;
  /** Kalau true, item sudah ada sebelumnya & akan di-skip */
  alreadyExists?: boolean;
  /** Badge kanan opsional, misal predikat ekskul atau gender */
  rightBadge?: string;
}

export interface QuickFillSimpleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  title: string;
  description?: React.ReactNode;

  /** Label tombol konfirmasi, misal "Tambahkan" atau "Lanjut" */
  confirmLabel?: string;
  /** Icon di tombol konfirmasi — default Plus */
  confirmIcon?: "plus" | "wand";

  /** List item yang akan di-preview */
  items: PreviewItem[];
  /** Unit label untuk counter, misal "ekskul" */
  itemLabel: string;

  isLoading?: boolean;
  onConfirm: () => void;
}

export function QuickFillSimpleDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Tambahkan",
  confirmIcon = "plus",
  items,
  itemLabel,
  isLoading = false,
  onConfirm,
}: QuickFillSimpleDialogProps) {
  const toAdd = items.filter((i) => !i.alreadyExists);
  const existing = items.filter((i) => i.alreadyExists);

  const nothingToAdd = toAdd.length === 0;

  const ConfirmIcon = confirmIcon === "wand" ? Wand2 : Plus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Counter */}
          <div
            className={cn(
              "rounded-lg border p-3 space-y-1",
              nothingToAdd
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            )}
          >
            <div className="flex items-center gap-2">
              {nothingToAdd ? (
                <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">
                {nothingToAdd
                  ? `Semua ${itemLabel} sudah ditambahkan sebelumnya`
                  : `${toAdd.length} ${itemLabel} akan ditambahkan`}
                {existing.length > 0 && !nothingToAdd && (
                  <>
                    {" "}
                    <span className="text-muted-foreground font-normal">
                      · {existing.length} sudah ada, dilewati
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Preview list */}
          {items.length > 0 && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                Preview
              </p>
              <div className="divide-y rounded-lg border overflow-hidden">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm",
                      item.alreadyExists && "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <span className="flex-1 min-w-0 truncate">
                      {item.label}
                    </span>
                    {item.rightBadge && !item.alreadyExists && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {item.rightBadge}
                      </Badge>
                    )}
                    {item.alreadyExists && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground flex-shrink-0"
                      >
                        sudah ada
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
            onClick={onConfirm}
            disabled={isLoading || nothingToAdd}
            className="gap-1.5"
          >
            {isLoading ? (
              <Spinner className="size-3.5" />
            ) : (
              <ConfirmIcon className="h-3.5 w-3.5" />
            )}
            {isLoading ? "Memproses…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}