// ============================================================
// FILE PATH: src/components/features/admin/tab-mata-pelajaran.tsx
// ============================================================
// REPLACE. v3.0 — migrasi vaul Drawer + Dialog → shadcn Sheet,
// dengan refactor terbesar di tab admin: MapelDetailDrawer di-
// HAPUS entirely, tap row langsung Edit.
//
// CHANGELOG vs versi sebelumnya:
//
//   1. MapelDetailDrawer (vaul Drawer) — DIHAPUS ENTIRELY.
//      Mapel cuma nama + paket + kelompok + agama, viewer thin
//      banget gak ada value tambahan. Tap row → langsung Edit
//      lewat MapelFormSheet. Akses "Kelola KD" + "Hapus" lewat
//      row kebab menu (lihat di bawah).
//
//   2. MapelFormDialog (Dialog max-w-lg) → MapelFormSheet
//      Default tier (sm:max-w-xl). Form dengan duplicate guard +
//      warning agama PA tetap dipertahankan.
//
//   3. KompetensiPanel (Dialog max-w-3xl) → KompetensiSheet
//      WIDE TIER (sm:max-w-2xl) karena daftar KD bisa banyak.
//      Sekarang jadi PARENT viewer dengan list KD inline +
//      tombol Tambah KD di footer + inline icons (Pencil/Trash)
//      per KD row. Tidak lagi double-modal.
//
//   4. KompetensiForm (Dialog max-w-2xl) → KdFormSheet
//      WIDE TIER (sm:max-w-2xl) supaya child fully overlap parent
//      (sesuai pattern KelolaKelas → Tambah/Edit). Form punya
//      4 textarea panjang (deskripsi A/B/C/D) jadi memang butuh
//      width ekstra.
//
//   5. STACKING:
//      Row tap → MapelFormSheet (edit mode, no parent)
//      Row kebab → Edit Mapel | Kelola KD | (sep) | Hapus
//        ├── Edit → MapelFormSheet (no parent)
//        ├── Kelola KD → KompetensiSheet (parent, WIDE 2xl)
//        │     ├── Tambah KD → KdFormSheet (child, WIDE 2xl)
//        │     └── Edit KD → KdFormSheet (child, WIDE 2xl)
//        └── Hapus → DeleteMapelConfirm (AlertDialog modal)
//      Toolbar [Tambah] → MapelFormSheet (add mode, no parent)
//
//   6. PRESERVED:
//      - Semua hooks (useAllMataPelajaran, CRUD, useNilaiCountByMapel
//        untuk impact preview, useKompetensiByMapel + KD CRUD)
//      - Grouped table by paket → kelompok
//      - Live duplicate hint di form (cek ke existing list)
//      - PA agama warning (auto-detect "Pendidikan Agama" di nama)
//      - DeleteMapelConfirm pakai useNilaiCountByMapel buat impact
//        preview (CASCADE warning kalau ada nilai)
//      - DeleteKdButton inline AlertDialog di KompetensiSheet body
//
//   7. REMOVED: import { Drawer } from "vaul" — gak dipake lagi.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  useAllMataPelajaran,
  useCreateMataPelajaran,
  useUpdateMataPelajaran,
  useDeleteMataPelajaran,
  useNilaiCountByMapel,
  useKompetensiByMapel,
  useCreateKompetensi,
  useUpdateKompetensi,
  useDeleteKompetensi,
} from "@/hooks";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  mataPelajaranSchema,
  kompetensiDasarSchema,
  typedResolver,
  type MataPelajaranFormData,
  type KompetensiDasarFormData,
} from "@/lib/validators";
import type { MataPelajaran, KompetensiDasar, KelompokMapel } from "@/types";

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
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
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
  ListChecks,
  AlertTriangle,
  BookOpen,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// CONSTANTS
// ============================================================

const KELOMPOK_LABEL: Record<KelompokMapel, string> = {
  umum: "Umum",
  muatan_lokal: "Muatan Lokal",
  peminatan_ips: "Peminatan IPS",
  khusus: "Khusus",
};

const KELOMPOK_ORDER: KelompokMapel[] = [
  "umum",
  "muatan_lokal",
  "peminatan_ips",
  "khusus",
];

const AGAMA_OPTIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
] as const;

const AGAMA_NONE_SENTINEL = "_none";

// ============================================================
// MAIN
// ============================================================

export function TabMataPelajaran() {
  const { data: mapelList, isLoading } = useAllMataPelajaran();

  // Form sheet states (lifted)
  const [editing, setEditing] = useState<MataPelajaran | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Kompetensi sheet state
  const [kompetensiOf, setKompetensiOf] = useState<MataPelajaran | null>(null);
  const [kdForm, setKdForm] = useState<{
    open: boolean;
    mapelId: number | null;
    editing: KompetensiDasar | null;
  }>({ open: false, mapelId: null, editing: null });

  // Delete confirm state
  const [deletingMapel, setDeletingMapel] = useState<MataPelajaran | null>(
    null
  );

  const grouped = useMemo(() => {
    const g: Record<string, Record<KelompokMapel, MataPelajaran[]>> = {};
    (mapelList ?? []).forEach((m) => {
      if (!g[m.paket])
        g[m.paket] = {
          umum: [],
          muatan_lokal: [],
          peminatan_ips: [],
          khusus: [],
        };
      const k = m.kelompok as KelompokMapel;
      if (g[m.paket][k]) g[m.paket][k].push(m);
    });
    Object.values(g).forEach((paketGroups) => {
      Object.values(paketGroups).forEach((arr) => {
        arr.sort((a, b) => {
          if (a.urutan !== b.urutan) return a.urutan - b.urutan;
          return a.nama.localeCompare(b.nama, "id");
        });
      });
    });
    return g;
  }, [mapelList]);

  const paTanpaAgamaCount = useMemo(() => {
    return (mapelList ?? []).filter(
      (m) => !m.agama && m.nama.toLowerCase().includes("pendidikan agama")
    ).length;
  }, [mapelList]);

  return (
    <div className="space-y-5">
      {/* Header — toolbar */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Tambah
        </Button>
      </div>

      {paTanpaAgamaCount > 0 && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-sm">
            <p className="font-medium text-rose-900">
              {paTanpaAgamaCount} mata pelajaran &quot;Pendidikan Agama&quot;
              belum di-tag agamanya
            </p>
            <p className="text-xs text-rose-800 mt-0.5">
              Mapel PA harus di-set kolom <strong>Agama</strong>-nya
              (Islam/Kristen/dst) biar muncul ke siswa yang tepat. Tap mapel →
              set Agama.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada mata pelajaran. Klik <em>Tambah</em>.
        </div>
      ) : (
        Object.keys(grouped)
          .sort()
          .map((paket) => (
            <div key={paket} className="rounded-lg border overflow-hidden">
              <div className="border-b bg-muted/40 px-4 py-2.5 font-medium text-sm">
                {paket}
              </div>

              <div className="divide-y">
                {KELOMPOK_ORDER.map((kelompok) => {
                  const items = grouped[paket][kelompok];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={kelompok}>
                      <div className="px-4 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/20">
                        Kelompok {KELOMPOK_LABEL[kelompok]}
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12 px-3 text-xs">
                              #
                            </TableHead>
                            <TableHead className="px-2 text-xs">
                              Mata Pelajaran
                            </TableHead>
                            <TableHead className="w-12 px-2" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((m, i) => {
                            const nomor = m.urutan || i + 1;
                            return (
                              <MapelTableRow
                                key={m.id}
                                mapel={m}
                                nomor={nomor}
                                onEdit={() => setEditing(m)}
                                onManageKd={() => setKompetensiOf(m)}
                                onDelete={() => setDeletingMapel(m)}
                              />
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
      )}

      {/* Sheet — Tambah Mapel (add mode) */}
      <MapelFormSheet
        open={showAdd}
        onOpenChange={setShowAdd}
        editing={null}
        existingMapel={mapelList ?? []}
      />

      {/* Sheet — Edit Mapel */}
      <MapelFormSheet
        open={editing !== null}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        editing={editing}
        existingMapel={mapelList ?? []}
      />

      {/* Sheet — Kompetensi (parent, WIDE 2xl) */}
      <KompetensiSheet
        mapel={kompetensiOf}
        onClose={() => setKompetensiOf(null)}
        onAddKd={() => {
          if (kompetensiOf) {
            setKdForm({
              open: true,
              mapelId: kompetensiOf.id,
              editing: null,
            });
          }
        }}
        onEditKd={(kd) => {
          if (kompetensiOf) {
            setKdForm({
              open: true,
              mapelId: kompetensiOf.id,
              editing: kd,
            });
          }
        }}
      />

      {/* Sheet — KD Form (child, WIDE 2xl to match parent) */}
      <KdFormSheet
        open={kdForm.open}
        onOpenChange={(v) =>
          setKdForm((prev) => ({
            ...prev,
            open: v,
            editing: v ? prev.editing : null,
          }))
        }
        mapelId={kdForm.mapelId}
        editing={kdForm.editing}
      />

      {/* Modal — confirm delete (with CASCADE impact preview) */}
      {deletingMapel && (
        <DeleteMapelConfirm
          mapel={deletingMapel}
          onClose={() => setDeletingMapel(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// MapelTableRow — kebab menu (Edit / Kelola KD / sep / Hapus)
// ============================================================

function MapelTableRow({
  mapel,
  nomor,
  onEdit,
  onManageKd,
  onDelete,
}: {
  mapel: MataPelajaran;
  nomor: number;
  onEdit: () => void;
  onManageKd: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow
      onClick={onEdit}
      className={cn("cursor-pointer", !mapel.is_aktif && "opacity-60")}
    >
      <TableCell className="w-12 px-3 py-2 text-xs text-muted-foreground tabular-nums">
        {nomor}.
      </TableCell>
      <TableCell className="px-2 py-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-sm truncate" title={mapel.nama}>
            {mapel.nama}
          </span>
          {mapel.agama && (
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 bg-violet-50 text-violet-700 border-violet-200"
            >
              {mapel.agama}
            </Badge>
          )}
          {mapel.fase && (
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200"
            >
              {mapel.fase}
            </Badge>
          )}
          {!mapel.is_aktif && (
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 bg-muted text-muted-foreground"
            >
              Nonaktif
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="w-12 px-2 py-2 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Aksi untuk ${mapel.nama}`}
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
              Edit Mapel
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onManageKd();
              }}
            >
              <ListChecks className="mr-2 h-3.5 w-3.5" />
              Kelola KD
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
              Hapus Mapel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ============================================================
// DeleteMapelConfirm — AlertDialog dengan CASCADE impact preview
// ============================================================

function DeleteMapelConfirm({
  mapel,
  onClose,
}: {
  mapel: MataPelajaran;
  onClose: () => void;
}) {
  const deleteMut = useDeleteMataPelajaran();
  const { data: nilaiCount, isLoading: loadingCount } = useNilaiCountByMapel(
    mapel.id
  );

  const hasNilai = (nilaiCount ?? 0) > 0;

  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus mata pelajaran?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                &quot;
                <span className="font-medium text-foreground">
                  {mapel.nama}
                </span>
                &quot; akan dihapus permanen dari sistem.
              </p>

              {loadingCount ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Memeriksa data nilai terkait…
                </div>
              ) : hasNilai ? (
                <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 text-xs text-rose-900">
                    <p className="font-semibold">
                      ⚠️ Akan ikut menghapus {nilaiCount} nilai siswa
                    </p>
                    <p className="mt-0.5 text-rose-800">
                      Karena CASCADE aktif, semua nilai yang menggunakan mata
                      pelajaran ini akan terhapus permanen dan{" "}
                      <strong>tidak bisa di-undo</strong>. Pertimbangkan untuk
                      menonaktifkan mapel saja (toggle Aktif → off) jika ingin
                      menyimpan history nilai.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                  Tidak ada nilai siswa yang terhubung. Aman untuk dihapus.
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMut.isPending}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              deleteMut.mutate(mapel.id, {
                onSuccess: onClose,
              });
            }}
            disabled={deleteMut.isPending || loadingCount}
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              hasNilai && "ring-2 ring-rose-300 ring-offset-1"
            )}
          >
            {deleteMut.isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            {hasNilai ? `Hapus mapel + ${nilaiCount} nilai` : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
// MapelFormSheet — replaces MapelFormDialog (default xl tier)
// Handles BOTH add (editing=null) and edit modes.
// ============================================================

function MapelFormSheet({
  open,
  onOpenChange,
  editing,
  existingMapel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: MataPelajaran | null;
  existingMapel: MataPelajaran[];
}) {
  const isDesktop = useIsDesktop();
  const createMut = useCreateMataPelajaran();
  const updateMut = useUpdateMataPelajaran();
  const isEditMode = editing !== null;

  const form = useForm<MataPelajaranFormData>({
    resolver: typedResolver(mataPelajaranSchema),
    values: editing
      ? {
          nama: editing.nama,
          paket: editing.paket as MataPelajaranFormData["paket"],
          fase: (editing.fase ?? null) as MataPelajaranFormData["fase"],
          kelompok: editing.kelompok as KelompokMapel,
          agama: (editing.agama ?? null) as MataPelajaranFormData["agama"],
          urutan: editing.urutan,
          is_aktif: editing.is_aktif,
        }
      : {
          nama: "",
          paket: "Paket C",
          fase: "Fase E",
          kelompok: "umum",
          agama: null,
          urutan: 99,
          is_aktif: true,
        },
  });

  const watchedNama = form.watch("nama");
  const watchedPaket = form.watch("paket");
  const watchedFase = form.watch("fase");
  const watchedAgama = form.watch("agama");

  const isPaMapel = (watchedNama ?? "")
    .toLowerCase()
    .includes("pendidikan agama");
  const showAgamaWarning = isPaMapel && !watchedAgama;

  const duplicateRow = useMemo(() => {
    const namaTrim = (watchedNama ?? "").trim().toLowerCase();
    if (!namaTrim) return null;
    return (
      existingMapel.find((m) => {
        if (editing && m.id === editing.id) return false;
        if (m.nama.trim().toLowerCase() !== namaTrim) return false;
        if (m.paket !== watchedPaket) return false;
        const mFase = m.fase ?? null;
        const wFase = watchedFase ?? null;
        if (mFase !== wFase) return false;
        const mAgama = m.agama ?? null;
        const wAgama = watchedAgama ?? null;
        if (mAgama !== wAgama) return false;
        return true;
      }) ?? null
    );
  }, [
    watchedNama,
    watchedPaket,
    watchedFase,
    watchedAgama,
    existingMapel,
    editing,
  ]);

  const onSubmit = async (values: MataPelajaranFormData) => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, values });
      } else {
        await createMut.mutateAsync(values);
      }
      onOpenChange(false);
      form.reset();
    } catch {
      /* toast handled by hook */
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
          {isEditMode
            ? `Edit Mapel — ${editing?.nama}`
            : "Tambah Mata Pelajaran"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form untuk {isEditMode ? "mengedit" : "menambahkan"} mata pelajaran
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col min-h-0"
        >
          <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              {isEditMode ? (
                <Pencil className="h-4 w-4 text-primary" />
              ) : (
                <BookOpen className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {isEditMode ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
              </p>
              <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                {isEditMode ? editing?.nama : "Mapel Baru"}
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">
                Nama Mata Pelajaran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nama"
                {...form.register("nama")}
                placeholder="Misal: Bahasa Indonesia"
                className={cn(
                  duplicateRow && "border-rose-400 ring-1 ring-rose-200"
                )}
              />
              {form.formState.errors.nama && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.nama.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>
                  Paket <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("paket")}
                  onValueChange={(v) =>
                    form.setValue(
                      "paket",
                      v as MataPelajaranFormData["paket"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paket A">Paket A</SelectItem>
                    <SelectItem value="Paket B">Paket B</SelectItem>
                    <SelectItem value="Paket C">Paket C</SelectItem>
                    <SelectItem value="Semua">Semua Paket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  inputMode="numeric"
                  {...form.register("urutan")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fase</Label>
                <Select
                  value={form.watch("fase") ?? ""}
                  onValueChange={(v) =>
                    form.setValue("fase", v as MataPelajaranFormData["fase"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fase A">Fase A</SelectItem>
                    <SelectItem value="Fase B">Fase B</SelectItem>
                    <SelectItem value="Fase C">Fase C</SelectItem>
                    <SelectItem value="Fase D">Fase D</SelectItem>
                    <SelectItem value="Fase E">Fase E</SelectItem>
                    <SelectItem value="Fase F">Fase F</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Kelompok di Rapor{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("kelompok")}
                  onValueChange={(v) =>
                    form.setValue("kelompok", v as KelompokMapel)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="umum">Kelompok Umum</SelectItem>
                    <SelectItem value="muatan_lokal">
                      Muatan Lokal (Paket B)
                    </SelectItem>
                    <SelectItem value="peminatan_ips">
                      Peminatan Ilmu-ilmu Sosial
                    </SelectItem>
                    <SelectItem value="khusus">
                      Kelompok Khusus (PJOK, Prakarya, dll)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Kelompok menentukan posisi mapel di tabel nilai rapor.
            </p>

            <div className="space-y-2">
              <Label>Agama (khusus mapel Pendidikan Agama)</Label>
              <Select
                value={form.watch("agama") ?? AGAMA_NONE_SENTINEL}
                onValueChange={(v) =>
                  form.setValue(
                    "agama",
                    v === AGAMA_NONE_SENTINEL
                      ? null
                      : (v as MataPelajaranFormData["agama"])
                  )
                }
              >
                <SelectTrigger
                  className={cn(
                    showAgamaWarning && "border-rose-400 ring-1 ring-rose-200"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AGAMA_NONE_SENTINEL}>
                    — Tidak ada (mapel umum) —
                  </SelectItem>
                  {AGAMA_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Set agama hanya untuk mapel <strong>Pendidikan Agama</strong>.
                Mapel umum (Matematika, B.Indo, dll) biarkan kosong. Mapel PA
                dengan agama yang di-set cuma muncul ke siswa beragama sama.
              </p>
              {showAgamaWarning && (
                <p className="text-xs text-rose-700 flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Nama mapel mengandung &quot;Pendidikan Agama&quot; tapi
                  belum di-set agamanya. Pilih salah satu di atas.
                </p>
              )}
            </div>

            {duplicateRow && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-medium text-rose-900">
                    Mata pelajaran ini sudah ada
                  </p>
                  <p className="text-rose-800 mt-0.5">
                    Sudah ada &quot;{duplicateRow.nama}&quot; di{" "}
                    {duplicateRow.paket}
                    {duplicateRow.fase ? ` · ${duplicateRow.fase}` : ""}
                    {duplicateRow.agama ? ` · agama ${duplicateRow.agama}` : ""}
                    . Tidak boleh duplikat — ubah nama, paket, fase, atau
                    agamanya.
                  </p>
                </div>
              </div>
            )}

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
          </div>

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
              disabled={isPending || !!duplicateRow}
              title={duplicateRow ? "Tidak bisa simpan: duplikat" : undefined}
              className="flex-1 gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEditMode ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// KompetensiSheet — PARENT viewer (WIDE 2xl)
// Replaces KompetensiPanel Dialog
// ============================================================

function KompetensiSheet({
  mapel,
  onClose,
  onAddKd,
  onEditKd,
}: {
  mapel: MataPelajaran | null;
  onClose: () => void;
  onAddKd: () => void;
  onEditKd: (kd: KompetensiDasar) => void;
}) {
  const isDesktop = useIsDesktop();
  const open = mapel !== null;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 flex flex-col gap-0",
          // WIDE TIER (2xl) — list KD bisa banyak + space ekstra
          isDesktop && "w-full sm:max-w-2xl",
          !isDesktop && "h-auto max-h-[88vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">
          Kelola Kompetensi Dasar — {mapel?.nama ?? ""}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Daftar kompetensi dasar untuk mata pelajaran ini, beserta deskripsi
          per predikat A/B/C/D
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {mapel && (
          <KompetensiSheetBody
            mapel={mapel}
            onClose={onClose}
            onAddKd={onAddKd}
            onEditKd={onEditKd}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function KompetensiSheetBody({
  mapel,
  onClose,
  onAddKd,
  onEditKd,
}: {
  mapel: MataPelajaran;
  onClose: () => void;
  onAddKd: () => void;
  onEditKd: (kd: KompetensiDasar) => void;
}) {
  const { data: kdList, isLoading } = useKompetensiByMapel(mapel.id);

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          <ListChecks className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Kompetensi Dasar
          </p>
          <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
            {mapel.nama}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mapel.paket}
            {mapel.fase ? ` · ${mapel.fase}` : ""} ·{" "}
            {kdList?.length ?? 0} KD
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : !kdList || kdList.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada KD untuk mapel ini. Klik <em>Tambah KD</em> di footer.
          </div>
        ) : (
          kdList.map((kd) => (
            <div
              key={kd.id}
              className={cn(
                "rounded-lg border p-3 space-y-1",
                !kd.is_aktif && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {kd.nama_kompetensi}
                    </span>
                    {!kd.is_aktif && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 bg-muted text-muted-foreground"
                      >
                        Nonaktif
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Urutan: {kd.urutan}
                  </p>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onEditKd(kd)}
                    aria-label={`Edit ${kd.nama_kompetensi}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <DeleteKdButton id={kd.id} mapelId={mapel.id} />
                </div>
              </div>
              {/* Preview deskripsi singkat */}
              <div className="grid grid-cols-2 gap-1 mt-2 text-[11px] text-muted-foreground">
                <p className="truncate">
                  <span className="font-mono font-semibold text-foreground">
                    A:
                  </span>{" "}
                  {kd.deskripsi_a}
                </p>
                <p className="truncate">
                  <span className="font-mono font-semibold text-foreground">
                    B:
                  </span>{" "}
                  {kd.deskripsi_b}
                </p>
                <p className="truncate">
                  <span className="font-mono font-semibold text-foreground">
                    C:
                  </span>{" "}
                  {kd.deskripsi_c}
                </p>
                <p className="truncate">
                  <span className="font-mono font-semibold text-foreground">
                    D:
                  </span>{" "}
                  {kd.deskripsi_d}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="flex-1"
        >
          Tutup
        </Button>
        <Button size="sm" onClick={onAddKd} className="flex-1 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Tambah KD
        </Button>
      </div>
    </>
  );
}

// ============================================================
// DeleteKdButton — inline AlertDialog
// ============================================================

function DeleteKdButton({ id, mapelId }: { id: number; mapelId: number }) {
  const del = useDeleteKompetensi();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          aria-label="Hapus KD"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus kompetensi dasar?</AlertDialogTitle>
          <AlertDialogDescription>
            KD ini akan dihapus permanen. Nilai siswa yang terkait KD ini juga
            akan ikut terhapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => del.mutate({ id, mapelId })}
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
// KdFormSheet — child of KompetensiSheet (WIDE 2xl)
// Replaces KompetensiForm Dialog
// ============================================================

function KdFormSheet({
  open,
  onOpenChange,
  mapelId,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mapelId: number | null;
  editing: KompetensiDasar | null;
}) {
  const isDesktop = useIsDesktop();
  const createMut = useCreateKompetensi();
  const updateMut = useUpdateKompetensi();

  const form = useForm<KompetensiDasarFormData>({
    resolver: typedResolver(kompetensiDasarSchema),
    values: editing
      ? {
          mata_pelajaran_id: editing.mata_pelajaran_id,
          nama_kompetensi: editing.nama_kompetensi,
          urutan: editing.urutan,
          deskripsi_a: editing.deskripsi_a,
          deskripsi_b: editing.deskripsi_b,
          deskripsi_c: editing.deskripsi_c,
          deskripsi_d: editing.deskripsi_d,
          is_aktif: editing.is_aktif,
        }
      : {
          mata_pelajaran_id: mapelId ?? 0,
          nama_kompetensi: "",
          urutan: 99,
          deskripsi_a: "",
          deskripsi_b: "",
          deskripsi_c: "",
          deskripsi_d: "",
          is_aktif: true,
        },
  });

  const onSubmit = async (values: KompetensiDasarFormData) => {
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
          // WIDE TIER (2xl) — match parent KompetensiSheet untuk
          // full overlap. Plus 4 textarea panjang butuh space.
          isDesktop && "w-full sm:max-w-2xl",
          !isDesktop && "h-auto max-h-[92vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">
          {editing ? "Edit Kompetensi Dasar" : "Tambah Kompetensi Dasar"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form untuk {editing ? "mengedit" : "menambahkan"} kompetensi dasar
          beserta deskripsi capaian per predikat
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col min-h-0"
        >
          <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              {editing ? (
                <Pencil className="h-4 w-4 text-primary" />
              ) : (
                <Plus className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {editing ? "Edit Kompetensi Dasar" : "Tambah Kompetensi Dasar"}
              </p>
              <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                {editing ? editing.nama_kompetensi : "KD Baru"}
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div className="space-y-2">
                <Label>
                  Nama Kompetensi <span className="text-destructive">*</span>
                </Label>
                <Input {...form.register("nama_kompetensi")} />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  {...form.register("urutan")}
                />
              </div>
            </div>

            {(["a", "b", "c", "d"] as const).map((lvl) => (
              <div key={lvl} className="space-y-2">
                <Label>
                  Deskripsi Predikat {lvl.toUpperCase()}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  rows={3}
                  {...form.register(`deskripsi_${lvl}` as const)}
                  placeholder={`Capaian saat predikat ${lvl.toUpperCase()}…`}
                />
              </div>
            ))}

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label>Aktif</Label>
              <Switch
                checked={form.watch("is_aktif")}
                onCheckedChange={(v) => form.setValue("is_aktif", v)}
              />
            </div>
          </div>

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
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editing ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
