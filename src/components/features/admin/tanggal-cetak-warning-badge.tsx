// ============================================================
// FILE PATH: src/components/features/admin/tanggal-cetak-warning-badge.tsx
// ============================================================
"use client";

import { useMemo } from "react";
import {
  useTPMissingTanggalCetak,
  useTanggalCetakByTP,
  PAKET_LIST,
} from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// 1. GLOBAL WARNING BANNER
// ============================================================

export function TanggalCetakGlobalWarning({
  className,
  onlyAktif = false,
}: {
  className?: string;
  onlyAktif?: boolean;
}) {
  const { data: missing, isLoading } = useTPMissingTanggalCetak();

  const filtered = useMemo(() => {
    if (!missing) return [];
    return onlyAktif ? missing.filter((m) => m.is_aktif) : missing;
  }, [missing, onlyAktif]);

  const grouped = useMemo(() => {
    const g: Record<string, { nama: string; semester: number; is_aktif: boolean; paketList: string[] }> = {};
    filtered.forEach((m) => {
      const key = String(m.tahun_pelajaran_id);
      if (!g[key]) {
        g[key] = {
          nama: m.tahun_pelajaran_nama,
          semester: m.semester,
          is_aktif: m.is_aktif,
          paketList: [],
        };
      }
      g[key].paketList.push(m.paket);
    });
    return Object.entries(g);
  }, [filtered]);

  if (isLoading) return null;
  if (filtered.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-rose-300 bg-rose-50 p-3",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-rose-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 text-sm space-y-2">
          <p className="font-medium text-rose-900">
            {filtered.length} entri tanggal cetak belum di-set
          </p>
          <p className="text-xs text-rose-800">
            Rapor untuk paket berikut <strong>tidak bisa dicetak</strong>{" "}
            sampai admin set tanggalnya. Klik tahun pelajaran terkait untuk set.
          </p>
          <ul className="text-xs text-rose-900 space-y-1 mt-2">
            {grouped.map(([tpId, info]) => (
              <li key={tpId} className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium">
                  {info.nama} · Smt {info.semester}
                </span>
                {info.is_aktif && (
                  <Badge
                    variant="outline"
                    className="text-[9px] h-4 px-1 bg-amber-100 text-amber-800 border-amber-300"
                  >
                    AKTIF
                  </Badge>
                )}
                <span className="text-rose-700">→ belum:</span>
                {info.paketList.map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="text-[10px] h-4 px-1.5 bg-rose-100 text-rose-800 border-rose-300"
                  >
                    {p}
                  </Badge>
                ))}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 2. ROW-LEVEL BADGE (per TP)
// ============================================================

export function TanggalCetakRowBadge({
  tahunPelajaranId,
  className,
}: {
  tahunPelajaranId: number;
  className?: string;
}) {
  const { data: tanggalMap, isLoading } = useTanggalCetakByTP(tahunPelajaranId);

  if (isLoading) return null;
  if (!tanggalMap) return null;

  const setCount = PAKET_LIST.filter((p) => !!tanggalMap[p]).length;
  const totalCount = PAKET_LIST.length;
  const allSet = setCount === totalCount;
  const noneSet = setCount === 0;

  if (allSet) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] h-5 px-1.5 bg-emerald-100 text-emerald-800 border-emerald-300 gap-1",
          className
        )}
        title="Semua paket sudah di-set tanggal cetaknya"
      >
        <CheckCircle2 className="h-2.5 w-2.5" />
        Tanggal cetak: lengkap
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] h-5 px-1.5 gap-1",
        noneSet
          ? "bg-rose-100 text-rose-800 border-rose-300"
          : "bg-amber-100 text-amber-800 border-amber-300",
        className
      )}
      title={`${totalCount - setCount} paket belum di-set tanggal cetaknya`}
    >
      <AlertTriangle className="h-2.5 w-2.5" />
      Tanggal cetak: {setCount}/{totalCount}
    </Badge>
  );
}