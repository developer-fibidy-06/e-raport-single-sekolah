// ============================================================
// FILE PATH: src/components/features/penilaian/quick-fill-panel.tsx
// ============================================================
// REPLACE. Generalize jadi reusable untuk Nilai/P5/Ekskul/Absensi.
//
// Perubahan:
//   - Prop names neutral: title, itemLabel, totalItems, filledItems
//   - Generic level type: TLevel extends string
//   - Levels & labels passed via props (bukan hardcoded P5)
//
// Pattern (A-keep dari versi sebelumnya):
//   - User select level → onChange langsung trigger dialog konfirmasi
//   - Reset ke placeholder setelah confirm/batal
//   - Native select = mobile-friendly + accessible by default
// ============================================================

"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Zap, Loader2 } from "lucide-react";

export interface QuickFillLevelOption<TLevel extends string> {
  value: TLevel;
  label: string;
  /** Description shown in option, e.g. "Berkembang Sesuai Harapan (nilai 82-88)" */
  desc: string;
}

interface Props<TLevel extends string> {
  /** Judul card, e.g. "Isi Cepat Semua Mapel" */
  title: string;
  /** Unit label untuk counter, e.g. "mapel", "sub-elemen", "ekskul" */
  itemLabel: string;
  /** Total item yang bisa diisi */
  totalItems: number;
  /** Item yang sudah terisi */
  filledItems: number;
  /** List level options yang muncul di dropdown */
  levels: ReadonlyArray<QuickFillLevelOption<TLevel>>;
  /** Pemicu dialog di parent saat user pilih level */
  onPickLevel: (level: TLevel) => void;
  /** Spinner saat batch processing jalan */
  isLoading?: boolean;
  /** Disable select (misal saat drawer detail terbuka) */
  disabled?: boolean;
}

export function QuickFillPanel<TLevel extends string>({
  title,
  itemLabel,
  totalItems,
  filledItems,
  levels,
  onPickLevel,
  isLoading = false,
  disabled = false,
}: Props<TLevel>) {
  const selectRef = useRef<HTMLSelectElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TLevel | "";
    if (!value) return;
    onPickLevel(value);
    // Reset ke placeholder supaya pilih level yang sama bisa trigger lagi
    requestAnimationFrame(() => {
      if (selectRef.current) selectRef.current.value = "";
    });
  };

  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardContent className="py-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Zap className="h-3.5 w-3.5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">{title}</p>
            <p className="text-xs text-muted-foreground">
              {filledItems} dari {totalItems} {itemLabel} terisi
            </p>
          </div>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Native select */}
        <NativeSelect
          ref={selectRef}
          defaultValue=""
          onChange={handleChange}
          disabled={disabled || isLoading}
          aria-label={`Pilih level untuk ${title.toLowerCase()}`}
        >
          <NativeSelectOption value="" disabled>
            Pilih level…
          </NativeSelectOption>
          {levels.map((lvl) => (
            <NativeSelectOption key={lvl.value} value={lvl.value}>
              {lvl.label} — {lvl.desc}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </CardContent>
    </Card>
  );
}