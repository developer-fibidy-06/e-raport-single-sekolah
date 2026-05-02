// ============================================================
// FILE PATH: src/components/features/admin/tab-siswa.tsx
// ============================================================
// REPLACE. Perubahan dari versi sebelumnya:
//
//   1. Hapus hardcode `AGAMA_OPTIONS = [...]` lokal,
//      import `AGAMA_VALUES` dari validators (single source of truth,
//      konsisten dengan SQL CHECK constraint).
//   2. Field Agama: tambah asterisk merah di label (visual cue wajib).
//   3. Default value `agama: ""` dihapus dari defaultValues —
//      undefined di-translate ke placeholder "Pilih agama" oleh
//      Select. Validator (z.enum required) bakal tolak save kalo
//      admin lupa pilih.
//   4. Tambah deskripsi kecil di bawah Select Agama: jelasin kenapa
//      wajib + dampak di filter mapel Pendidikan Agama.
//
//   List view, form layout, dialog wiring, hooks, ImportSiswaDialog —
//   TIDAK BERUBAH.
//
// CATATAN: ImportSiswaDialog (CSV import) di file terpisah. Kalo CSV
// lo punya row tanpa kolom agama / agama kosong, insert akan ditolak
// sama DB CHECK constraint setelah v3 nuclear reset. Update
// import-siswa-dialog.tsx terpisah kalo butuh validation di-side
// front-end juga.
// ============================================================

"use client";

import { useState } from "react";
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
} from "@/hooks";
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
import { Loader2, Plus, Search, Upload, ChevronRight } from "lucide-react";
import type { PesertaDidik } from "@/types";
import { ImportSiswaDialog } from "./import-siswa-dialog";

// ============================================================
// SiswaForm — agama jadi required field
// ============================================================

function SiswaForm({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: Partial<PesertaDidikFormData>;
  onSubmit: (v: PesertaDidikFormData) => void;
  isPending: boolean;
}) {
  const form = useForm<PesertaDidikFormData>({
    resolver: typedResolver(pesertaDidikSchema),
    defaultValues: {
      nama_lengkap: "",
      jenis_kelamin: "L",
      nisn: "",
      nis: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      // agama: tidak di-set default — undefined → placeholder muncul,
      // admin force pick. Validator (z.enum) catch kalau lupa.
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
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-h-[65vh] overflow-y-auto pr-1"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nama_lengkap"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  Nama Lengkap <span className="text-destructive">*</span>
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
                  Jenis Kelamin <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
                  Wajib. Otomatis filter mapel Pendidikan Agama yang muncul
                  ke siswa ini di halaman Penilaian dan rapor.
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
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            ["rt", "rw", "kelurahan", "kecamatan", "kabupaten", "provinsi"] as const
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

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ============================================================
// MAIN
// ============================================================

export function TabSiswa() {
  const [search, setSearch] = useState("");
  const [editSiswa, setEditSiswa] = useState<PesertaDidik | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: siswaList = [], isLoading } = usePesertaDidik();
  const createSiswa = useCreatePesertaDidik();
  const updateSiswa = useUpdatePesertaDidik();

  const filtered = siswaList.filter(
    (s) =>
      s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      (s.nisn ?? "").includes(search)
  );

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

      {/* List — Table pattern */}
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
                <TableHead className="w-12 px-3 text-xs">#</TableHead>
                <TableHead className="px-2 text-xs">Siswa</TableHead>
                <TableHead className="w-24 px-2 text-xs text-center">
                  Status
                </TableHead>
                <TableHead className="w-8 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s, idx) => (
                <TableRow
                  key={s.id}
                  onClick={() => setEditSiswa(s)}
                  className="cursor-pointer"
                >
                  <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
                    {idx + 1}.
                  </TableCell>
                  <TableCell className="px-2 py-2.5 max-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.nama_lengkap}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      NISN: {s.nisn ?? "-"} ·{" "}
                      {s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                      {s.agama ? ` · ${s.agama}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="w-24 px-2 py-2.5 text-center">
                    {s.is_aktif ? (
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
                  <TableCell className="w-8 px-2 py-2.5">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add manual dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Peserta Didik</DialogTitle>
          </DialogHeader>
          <SiswaForm
            isPending={createSiswa.isPending}
            onSubmit={(values) =>
              createSiswa.mutate(values, {
                onSuccess: () => setShowAdd(false),
              })
            }
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editSiswa} onOpenChange={() => setEditSiswa(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Peserta Didik</DialogTitle>
          </DialogHeader>
          {editSiswa && (
            <SiswaForm
              defaultValues={
                editSiswa as unknown as Partial<PesertaDidikFormData>
              }
              isPending={updateSiswa.isPending}
              onSubmit={(values) =>
                updateSiswa.mutate(
                  { id: editSiswa.id, values },
                  { onSuccess: () => setEditSiswa(null) }
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import CSV */}
      <ImportSiswaDialog open={showImport} onOpenChange={setShowImport} />
    </div>
  );
}