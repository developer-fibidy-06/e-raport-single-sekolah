// ============================================================
// FILE PATH: src/components/features/admin/tab-mata-pelajaran.tsx
// ============================================================
// REPLACE versi sebelumnya. Perubahan TUNGGAL dari versi sebelumnya:
//
//   1. DeleteKdButton: signature ganti dari `{ id }` jadi
//      `{ id, mapelId }` supaya match useDeleteKompetensi yang
//      butuh dua field (untuk invalidate query per-mapel).
//   2. Caller di KompetensiPanel: pass mapelId dari `mapel.id`.
//
// Sisa logic TIDAK BERUBAH dari versi yang lo share — semua
// duplicate guard, drawer detail, KD management, kebab menu, dll.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Drawer } from "vaul";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Pencil,
  Trash2,
  ListChecks,
  AlertTriangle,
  ChevronRight,
  X,
  BookOpen,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
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
  const [editing, setEditing] = useState<MataPelajaran | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [kompetensiOf, setKompetensiOf] = useState<MataPelajaran | null>(null);
  const [detailOf, setDetailOf] = useState<MataPelajaran | null>(null);

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
      {/* Header */}
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

      {paTanpaAgamaCount > 0 && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-sm">
            <p className="font-medium text-rose-900">
              {paTanpaAgamaCount} mata pelajaran &quot;Pendidikan Agama&quot; belum di-tag agamanya
            </p>
            <p className="text-xs text-rose-800 mt-0.5">
              Mapel PA harus di-set kolom <strong>Agama</strong>-nya (Islam/Kristen/dst)
              biar muncul ke siswa yang tepat. Klik mapel → Edit → set Agama.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
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
                            <TableHead className="w-8 px-2" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((m, i) => {
                            const nomor = m.urutan || i + 1;
                            return (
                              <TableRow
                                key={m.id}
                                onClick={() => setDetailOf(m)}
                                className={cn(
                                  "cursor-pointer",
                                  !m.is_aktif && "opacity-60"
                                )}
                              >
                                <TableCell className="w-12 px-3 py-2 text-xs text-muted-foreground tabular-nums">
                                  {nomor}.
                                </TableCell>
                                <TableCell className="px-2 py-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                    <span
                                      className="text-sm truncate"
                                      title={m.nama}
                                    >
                                      {m.nama}
                                    </span>
                                    {m.agama && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 px-1.5 bg-violet-50 text-violet-700 border-violet-200"
                                      >
                                        {m.agama}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="w-8 px-2 py-2">
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </TableCell>
                              </TableRow>
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

      <MapelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        existingMapel={mapelList ?? []}
      />

      <MapelDetailDrawer
        mapel={detailOf}
        onClose={() => setDetailOf(null)}
        onEdit={(m) => {
          setDetailOf(null);
          setEditing(m);
          setFormOpen(true);
        }}
        onManageKd={(m) => {
          setDetailOf(null);
          setKompetensiOf(m);
        }}
      />

      {kompetensiOf && (
        <KompetensiPanel
          mapel={kompetensiOf}
          onClose={() => setKompetensiOf(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// DETAIL DRAWER
// ============================================================

function MapelDetailDrawer({
  mapel,
  onClose,
  onEdit,
  onManageKd,
}: {
  mapel: MataPelajaran | null;
  onClose: () => void;
  onEdit: (m: MataPelajaran) => void;
  onManageKd: (m: MataPelajaran) => void;
}) {
  const isDesktop = useIsDesktop();
  const direction = isDesktop ? "right" : "bottom";
  const open = mapel !== null;

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
            "right-0 top-0 bottom-0 w-full max-w-md border-l shadow-xl",
            !isDesktop &&
            "left-0 right-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t shadow-xl"
          )}
        >
          <Drawer.Title className="sr-only">Detail Mata Pelajaran</Drawer.Title>
          <Drawer.Description className="sr-only">
            Detail informasi mata pelajaran beserta tombol aksi edit, hapus, dan kelola kompetensi dasar
          </Drawer.Description>

          {!isDesktop && (
            <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          {mapel && (
            <DrawerBody
              mapel={mapel}
              onClose={onClose}
              onEdit={() => onEdit(mapel)}
              onManageKd={() => onManageKd(mapel)}
            />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function DrawerBody({
  mapel,
  onClose,
  onEdit,
  onManageKd,
}: {
  mapel: MataPelajaran;
  onClose: () => void;
  onEdit: () => void;
  onManageKd: () => void;
}) {
  const { data: kdList } = useKompetensiByMapel(mapel.id);
  const kdCount = kdList?.length ?? 0;

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 flex-wrap">
          {mapel.fase ? (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              {mapel.fase}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Tanpa Fase
            </Badge>
          )}
          {mapel.agama && (
            <Badge
              variant="outline"
              className="bg-violet-50 text-violet-700 border-violet-200"
            >
              Agama: {mapel.agama}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={mapel.is_aktif ? "default" : "secondary"}
            className={cn(
              mapel.is_aktif
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                : "bg-muted text-muted-foreground"
            )}
          >
            {mapel.is_aktif ? "Aktif" : "Nonaktif"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Mata Pelajaran
          </p>
          <h3 className="text-base font-semibold leading-tight">
            {mapel.nama}
          </h3>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
          <InfoRow label="Paket" value={mapel.paket} />
          <InfoRow
            label="Kelompok"
            value={KELOMPOK_LABEL[mapel.kelompok as KelompokMapel] ?? mapel.kelompok}
          />
          <InfoRow
            label="Agama"
            value={mapel.agama ?? "— (mapel umum)"}
          />
          <InfoRow label="Urutan" value={String(mapel.urutan)} />
          <InfoRow label="Kompetensi Dasar" value={`${kdCount} KD`} />
        </div>

        {mapel.agama && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 flex items-start gap-2.5">
            <BookOpen className="h-4 w-4 text-violet-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-violet-900">
              <p className="font-medium">Mapel Pendidikan Agama spesifik</p>
              <p className="mt-0.5">
                Mapel ini cuma muncul ke siswa dengan agama{" "}
                <strong>{mapel.agama}</strong>. Siswa lain (agama berbeda)
                bakal liat mapel PA versi mereka di slot yang sama.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t bg-background px-4 py-3 sm:px-5 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[120px] gap-1.5"
          onClick={onManageKd}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Kelola KD ({kdCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[100px] gap-1.5"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <DeleteMapelDrawerButton
          mapelId={mapel.id}
          nama={mapel.nama}
          onDeleted={onClose}
        />
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

// ============================================================
// DELETE BUTTON — dengan counter nilai (CASCADE warning)
// ============================================================

function DeleteMapelDrawerButton({
  mapelId,
  nama,
  onDeleted,
}: {
  mapelId: number;
  nama: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const deleteMut = useDeleteMataPelajaran();

  const { data: nilaiCount, isLoading: loadingCount } = useNilaiCountByMapel(
    open ? mapelId : null
  );

  const hasNilai = (nilaiCount ?? 0) > 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[100px] gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus mata pelajaran?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                &quot;<span className="font-medium text-foreground">{nama}</span>&quot;{" "}
                akan dihapus permanen dari sistem.
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
                      Karena CASCADE aktif, semua nilai yang menggunakan
                      mata pelajaran ini akan terhapus permanen dan{" "}
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
              deleteMut.mutate(mapelId, {
                onSuccess: () => {
                  setOpen(false);
                  onDeleted();
                },
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
            {hasNilai
              ? `Hapus mapel + ${nilaiCount} nilai`
              : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
// FORM DIALOG — live duplicate hint
// ============================================================

function MapelFormDialog({
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
  const createMut = useCreateMataPelajaran();
  const updateMut = useUpdateMataPelajaran();

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

  const isPaMapel = (watchedNama ?? "").toLowerCase().includes("pendidikan agama");
  const showAgamaWarning = isPaMapel && !watchedAgama;

  const duplicateRow = useMemo(() => {
    const namaTrim = (watchedNama ?? "").trim().toLowerCase();
    if (!namaTrim) return null;
    return existingMapel.find((m) => {
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
    }) ?? null;
  }, [watchedNama, watchedPaket, watchedFase, watchedAgama, existingMapel, editing]);

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
      // toast handled by hook
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Mata Pelajaran *</Label>
            <Input
              id="nama"
              {...form.register("nama")}
              placeholder="Misal: Bahasa Indonesia"
              className={cn(duplicateRow && "border-rose-400 ring-1 ring-rose-200")}
            />
            {form.formState.errors.nama && (
              <p className="text-xs text-destructive">{form.formState.errors.nama.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Paket *</Label>
              <Select
                value={form.watch("paket")}
                onValueChange={(v) => form.setValue("paket", v as MataPelajaranFormData["paket"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input type="number" min={1} max={99} {...form.register("urutan")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fase</Label>
              <Select
                value={form.watch("fase") ?? ""}
                onValueChange={(v) => form.setValue("fase", v as MataPelajaranFormData["fase"])}
              >
                <SelectTrigger><SelectValue placeholder="Pilih fase" /></SelectTrigger>
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
              <Label>Kelompok di Rapor *</Label>
              <Select
                value={form.watch("kelompok")}
                onValueChange={(v) => form.setValue("kelompok", v as KelompokMapel)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="umum">Kelompok Umum</SelectItem>
                  <SelectItem value="muatan_lokal">Muatan Lokal (Paket B)</SelectItem>
                  <SelectItem value="peminatan_ips">Peminatan Ilmu-ilmu Sosial</SelectItem>
                  <SelectItem value="khusus">Kelompok Khusus (PJOK, Prakarya, dll)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Kelompok menentukan posisi mapel di tabel nilai rapor.
          </p>

          {/* Agama */}
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
                Nama mapel mengandung &quot;Pendidikan Agama&quot; tapi belum
                di-set agamanya. Pilih salah satu di atas.
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
                  Sudah ada &quot;{duplicateRow.nama}&quot; di {duplicateRow.paket}
                  {duplicateRow.fase ? ` · ${duplicateRow.fase}` : ""}
                  {duplicateRow.agama ? ` · agama ${duplicateRow.agama}` : ""}.
                  Tidak boleh duplikat — ubah nama, paket, fase, atau agamanya.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor="is_aktif" className="cursor-pointer">Aktif</Label>
            <Switch
              id="is_aktif"
              checked={form.watch("is_aktif")}
              onCheckedChange={(v) => form.setValue("is_aktif", v)}
            />
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
            <Button
              type="submit"
              disabled={isPending || !!duplicateRow}
              title={duplicateRow ? "Tidak bisa simpan: duplikat" : undefined}
            >
              {editing ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// KOMPETENSI PANEL
// ============================================================

function KompetensiPanel({
  mapel,
  onClose,
}: {
  mapel: MataPelajaran;
  onClose: () => void;
}) {
  const { data: kdList, isLoading } = useKompetensiByMapel(mapel.id);
  const [editing, setEditing] = useState<KompetensiDasar | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Kompetensi Dasar — {mapel.nama}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah KD
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : !kdList || kdList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada KD untuk mapel ini.</p>
        ) : (
          <div className="space-y-3">
            {kdList.map((kd) => (
              <div key={kd.id} className="rounded border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{kd.nama_kompetensi}</div>
                    <div className="text-xs text-muted-foreground">Urutan: {kd.urutan}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(kd);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteKdButton id={kd.id} mapelId={mapel.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <KompetensiForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mapelId={mapel.id}
          editing={editing}
        />
      </DialogContent>
    </Dialog>
  );
}

function DeleteKdButton({ id, mapelId }: { id: number; mapelId: number }) {
  const del = useDeleteKompetensi();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus kompetensi dasar?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => del.mutate({ id, mapelId })}
            className="bg-destructive text-destructive-foreground"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function KompetensiForm({
  open,
  onOpenChange,
  mapelId,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mapelId: number;
  editing: KompetensiDasar | null;
}) {
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
        mata_pelajaran_id: mapelId,
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
    } catch { }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Kompetensi Dasar" : "Tambah Kompetensi Dasar"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <div className="space-y-2">
              <Label>Nama Kompetensi *</Label>
              <Input {...form.register("nama_kompetensi")} />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" {...form.register("urutan")} />
            </div>
          </div>

          {(["a", "b", "c", "d"] as const).map((lvl) => (
            <div key={lvl} className="space-y-2">
              <Label>Deskripsi Predikat {lvl.toUpperCase()} *</Label>
              <Textarea
                rows={2}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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