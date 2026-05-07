// ============================================================
// FILE PATH: src/components/features/admin/tab-ekskul-preset.tsx
// ============================================================
// REPLACE. v3.0 — migrasi Modal/Dialog → Sheet pattern.
//
// CHANGELOG vs versi sebelumnya:
//
//   1. PresetFormDialog (Dialog max-w-md) → PresetFormSheet
//      Sheet side="right" desktop / side="bottom" mobile,
//      width sm:max-w-xl (default tier — sesuai pattern admin
//      lainnya).
//
//   2. Header pattern konsisten dengan TambahKelasSheet:
//      icon kotak primary/10 + label uppercase + heading +
//      subtitle. pr-12 untuk space tombol X auto Sheet.
//
//   3. Footer sticky di bawah: tombol Batal + Simpan/Tambah.
//      Body scrollable berisi form fields + tip box.
//
//   4. PRESERVED:
//      - Semua hooks (useEkskulPresets, useCreateEkskulPreset,
//        useUpdateEkskulPreset, useDeleteEkskulPreset)
//      - Sort order: gender (SEMUA → L → P) → urutan → nama
//      - Table 3 kolom (#, Nama, Gender) + kebab menu
//      - DeleteConfirmDialog (AlertDialog) — modal untuk delete OK
//      - Form validation, gender select, urutan input, switch aktif
//      - Tip box "Preset SEMUA berlaku untuk siswa L dan P"
//
//   5. Detail viewer tidak diperlukan (data simple: nama + gender).
//      Tap row langsung edit lewat kebab menu — gak ada parent
//      sheet di tab ini.
// ============================================================

"use client";

import { useState, useMemo } from "react";
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
  type EkskulPresetFormData,
} from "@/lib/validators";
import type { EkskulPreset, GenderPreset } from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
  User,
  UserRound,
  Users,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// CONSTANTS
// ============================================================

const GENDER_COLOR: Record<GenderPreset, string> = {
  L: "bg-blue-50 text-blue-700 border-blue-200",
  P: "bg-pink-50 text-pink-700 border-pink-200",
  SEMUA: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const GENDER_ORDER: Record<GenderPreset, number> = {
  SEMUA: 0,
  L: 1,
  P: 2,
};

// ============================================================
// MAIN
// ============================================================

export function TabEkskulPreset() {
  const { data: presets = [], isLoading } = useEkskulPresets();
  const [editing, setEditing] = useState<EkskulPreset | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EkskulPreset | null>(null);

  const sortedPresets = useMemo(() => {
    return [...presets].sort((a, b) => {
      const genderDiff =
        GENDER_ORDER[a.gender as GenderPreset] -
        GENDER_ORDER[b.gender as GenderPreset];
      if (genderDiff !== 0) return genderDiff;
      if (a.urutan !== b.urutan) return a.urutan - b.urutan;
      return a.nama_ekskul.localeCompare(b.nama_ekskul, "id");
    });
  }, [presets]);

  return (
    <div className="space-y-5">
      {/* Toolbar — tombol Tambah Preset di kanan */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Tambah
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : sortedPresets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada preset ekskul. Klik <em>Tambah</em> untuk memulai.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-3 text-xs">#</TableHead>
                <TableHead className="px-2 text-xs">
                  Nama Ekstrakurikuler
                </TableHead>
                <TableHead className="w-24 px-2 text-xs text-center">
                  Gender
                </TableHead>
                <TableHead className="w-12 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPresets.map((preset, idx) => (
                <PresetTableRow
                  key={preset.id}
                  preset={preset}
                  index={idx + 1}
                  onEdit={() => setEditing(preset)}
                  onDelete={() => setConfirmDelete(preset)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet — Tambah Preset (no parent) */}
      <PresetFormSheet
        open={showAdd}
        onOpenChange={setShowAdd}
        editing={null}
      />

      {/* Sheet — Edit Preset (no parent) */}
      <PresetFormSheet
        open={editing !== null}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        editing={editing}
      />

      {/* Modal — confirm delete (destructive, tetap Dialog) */}
      {confirmDelete && (
        <DeleteConfirmDialog
          preset={confirmDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// PresetTableRow — single row dengan kebab menu
// ============================================================

function PresetTableRow({
  preset,
  index,
  onEdit,
  onDelete,
}: {
  preset: EkskulPreset;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow
      onClick={onEdit}
      className={cn("cursor-pointer", !preset.is_aktif && "opacity-60")}
    >
      <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
        {index}.
      </TableCell>
      <TableCell className="px-2 py-2.5 max-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="block truncate text-sm font-medium"
            title={preset.nama_ekskul}
          >
            {preset.nama_ekskul}
          </span>
          {!preset.is_aktif && (
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 flex-shrink-0"
            >
              Nonaktif
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="w-24 px-2 py-2.5 text-center">
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            GENDER_COLOR[preset.gender as GenderPreset]
          )}
        >
          {preset.gender}
        </Badge>
      </TableCell>
      <TableCell className="w-12 px-2 py-2.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Aksi untuk ${preset.nama_ekskul}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit Preset
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Hapus Preset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ============================================================
// DeleteConfirmDialog — AlertDialog (modal untuk delete = OK)
// ============================================================

function DeleteConfirmDialog({
  preset,
  onClose,
}: {
  preset: EkskulPreset;
  onClose: () => void;
}) {
  const del = useDeleteEkskulPreset();

  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus preset ekskul?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{preset.nama_ekskul}&quot; akan dihapus dari daftar preset.
            Data ekskul siswa yang sudah ter-insert sebelumnya tidak akan
            terpengaruh.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              del.mutate(preset.id, {
                onSuccess: () => onClose(),
              });
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
// PresetFormSheet — replaces PresetFormDialog
// Default tier (sm:max-w-xl) — form simple cuma 4 field
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

  const form = useForm<EkskulPresetFormData>({
    resolver: typedResolver(ekskulPresetSchema),
    values: editing
      ? {
          nama_ekskul: editing.nama_ekskul,
          gender: editing.gender as GenderPreset,
          urutan: editing.urutan,
          is_aktif: editing.is_aktif,
        }
      : {
          nama_ekskul: "",
          gender: "SEMUA",
          urutan: 99,
          is_aktif: true,
        },
  });

  const onSubmit = async (values: EkskulPresetFormData) => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, values });
      } else {
        await createMut.mutateAsync(values);
      }
      onOpenChange(false);
      form.reset();
    } catch {
      /* toast handled */
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
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
          {editing ? `Edit Preset — ${editing.nama_ekskul}` : "Tambah Preset Ekskul"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form untuk {editing ? "mengedit" : "menambahkan"} preset ekstrakurikuler
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col min-h-0"
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                {editing ? (
                  <Pencil className="h-4 w-4 text-primary" />
                ) : (
                  <Medal className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {editing ? "Edit Preset" : "Tambah Preset Ekskul"}
                </p>
                <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                  {editing ? editing.nama_ekskul : "Preset Baru"}
                </h3>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
              <FormField
                control={form.control}
                name="nama_ekskul"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Ekstrakurikuler{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Pramuka, Desain Grafis, Tata Rias"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Gender <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) =>
                          field.onChange(v as GenderPreset)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SEMUA">
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5" />
                              Semua (L &amp; P)
                            </div>
                          </SelectItem>
                          <SelectItem value="L">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              Laki-laki
                            </div>
                          </SelectItem>
                          <SelectItem value="P">
                            <div className="flex items-center gap-2">
                              <UserRound className="h-3.5 w-3.5" />
                              Perempuan
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="urutan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urutan</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_aktif"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <FormLabel className="cursor-pointer">Aktif</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                💡 Preset <strong>SEMUA</strong> berlaku untuk siswa L dan P.
                Preset <strong>L</strong> hanya muncul untuk siswa laki-laki,
                begitu juga <strong>P</strong>.
              </div>
            </div>

            {/* Footer — sticky */}
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
                {isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {editing ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
