// ============================================================
// FILE PATH: src/components/features/admin/tab-p5-master.tsx
// ============================================================
// REPLACE. Major refactor — pattern List Table + Drawer dengan
// kebab menu (MoreHorizontal) per row dimensi.
//
// Filosofi:
//   1. List view (Table) = manage row itself: edit nama/nomor
//      atau hapus dimensi. Aksi via kebab menu — destructive
//      diisolasi (less accidental).
//   2. Tap row → P5DimensiDrawer kebuka — scope: kelola children.
//      Body: accordion list elemen, expand jadi sub-elemen rows.
//      Inline icons (Pencil + Trash) di tiap elemen + sub-elemen
//      karena lebih sering disentuh ketimbang dimensi.
//      Footer: tombol Tutup + Tambah Elemen.
//   3. NativeSelect untuk filter fase di toolbar atas.
//
// Yang HILANG dari versi sebelumnya:
//   - Heading "Profil Pelajar Pancasila / Kelola 6 dimensi…"
//   - Top-level Accordion 6 dimensi yang langsung expand inline
//   - Trash + Pencil button untuk dimensi di list (pindah ke kebab)
//   - shadcn Select untuk fase (diganti NativeSelect)
//
// Yang DIPERTAHANKAN:
//   - DimensiFormDialog, ElemenFormDialog, SubElemenFormDialog
//   - Hooks: useP5Tree, useCreateDimensi, dst (no changes)
//   - DeleteElemenButton, DeleteSubElemenButton (inline AlertDialog
//     pattern), tetep dipakai di dalam drawer body
//
// Catatan:
//   - Pencil + Trash di drawer (untuk elemen + sub-elemen) tetep
//     inline icons karena drawer space terbatas dan children lebih
//     sering disentuh. Beda treatment dari parent (dimensi di list
//     yang pakai kebab).
//   - Form dialogs di-lift ke parent (TabP5Master) supaya state
//     survive drawer state changes. Pas drawer ditutup, form yang
//     lagi open tidak ke-unmount.
// ============================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Drawer } from "vaul";
import {
  useP5Tree,
  useCreateDimensi,
  useUpdateDimensi,
  useDeleteDimensi,
  useCreateElemen,
  useUpdateElemen,
  useDeleteElemen,
  useCreateSubElemen,
  useUpdateSubElemen,
  useDeleteSubElemen,
} from "@/hooks";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  p5DimensiSchema,
  p5ElemenSchema,
  p5SubElemenSchema,
  typedResolver,
  type P5DimensiFormData,
  type P5ElemenFormData,
  type P5SubElemenFormData,
} from "@/lib/validators";
import type {
  P5Dimensi,
  P5Elemen,
  P5SubElemen,
  P5DimensiTree,
  Fase,
} from "@/types";

// shadcn primitives
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  AlertDialogTrigger,
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
  Sparkles,
  BookOpen,
  X,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FASE_LIST: Fase[] = [
  "Fase A",
  "Fase B",
  "Fase C",
  "Fase D",
  "Fase E",
  "Fase F",
];

// ============================================================
// MAIN — TabP5Master
// ============================================================

export function TabP5Master() {
  const [fase, setFase] = useState<Fase>("Fase F");
  const { data: tree, isLoading } = useP5Tree(fase);

  // Drawer state
  const [drawerDimensi, setDrawerDimensi] = useState<P5DimensiTree | null>(
    null
  );

  // Dialog states (lifted ke parent supaya survive drawer state changes)
  const [dimensiForm, setDimensiForm] = useState<{
    open: boolean;
    editing: P5Dimensi | null;
  }>({ open: false, editing: null });

  const [elemenForm, setElemenForm] = useState<{
    open: boolean;
    dimensiId: number | null;
    editing: P5Elemen | null;
  }>({ open: false, dimensiId: null, editing: null });

  const [subForm, setSubForm] = useState<{
    open: boolean;
    elemenId: number | null;
    editing: P5SubElemen | null;
  }>({ open: false, elemenId: null, editing: null });

  return (
    <div className="space-y-5">
      {/* Toolbar — fase filter (NativeSelect) + tombol Tambah Dimensi */}
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="fase-filter"
            className="text-xs whitespace-nowrap text-muted-foreground"
          >
            Fase
          </Label>
          <NativeSelect
            id="fase-filter"
            value={fase}
            onChange={(e) => setFase(e.target.value as Fase)}
            className="h-9 w-32"
          >
            {FASE_LIST.map((f) => (
              <NativeSelectOption key={f} value={f}>
                {f}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button
          onClick={() => setDimensiForm({ open: true, editing: null })}
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          Tambah
        </Button>
      </div>

      {/* Table list 6 dimensi */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !tree || tree.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada dimensi P5. Klik <em>Tambah Dimensi</em> untuk memulai.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-3 text-xs">#</TableHead>
                <TableHead className="px-2 text-xs">Nama Dimensi</TableHead>
                <TableHead className="w-28 px-2 text-xs text-center">
                  Elemen
                </TableHead>
                <TableHead className="w-12 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tree.map((dimensi) => (
                <DimensiTableRow
                  key={dimensi.id}
                  dimensi={dimensi}
                  onOpenDrawer={() => setDrawerDimensi(dimensi)}
                  onEdit={() =>
                    setDimensiForm({ open: true, editing: dimensi })
                  }
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form dialog: Dimensi */}
      <DimensiFormDialog
        open={dimensiForm.open}
        onOpenChange={(v) =>
          setDimensiForm({ open: v, editing: v ? dimensiForm.editing : null })
        }
        editing={dimensiForm.editing}
      />

      {/* Drawer: kelola elemen + sub-elemen di dalam dimensi */}
      <P5DimensiDrawer
        dimensi={drawerDimensi}
        fase={fase}
        onClose={() => setDrawerDimensi(null)}
        onAddElemen={() => {
          if (drawerDimensi) {
            setElemenForm({
              open: true,
              dimensiId: drawerDimensi.id,
              editing: null,
            });
          }
        }}
        onEditElemen={(elemen) => {
          setElemenForm({
            open: true,
            dimensiId: elemen.dimensi_id,
            editing: elemen,
          });
        }}
        onAddSubElemen={(elemenId) => {
          setSubForm({ open: true, elemenId, editing: null });
        }}
        onEditSubElemen={(elemenId, sub) => {
          setSubForm({ open: true, elemenId, editing: sub });
        }}
      />

      {/* Form dialog: Elemen */}
      <ElemenFormDialog
        open={elemenForm.open}
        onOpenChange={(v) =>
          setElemenForm((prev) => ({
            ...prev,
            open: v,
            editing: v ? prev.editing : null,
          }))
        }
        dimensiId={elemenForm.dimensiId}
        editing={elemenForm.editing}
      />

      {/* Form dialog: Sub-elemen */}
      <SubElemenFormDialog
        open={subForm.open}
        onOpenChange={(v) =>
          setSubForm((prev) => ({
            ...prev,
            open: v,
            editing: v ? prev.editing : null,
          }))
        }
        elemenId={subForm.elemenId}
        defaultFase={fase}
        editing={subForm.editing}
      />
    </div>
  );
}

// ============================================================
// DimensiTableRow — single row di table dengan kebab menu
// ============================================================

function DimensiTableRow({
  dimensi,
  onOpenDrawer,
  onEdit,
}: {
  dimensi: P5DimensiTree;
  onOpenDrawer: () => void;
  onEdit: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = useDeleteDimensi();

  return (
    <>
      <TableRow
        onClick={onOpenDrawer}
        className={cn("cursor-pointer", !dimensi.is_aktif && "opacity-60")}
      >
        <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
          {dimensi.nomor}.
        </TableCell>
        <TableCell className="px-2 py-2.5 max-w-0">
          <span
            className="block truncate text-sm font-medium"
            title={dimensi.nama}
          >
            {dimensi.nama}
          </span>
        </TableCell>
        <TableCell className="w-28 px-2 py-2.5 text-center text-xs text-muted-foreground">
          {dimensi.elemen.length} elemen
        </TableCell>
        <TableCell className="w-12 px-2 py-2.5 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Aksi untuk ${dimensi.nama}`}
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
                Edit Dimensi
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Hapus Dimensi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Confirm dialog hapus dimensi */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus dimensi &quot;{dimensi.nama}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dimensi ini beserta seluruh elemen dan sub-elemennya akan
              terhapus. Nilai siswa yang terkait dimensi ini juga akan ikut
              terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => del.mutate(dimensi.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// P5DimensiDrawer — vaul responsive direction
// ============================================================

function P5DimensiDrawer({
  dimensi,
  fase,
  onClose,
  onAddElemen,
  onEditElemen,
  onAddSubElemen,
  onEditSubElemen,
}: {
  dimensi: P5DimensiTree | null;
  fase: Fase;
  onClose: () => void;
  onAddElemen: () => void;
  onEditElemen: (elemen: P5Elemen) => void;
  onAddSubElemen: (elemenId: number) => void;
  onEditSubElemen: (elemenId: number, sub: P5SubElemen) => void;
}) {
  const isDesktop = useIsDesktop();
  const direction = isDesktop ? "right" : "bottom";
  const open = dimensi !== null;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      direction={direction}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            "fixed z-50 flex flex-col bg-background outline-none",
            isDesktop &&
            "right-0 top-0 bottom-0 w-full max-w-lg border-l shadow-xl",
            !isDesktop &&
            "left-0 right-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t shadow-xl"
          )}
        >
          <Drawer.Title className="sr-only">
            Kelola Elemen dan Sub-elemen
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Drawer untuk menambah, edit, dan hapus elemen serta sub-elemen di
            dalam dimensi P5
          </Drawer.Description>

          {!isDesktop && (
            <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          {dimensi && (
            <DrawerBody
              dimensi={dimensi}
              fase={fase}
              onClose={onClose}
              onAddElemen={onAddElemen}
              onEditElemen={onEditElemen}
              onAddSubElemen={onAddSubElemen}
              onEditSubElemen={onEditSubElemen}
            />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function DrawerBody({
  dimensi,
  fase,
  onClose,
  onAddElemen,
  onEditElemen,
  onAddSubElemen,
  onEditSubElemen,
}: {
  dimensi: P5DimensiTree;
  fase: Fase;
  onClose: () => void;
  onAddElemen: () => void;
  onEditElemen: (elemen: P5Elemen) => void;
  onAddSubElemen: (elemenId: number) => void;
  onEditSubElemen: (elemenId: number, sub: P5SubElemen) => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Dimensi {dimensi.nomor} · {fase}
          </p>
          <h3 className="text-base font-semibold leading-tight mt-0.5">
            {dimensi.nama}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dimensi.elemen.length} elemen
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={onClose}
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body — accordion list elemen */}
      <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5">
        {dimensi.elemen.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada elemen. Klik <em>Tambah Elemen</em> di footer untuk
            memulai.
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {dimensi.elemen.map((elemen) => (
              <ElemenAccordionItem
                key={elemen.id}
                elemen={elemen}
                onEditElemen={() => onEditElemen(elemen)}
                onAddSub={() => onAddSubElemen(elemen.id)}
                onEditSub={(sub) => onEditSubElemen(elemen.id, sub)}
              />
            ))}
          </Accordion>
        )}
      </div>

      {/* Footer — Tutup + Tambah Elemen (no Edit/Hapus dimensi) */}
      <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="flex-1"
        >
          Tutup
        </Button>
        <Button size="sm" onClick={onAddElemen} className="flex-1 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Tambah Elemen
        </Button>
      </div>
    </>
  );
}

// ============================================================
// ElemenAccordionItem — 1 elemen + nested sub-elemen
// Inline icons (Pencil + Trash) karena children lebih sering disentuh
// ============================================================

function ElemenAccordionItem({
  elemen,
  onEditElemen,
  onAddSub,
  onEditSub,
}: {
  elemen: P5DimensiTree["elemen"][number];
  onEditElemen: () => void;
  onAddSub: () => void;
  onEditSub: (sub: P5SubElemen) => void;
}) {
  return (
    <AccordionItem
      value={`e-${elemen.id}`}
      className="rounded-md border bg-background"
    >
      <div className="flex items-center">
        <AccordionTrigger className="flex-1 px-3 py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-left min-w-0 flex-1">
            <BookOpen className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate">{elemen.nama}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              ({elemen.sub_elemen.length})
            </span>
          </div>
        </AccordionTrigger>
        <div className="flex items-center gap-0.5 pr-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEditElemen();
            }}
            aria-label={`Edit ${elemen.nama}`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <DeleteElemenButton
            id={elemen.id}
            dimensiId={elemen.dimensi_id}
            nama={elemen.nama}
          />
        </div>
      </div>

      <AccordionContent className="px-3 pb-3 pt-1 space-y-2 border-t">
        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={onAddSub}
          >
            <Plus className="h-3 w-3" />
            Sub-elemen
          </Button>
        </div>

        {elemen.sub_elemen.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-1 py-2">
            Belum ada sub-elemen untuk fase ini.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {elemen.sub_elemen.map((sub, i) => (
              <li
                key={sub.id}
                className="flex gap-2 rounded border bg-muted/30 p-2 text-sm"
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums w-5 text-right pt-0.5">
                  {i + 1}.
                </span>
                <p className="flex-1 leading-snug min-w-0 break-words">
                  {sub.deskripsi}
                </p>
                <div className="flex shrink-0 gap-0.5 items-start">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => onEditSub(sub)}
                    aria-label="Edit sub-elemen"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <DeleteSubElemenButton id={sub.id} elemenId={elemen.id} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ============================================================
// DimensiFormDialog — preserved
// ============================================================

function DimensiFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: P5Dimensi | null;
}) {
  const create = useCreateDimensi();
  const update = useUpdateDimensi();

  const form = useForm<P5DimensiFormData>({
    resolver: typedResolver(p5DimensiSchema),
    values: editing
      ? {
        nomor: editing.nomor,
        nama: editing.nama,
        urutan: editing.urutan,
        is_aktif: editing.is_aktif,
      }
      : { nomor: 1, nama: "", urutan: 99, is_aktif: true },
  });

  const onSubmit = async (values: P5DimensiFormData) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, values });
      } else {
        await create.mutateAsync(values);
      }
      onOpenChange(false);
      form.reset();
    } catch {
      /* toast handled */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Dimensi" : "Tambah Dimensi"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div className="space-y-2">
              <Label>Nomor *</Label>
              <Input
                type="number"
                min={1}
                max={99}
                {...form.register("nomor")}
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Dimensi *</Label>
              <Input
                {...form.register("nama")}
                placeholder="Misal: Bernalar Kritis"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Urutan Tampil</Label>
            <Input type="number" {...form.register("urutan")} />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label>Aktif</Label>
            <Switch
              checked={form.watch("is_aktif")}
              onCheckedChange={(v) => form.setValue("is_aktif", v)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {editing ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ElemenFormDialog — preserved
// ============================================================

function ElemenFormDialog({
  open,
  onOpenChange,
  dimensiId,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dimensiId: number | null;
  editing: P5Elemen | null;
}) {
  const create = useCreateElemen();
  const update = useUpdateElemen();

  const form = useForm<P5ElemenFormData>({
    resolver: typedResolver(p5ElemenSchema),
    values: editing
      ? {
        dimensi_id: editing.dimensi_id,
        nama: editing.nama,
        urutan: editing.urutan,
        is_aktif: editing.is_aktif,
      }
      : {
        dimensi_id: dimensiId ?? 0,
        nama: "",
        urutan: 99,
        is_aktif: true,
      },
  });

  const onSubmit = async (values: P5ElemenFormData) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, values });
      } else {
        await create.mutateAsync(values);
      }
      onOpenChange(false);
      form.reset();
    } catch {
      /* toast handled */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Elemen" : "Tambah Elemen"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Elemen *</Label>
            <Input
              {...form.register("nama")}
              placeholder="Misal: akhlak beragama"
            />
          </div>
          <div className="space-y-2">
            <Label>Urutan Tampil</Label>
            <Input type="number" {...form.register("urutan")} />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label>Aktif</Label>
            <Switch
              checked={form.watch("is_aktif")}
              onCheckedChange={(v) => form.setValue("is_aktif", v)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {editing ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// DeleteElemenButton — inline AlertDialog di dalam drawer
// ============================================================

function DeleteElemenButton({
  id,
  dimensiId,
  nama,
}: {
  id: number;
  dimensiId: number;
  nama: string;
}) {
  const del = useDeleteElemen();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={(e) => e.stopPropagation()}
          aria-label="Hapus elemen"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus elemen?</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{nama}&quot; dan seluruh sub-elemen di dalamnya akan terhapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => del.mutate({ id, dimensiId })}
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
// SubElemenFormDialog — preserved
// ============================================================

function SubElemenFormDialog({
  open,
  onOpenChange,
  elemenId,
  defaultFase,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  elemenId: number | null;
  defaultFase: Fase;
  editing: P5SubElemen | null;
}) {
  const create = useCreateSubElemen();
  const update = useUpdateSubElemen();

  const form = useForm<P5SubElemenFormData>({
    resolver: typedResolver(p5SubElemenSchema),
    values: editing
      ? {
        elemen_id: editing.elemen_id,
        fase: editing.fase as Fase,
        deskripsi: editing.deskripsi,
        urutan: editing.urutan,
        is_aktif: editing.is_aktif,
      }
      : {
        elemen_id: elemenId ?? 0,
        fase: defaultFase,
        deskripsi: "",
        urutan: 99,
        is_aktif: true,
      },
  });

  const onSubmit = async (values: P5SubElemenFormData) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, values });
      } else {
        await create.mutateAsync(values);
      }
      onOpenChange(false);
      form.reset();
    } catch {
      /* toast handled */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Sub-elemen" : "Tambah Sub-elemen"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-2">
              <Label>Fase *</Label>
              <Select
                value={form.watch("fase")}
                onValueChange={(v) => form.setValue("fase", v as Fase)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FASE_LIST.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" {...form.register("urutan")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deskripsi Sub-elemen *</Label>
            <Textarea
              rows={5}
              {...form.register("deskripsi")}
              placeholder="Deskripsi capaian sub-elemen untuk fase ini…"
            />
            {form.formState.errors.deskripsi && (
              <p className="text-xs text-destructive">
                {form.formState.errors.deskripsi.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label>Aktif</Label>
            <Switch
              checked={form.watch("is_aktif")}
              onCheckedChange={(v) => form.setValue("is_aktif", v)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {editing ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// DeleteSubElemenButton — inline AlertDialog di dalam drawer
// ============================================================

function DeleteSubElemenButton({
  id,
  elemenId,
}: {
  id: number;
  elemenId: number;
}) {
  const del = useDeleteSubElemen();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={(e) => e.stopPropagation()}
          aria-label="Hapus sub-elemen"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus sub-elemen?</AlertDialogTitle>
          <AlertDialogDescription>
            Sub-elemen ini dan nilai siswa yang terkait akan terhapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => del.mutate({ id, elemenId })}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}