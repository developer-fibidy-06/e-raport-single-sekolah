// ============================================================
// FILE PATH: src/components/features/admin/tab-tahun-kelas.tsx
// ============================================================
// REPLACE. v2.4 — integrasi tanggal cetak per paket A/B/C.
//
// CHANGELOG vs versi sebelumnya (yang lo share):
//
//   1. Imports: TAMBAH 2 baris untuk komponen tanggal cetak
//      (TanggalCetakGlobalWarning, TanggalCetakRowBadge,
//       TanggalCetakPaketForm).
//
//   2. TabTahunKelas: TAMBAH <TanggalCetakGlobalWarning /> setelah
//      toolbar form add tahun, sebelum table list TP. Banner ini
//      muncul kalau ada minimal 1 TP × paket yang missing tanggal.
//
//   3. TahunTableRow: TAMBAH <TanggalCetakRowBadge> di kolom utama
//      (Tahun & Semester), tampil sebagai row inline di bawah nama
//      TP — kasih signal merah kalau row ini punya paket yang
//      belum di-set tanggalnya.
//
//   4. DrawerBody: TAMBAH section "Tanggal Cetak Rapor" di atas
//      list kelas (di body drawer). Berisi form 3 paket dengan
//      status badge per paket. Admin bisa langsung edit dari sini.
//
// SEMUA logic existing (hooks, KelolaKelasDrawer, TambahKelasDialog,
// EditKelasDialog, EnrollmentDialog, ConfirmDialog, KELAS_PARALEL_VALUES,
// buildNamaKelas helper, dll) PRESERVED tanpa perubahan.
//
// Total tambahan: 3 baris import + ~15 baris JSX di 3 lokasi.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Drawer } from "vaul";
import {
  tahunPelajaranSchema,
  rombonganBelajarSchema,
  typedResolver,
  KELAS_PARALEL_VALUES,
  type TahunPelajaranFormData,
  type RombonganBelajarFormData,
} from "@/lib/validators";
import {
  useTahunPelajaran,
  useCreateTahunPelajaran,
  useSetTahunPelajaranAktif,
  useDeleteTahunPelajaran,
  useKelasByTahun,
  useCreateKelas,
  useUpdateKelas,
  useDeleteKelas,
} from "@/hooks";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  Pencil,
  UserCircle,
  MoreHorizontal,
  X,
  Calendar,
} from "lucide-react";
import type { TahunPelajaran, RombonganBelajar } from "@/types";
import { EnrollmentDialog } from "./enrollment-dialog";
import { cn } from "@/lib/utils";

// ── v2.4: integrasi tanggal cetak per paket ──
import {
  TanggalCetakGlobalWarning,
  TanggalCetakRowBadge,
} from "./tanggal-cetak-warning-badge";
import { TanggalCetakPaketForm } from "./tanggal-cetak-paket-form";

const PAKET_OPTIONS = ["Paket A", "Paket B", "Paket C"] as const;
const FASE_OPTIONS = [
  "Fase A",
  "Fase B",
  "Fase C",
  "Fase D",
  "Fase E",
  "Fase F",
] as const;

// ────────────────────────────────────────────────────────────
// Helper: build nama_kelas dari tingkat + paralel.
// Convention:
//   paralel="Tidak ada" → "Kelas 12"   (no suffix)
//   paralel="A"         → "Kelas 12A"  (compact, no space)
//   paralel="B"         → "Kelas 12B"
// ────────────────────────────────────────────────────────────
function buildNamaKelas(tingkat: number, paralel: string): string {
  const suffix = paralel === "Tidak ada" ? "" : paralel;
  return `Kelas ${tingkat}${suffix}`;
}

// ============================================================
// MAIN
// ============================================================

export function TabTahunKelas() {
  const [drawerTahun, setDrawerTahun] = useState<TahunPelajaran | null>(null);
  const [showAddKelas, setShowAddKelas] = useState(false);
  const [editKelas, setEditKelas] = useState<RombonganBelajar | null>(null);
  const [manageKelas, setManageKelas] = useState<RombonganBelajar | null>(null);
  const [showDeleteTahun, setShowDeleteTahun] = useState<number | null>(null);
  const [showDeleteKelas, setShowDeleteKelas] = useState<number | null>(null);

  const { data: tahunList = [], isLoading: loadingTahun } = useTahunPelajaran();
  const createTahun = useCreateTahunPelajaran();
  const setAktif = useSetTahunPelajaranAktif();
  const deleteTahun = useDeleteTahunPelajaran();
  const deleteKelas = useDeleteKelas();

  const tahunForm = useForm<TahunPelajaranFormData>({
    resolver: typedResolver(tahunPelajaranSchema),
    defaultValues: { nama: "", semester: 1, is_aktif: false },
  });

  const onAddTahun = (values: TahunPelajaranFormData) => {
    createTahun.mutate(values, { onSuccess: () => tahunForm.reset() });
  };

  return (
    <div className="space-y-4">
      {/* Top toolbar — form tambah tahun, no heading no Card */}
      <Form {...tahunForm}>
        <form
          onSubmit={tahunForm.handleSubmit(onAddTahun)}
          className="flex items-start gap-2 flex-wrap"
        >
          <FormField
            control={tahunForm.control}
            name="nama"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-[140px]">
                <FormControl>
                  <Input placeholder="2025/2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={tahunForm.control}
            name="semester"
            render={({ field }) => (
              <FormItem className="w-32">
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={createTahun.isPending}
            size="sm"
            className="self-start"
          >
            {createTahun.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Tambah
          </Button>
        </form>
      </Form>

      {/* v2.4: Banner warning global — muncul kalau ada TP × paket
          yang missing tanggal cetak. Self-contained, fetch sendiri. */}
      <TanggalCetakGlobalWarning />

      {/* Table tahun pelajaran */}
      {loadingTahun ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : tahunList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada tahun pelajaran. Tambahkan dari form di atas.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-3 text-xs">#</TableHead>
                <TableHead className="px-2 text-xs">
                  Tahun &amp; Semester
                </TableHead>
                <TableHead className="w-20 px-2 text-xs text-center">
                  Status
                </TableHead>
                <TableHead className="w-12 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tahunList.map((tp, idx) => (
                <TahunTableRow
                  key={tp.id}
                  tahun={tp}
                  index={idx + 1}
                  isSettingAktif={setAktif.isPending}
                  onOpenDrawer={() => setDrawerTahun(tp)}
                  onSetAktif={() => setAktif.mutate(tp.id)}
                  onDelete={() => setShowDeleteTahun(tp.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Drawer kelola kelas */}
      <KelolaKelasDrawer
        tahun={drawerTahun}
        onClose={() => setDrawerTahun(null)}
        onAddKelas={() => setShowAddKelas(true)}
        onEditKelas={setEditKelas}
        onDeleteKelas={setShowDeleteKelas}
        onManageSiswa={setManageKelas}
      />

      {/* Dialog tambah kelas */}
      <TambahKelasDialog
        open={showAddKelas}
        onOpenChange={setShowAddKelas}
        tahun={drawerTahun}
      />

      {/* Dialog edit kelas */}
      {editKelas && (
        <EditKelasDialog kelas={editKelas} onClose={() => setEditKelas(null)} />
      )}

      {/* Confirm hapus tahun */}
      <ConfirmDialog
        open={!!showDeleteTahun}
        onOpenChange={() => setShowDeleteTahun(null)}
        title="Hapus Tahun Pelajaran?"
        description="Semua kelas, tanggal cetak per paket, dan data terkait akan ikut terhapus."
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={deleteTahun.isPending}
        onConfirm={() => {
          if (showDeleteTahun)
            deleteTahun.mutate(showDeleteTahun, {
              onSuccess: () => {
                setShowDeleteTahun(null);
                setDrawerTahun(null);
              },
            });
        }}
      />

      {/* Confirm hapus kelas */}
      <ConfirmDialog
        open={!!showDeleteKelas}
        onOpenChange={() => setShowDeleteKelas(null)}
        title="Hapus Kelas?"
        description="Semua siswa dan nilai di kelas ini akan ikut terhapus."
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={deleteKelas.isPending}
        onConfirm={() => {
          if (showDeleteKelas)
            deleteKelas.mutate(showDeleteKelas, {
              onSuccess: () => setShowDeleteKelas(null),
            });
        }}
      />

      {/* Enrollment (kelola siswa) */}
      {manageKelas && (
        <EnrollmentDialog
          open
          onOpenChange={(v) => !v && setManageKelas(null)}
          kelas={{
            id: manageKelas.id,
            nama_kelas: manageKelas.nama_kelas,
            paket: manageKelas.paket,
            fase: manageKelas.fase,
            tahun_pelajaran_id: manageKelas.tahun_pelajaran_id,
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// TahunTableRow — single row dengan kebab menu
// v2.4: tambah TanggalCetakRowBadge di kolom utama
// ============================================================

function TahunTableRow({
  tahun,
  index,
  isSettingAktif,
  onOpenDrawer,
  onSetAktif,
  onDelete,
}: {
  tahun: TahunPelajaran;
  index: number;
  isSettingAktif: boolean;
  onOpenDrawer: () => void;
  onSetAktif: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow onClick={onOpenDrawer} className="cursor-pointer">
      <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
        {index}.
      </TableCell>
      <TableCell className="px-2 py-2.5 max-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="block truncate text-sm font-medium">
            {tahun.nama} — Semester {tahun.semester}
          </span>
          {/* v2.4: badge merah kalau ada paket yang missing tanggal */}
          <TanggalCetakRowBadge tahunPelajaranId={tahun.id} />
        </div>
      </TableCell>
      <TableCell className="w-20 px-2 py-2.5 text-center">
        {tahun.is_aktif ? (
          <Badge
            variant="outline"
            className="text-[10px] h-4 px-1.5 bg-green-50 text-green-700 border-green-200"
          >
            Aktif
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="w-12 px-2 py-2.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Aksi untuk ${tahun.nama} Semester ${tahun.semester}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSetAktif();
              }}
              disabled={tahun.is_aktif || isSettingAktif}
            >
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              {tahun.is_aktif ? "Sudah Aktif" : "Set Aktif"}
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
              Hapus Tahun
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ============================================================
// KelolaKelasDrawer — vaul responsive direction
// ============================================================

function KelolaKelasDrawer({
  tahun,
  onClose,
  onAddKelas,
  onEditKelas,
  onDeleteKelas,
  onManageSiswa,
}: {
  tahun: TahunPelajaran | null;
  onClose: () => void;
  onAddKelas: () => void;
  onEditKelas: (k: RombonganBelajar) => void;
  onDeleteKelas: (id: number) => void;
  onManageSiswa: (k: RombonganBelajar) => void;
}) {
  const isDesktop = useIsDesktop();
  const direction = isDesktop ? "right" : "bottom";
  const open = tahun !== null;

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
            "right-0 top-0 bottom-0 w-full max-w-xl border-l shadow-xl",
            !isDesktop &&
            "left-0 right-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t shadow-xl"
          )}
        >
          <Drawer.Title className="sr-only">Kelola Kelas</Drawer.Title>
          <Drawer.Description className="sr-only">
            Kelola daftar kelas untuk tahun pelajaran ini
          </Drawer.Description>

          {!isDesktop && (
            <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          {tahun && (
            <DrawerBody
              tahun={tahun}
              onClose={onClose}
              onAddKelas={onAddKelas}
              onEditKelas={onEditKelas}
              onDeleteKelas={onDeleteKelas}
              onManageSiswa={onManageSiswa}
            />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ============================================================
// DrawerBody — v2.4: tambah section Tanggal Cetak Rapor di body
// ============================================================

function DrawerBody({
  tahun,
  onClose,
  onAddKelas,
  onEditKelas,
  onDeleteKelas,
  onManageSiswa,
}: {
  tahun: TahunPelajaran;
  onClose: () => void;
  onAddKelas: () => void;
  onEditKelas: (k: RombonganBelajar) => void;
  onDeleteKelas: (id: number) => void;
  onManageSiswa: (k: RombonganBelajar) => void;
}) {
  const { data: kelasList = [], isLoading } = useKelasByTahun(tahun.id);

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Tahun Pelajaran
          </p>
          <h3 className="text-base font-semibold leading-tight mt-0.5">
            {tahun.nama} Semester {tahun.semester}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {tahun.is_aktif && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 bg-green-50 text-green-700 border-green-200"
              >
                Aktif
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {kelasList.length} kelas
            </span>
          </div>
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

      {/* Body — section tanggal cetak + list kelas */}
      <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 space-y-5">
        {/* v2.4: Tanggal Cetak Rapor per Paket */}
        <section className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold">Tanggal Cetak Rapor</h4>
            <p className="text-xs text-muted-foreground">
              Set tanggal cetak per paket. Tanggal ini muncul di TTD rapor.
              Rapor cuma bisa di-cetak setelah paket-nya punya tanggal.
            </p>
          </div>
          <TanggalCetakPaketForm tahunPelajaranId={tahun.id} />
        </section>

        <div className="border-t" />

        {/* Daftar kelas — existing logic */}
        <section className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold">Daftar Kelas</h4>
            <p className="text-xs text-muted-foreground">
              {kelasList.length} kelas terdaftar di tahun pelajaran ini.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : kelasList.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada kelas. Klik <em>Tambah Kelas</em> di footer.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {kelasList.map((k) => (
                <KelasItem
                  key={k.id}
                  kelas={k}
                  onEdit={() => onEditKelas(k)}
                  onDelete={() => onDeleteKelas(k.id)}
                  onManageSiswa={() => onManageSiswa(k)}
                />
              ))}
            </div>
          )}
        </section>
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
        <Button size="sm" onClick={onAddKelas} className="flex-1 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Tambah Kelas
        </Button>
      </div>
    </>
  );
}

// ============================================================
// KelasItem — 1 row kelas di drawer body, inline action icons
// ============================================================

function KelasItem({
  kelas,
  onEdit,
  onDelete,
  onManageSiswa,
}: {
  kelas: RombonganBelajar;
  onEdit: () => void;
  onDelete: () => void;
  onManageSiswa: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{kelas.nama_kelas}</p>
        <p className="text-xs text-muted-foreground truncate">
          {kelas.paket} · {kelas.fase}
          {kelas.wali_kelas && (
            <>
              {" · "}
              <span className="inline-flex items-center gap-1">
                <UserCircle className="h-3 w-3 inline" />
                {kelas.wali_kelas}
              </span>
            </>
          )}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1 flex-shrink-0"
        onClick={onManageSiswa}
      >
        <Users className="h-3 w-3" />
        <span className="hidden sm:inline">Kelola Siswa</span>
        <span className="sm:hidden">Siswa</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={onEdit}
        title="Edit kelas"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
        onClick={onDelete}
        title="Hapus kelas"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ============================================================
// TambahKelasDialog — form add kelas dengan support paralel "Tidak ada"
// ============================================================

function TambahKelasDialog({
  open,
  onOpenChange,
  tahun,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tahun: TahunPelajaran | null;
}) {
  const createKelas = useCreateKelas();

  const form = useForm<RombonganBelajarFormData>({
    resolver: typedResolver(rombonganBelajarSchema),
    defaultValues: {
      tahun_pelajaran_id: tahun?.id ?? 0,
      nama_kelas: "Kelas 1",
      tingkat: 1,
      kelas_paralel: "Tidak ada",
      paket: "Paket A",
      fase: "Fase A",
      wali_kelas: "",
    },
  });

  // Sync tahun_pelajaran_id setiap dialog dibuka untuk tahun berbeda
  useEffect(() => {
    if (tahun) {
      form.setValue("tahun_pelajaran_id", tahun.id);
    }
  }, [tahun, form]);

  // Auto-update nama_kelas berdasarkan tingkat + paralel
  const watchTingkat = form.watch("tingkat");
  const watchParalel = form.watch("kelas_paralel");
  useEffect(() => {
    form.setValue("nama_kelas", buildNamaKelas(watchTingkat, watchParalel));
  }, [watchTingkat, watchParalel, form]);

  const onSubmit = (values: RombonganBelajarFormData) => {
    if (!tahun) return;
    createKelas.mutate(
      {
        ...values,
        tahun_pelajaran_id: tahun.id,
        nama_kelas: buildNamaKelas(values.tingkat, values.kelas_paralel),
        wali_kelas: values.wali_kelas?.trim() || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset({
            tahun_pelajaran_id: tahun.id,
            nama_kelas: "Kelas 1",
            tingkat: 1,
            kelas_paralel: "Tidak ada",
            paket: "Paket A",
            fase: "Fase A",
            wali_kelas: "",
          });
        },
      }
    );
  };

  if (!tahun) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Tambah Kelas — {tahun.nama} Semester {tahun.semester}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-4">
              <FormField
                control={form.control}
                name="tingkat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tingkat</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (n) => (
                            <SelectItem key={n} value={String(n)}>
                              Kelas {n}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kelas_paralel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Paralel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {KELAS_PARALEL_VALUES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Paket</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAKET_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Fase</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FASE_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hint paralel */}
            <p className="text-[11px] text-muted-foreground">
              <strong>Tip Paralel:</strong> Pilih{" "}
              <span className="font-mono">&quot;Tidak ada&quot;</span> kalau
              tingkat ini cuma 1 kelas (mayoritas PKBM kecil). Pilih{" "}
              <span className="font-mono">A/B</span> kalau perlu split jadi 2
              kelas paralel (misal murid 25+).
            </p>

            <FormField
              control={form.control}
              name="wali_kelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1">
                    <UserCircle className="h-3 w-3" />
                    Wali Kelas (opsional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: WAHYU RATNA NINGRUM, S.Pd"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview nama_kelas yang akan dibuat */}
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Nama kelas:{" "}
              <span className="font-mono font-semibold text-foreground">
                {buildNamaKelas(watchTingkat, watchParalel)}
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createKelas.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createKelas.isPending}>
                {createKelas.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Tambah Kelas
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// EditKelasDialog — type cast paralel diperbaiki
// ============================================================

function EditKelasDialog({
  kelas,
  onClose,
}: {
  kelas: RombonganBelajar;
  onClose: () => void;
}) {
  const update = useUpdateKelas();

  const form = useForm<RombonganBelajarFormData>({
    resolver: typedResolver(rombonganBelajarSchema),
    defaultValues: {
      tahun_pelajaran_id: kelas.tahun_pelajaran_id,
      nama_kelas: kelas.nama_kelas,
      tingkat: kelas.tingkat,
      kelas_paralel: kelas.kelas_paralel as RombonganBelajarFormData["kelas_paralel"],
      paket: kelas.paket as RombonganBelajarFormData["paket"],
      fase: kelas.fase as RombonganBelajarFormData["fase"],
      wali_kelas: kelas.wali_kelas ?? "",
    },
  });

  const onSubmit = (values: RombonganBelajarFormData) => {
    update.mutate(
      {
        id: kelas.id,
        values: {
          paket: values.paket,
          fase: values.fase,
          wali_kelas: values.wali_kelas?.trim() || null,
        },
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {kelas.nama_kelas}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="paket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Paket</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAKET_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Fase</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FASE_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="wali_kelas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1">
                    <UserCircle className="h-3 w-3" />
                    Wali Kelas
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: WAHYU RATNA NINGRUM, S.Pd"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}