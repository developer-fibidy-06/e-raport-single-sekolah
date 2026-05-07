// ============================================================
// FILE PATH: src/components/features/admin/tab-tahun-kelas.tsx
// ============================================================
// REPLACE. v2.7 — migrasi Modal/Dialog → Sheet pattern (lengkap).
//
// CHANGELOG vs v2.5:
//
//   1. KelolaKelasDrawer (vaul Drawer) → KelolaKelasSheet
//      Ganti pakai shadcn `Sheet` (Radix Dialog wrapper). Visual
//      sama-sama side panel di desktop & bottom sheet di mobile,
//      tapi pakai primitive shadcn yang konsisten dengan sisa
//      codebase (no more import vaul di file ini).
//
//   2. TambahKelasDialog (Dialog modal) → TambahKelasSheet
//      Ganti dari modal di tengah jadi side-sheet kanan (desktop)
//      / bottom-sheet (mobile). Lebih sesuai untuk workflow yang
//      panjang (form 4 field) ketimbang interrupt-style modal.
//
//   3. EditKelasDialog (Dialog modal) → EditKelasSheet
//      Same treatment.
//
//   4. EnrollmentDialog (Dialog modal) → EnrollmentSheet  [v2.7]
//      Kelola siswa (3 tab terdaftar/existing/baru) sekarang juga
//      pakai Sheet. Inner ConfirmKeluarDialog (konfirmasi
//      keluarkan/pindah/lulus siswa) TETEP Dialog modal — sesuai
//      filosofi: modal khusus untuk konfirmasi destruktif.
//      File baru: enrollment-sheet.tsx (replaces enrollment-dialog.tsx).
//
//   5. STACKING — kunci UX yang diminta user:
//      - SEMUA sheet (parent KelolaKelas + child Tambah/Edit + child
//        Enrollment) pakai width seragam `sm:max-w-xl` (576px) di
//        desktop. [v2.7 final — request user]
//      - Saat child Sheet open, parent Sheet TETAP open di belakang
//        (state independen). Child fully overlap parent secara visual,
//        tapi stacking tetep terbukti via:
//          • Radix overlay (dimming layer terpisah per Sheet)
//          • Slide-in animation (child slide masuk dari kanan/bawah)
//          • Z-index otomatis via portal mount order
//      - Tekan Batal / submit success → child Sheet close,
//        parent Sheet stay → user balik ke daftar kelas tanpa
//        kehilangan konteks. Sesuai prinsip:
//        "modal cuma untuk dialog delete, sisanya pakai sheet".
//      - Triple stacking saat Keluarkan siswa: parent KelolaKelasSheet
//        → child EnrollmentSheet → ConfirmKeluarDialog (modal). Radix
//        handle z-index via portal mount order otomatis.
//      - Escape: tutup yang paling atas dulu (Radix default).
//
//   6. PRESERVED:
//      - Semua hooks (useTahunPelajaran, useKelasByTahun, useCreateKelas,
//        useUpdateKelas, useDeleteKelas, useKelasDeletionImpact, dll)
//      - Tahun creation form di toolbar atas
//      - Table tahun pelajaran + kebab menu
//      - DeleteKelasConfirm (AlertDialog) — modal untuk delete OK
//      - ConfirmDialog hapus tahun — modal untuk delete OK
//      - TanggalCetakGlobalWarning + TanggalCetakRowBadge
//      - TanggalCetakPaketForm di body parent sheet
//      - KelasItem (row di parent sheet body): inline Kelola Siswa
//        button + Edit + Delete icons
//      - Form schema, validation, auto-build nama_kelas, hint paralel,
//        preview nama_kelas, useEffect sync
//      - useIsDesktop responsive helper (right side desktop / bottom
//        sheet mobile)
//
//   7. REMOVED imports:
//      - vaul (Drawer.Root, Drawer.Content, dst) — tidak dipakai lagi
//      - Dialog primitives (Dialog, DialogContent, DialogHeader, dst)
//        sudah tidak dipakai di file ini
//
//   8. NOTE: file `enrollment-dialog.tsx` lama bisa dihapus setelah
//      file ini di-replace. Sudah tidak ada yang import dari sana.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  useKelasDeletionImpact,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Calendar,
  AlertTriangle,
} from "lucide-react";
import type { TahunPelajaran, RombonganBelajar } from "@/types";
import { EnrollmentSheet } from "./enrollment-sheet";
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
      {/* Top toolbar — form tambah tahun */}
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
          yang missing tanggal cetak. */}
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
                  onOpenSheet={() => setDrawerTahun(tp)}
                  onSetAktif={() => setAktif.mutate(tp.id)}
                  onDelete={() => setShowDeleteTahun(tp.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── PARENT SHEET — Kelola Kelas ─────────────────────── */}
      <KelolaKelasSheet
        tahun={drawerTahun}
        onClose={() => setDrawerTahun(null)}
        onAddKelas={() => setShowAddKelas(true)}
        onEditKelas={setEditKelas}
        onDeleteKelas={setShowDeleteKelas}
        onManageSiswa={setManageKelas}
      />

      {/* ─── CHILD SHEET — Tambah Kelas (di atas parent) ────── */}
      <TambahKelasSheet
        open={showAddKelas}
        onOpenChange={setShowAddKelas}
        tahun={drawerTahun}
      />

      {/* ─── CHILD SHEET — Edit Kelas (di atas parent) ──────── */}
      <EditKelasSheet
        kelas={editKelas}
        onClose={() => setEditKelas(null)}
      />

      {/* ─── MODAL — Confirm hapus tahun ─────────────────────── */}
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

      {/* ─── MODAL — Confirm hapus kelas (smart impact preview) ─ */}
      {showDeleteKelas !== null && (
        <DeleteKelasConfirm
          kelasId={showDeleteKelas}
          isPending={deleteKelas.isPending}
          onConfirm={() =>
            deleteKelas.mutate(showDeleteKelas, {
              onSuccess: () => setShowDeleteKelas(null),
            })
          }
          onClose={() => setShowDeleteKelas(null)}
        />
      )}

      {/* ─── CHILD SHEET — Enrollment (kelola siswa) ──────────── */}
      {/* v2.7: Subflow 3 tab (terdaftar/existing/baru) sekarang juga
          pakai Sheet (sebelumnya Dialog modal). Width sm:max-w-xl
          (576px) — seragam dengan parent + Tambah/Edit child. Inner
          ConfirmKeluarDialog tetep modal (delete confirmation OK). */}
      <EnrollmentSheet
        kelas={
          manageKelas
            ? {
                id: manageKelas.id,
                nama_kelas: manageKelas.nama_kelas,
                paket: manageKelas.paket,
                fase: manageKelas.fase,
                tahun_pelajaran_id: manageKelas.tahun_pelajaran_id,
              }
            : null
        }
        onClose={() => setManageKelas(null)}
      />
    </div>
  );
}

// ============================================================
// DeleteKelasConfirm — AlertDialog (modal untuk delete = OK)
// ============================================================

function DeleteKelasConfirm({
  kelasId,
  isPending,
  onConfirm,
  onClose,
}: {
  kelasId: number;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { data: impact, isLoading } = useKelasDeletionImpact(kelasId);

  const hasData = (impact?.enrollmentCount ?? 0) > 0;
  const hasPublishedRapor = (impact?.raporPublishedCount ?? 0) > 0;
  const isDangerous = hasData;

  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus kelas ini?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Kelas akan dihapus permanen dari sistem dan tidak bisa di-undo.
              </p>

              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Memeriksa data terkait…
                </div>
              ) : !hasData ? (
                <div className="rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                  Tidak ada siswa atau nilai yang terhubung. Aman untuk dihapus.
                </div>
              ) : (
                <div
                  className={cn(
                    "rounded-lg border p-3 flex items-start gap-2.5",
                    hasPublishedRapor
                      ? "border-rose-300 bg-rose-50"
                      : "border-amber-300 bg-amber-50"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4 flex-shrink-0 mt-0.5",
                      hasPublishedRapor ? "text-rose-700" : "text-amber-700"
                    )}
                  />
                  <div className="flex-1 min-w-0 text-xs space-y-1.5">
                    <p
                      className={cn(
                        "font-semibold",
                        hasPublishedRapor ? "text-rose-900" : "text-amber-900"
                      )}
                    >
                      ⚠️ Akan ikut menghapus data berikut:
                    </p>
                    <ul
                      className={cn(
                        "space-y-0.5 list-disc list-inside",
                        hasPublishedRapor ? "text-rose-800" : "text-amber-800"
                      )}
                    >
                      <li>
                        <strong>{impact!.enrollmentCount}</strong> enrollment
                        {impact!.enrollmentAktifCount > 0 && (
                          <> ({impact!.enrollmentAktifCount} aktif)</>
                        )}
                      </li>
                      {impact!.nilaiCount > 0 && (
                        <li>
                          <strong>{impact!.nilaiCount}</strong> nilai mapel
                          (CASCADE)
                        </li>
                      )}
                      {hasPublishedRapor && (
                        <li className="font-semibold">
                          <strong>{impact!.raporPublishedCount}</strong> rapor
                          yang sudah <em>published</em> ⚠️
                        </li>
                      )}
                    </ul>
                    <p
                      className={cn(
                        "mt-2 text-[11px]",
                        hasPublishedRapor ? "text-rose-700" : "text-amber-700"
                      )}
                    >
                      {hasPublishedRapor ? (
                        <>
                          Kelas ini punya rapor yang sudah dipublikasi.
                          Pertimbangkan untuk <strong>tidak menghapus</strong>{" "}
                          dan biarkan sebagai arsip riwayat.
                        </>
                      ) : (
                        <>
                          Penilaian P5, ekskul, absensi, dan catatan wali
                          kelas ikut ke-cascade-delete.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending || isLoading}
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              hasPublishedRapor && "ring-2 ring-rose-400 ring-offset-1"
            )}
          >
            {isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            {isDangerous
              ? `Hapus kelas + ${impact!.enrollmentCount} enrollment`
              : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
// TahunTableRow — single row dengan kebab menu
// ============================================================

function TahunTableRow({
  tahun,
  index,
  isSettingAktif,
  onOpenSheet,
  onSetAktif,
  onDelete,
}: {
  tahun: TahunPelajaran;
  index: number;
  isSettingAktif: boolean;
  onOpenSheet: () => void;
  onSetAktif: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow onClick={onOpenSheet} className="cursor-pointer">
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
// KelolaKelasSheet — PARENT SHEET (replaces vaul Drawer)
// ============================================================
// shadcn Sheet wrapper. Side responsive: kanan di desktop, bawah
// di mobile. Width `sm:max-w-xl` (576px) — seragam dengan semua
// child Sheet (Tambah/Edit/Enrollment). Stacking via Radix portal
// mount order + overlay layer.
// ============================================================

function KelolaKelasSheet({
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
  const open = tahun !== null;

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
          isDesktop && "w-full sm:max-w-xl",
          !isDesktop && "h-auto max-h-[88vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">
          Kelola Kelas — {tahun?.nama ?? ""}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Kelola daftar kelas dan tanggal cetak rapor untuk tahun pelajaran ini
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {tahun && (
          <KelolaKelasSheetBody
            tahun={tahun}
            onClose={onClose}
            onAddKelas={onAddKelas}
            onEditKelas={onEditKelas}
            onDeleteKelas={onDeleteKelas}
            onManageSiswa={onManageSiswa}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// KelolaKelasSheetBody — header + body (scroll) + footer (sticky)
// ============================================================

function KelolaKelasSheetBody({
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
      {/* Header — pr-12 supaya tidak ketabrak tombol X auto Sheet */}
      <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
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

        {/* Daftar kelas */}
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
// KelasItem — 1 row kelas di parent sheet body, inline action icons
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
// TambahKelasSheet — CHILD SHEET (replaces TambahKelasDialog)
// ============================================================
// Slide-in dari kanan (desktop) / bawah (mobile) di atas parent
// Sheet. Width `sm:max-w-xl` — seragam dengan parent. Child fully
// overlap parent, tapi stacking tetep terbukti via Radix overlay
// + slide animation + portal z-index.
//
// Batal / submit success → onOpenChange(false) → cuma child Sheet
// yang close, parent Sheet TETAP open. User balik ke daftar
// kelas tanpa kehilangan konteks.
// ============================================================

function TambahKelasSheet({
  open,
  onOpenChange,
  tahun,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tahun: TahunPelajaran | null;
}) {
  const isDesktop = useIsDesktop();
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

  // Sync tahun_pelajaran_id setiap sheet dibuka untuk tahun berbeda
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

  // Kalau parent close & tahun jadi null, jangan render sheet content.
  // Tapi <Sheet open={false}> tetap aman dirender → no-op visual.
  if (!tahun) {
    return (
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent className="hidden">
          <SheetTitle className="sr-only">Tambah Kelas</SheetTitle>
        </SheetContent>
      </Sheet>
    );
  }

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
          Tambah Kelas — {tahun.nama} Semester {tahun.semester}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form untuk menambahkan kelas baru ke tahun pelajaran ini
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
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Tambah Kelas Baru
                </p>
                <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                  {tahun.nama} Semester {tahun.semester}
                </h3>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
              <div className="grid gap-2 grid-cols-2">
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
            </div>

            {/* Footer — sticky, gak scroll */}
            <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={createKelas.isPending}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createKelas.isPending}
                className="flex-1 gap-1.5"
              >
                {createKelas.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Tambah Kelas
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// EditKelasSheet — CHILD SHEET (replaces EditKelasDialog)
// ============================================================
// Sama persis pattern dengan TambahKelasSheet — slide-in di atas
// parent. Submit success / Batal → child close, parent stay.
// ============================================================

function EditKelasSheet({
  kelas,
  onClose,
}: {
  kelas: RombonganBelajar | null;
  onClose: () => void;
}) {
  const isDesktop = useIsDesktop();
  const update = useUpdateKelas();
  const open = kelas !== null;

  const form = useForm<RombonganBelajarFormData>({
    resolver: typedResolver(rombonganBelajarSchema),
    defaultValues: {
      tahun_pelajaran_id: 0,
      nama_kelas: "Kelas 1",
      tingkat: 1,
      kelas_paralel: "Tidak ada",
      paket: "Paket A",
      fase: "Fase A",
      wali_kelas: "",
    },
  });

  // Sync defaults setiap kali kelas berubah (saat sheet dibuka)
  useEffect(() => {
    if (kelas) {
      form.reset({
        tahun_pelajaran_id: kelas.tahun_pelajaran_id,
        nama_kelas: kelas.nama_kelas,
        tingkat: kelas.tingkat,
        kelas_paralel:
          kelas.kelas_paralel as RombonganBelajarFormData["kelas_paralel"],
        paket: kelas.paket as RombonganBelajarFormData["paket"],
        fase: kelas.fase as RombonganBelajarFormData["fase"],
        wali_kelas: kelas.wali_kelas ?? "",
      });
    }
  }, [kelas, form]);

  const onSubmit = (values: RombonganBelajarFormData) => {
    if (!kelas) return;
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
          isDesktop && "w-full sm:max-w-xl",
          !isDesktop && "h-auto max-h-[92vh] rounded-t-2xl"
        )}
      >
        <SheetTitle className="sr-only">
          Edit Kelas — {kelas?.nama_kelas ?? ""}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form untuk mengedit data kelas (paket, fase, wali kelas)
        </SheetDescription>

        {!isDesktop && (
          <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {kelas && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-1 flex-col min-h-0"
            >
              {/* Header */}
              <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 pr-12">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Pencil className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Edit Kelas
                  </p>
                  <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                    {kelas.nama_kelas}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tingkat &amp; paralel tidak dapat diubah setelah kelas dibuat
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="paket"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Paket</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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

                {/* Info read-only fields */}
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  <p>
                    Nama kelas:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {kelas.nama_kelas}
                    </span>
                  </p>
                  <p>
                    Tingkat:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {kelas.tingkat}
                    </span>{" "}
                    · Paralel:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {kelas.kelas_paralel}
                    </span>
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t bg-background px-4 py-3 sm:px-5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={update.isPending}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={update.isPending}
                  className="flex-1 gap-1.5"
                >
                  {update.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
