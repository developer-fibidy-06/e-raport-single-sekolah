// ============================================================
// FILE PATH: src/components/features/admin/tab-siswa.tsx
// ============================================================
// REPLACE. v3.1 — fix TypeScript errors di SiswaFormSheet.
//
// CHANGELOG vs v3.0:
//
//   1. FIX TS2322 (line 537 di v3.0): default values useForm
//      ga punya field `agama` padahal schema require enum agama.
//      → Tambahkan `agama: "Islam"` sebagai default add-mode
//      (user wajib pilih ulang via Select, tapi default ini bikin
//      type cocok dengan `PesertaDidikFormData`).
//
//   2. FIX TS2345 + TS2322 (resolver type bleed jadi FieldValues):
//      RHF v7.72 + resolver wrapper kadang bikin generic param
//      `TFieldValues` bocor. Solusi: pakai `useForm<TInput, TContext,
//      TOutput>` dengan ketiga param eksplisit — yaitu
//      `useForm<PesertaDidikFormData, unknown, PesertaDidikFormData>`.
//      Ini nge-pin `Control<...>` jadi konsisten antara `useForm()`
//      output dan `<FormField control={form.control} />`.
//
//   3. PRESERVED semua behavior dari v3.0:
//      - Sheet pattern (right desktop / bottom mobile)
//      - Konsolidasi add/edit jadi 1 SiswaFormSheet
//      - Selection persist Set<string>
//      - Bulk action bar
//      - Delete confirm dengan impact preview (single + bulk)
//      - 15+ form fields, 3 grouped sections
//      - Agama required hint
//
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  pesertaDidikSchema,
  typedResolver,
  AGAMA_VALUES,
  type PesertaDidikFormData,
} from "@/lib/validators";
import {
  usePesertaDidik,
  useCreatePesertaDidik,
  useUpdatePesertaDidik,
  useDeletePesertaDidik,
  useBulkDeletePesertaDidik,
  useSiswaDeletionImpact,
  useBulkSiswaDeletionImpact,
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
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  Search,
  Upload,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  UserPlus,
} from "lucide-react";
import type { PesertaDidik } from "@/types";
import { ImportSiswaSheet } from "./import-siswa-sheet";
import { cn } from "@/lib/utils";

// ============================================================
// MAIN
// ============================================================

export function TabSiswa() {
  const [search, setSearch] = useState("");
  const [editSiswa, setEditSiswa] = useState<PesertaDidik | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<PesertaDidik | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const { data: siswaList = [], isLoading } = usePesertaDidik();
  const deleteSiswa = useDeletePesertaDidik();
  const bulkDelete = useBulkDeletePesertaDidik();

  const filtered = useMemo(() => {
    return siswaList.filter(
      (s) =>
        s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
        (s.nisn ?? "").includes(search)
    );
  }, [siswaList, search]);

  const filteredIds = useMemo(() => filtered.map((s) => s.id), [filtered]);

  const visibleSelectedCount = useMemo(
    () => filteredIds.filter((id) => selectedIds.has(id)).length,
    [filteredIds, selectedIds]
  );

  const allFilteredSelected =
    filteredIds.length > 0 && visibleSelectedCount === filteredIds.length;
  const someFilteredSelected =
    visibleSelectedCount > 0 && visibleSelectedCount < filteredIds.length;

  const hiddenSelectedCount = selectedIds.size - visibleSelectedCount;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const headerCheckedState: boolean | "indeterminate" = allFilteredSelected
    ? true
    : someFilteredSelected
      ? "indeterminate"
      : false;

  return (
    <div className="space-y-4">
      {/* Toolbar: search + import + tambah */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau NISN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setShowImport(true)}
          size="sm"
          variant="outline"
          className="gap-1.5"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Tambah Siswa
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          totalSelected={selectedIds.size}
          hiddenSelected={hiddenSelectedCount}
          onCancel={clearSelection}
          onBulkDelete={() => setConfirmBulkDelete(true)}
        />
      )}

      {/* List — Table dengan checkbox column */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {search ? "Tidak ditemukan." : "Belum ada peserta didik."}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-3 pr-1">
                  <Checkbox
                    checked={headerCheckedState}
                    onCheckedChange={toggleSelectAll}
                    aria-label={
                      allFilteredSelected
                        ? "Batal pilih semua siswa di halaman ini"
                        : "Pilih semua siswa di halaman ini"
                    }
                  />
                </TableHead>
                <TableHead className="w-12 px-2 text-xs">#</TableHead>
                <TableHead className="px-2 text-xs">Siswa</TableHead>
                <TableHead className="w-24 px-2 text-xs text-center">
                  Status
                </TableHead>
                <TableHead className="w-12 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s, idx) => {
                const isSelected = selectedIds.has(s.id);
                return (
                  <SiswaRow
                    key={s.id}
                    siswa={s}
                    index={idx + 1}
                    isSelected={isSelected}
                    onToggleSelect={() => toggleOne(s.id)}
                    onEdit={() => setEditSiswa(s)}
                    onDelete={() => setConfirmDelete(s)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet — Tambah Siswa (mode add) */}
      <SiswaFormSheet
        open={showAdd}
        onOpenChange={setShowAdd}
        editing={null}
      />

      {/* Sheet — Edit Siswa (mode edit) */}
      <SiswaFormSheet
        open={editSiswa !== null}
        onOpenChange={(v) => {
          if (!v) setEditSiswa(null);
        }}
        editing={editSiswa}
      />

      {/* Sheet — Import CSV */}
      <ImportSiswaSheet open={showImport} onOpenChange={setShowImport} />

      {/* Modal — Single delete confirm */}
      {confirmDelete && (
        <DeleteSiswaConfirm
          siswa={confirmDelete}
          isPending={deleteSiswa.isPending}
          onConfirm={() =>
            deleteSiswa.mutate(confirmDelete.id, {
              onSuccess: () => {
                setSelectedIds((prev) => {
                  if (!prev.has(confirmDelete.id)) return prev;
                  const next = new Set(prev);
                  next.delete(confirmDelete.id);
                  return next;
                });
                setConfirmDelete(null);
              },
            })
          }
          onClose={() => setConfirmDelete(null)}
        />
      )}

      {/* Modal — Bulk delete confirm */}
      {confirmBulkDelete && (
        <BulkDeleteSiswaConfirm
          ids={Array.from(selectedIds)}
          siswaList={siswaList}
          isPending={bulkDelete.isPending}
          onConfirm={() =>
            bulkDelete.mutate(Array.from(selectedIds), {
              onSuccess: () => {
                setConfirmBulkDelete(false);
                clearSelection();
              },
            })
          }
          onClose={() => setConfirmBulkDelete(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// SiswaRow — single row dengan checkbox + kebab menu
// ============================================================

function SiswaRow({
  siswa,
  index,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  siswa: PesertaDidik;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow
      onClick={onEdit}
      className={cn(
        "cursor-pointer",
        isSelected && "bg-primary/5 hover:bg-primary/10"
      )}
      data-state={isSelected ? "selected" : undefined}
    >
      <TableCell
        className="w-10 pl-3 pr-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Pilih ${siswa.nama_lengkap}`}
        />
      </TableCell>
      <TableCell className="w-12 px-2 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
        {index}.
      </TableCell>
      <TableCell className="px-2 py-2.5 max-w-0">
        <p className="text-sm font-medium truncate">{siswa.nama_lengkap}</p>
        <p className="text-xs text-muted-foreground truncate">
          NISN: {siswa.nisn ?? "-"} ·{" "}
          {siswa.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
          {siswa.agama ? ` · ${siswa.agama}` : ""}
        </p>
      </TableCell>
      <TableCell className="w-24 px-2 py-2.5 text-center">
        {siswa.is_aktif ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] h-4 px-1.5 bg-muted text-muted-foreground"
          >
            Nonaktif
          </Badge>
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
              aria-label={`Aksi untuk ${siswa.nama_lengkap}`}
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
              Edit Siswa
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
              Hapus Siswa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ============================================================
// BulkActionBar
// ============================================================

function BulkActionBar({
  totalSelected,
  hiddenSelected,
  onCancel,
  onBulkDelete,
}: {
  totalSelected: number;
  hiddenSelected: number;
  onCancel: () => void;
  onBulkDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-primary/5 px-3 py-2 flex-wrap">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Checkbox checked aria-hidden tabIndex={-1} className="cursor-default" />
        <div className="text-sm min-w-0">
          <span className="font-medium">{totalSelected} siswa terpilih</span>
          {hiddenSelected > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              ({hiddenSelected} tidak terlihat di pencarian saat ini)
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Batal Pilih
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          className="h-8 gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus Terpilih
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// SiswaFormSheet — handles BOTH add (editing=null) and edit modes
// ============================================================

// Default values utk add-mode. Note `agama: "Islam"` — schema require
// enum, jadi default ini bikin type cocok. User tetep harus pilih
// ulang lewat Select (tapi karena default udh valid, form ga error
// di mount).
const ADD_MODE_DEFAULTS: PesertaDidikFormData = {
  nama_lengkap: "",
  jenis_kelamin: "L",
  agama: "Islam",
  nisn: "",
  nis: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  alamat: "",
  rt: "",
  rw: "",
  kelurahan: "",
  kecamatan: "",
  kabupaten: "",
  provinsi: "",
  nama_ayah: "",
  nama_ibu: "",
  pekerjaan_ayah: "",
  pekerjaan_ibu: "",
  no_telp_ortu: "",
  is_aktif: true,
};

function SiswaFormSheet({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: PesertaDidik | null;
}) {
  const isDesktop = useIsDesktop();
  const createSiswa = useCreatePesertaDidik();
  const updateSiswa = useUpdatePesertaDidik();

  const isEditMode = editing !== null;

  // Generic eksplisit <TFieldValues, TContext, TTransformedValues>
  // utk nge-pin Control type — fix RHF v7.72 type bleed yg bikin
  // Control jadi pake FieldValues default.
  const form = useForm<PesertaDidikFormData, unknown, PesertaDidikFormData>({
    resolver: typedResolver(pesertaDidikSchema),
    values: editing
      ? (editing as unknown as PesertaDidikFormData)
      : ADD_MODE_DEFAULTS,
  });

  const isPending = createSiswa.isPending || updateSiswa.isPending;

  const onSubmit = (values: PesertaDidikFormData) => {
    if (isEditMode && editing) {
      updateSiswa.mutate(
        { id: editing.id, values },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createSiswa.mutate(values, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

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
            ? `Edit Siswa — ${editing?.nama_lengkap}`
            : "Tambah Peserta Didik"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Form {isEditMode ? "edit" : "tambah"} data peserta didik (identitas,
          alamat, orang tua)
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
                {isEditMode ? (
                  <Pencil className="h-4 w-4 text-primary" />
                ) : (
                  <UserPlus className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {isEditMode ? "Edit Peserta Didik" : "Tambah Peserta Didik"}
                </p>
                <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">
                  {isEditMode ? editing?.nama_lengkap : "Siswa Baru"}
                </h3>
                {isEditMode && editing?.nisn && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    NISN: {editing.nisn}
                  </p>
                )}
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-5">
              {/* SECTION 1: Identitas */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Identitas
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nama_lengkap"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>
                          Nama Lengkap{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nisn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NISN</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIS</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jenis_kelamin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Jenis Kelamin{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
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
                            <SelectItem value="L">Laki-laki</SelectItem>
                            <SelectItem value="P">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Agama <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih agama" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGAMA_VALUES.map((a) => (
                              <SelectItem key={a} value={a}>
                                {a}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Wajib. Otomatis filter mapel Pendidikan Agama yang
                          muncul ke siswa ini.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tempat_lahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempat Lahir</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tanggal_lahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* SECTION 2: Alamat */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Alamat
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="alamat"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Alamat</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {(
                    [
                      "rt",
                      "rw",
                      "kelurahan",
                      "kecamatan",
                      "kabupaten",
                      "provinsi",
                    ] as const
                  ).map((n) => (
                    <FormField
                      key={n}
                      control={form.control}
                      name={n}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize">{n}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </section>

              {/* SECTION 3: Orang Tua */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Orang Tua
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      "nama_ayah",
                      "nama_ibu",
                      "pekerjaan_ayah",
                      "pekerjaan_ibu",
                      "no_telp_ortu",
                    ] as const
                  ).map((n) => (
                    <FormField
                      key={n}
                      control={form.control}
                      name={n}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize">
                            {n.replace(/_/g, " ")}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </section>
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
                {isEditMode ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// DeleteSiswaConfirm — single delete dengan impact preview
// ============================================================

function DeleteSiswaConfirm({
  siswa,
  isPending,
  onConfirm,
  onClose,
}: {
  siswa: PesertaDidik;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { data: impact, isLoading } = useSiswaDeletionImpact(siswa.id);

  const hasData = (impact?.enrollmentCount ?? 0) > 0;
  const hasPublishedRapor = (impact?.raporPublishedCount ?? 0) > 0;
  const isDangerous = hasData;

  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus siswa &quot;{siswa.nama_lengkap}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Siswa akan dihapus permanen dari sistem dan tidak bisa di-undo.
              </p>

              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Memeriksa data terkait…
                </div>
              ) : !hasData ? (
                <div className="rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                  Tidak ada enrollment atau nilai yang terhubung. Aman untuk
                  dihapus.
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
                          Siswa ini punya rapor yang sudah dipublikasi.
                          Pertimbangkan <strong>nonaktifkan saja</strong>{" "}
                          (Edit → Aktif: off) supaya history tetap tersimpan.
                        </>
                      ) : (
                        <>
                          Penilaian P5, ekskul, absensi, dan catatan wali kelas
                          ikut ke-cascade-delete.
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
              ? `Hapus siswa + ${impact!.enrollmentCount} enrollment`
              : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================
// BulkDeleteSiswaConfirm — multi delete dengan aggregate impact
// ============================================================

function BulkDeleteSiswaConfirm({
  ids,
  siswaList,
  isPending,
  onConfirm,
  onClose,
}: {
  ids: string[];
  siswaList: PesertaDidik[];
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { data: impact, isLoading } = useBulkSiswaDeletionImpact(ids);

  const selectedSiswa = useMemo(() => {
    const idSet = new Set(ids);
    return siswaList
      .filter((s) => idSet.has(s.id))
      .sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap, "id"));
  }, [ids, siswaList]);

  const previewNames = selectedSiswa.slice(0, 5).map((s) => s.nama_lengkap);
  const moreCount = Math.max(0, selectedSiswa.length - 5);

  const hasData = (impact?.enrollmentCount ?? 0) > 0;
  const hasPublishedRapor = (impact?.raporPublishedCount ?? 0) > 0;
  const isDangerous = hasData;

  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus {ids.length} siswa terpilih?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Semua siswa berikut akan dihapus permanen dari sistem dan tidak
                bisa di-undo.
              </p>

              <div className="rounded-lg border bg-muted/30 p-2.5 text-xs space-y-1">
                <p className="font-medium text-foreground">
                  Siswa yang akan dihapus:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {previewNames.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                  {moreCount > 0 && (
                    <li className="italic">+{moreCount} lainnya</li>
                  )}
                </ul>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Memeriksa data terkait…
                </div>
              ) : !hasData ? (
                <div className="rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                  Tidak ada enrollment atau nilai yang terhubung untuk
                  siswa-siswa ini. Aman untuk dihapus.
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
                      ⚠️ Total dampak agregat:
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
                          Beberapa siswa terpilih punya rapor yang sudah
                          dipublikasi. Pertimbangkan untuk{" "}
                          <strong>tidak menghapus</strong> dan biarkan sebagai
                          arsip riwayat.
                        </>
                      ) : (
                        <>
                          Penilaian P5, ekskul, absensi, dan catatan wali kelas
                          ikut ke-cascade-delete untuk semua siswa terpilih.
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
              ? `Hapus ${ids.length} siswa + ${impact!.enrollmentCount} enrollment`
              : `Hapus ${ids.length} siswa`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}