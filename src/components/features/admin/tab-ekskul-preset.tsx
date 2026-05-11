// ============================================================
// FILE PATH: src/components/features/admin/tab-ekskul-preset.tsx
// ============================================================
// FULL REPLACE — siap copy-paste.
//
// Pattern di-align dengan tab-mata-pelajaran.tsx supaya konsisten:
//   - typedResolver (bukan zodResolver langsung)
//   - useCreateEkskulPreset + useUpdateEkskulPreset (bukan useUpsert)
//   - Form pakai .reset(values) di useEffect (bukan `values:` prop
//     yang bikin Resolver type mismatch)
//
// Hooks dependency (HARUS exist di @/hooks):
//   - useEkskulPresets       — list semua preset
//   - useCreateEkskulPreset  — insert
//   - useUpdateEkskulPreset  — update { id, values }
//   - useDeleteEkskulPreset  — delete id
//
// File hooks-nya di paket ini: 01-use-ekskul-preset.ts
// Drop di src/hooks/use-ekskul-preset.ts dan tambah export
// di src/hooks/index.ts: `export * from "./use-ekskul-preset"`
//
// Changelog dari v2:
//   1. Pakai typedResolver supaya Resolver type-nya selaras
//   2. defaultValues + form.reset() di useEffect (fix RHF type bug)
//   3. Pisah useCreate + useUpdate (selaras dengan codebase)
//   4. Number input pakai valueAsNumber lewat onChange manual
//   5. Sort tetap: SEMUA → L → P → urutan → nama
// ============================================================

"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useEkskulPresets,
  useCreateEkskulPreset,
  useUpdateEkskulPreset,
  useDeleteEkskulPreset,
} from "@/hooks";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  ekskulPresetSchema,
  typedResolver,
  type EkskulPresetFormValues,
} from "@/lib/validators";
import type { EkskulPreset } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Medal,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// CONSTANTS
// ============================================================

const PLACEHOLDER_TEMPLATES: Record<"A" | "B" | "C" | "D", string> = {
  A: "Mengikuti kegiatan ekstrakurikuler dengan sangat aktif dan menunjukkan prestasi yang membanggakan.",
  B: "Mengikuti kegiatan ekstrakurikuler dengan baik dan menunjukkan perkembangan yang positif.",
  C: "Mengikuti kegiatan ekstrakurikuler dengan partisipasi cukup, perlu meningkatkan keaktifan dan keterampilan.",
  D: "Partisipasi di kegiatan ekstrakurikuler masih kurang, perlu motivasi dan pendampingan agar lebih aktif.",
};

const GENDER_OPTIONS = [
  { value: "SEMUA", label: "Semua Gender" },
  { value: "L", label: "Laki-laki" },
  { value: "P", label: "Perempuan" },
] as const;

const DEFAULT_VALUES: EkskulPresetFormValues = {
  nama_ekskul: "",
  gender: "SEMUA",
  is_aktif: true,
  urutan: 0,
  keterangan_a: "",
  keterangan_b: "",
  keterangan_c: "",
  keterangan_d: "",
};

// ============================================================
// MAIN
// ============================================================

export function TabEkskulPreset() {
  const { data: presets = [], isLoading } = useEkskulPresets();
  const del = useDeleteEkskulPreset();

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<
    "ALL" | "L" | "P" | "SEMUA"
  >("ALL");
  const [formSheet, setFormSheet] = useState<{
    open: boolean;
    editing: EkskulPreset | null;
  }>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<EkskulPreset | null>(null);

  const filtered = useMemo(() => {
    let result = [...presets];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => p.nama_ekskul.toLowerCase().includes(q));
    }

    if (genderFilter !== "ALL") {
      result = result.filter((p) => p.gender === genderFilter);
    }

    // Sort: SEMUA → L → P, lalu urutan, lalu nama
    const genderOrder: Record<string, number> = { SEMUA: 0, L: 1, P: 2 };
    result.sort((a, b) => {
      const ga = genderOrder[a.gender] ?? 99;
      const gb = genderOrder[b.gender] ?? 99;
      if (ga !== gb) return ga - gb;
      if (a.urutan !== b.urutan) return a.urutan - b.urutan;
      return a.nama_ekskul.localeCompare(b.nama_ekskul, "id");
    });

    return result;
  }, [presets, search, genderFilter]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Medal className="h-4 w-4" />
                Master Preset Ekstrakurikuler
              </CardTitle>
              <CardDescription className="text-xs">
                Daftar ekskul yang muncul sebagai opsi Isi Cepat di form
                penilaian. Template keterangan A/B/C/D akan dipakai sesuai
                predikat siswa.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setFormSheet({ open: true, editing: null })}
              className="gap-1.5 flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Preset
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Search + filter */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama ekskul..."
                className="pl-8 h-9"
              />
            </div>
            <Select
              value={genderFilter}
              onValueChange={(v) => setGenderFilter(v as typeof genderFilter)}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Filter</SelectItem>
                <SelectItem value="SEMUA">Gender: Semua</SelectItem>
                <SelectItem value="L">Gender: Laki-laki</SelectItem>
                <SelectItem value="P">Gender: Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {search || genderFilter !== "ALL" ? (
                <>Tidak ada preset cocok dengan filter.</>
              ) : (
                <>
                  Belum ada preset ekskul. Klik <em>Tambah Preset</em> untuk
                  mulai.
                </>
              )}
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {filtered.map((preset) => (
                <PresetTableRow
                  key={preset.id}
                  preset={preset}
                  onEdit={() => setFormSheet({ open: true, editing: preset })}
                  onDelete={() => setDeleteTarget(preset)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PresetFormSheet
        open={formSheet.open}
        onOpenChange={(v) =>
          setFormSheet((p) => ({
            ...p,
            open: v,
            editing: v ? p.editing : null,
          }))
        }
        editing={formSheet.editing}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Preset <strong>{deleteTarget?.nama_ekskul}</strong> akan dihapus.
              Data ekskul siswa yang udah di-input{" "}
              <em>tidak akan</em> terhapus, tapi preset ini gak akan muncul
              lagi sebagai opsi Isi Cepat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) {
                  del.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  });
                }
              }}
              disabled={del.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// PresetTableRow
// ============================================================

function PresetTableRow({
  preset,
  onEdit,
  onDelete,
}: {
  preset: EkskulPreset;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const templateSetCount = [
    preset.keterangan_a,
    preset.keterangan_b,
    preset.keterangan_c,
    preset.keterangan_d,
  ].filter((t) => t && t.trim().length > 0).length;

  const genderBadge =
    preset.gender === "L"
      ? { label: "L", color: "bg-blue-50 text-blue-700 border-blue-200" }
      : preset.gender === "P"
        ? { label: "P", color: "bg-pink-50 text-pink-700 border-pink-200" }
        : {
          label: "Semua",
          color:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
        };

  return (
    <div
      onClick={onEdit}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors",
        !preset.is_aktif && "opacity-60"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{preset.nama_ekskul}</p>
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0",
              genderBadge.color
            )}
          >
            {genderBadge.label}
          </span>
          {!preset.is_aktif && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-muted text-muted-foreground border-border flex-shrink-0">
              Nonaktif
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-[11px] text-muted-foreground">
            Urutan: {preset.urutan}
          </p>
          <p
            className={cn(
              "text-[11px]",
              templateSetCount === 4
                ? "text-emerald-700"
                : templateSetCount > 0
                  ? "text-amber-700"
                  : "text-muted-foreground"
            )}
          >
            Template: {templateSetCount}/4
            {templateSetCount < 4 && " (pakai generic fallback)"}
          </p>
        </div>
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

// ============================================================
// PresetFormSheet — handle add + edit dengan 4 template fields
// ============================================================

function PresetFormSheet({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: EkskulPreset | null;
}) {
  const isDesktop = useIsDesktop();
  const createMut = useCreateEkskulPreset();
  const updateMut = useUpdateEkskulPreset();
  const isEditMode = editing !== null;

  const form = useForm<EkskulPresetFormValues>({
    resolver: typedResolver(ekskulPresetSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Sync form setiap sheet dibuka atau editing target berubah.
  // Pattern reset() ini lebih reliable daripada `values:` prop —
  // gak bikin RHF Resolver type mismatch.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        nama_ekskul: editing.nama_ekskul,
        gender: editing.gender,
        is_aktif: editing.is_aktif,
        urutan: editing.urutan,
        keterangan_a: editing.keterangan_a ?? "",
        keterangan_b: editing.keterangan_b ?? "",
        keterangan_c: editing.keterangan_c ?? "",
        keterangan_d: editing.keterangan_d ?? "",
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const onSubmit = async (values: EkskulPresetFormValues) => {
    // Normalize empty strings ke null untuk DB consistency
    const normalized: EkskulPresetFormValues = {
      ...values,
      nama_ekskul: values.nama_ekskul.trim(),
      keterangan_a:
        values.keterangan_a && values.keterangan_a.trim().length > 0
          ? values.keterangan_a.trim()
          : null,
      keterangan_b:
        values.keterangan_b && values.keterangan_b.trim().length > 0
          ? values.keterangan_b.trim()
          : null,
      keterangan_c:
        values.keterangan_c && values.keterangan_c.trim().length > 0
          ? values.keterangan_c.trim()
          : null,
      keterangan_d:
        values.keterangan_d && values.keterangan_d.trim().length > 0
          ? values.keterangan_d.trim()
          : null,
    };

    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, values: normalized });
      } else {
        await createMut.mutateAsync(normalized);
      }
      onOpenChange(false);
      form.reset(DEFAULT_VALUES);
    } catch {
      /* toast handled di hook */
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col gap-0",
          isDesktop && "w-full sm:max-w-2xl",
          !isDesktop && "h-[92vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">
          {isEditMode
            ? `Edit Preset — ${editing?.nama_ekskul}`
            : "Tambah Preset Ekskul"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form admin untuk mengelola preset ekstrakurikuler beserta template
          keterangan untuk predikat A/B/C/D
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col min-h-0"
        >
          {/* Header */}
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
                {isEditMode ? "Edit Preset Ekskul" : "Tambah Preset Ekskul"}
              </p>
              <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                {isEditMode ? editing?.nama_ekskul : "Preset Baru"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Master data untuk Isi Cepat di form penilaian siswa
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-5">
            {/* Section 1: Identitas */}
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_ekskul">
                  Nama Ekstrakurikuler{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nama_ekskul"
                  {...form.register("nama_ekskul")}
                  placeholder="Pramuka, Pencak Silat, Tahfizh, dll"
                  autoFocus={!isEditMode}
                />
                {form.formState.errors.nama_ekskul && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.nama_ekskul.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={form.watch("gender")}
                    onValueChange={(v) =>
                      form.setValue("gender", v as "L" | "P" | "SEMUA")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urutan">Urutan</Label>
                  <Input
                    id="urutan"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={form.watch("urutan") ?? 0}
                    onChange={(e) =>
                      form.setValue("urutan", Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="is_aktif" className="cursor-pointer">
                    Aktif
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Tampilkan sebagai opsi Isi Cepat di form penilaian
                  </p>
                </div>
                <Switch
                  id="is_aktif"
                  checked={form.watch("is_aktif") ?? true}
                  onCheckedChange={(v) => form.setValue("is_aktif", v)}
                />
              </div>
            </section>

            {/* Section 2: Template Keterangan */}
            <section className="space-y-3 pt-2 border-t">
              <div>
                <h4 className="text-sm font-semibold">
                  Template Keterangan Rapor
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Template per predikat. <strong>A/B</strong> dipakai
                  quick-fill batch (acak 70/30). <strong>C/D</strong> dipakai
                  saat operator manual edit/downgrade siswa. Kosong = pakai
                  template generic.
                </p>
              </div>

              <TemplateField
                form={form}
                fieldName="keterangan_a"
                predikat="A"
                label="Predikat A — Sangat Baik"
                badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
              />
              <TemplateField
                form={form}
                fieldName="keterangan_b"
                predikat="B"
                label="Predikat B — Baik"
                badgeColor="bg-blue-50 text-blue-700 border-blue-200"
              />
              <TemplateField
                form={form}
                fieldName="keterangan_c"
                predikat="C"
                label="Predikat C — Cukup"
                badgeColor="bg-amber-50 text-amber-700 border-amber-200"
              />
              <TemplateField
                form={form}
                fieldName="keterangan_d"
                predikat="D"
                label="Predikat D — Perlu Bimbingan"
                badgeColor="bg-red-50 text-red-700 border-red-200"
              />
            </section>
          </div>

          {/* Footer */}
          <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="flex-1 gap-1.5"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isEditMode ? (
                <Save className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {isEditMode ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// TemplateField — reusable textarea untuk satu predikat
// ============================================================

function TemplateField({
  form,
  fieldName,
  predikat,
  label,
  badgeColor,
}: {
  form: ReturnType<typeof useForm<EkskulPresetFormValues>>;
  fieldName: "keterangan_a" | "keterangan_b" | "keterangan_c" | "keterangan_d";
  predikat: "A" | "B" | "C" | "D";
  label: string;
  badgeColor: string;
}) {
  const value = form.watch(fieldName) ?? "";
  const charCount = value.length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border",
              badgeColor
            )}
          >
            {predikat}
          </span>
          <Label
            htmlFor={fieldName}
            className="text-xs font-medium cursor-pointer"
          >
            {label}
          </Label>
        </div>
        <span
          className={cn(
            "text-[10px] tabular-nums",
            charCount > 500
              ? "text-destructive"
              : charCount > 0
                ? "text-muted-foreground"
                : "text-muted-foreground/60"
          )}
        >
          {charCount}/500
        </span>
      </div>
      <Textarea
        id={fieldName}
        rows={3}
        {...form.register(fieldName)}
        placeholder={PLACEHOLDER_TEMPLATES[predikat]}
        className="text-sm resize-none"
      />
      {form.formState.errors[fieldName] && (
        <p className="text-xs text-destructive">
          {form.formState.errors[fieldName]?.message}
        </p>
      )}
    </div>
  );
}