// ============================================================
// FILE PATH: src/components/features/penilaian/ekskul-form.tsx
// ============================================================
// REPLACE. Konsistensi: pakai <QuickFillPanel> generic native select
// (sama kaya Nilai-Form & P5-Form).
//
// Perubahan dari versi sebelumnya:
//   - HAPUS Card quick-fill custom dengan badge preview + button
//   - GANTI dengan <QuickFillPanel> + 1 level "preset" (semua jadi 1
//     option: "Tambahkan Preset Ekskul")
//   - User pilih level → buka <QuickFillSimpleDialog /> seperti dulu
//
// Filosofi: ekskul gak punya 4 level kayak Nilai/P5 (cuma 1 action:
// "tambah dari preset"). Tapi UI-nya tetep konsisten — native select
// dengan 1 opsi. User experience: "Pilih level…" → "Tambahkan dari
// preset" → confirm dialog.
//
// Manual add card & list tersimpan TIDAK BERUBAH.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import {
  useEkskulByEnrollment,
  useUpsertEkskul,
  useBatchInsertEkskul,
  useDeleteEkskul,
} from "@/hooks/use-nilai";
import { useActiveEkskulPresets } from "@/hooks";
import {
  filterPresetByGender,
  generateEkskulRows,
} from "@/lib/quick-fill-ekskul";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/shared";
import { QuickFillPanel, type QuickFillLevelOption } from "./quick-fill-panel";
import {
  QuickFillSimpleDialog,
  type PreviewItem,
} from "./quick-fill-simple-dialog";
import { Plus, Trash2, Medal } from "lucide-react";

const PREDIKAT_OPTIONS = [
  { value: "A", label: "A — Sangat Baik" },
  { value: "B", label: "B — Baik" },
  { value: "C", label: "C — Cukup" },
  { value: "D", label: "D — Perlu Bimbingan" },
];

// Single-level option untuk QuickFillPanel
type EkskulLevel = "preset";
const EKSKUL_LEVELS: ReadonlyArray<QuickFillLevelOption<EkskulLevel>> = [
  {
    value: "preset",
    label: "Tambah dari preset",
    desc: "Predikat acak ~70% A, ~30% B",
  },
];

interface EkskulFormProps {
  enrollmentId: string;
  gender: "L" | "P";
}

export function EkskulForm({ enrollmentId, gender }: EkskulFormProps) {
  const [namaEkskul, setNamaEkskul] = useState("");
  const [predikat, setPredikat] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: ekskulList = [], isLoading } = useEkskulByEnrollment(enrollmentId);
  const { data: presets = [], isLoading: loadingPresets } =
    useActiveEkskulPresets();
  const upsert = useUpsertEkskul();
  const batchInsert = useBatchInsertEkskul();
  const del = useDeleteEkskul();

  const matchedPresets = useMemo(
    () => filterPresetByGender(presets, gender),
    [presets, gender]
  );

  // Set nama ekskul yang sudah existing (case-insensitive) → untuk mark "sudah ada"
  const existingNamesLower = useMemo(
    () => new Set(ekskulList.map((e) => e.nama_ekskul.toLowerCase())),
    [ekskulList]
  );

  // Preview items untuk dialog
  const previewItems = useMemo<PreviewItem[]>(
    () =>
      matchedPresets.map((p) => ({
        key: String(p.id),
        label: p.nama_ekskul,
        alreadyExists: existingNamesLower.has(p.nama_ekskul.toLowerCase()),
      })),
    [matchedPresets, existingNamesLower]
  );

  const toAddCount = previewItems.filter((i) => !i.alreadyExists).length;

  const handleConfirmBatchInsert = () => {
    const rows = generateEkskulRows(presets, gender, enrollmentId);
    batchInsert.mutate(
      { enrollment_id: enrollmentId, rows },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      }
    );
  };

  const handleAdd = () => {
    if (!namaEkskul.trim()) return;
    upsert.mutate(
      {
        enrollment_id: enrollmentId,
        nama_ekskul: namaEkskul.trim(),
        predikat: predikat || null,
        keterangan: keterangan || null,
      },
      {
        onSuccess: () => {
          setNamaEkskul("");
          setPredikat("");
          setKeterangan("");
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* ═══════ QUICK-FILL PANEL — generic native select ═══════ */}
      <QuickFillPanel<EkskulLevel>
        title="Isi Cepat Ekstrakurikuler"
        itemLabel="ekskul"
        totalItems={matchedPresets.length}
        filledItems={matchedPresets.length - toAddCount}
        levels={EKSKUL_LEVELS}
        onPickLevel={() => {
          if (matchedPresets.length === 0) return;
          setDialogOpen(true);
        }}
        isLoading={batchInsert.isPending || loadingPresets}
        disabled={loadingPresets || matchedPresets.length === 0}
      />

      {/* Helper text — preset summary kalau ada */}
      {!loadingPresets && matchedPresets.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">
          Belum ada preset ekskul untuk gender{" "}
          {gender === "L" ? "Laki-laki" : "Perempuan"}. Minta admin tambahkan di
          menu <strong>Admin → Preset Ekskul</strong>.
        </p>
      )}

      {/* ═══════ CONFIRM DIALOG (preview + konfirmasi) ═══════ */}
      <QuickFillSimpleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Isi Cepat Ekstrakurikuler"
        description={
          <>
            Preset ekskul untuk gender{" "}
            <span className="font-semibold">
              {gender === "L" ? "Laki-laki" : "Perempuan"}
            </span>
            . Predikat akan di-acak (~70% A, ~30% B).
          </>
        }
        confirmLabel={
          toAddCount > 0
            ? `Tambahkan ${toAddCount} Ekskul`
            : "Tidak ada yang ditambah"
        }
        items={previewItems}
        itemLabel="ekskul"
        isLoading={batchInsert.isPending}
        onConfirm={handleConfirmBatchInsert}
      />

      {/* ═══════ Manual add card ═══════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tambah Ekskul Manual</CardTitle>
          <CardDescription className="text-xs">
            Isi kalau siswa ikut ekskul di luar preset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Nama Ekskul
              </label>
              <Input
                value={namaEkskul}
                onChange={(e) => setNamaEkskul(e.target.value)}
                placeholder="Pramuka, Futsal, dll"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Predikat
              </label>
              <Select value={predikat} onValueChange={setPredikat}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {PREDIKAT_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Keterangan
              </label>
              <Input
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Opsional"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!namaEkskul.trim() || upsert.isPending}
            className="w-full sm:w-auto"
          >
            {upsert.isPending ? (
              <Spinner className="size-3.5 mr-1" />
            ) : (
              <Plus className="h-3.5 w-3.5 mr-1" />
            )}
            Tambah
          </Button>
        </CardContent>
      </Card>

      {/* ═══════ List tersimpan ═══════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ekskul Tersimpan</CardTitle>
          <CardDescription className="text-xs">
            Daftar ekskul yang akan muncul di rapor.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <div className="h-20 rounded-xl bg-muted animate-pulse" />
            </div>
          ) : ekskulList.length > 0 ? (
            <div className="divide-y">
              {ekskulList.map((ekskul) => (
                <div
                  key={ekskul.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Medal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ekskul.nama_ekskul}</p>
                    {ekskul.keterangan && (
                      <p className="text-xs text-muted-foreground">
                        {ekskul.keterangan}
                      </p>
                    )}
                  </div>
                  {ekskul.predikat && (
                    <span className="text-sm font-bold text-primary">
                      {ekskul.predikat}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(ekskul.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Belum ada ekskul ditambahkan.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Hapus Ekskul?"
        description="Data ekskul ini akan dihapus dari rapor siswa."
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={del.isPending}
        onConfirm={() => {
          if (deleteId)
            del.mutate(
              { id: deleteId, enrollmentId },
              { onSuccess: () => setDeleteId(null) }
            );
        }}
      />
    </div>
  );
}