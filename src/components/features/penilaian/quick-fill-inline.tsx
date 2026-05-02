// ============================================================
// FILE PATH: src/components/features/penilaian/quick-fill-inline.tsx
// ============================================================
// Tombol quick-fill kecil per-mapel. Dipakai kalau operator udah
// global-fill BSH tapi mapel tertentu sebetulnya SB atau SAB.
// ============================================================

"use client";

import { Button } from "@/components/ui/button";
import type { PredikatP5 } from "@/types";
import { QUICK_FILL_LABELS, QUICK_FILL_LEVELS } from "@/lib/quick-fill";

interface Props {
  onFill: (level: PredikatP5) => void;
  disabled?: boolean;
}

export function QuickFillInline({ onFill, disabled = false }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
        Isi cepat:
      </span>
      <div className="flex gap-1">
        {QUICK_FILL_LEVELS.map((level) => {
          const meta = QUICK_FILL_LABELS[level];
          return (
            <Button
              key={level}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px] font-bold"
              onClick={() => onFill(level)}
              disabled={disabled}
              title={meta.desc}
            >
              {level}
            </Button>
          );
        })}
      </div>
    </div>
  );
}