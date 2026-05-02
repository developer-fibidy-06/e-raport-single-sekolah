// ============================================================
// FILE PATH: src/components/features/admin/enrollment-dialog.tsx
// ============================================================
// Komponen baru untuk kelola siswa per kelas.
// Dipakai oleh TabTahunKelas.
// ============================================================

"use client";

import { useMemo, useState } from "react";
import {
  useEnrollmentByKelasAll,
  useUnenrolledSiswa,
  useEnrollSiswa,
  useSetEnrollmentStatus,
  useCreateSiswaAndEnroll,
} from "@/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  UserMinus,
  ListChecks,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface KelasCtx {
  id: number;
  nama_kelas: string;
  paket: string;
  fase: string;
  tahun_pelajaran_id: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kelas: KelasCtx;
}

type TabKey = "terdaftar" | "existing" | "baru";

const TABS: Array<{ key: TabKey; label: string; icon: typeof Users }> = [
  { key: "terdaftar", label: "Siswa Terdaftar", icon: Users },
  { key: "existing", label: "Pilih Existing", icon: ListChecks },
  { key: "baru", label: "Daftarkan Baru", icon: UserPlus },
];

export function EnrollmentDialog({ open, onOpenChange, kelas }: Props) {
  const [tab, setTab] = useState<TabKey>("terdaftar");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setTab("terdaftar");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-3 border-b">
          <DialogTitle>Kelola Siswa — {kelas.nama_kelas}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {kelas.paket} · {kelas.fase}
          </p>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-b overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                  tab === t.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "terdaftar" && <TerdaftarPanel kelas={kelas} />}
          {tab === "existing" && (
            <ExistingPanel kelas={kelas} onSuccess={() => setTab("terdaftar")} />
          )}
          {tab === "baru" && (
            <BaruPanel kelas={kelas} onSuccess={() => setTab("terdaftar")} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────
// TAB 1 — SISWA TERDAFTAR
// ────────────────────────────────────────────────────────────

type StatusFilter = "aktif" | "non-aktif" | "all";

function TerdaftarPanel({ kelas }: { kelas: KelasCtx }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("aktif");
  const [confirmKeluar, setConfirmKeluar] = useState<{
    enrollmentId: string;
    nama: string;
  } | null>(null);

  const { data: enrollments = [], isLoading } = useEnrollmentByKelasAll(kelas.id);

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "aktif") return e.status === "aktif";
      if (statusFilter === "non-aktif") return e.status !== "aktif";
      return true;
    });
  }, [enrollments, statusFilter]);

  const counts = useMemo(() => {
    const c = { aktif: 0, nonAktif: 0 };
    enrollments.forEach((e) => {
      if (e.status === "aktif") c.aktif++;
      else c.nonAktif++;
    });
    return c;
  }, [enrollments]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary + filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{counts.aktif}</strong> aktif
            {counts.nonAktif > 0 && <> · {counts.nonAktif} non-aktif</>}
          </span>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aktif">Hanya Aktif</SelectItem>
            <SelectItem value="non-aktif">Non-aktif</SelectItem>
            <SelectItem value="all">Semua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {statusFilter === "aktif"
            ? 'Belum ada siswa aktif. Klik tab "Pilih Existing" atau "Daftarkan Baru".'
            : "Tidak ada siswa dengan status ini."}
        </div>
      ) : (
        <div className="divide-y rounded-lg border overflow-hidden">
          {filtered.map((enr, i) => {
            const siswa = enr.peserta_didik as {
              nama_lengkap: string;
              nisn?: string | null;
              jenis_kelamin: string;
            } | null;
            const isActive = enr.status === "aktif";

            return (
              <div
                key={enr.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 bg-background",
                  !isActive && "opacity-60"
                )}
              >
                <span className="text-xs text-muted-foreground w-6 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {siswa?.nama_lengkap?.charAt(0) ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {siswa?.nama_lengkap ?? "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    NISN: {siswa?.nisn ?? "-"} ·{" "}
                    {siswa?.jenis_kelamin === "L" ? "L" : "P"}
                  </p>
                </div>
                <StatusBadge status={enr.status} />
                {isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() =>
                      setConfirmKeluar({
                        enrollmentId: enr.id,
                        nama: siswa?.nama_lengkap ?? "Siswa",
                      })
                    }
                  >
                    <UserMinus className="h-3 w-3 mr-1" />
                    Keluarkan
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirmKeluar && (
        <ConfirmKeluarDialog
          enrollmentId={confirmKeluar.enrollmentId}
          nama={confirmKeluar.nama}
          kelasId={kelas.id}
          tahunId={kelas.tahun_pelajaran_id}
          onClose={() => setConfirmKeluar(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    aktif: { label: "Aktif", cls: "bg-green-50 text-green-700 border-green-200" },
    keluar: { label: "Keluar", cls: "bg-red-50 text-red-700 border-red-200" },
    pindah: { label: "Pindah", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    lulus: { label: "Lulus", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  };
  const meta = map[status] ?? { label: status, cls: "" };
  return (
    <Badge variant="outline" className={cn("text-xs", meta.cls)}>
      {meta.label}
    </Badge>
  );
}

function ConfirmKeluarDialog({
  enrollmentId,
  nama,
  kelasId,
  tahunId,
  onClose,
}: {
  enrollmentId: string;
  nama: string;
  kelasId: number;
  tahunId: number;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<"keluar" | "pindah" | "lulus">("keluar");
  const setStatus = useSetEnrollmentStatus();

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keluarkan {nama}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Data nilai & rapor siswa tetap tersimpan (soft delete). Pilih alasan:
          </p>
          <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keluar">Keluar (drop out)</SelectItem>
              <SelectItem value="pindah">Pindah (ke sekolah lain)</SelectItem>
              <SelectItem value="lulus">Lulus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={setStatus.isPending}>
            Batal
          </Button>
          <Button
            variant="destructive"
            disabled={setStatus.isPending}
            onClick={() =>
              setStatus.mutate(
                { enrollmentId, status: reason, kelasId, tahunId },
                { onSuccess: onClose }
              )
            }
          >
            {setStatus.isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            )}
            Keluarkan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────
// TAB 2 — PILIH EXISTING (bulk enroll dari master siswa)
// ────────────────────────────────────────────────────────────

function ExistingPanel({
  kelas,
  onSuccess,
}: {
  kelas: KelasCtx;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: siswaList = [], isLoading } = useUnenrolledSiswa(
    kelas.tahun_pelajaran_id
  );
  const enroll = useEnrollSiswa();

  const filtered = useMemo(() => {
    if (!search) return siswaList;
    const q = search.toLowerCase();
    return siswaList.filter(
      (s) =>
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nisn ?? "").includes(search)
    );
  }, [siswaList, search]);

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleEnroll = () => {
    if (selectedIds.size === 0) return;
    enroll.mutate(
      {
        peserta_didik_ids: Array.from(selectedIds),
        rombongan_belajar_id: kelas.id,
        tahun_pelajaran_id: kelas.tahun_pelajaran_id,
      },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setSearch("");
          onSuccess();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (siswaList.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-6 text-center">
        <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-amber-900">
          Tidak ada siswa yang belum ter-enroll
        </p>
        <p className="text-xs text-amber-700 mt-1">
          Semua siswa di master data sudah punya enrollment di tahun pelajaran ini.
          Gunakan tab &quot;Daftarkan Baru&quot; untuk siswa baru.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Daftar siswa di master data yang <strong>belum punya enrollment</strong>{" "}
        di tahun pelajaran ini.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau NISN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Select all control */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-primary hover:underline"
          >
            {selectedIds.size === filtered.length && filtered.length > 0
              ? "Uncheck semua"
              : "Check semua"}
          </button>
          <span className="text-xs text-muted-foreground">
            {selectedIds.size} dipilih · {filtered.length} ditampilkan
          </span>
        </div>
      )}

      {/* List */}
      <div className="divide-y rounded-lg border max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">
            Tidak ditemukan.
          </p>
        ) : (
          filtered.map((s) => {
            const checked = selectedIds.has(s.id);
            return (
              <label
                key={s.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
                  "hover:bg-muted/50 transition-colors",
                  checked && "bg-primary/5"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOne(s.id)}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.nama_lengkap}</p>
                  <p className="text-xs text-muted-foreground">
                    NISN: {s.nisn ?? "-"} ·{" "}
                    {s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
              </label>
            );
          })
        )}
      </div>

      <Button
        onClick={handleEnroll}
        disabled={selectedIds.size === 0 || enroll.isPending}
        className="w-full"
      >
        {enroll.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll {selectedIds.size || ""} Siswa ke {kelas.nama_kelas}
          </>
        )}
      </Button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TAB 3 — DAFTARKAN BARU (quick form + auto enroll)
// ────────────────────────────────────────────────────────────

function BaruPanel({
  kelas,
  onSuccess,
}: {
  kelas: KelasCtx;
  onSuccess: () => void;
}) {
  const [nama, setNama] = useState("");
  const [nisn, setNisn] = useState("");
  const [jk, setJk] = useState<"L" | "P">("L");
  const create = useCreateSiswaAndEnroll();

  const canSubmit = nama.trim().length > 0 && !create.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      {
        siswa: {
          nama_lengkap: nama.trim(),
          jenis_kelamin: jk,
          nisn: nisn.trim() || null,
        },
        rombongan_belajar_id: kelas.id,
        tahun_pelajaran_id: kelas.tahun_pelajaran_id,
      },
      {
        onSuccess: () => {
          setNama("");
          setNisn("");
          setJk("L");
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Form cepat: isi data minimum, detail lain (alamat, orang tua, dll) bisa
        dilengkapi via <strong className="text-foreground">Admin → Siswa</strong>.
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>
            Nama Lengkap <span className="text-destructive">*</span>
          </Label>
          <Input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama lengkap siswa"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>NISN</Label>
            <Input
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              placeholder="Opsional"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Jenis Kelamin <span className="text-destructive">*</span>
            </Label>
            <Select value={jk} onValueChange={(v) => setJk(v as "L" | "P")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-0.5">
        <p className="font-medium">Akan didaftarkan ke:</p>
        <p className="text-muted-foreground">
          {kelas.nama_kelas} · {kelas.paket} · {kelas.fase}
        </p>
      </div>

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {create.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Daftarkan &amp; Enroll
          </>
        )}
      </Button>
    </form>
  );
}