// ============================================================
// FILE PATH: src/components/features/penilaian/ekskul-form.tsx
// ============================================================
// REPLACE v3 — tambah "Pakai Template" button di EkskulRowSheet.
//
// CHANGELOG vs v2:
//   1. EkskulRowSheet sekarang terima `presets` prop, supaya bisa
//      match preset dari nama_ekskul yang lagi di-edit, lalu nawarin
//      template keterangan sesuai predikat yang dipilih.
//
//   2. NEW: Tombol "Pakai Template {predikat}" di sebelah Label
//      Keterangan, visible cuma kalau predikat terpilih (bukan
//      _none). Klik tombol = overwrite isi keterangan dengan
//      generateKeteranganEkskul(matchedPreset, predikat).
//      Kalau keterangan field udah ada isinya, konfirmasi via
//      ConfirmDialog dulu.
//
//   3. Logic match preset: pakai findPresetByName() helper baru
//      di quick-fill-ekskul.ts v2.
//
//   4. Indicator di field Nama: kalau ada preset cocok, show
//      hint "Cocok dengan preset admin — template tersedia".
// ============================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useEkskulByEnrollment,
  useUpsertEkskul,
  useBatchInsertEkskul,
  useDeleteEkskul,
} from "@/hooks/use-nilai";
import { useActiveEkskulPresets } from "@/hooks";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  filterPresetByGender,
  generateEkskulRows,
  generateKeteranganEkskul,
  findPresetByName,
  type EkskulPredikat,
} from "@/lib/quick-fill-ekskul";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared";
import { QuickFillPanel, type QuickFillLevelOption } from "./quick-fill-panel";
import {
  QuickFillSimpleDialog,
  type PreviewItem,
} from "./quick-fill-simple-dialog";
import {
  Plus,
  Trash2,
  Medal,
  Pencil,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import type { Ekstrakurikuler, EkskulPreset } from "@/types";
import { cn } from "@/lib/utils";

const PREDIKAT_OPTIONS: Array<{ value: EkskulPredikat; label: string }> = [
  { value: "A", label: "A — Sangat Baik" },
  { value: "B", label: "B — Baik" },
  { value: "C", label: "C — Cukup" },
  { value: "D", label: "D — Perlu Bimbingan" },
];

const PREDIKAT_NONE_SENTINEL = "_none";

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

// ============================================================
// MAIN
// ============================================================

export function EkskulForm({ enrollmentId, gender }: EkskulFormProps) {
  const [quickFillOpen, setQuickFillOpen] = useState(false);
  const [rowSheet, setRowSheet] = useState<{
    open: boolean;
    editing: Ekstrakurikuler | null;
  }>({ open: false, editing: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: ekskulList = [], isLoading } =
    useEkskulByEnrollment(enrollmentId);
  const { data: presets = [], isLoading: loadingPresets } =
    useActiveEkskulPresets();
  const batchInsert = useBatchInsertEkskul();
  const del = useDeleteEkskul();

  const matchedPresets = useMemo(
    () => filterPresetByGender(presets, gender),
    [presets, gender]
  );

  const existingNamesLower = useMemo(
    () => new Set(ekskulList.map((e) => e.nama_ekskul.toLowerCase())),
    [ekskulList]
  );

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
      { onSuccess: () => setQuickFillOpen(false) }
    );
  };

  return (
    <div className="space-y-5">
      {/* ═══════ QUICK-FILL PANEL ═══════ */}
      <QuickFillPanel<EkskulLevel>
        title="Isi Cepat Ekstrakurikuler"
        itemLabel="ekskul"
        totalItems={matchedPresets.length}
        filledItems={matchedPresets.length - toAddCount}
        levels={EKSKUL_LEVELS}
        onPickLevel={() => {
          if (matchedPresets.length === 0) return;
          setQuickFillOpen(true);
        }}
        isLoading={batchInsert.isPending || loadingPresets}
        disabled={loadingPresets || matchedPresets.length === 0}
      />

      {!loadingPresets && matchedPresets.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">
          Belum ada preset ekskul untuk gender{" "}
          {gender === "L" ? "Laki-laki" : "Perempuan"}. Minta admin tambahkan di
          menu <strong>Admin → Preset Ekskul</strong>.
        </p>
      )}

      <QuickFillSimpleDialog
        open={quickFillOpen}
        onOpenChange={setQuickFillOpen}
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

      {/* ═══════ EKSKUL TERSIMPAN ═══════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">Ekskul Tersimpan</CardTitle>
              <CardDescription className="text-xs">
                {ekskulList.length} ekskul akan muncul di rapor.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRowSheet({ open: true, editing: null })}
              className="gap-1.5 h-8 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Manual
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <div className="h-20 rounded-xl bg-muted animate-pulse" />
            </div>
          ) : ekskulList.length > 0 ? (
            <div className="divide-y">
              {ekskulList.map((ekskul) => (
                <EkskulRow
                  key={ekskul.id}
                  ekskul={ekskul}
                  onEdit={() => setRowSheet({ open: true, editing: ekskul })}
                  onDelete={() => setDeleteId(ekskul.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada ekskul. Klik <em>Tambah Manual</em> atau gunakan{" "}
              <em>Isi Cepat</em> di atas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ═══════ EKSKUL ROW SHEET ═══════ */}
      <EkskulRowSheet
        open={rowSheet.open}
        onOpenChange={(v) =>
          setRowSheet((prev) => ({
            ...prev,
            open: v,
            editing: v ? prev.editing : null,
          }))
        }
        enrollmentId={enrollmentId}
        editing={rowSheet.editing}
        presets={presets}
      />

      {/* ═══════ DELETE CONFIRM ═══════ */}
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

// ============================================================
// EkskulRow
// ============================================================

function EkskulRow({
  ekskul,
  onEdit,
  onDelete,
}: {
  ekskul: Ekstrakurikuler;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onEdit}
      className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
    >
      <Medal className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{ekskul.nama_ekskul}</p>
          {ekskul.predikat && (
            <span
              className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border flex-shrink-0",
                getPredikatColor(ekskul.predikat)
              )}
            >
              {ekskul.predikat}
            </span>
          )}
        </div>
        {ekskul.keterangan && (
          <p
            className="text-xs text-muted-foreground line-clamp-2 mt-0.5"
            title={ekskul.keterangan}
          >
            {ekskul.keterangan}
          </p>
        )}
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function getPredikatColor(predikat: string): string {
  switch (predikat) {
    case "A":
      return "bg-green-50 text-green-700 border-green-200";
    case "B":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "C":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "D":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// ============================================================
// EkskulRowSheet — add + edit, dengan "Pakai Template" button
// ============================================================

function EkskulRowSheet({
  open,
  onOpenChange,
  enrollmentId,
  editing,
  presets,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  enrollmentId: string;
  editing: Ekstrakurikuler | null;
  presets: EkskulPreset[];
}) {
  const isDesktop = useIsDesktop();
  const upsert = useUpsertEkskul();

  const [nama, setNama] = useState("");
  const [predikat, setPredikat] = useState<string>(PREDIKAT_NONE_SENTINEL);
  const [keterangan, setKeterangan] = useState("");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setNama(editing.nama_ekskul);
        setPredikat(editing.predikat ?? PREDIKAT_NONE_SENTINEL);
        setKeterangan(editing.keterangan ?? "");
      } else {
        setNama("");
        setPredikat(PREDIKAT_NONE_SENTINEL);
        setKeterangan("");
      }
    }
  }, [open, editing]);

  const isEditMode = editing !== null;
  const canSubmit = nama.trim().length > 0 && !upsert.isPending;

  // Match preset by nama_ekskul (case-insensitive)
  const matchedPreset = useMemo(
    () => (nama.trim() ? findPresetByName(presets, nama) : undefined),
    [presets, nama]
  );

  const selectedPredikat: EkskulPredikat | null =
    predikat === PREDIKAT_NONE_SENTINEL ? null : (predikat as EkskulPredikat);

  // "Pakai Template" visible asalkan predikat terpilih.
  // Generic fallback selalu available, jadi gak perlu cek matchedPreset.
  const canUseTemplate = selectedPredikat !== null;

  const handleUseTemplate = () => {
    if (!selectedPredikat) return;
    if (keterangan.trim().length > 0) {
      setConfirmOverwrite(true);
      return;
    }
    applyTemplate();
  };

  const applyTemplate = () => {
    if (!selectedPredikat) return;
    const template = generateKeteranganEkskul(matchedPreset, selectedPredikat);
    setKeterangan(template);
    setConfirmOverwrite(false);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    upsert.mutate(
      {
        id: editing?.id,
        enrollment_id: enrollmentId,
        nama_ekskul: nama.trim(),
        predikat: predikat === PREDIKAT_NONE_SENTINEL ? null : predikat,
        keterangan: keterangan.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={cn(
            "p-0 flex flex-col gap-0",
            isDesktop && "w-full sm:max-w-xl",
            !isDesktop && "h-auto max-h-[92vh] rounded-t-2xl"
          )}
        >
          <SheetTitle className="sr-only">
            {isEditMode
              ? `Edit Ekskul — ${editing?.nama_ekskul}`
              : "Tambah Ekskul Manual"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Form untuk {isEditMode ? "mengedit" : "menambahkan"} ekstrakurikuler
            siswa beserta predikat dan keterangan rapor
          </SheetDescription>

          {!isDesktop && (
            <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              {isEditMode ? (
                <Pencil className="h-4 w-4 text-primary" />
              ) : (
                <Plus className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {isEditMode ? "Edit Ekstrakurikuler" : "Tambah Ekskul Manual"}
              </p>
              <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                {isEditMode ? editing?.nama_ekskul : "Ekskul Baru"}
              </h3>
              {!isEditMode && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Untuk ekskul di luar preset, atau yang gak ke-cover{" "}
                  <em>Isi Cepat</em>
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama-ekskul">
                Nama Ekstrakurikuler{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nama-ekskul"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Pramuka, Futsal, Tahfizh, dll"
                autoFocus={!isEditMode}
              />
              {matchedPreset && (
                <p className="text-[11px] text-green-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Cocok dengan preset admin — template keterangan tersedia
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Predikat</Label>
              <Select value={predikat} onValueChange={setPredikat}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih predikat (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PREDIKAT_NONE_SENTINEL}>
                    — Tidak ada —
                  </SelectItem>
                  {PREDIKAT_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Predikat siswa di ekskul ini. Kosong = tidak ditampilkan di
                rapor.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="keterangan-ekskul">Keterangan</Label>
                {canUseTemplate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleUseTemplate}
                    className="h-7 gap-1 text-[11px] text-primary hover:text-primary"
                  >
                    <Sparkles className="h-3 w-3" />
                    Pakai Template {selectedPredikat}
                  </Button>
                )}
              </div>
              <Textarea
                id="keterangan-ekskul"
                rows={4}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan partisipasi siswa di ekskul ini, muncul di kolom keterangan rapor..."
              />
              <p className="text-[11px] text-muted-foreground">
                {canUseTemplate
                  ? matchedPreset
                    ? `Tap "Pakai Template ${selectedPredikat}" untuk auto-fill dari preset admin.`
                    : `Tap "Pakai Template ${selectedPredikat}" untuk auto-fill template generic.`
                  : "Pilih predikat dulu untuk akses template auto-fill."}
              </p>
            </div>
          </div>

          <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={upsert.isPending}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 gap-1.5"
            >
              {upsert.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isEditMode ? (
                <Save className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {isEditMode ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOverwrite}
        onOpenChange={setConfirmOverwrite}
        title="Timpa Keterangan?"
        description="Isi keterangan saat ini akan diganti dengan template. Lanjutkan?"
        confirmLabel="Ya, Timpa"
        variant="default"
        onConfirm={applyTemplate}
      />
    </>
  );
}