// ============================================================
// FILE PATH: src/components/features/admin/tanggal-cetak-paket-form.tsx
// ============================================================
// FILE BARU. Komponen reusable untuk set tanggal cetak per paket
// (3 date picker: Paket A, Paket B, Paket C) untuk satu tahun
// pelajaran.
//
// Cara pakai (di tab-tahun-pelajaran.tsx):
//
//   <TanggalCetakPaketForm tahunPelajaranId={tp.id} />
//
// Bisa di-embed di:
//   - Drawer detail tahun pelajaran (saat klik row)
//   - Dialog edit tahun pelajaran
//   - Section terpisah di tab Tahun & Semester
//
// Behavior:
//   - Auto-fetch tanggal current via useTanggalCetakByTP
//   - Tiap paket punya date picker independent
//   - Save per paket (gak harus isi 3 sekaligus)
//   - Tombol Hapus per paket (kalau admin mau reset)
//   - Badge merah "Belum di-set" kalau tanggal kosong
// ============================================================

"use client";

import { useState, useEffect } from "react";
import {
  useTanggalCetakByTP,
  useUpsertTanggalCetak,
  useDeleteTanggalCetak,
  PAKET_LIST,
  type PaketType,
} from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tahunPelajaranId: number;
  className?: string;
}

export function TanggalCetakPaketForm({ tahunPelajaranId, className }: Props) {
  const { data: tanggalMap, isLoading } = useTanggalCetakByTP(tahunPelajaranId);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 py-4 text-sm text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat tanggal cetak…
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Tanggal Cetak Rapor
        </h4>
        <p className="text-xs text-muted-foreground">
          Set tanggal cetak rapor per paket. Tanggal ini muncul di TTD rapor.
          Rapor <strong>tidak bisa dicetak</strong> kalau tanggalnya belum di-set.
        </p>
      </div>

      <div className="space-y-2">
        {PAKET_LIST.map((paket) => (
          <PaketRow
            key={paket}
            tahunPelajaranId={tahunPelajaranId}
            paket={paket}
            currentValue={tanggalMap?.[paket] ?? null}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: Row per paket
// ============================================================

function PaketRow({
  tahunPelajaranId,
  paket,
  currentValue,
}: {
  tahunPelajaranId: number;
  paket: PaketType;
  currentValue: string | null;
}) {
  const [draft, setDraft] = useState<string>(currentValue ?? "");
  const upsertMut = useUpsertTanggalCetak();
  const deleteMut = useDeleteTanggalCetak();

  // Sync draft kalau currentValue berubah dari luar
  useEffect(() => {
    setDraft(currentValue ?? "");
  }, [currentValue]);

  const isSet = !!currentValue;
  const hasChange = draft !== (currentValue ?? "");
  const canSave = !!draft && hasChange && !upsertMut.isPending;

  const handleSave = () => {
    if (!draft) return;
    upsertMut.mutate({
      tahun_pelajaran_id: tahunPelajaranId,
      paket,
      tanggal_cetak: draft,
    });
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2 transition-colors",
        isSet
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-rose-300 bg-rose-50/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label className="font-medium text-sm">{paket}</Label>
        {isSet ? (
          <Badge
            variant="outline"
            className="text-[10px] h-5 px-1.5 bg-emerald-100 text-emerald-800 border-emerald-300 gap-1"
          >
            <CheckCircle2 className="h-2.5 w-2.5" />
            Sudah di-set
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] h-5 px-1.5 bg-rose-100 text-rose-800 border-rose-300 gap-1"
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            Belum di-set
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 h-8 text-sm"
          disabled={upsertMut.isPending || deleteMut.isPending}
        />

        <Button
          size="sm"
          variant={canSave ? "default" : "outline"}
          onClick={handleSave}
          disabled={!canSave}
          className="h-8 px-2.5"
          title={canSave ? "Simpan tanggal" : "Belum ada perubahan"}
        >
          {upsertMut.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
        </Button>

        {isSet && (
          <DeleteButton
            tahunPelajaranId={tahunPelajaranId}
            paket={paket}
            isDeleting={deleteMut.isPending}
            onConfirm={() =>
              deleteMut.mutate({ tahun_pelajaran_id: tahunPelajaranId, paket })
            }
          />
        )}
      </div>
    </div>
  );
}

function DeleteButton({
  paket,
  isDeleting,
  onConfirm,
}: {
  tahunPelajaranId: number;
  paket: PaketType;
  isDeleting: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isDeleting}
          title="Hapus tanggal"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus tanggal cetak {paket}?</AlertDialogTitle>
          <AlertDialogDescription>
            Setelah dihapus, rapor untuk siswa {paket} di tahun pelajaran ini
            <strong> tidak bisa dicetak</strong> sampai admin set ulang
            tanggalnya.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}