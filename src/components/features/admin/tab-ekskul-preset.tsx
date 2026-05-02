// ============================================================
// FILE PATH: src/components/features/admin/tab-ekskul-preset.tsx
// ============================================================
// REPLACE. Major refactor:
//   1. HAPUS heading "Preset Ekstrakurikuler" + subtitle deskriptif
//   2. Card grouped by gender (3 Card stack vertikal) → Single
//      Table flat dengan kolom Gender sebagai badge per row
//   3. Inline Pencil + Trash icons → kebab menu (DropdownMenu titik
//      tiga) konsisten dengan Tab P5 Master
//   4. Sort order: gender (SEMUA → L → P) → urutan → nama
//   5. Status non-aktif tetep ditampilkan via opacity + badge kecil
//
// Ga butuh drawer karena data simple — Edit langsung lewat Dialog
// modal. PresetFormDialog di-preserve dari versi sebelumnya, no
// changes di form structure.
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
import {
  ekskulPresetSchema,
  typedResolver,
  type EkskulPresetFormData,
} from "@/lib/validators";
import type { EkskulPreset, GenderPreset } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

// Sort order untuk sorting di table — SEMUA dulu, lalu L, lalu P
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
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EkskulPreset | null>(null);

  // Sort: gender (SEMUA → L → P) → urutan → nama
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
      {/* Toolbar — tombol Tambah Preset di kanan, no heading */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          size="sm"
        >
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
          Belum ada preset ekskul. Klik <em>Tambah Preset</em> untuk memulai.
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
                  onEdit={() => {
                    setEditing(preset);
                    setFormOpen(true);
                  }}
                  onDelete={() => setConfirmDelete(preset)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PresetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

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
    <TableRow className={cn(!preset.is_aktif && "opacity-60")}>
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
              aria-label={`Aksi untuk ${preset.nama_ekskul}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit Preset
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
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
// DeleteConfirmDialog — controlled by parent state
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
// PresetFormDialog — preserved dari versi sebelumnya
// ============================================================

function PresetFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: EkskulPreset | null;
}) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Preset Ekskul" : "Tambah Preset Ekskul"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Nama Ekstrakurikuler <span className="text-destructive">*</span>
            </Label>
            <Input
              {...form.register("nama_ekskul")}
              placeholder="Contoh: Pramuka, Desain Grafis, Tata Rias"
              autoFocus
            />
            {form.formState.errors.nama_ekskul && (
              <p className="text-xs text-destructive">
                {form.formState.errors.nama_ekskul.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("gender")}
                onValueChange={(v) =>
                  form.setValue("gender", v as GenderPreset)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input
                type="number"
                min={1}
                max={99}
                {...form.register("urutan")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor="is_aktif" className="cursor-pointer">
              Aktif
            </Label>
            <Switch
              id="is_aktif"
              checked={form.watch("is_aktif")}
              onCheckedChange={(v) => form.setValue("is_aktif", v)}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            💡 Preset <strong>SEMUA</strong> berlaku untuk siswa L dan P.
            Preset <strong>L</strong> hanya muncul untuk siswa laki-laki,
            begitu juga <strong>P</strong>.
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}