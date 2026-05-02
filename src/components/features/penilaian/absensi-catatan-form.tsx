// ============================================================
// FILE PATH: src/components/features/penilaian/absensi-catatan-form.tsx
// ============================================================
// REPLACE. Konsistensi: pakai <QuickFillPanel> generic native select
// (sama kaya Nilai/P5/Ekskul).
//
// Perubahan dari versi sebelumnya:
//   1. <QuickFillPanel> sekarang STANDALONE (tidak dibungkus Card outer)
//      — biar sama persis kayak Nilai/P5/Ekskul yang panel-nya juga
//      standalone, bukan nested Card-in-Card.
//   2. Layout root sekarang flat:
//         [QuickFillPanel] ← standalone
//         [Card "Input Manual"] ← sakit/izin/alpa
//         [Card "Catatan Wali Kelas"] ← unchanged
//   3. Dialog konfirmasi quick-fill di-render di root (bukan di dalam
//      Card) supaya scope-nya bersih.
//
// Yang TIDAK BERUBAH (sesuai req: skip absensi):
//   - <AbsensiQuickFillDialog /> — preview angka + regenerate
//   - Manual input section logic
//   - Card "Catatan Wali Kelas" sepenuhnya
// ============================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useAbsensiByEnrollment,
  useUpsertAbsensi,
  useCatatanByEnrollment,
  useUpsertCatatan,
} from "@/hooks";
import {
  ABSENSI_LEVELS,
  ABSENSI_LABEL,
  generateAbsensi,
  generateCatatanWali,
  type AbsensiLevel,
} from "@/lib/quick-fill-absensi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { QuickFillPanel, type QuickFillLevelOption } from "./quick-fill-panel";
import {
  Save,
  Sparkles,
  Wand2,
  RefreshCw,
  Heart,
  FileWarning,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const ABSENSI_LEVEL_OPTIONS: ReadonlyArray<
  QuickFillLevelOption<AbsensiLevel>
> = ABSENSI_LEVELS.map((level) => {
  const meta = ABSENSI_LABEL[level];
  return {
    value: level,
    label: meta.short,
    desc: meta.desc,
  };
});

interface Props {
  enrollmentId: string;
  namaSiswa: string;
}

// ============================================================
// MAIN — flat layout: QuickFillPanel + Card Manual + Card Catatan
// ============================================================

export function AbsensiCatatanForm({ enrollmentId, namaSiswa }: Props) {
  // Level target di-share antara absensi & catatan biar konsisten:
  // "Rajin" → sedikit absen + catatan disiplin tinggi, dst.
  const [level, setLevel] = useState<AbsensiLevel>("biasa");

  // Hooks data — di-hoist ke parent supaya QuickFillPanel +
  // ManualInputCard sama-sama bisa akses
  const { data: absensi, isLoading } = useAbsensiByEnrollment(enrollmentId);
  const upsertAbsensi = useUpsertAbsensi();
  const upsertCatatan = useUpsertCatatan();

  // Local state untuk manual input
  const [sakit, setSakit] = useState("0");
  const [izin, setIzin] = useState("0");
  const [alpa, setAlpa] = useState("0");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sync local state dari server data
  useEffect(() => {
    if (absensi) {
      setSakit(String(absensi.sakit ?? 0));
      setIzin(String(absensi.izin ?? 0));
      setAlpa(String(absensi.alpha ?? 0));
    }
  }, [absensi]);

  const hasExistingAbsensi = useMemo(() => {
    if (!absensi) return false;
    return (
      (absensi.sakit ?? 0) > 0 ||
      (absensi.izin ?? 0) > 0 ||
      (absensi.alpha ?? 0) > 0
    );
  }, [absensi]);

  // QuickFillPanel counter:
  // 3 kategori (sakit/izin/alpa) sebagai "items"
  const totalItems = 3;
  const filledItems = hasExistingAbsensi ? 3 : 0;

  const handlePickLevel = (newLevel: AbsensiLevel) => {
    setLevel(newLevel);
    setDialogOpen(true);
  };

  const handleConfirmQuickFill = (opts: {
    generated: { sakit: number; izin: number; alpha: number };
    withCatatan: boolean;
  }) => {
    const { generated, withCatatan } = opts;
    setSakit(String(generated.sakit));
    setIzin(String(generated.izin));
    setAlpa(String(generated.alpha));

    upsertAbsensi.mutate(
      {
        enrollment_id: enrollmentId,
        sakit: generated.sakit,
        izin: generated.izin,
        alpha: generated.alpha,
      },
      {
        onSuccess: () => {
          if (withCatatan) {
            const catatan = generateCatatanWali(level, namaSiswa);
            upsertCatatan.mutate({
              enrollment_id: enrollmentId,
              catatan,
            });
          }
          setDialogOpen(false);
        },
      }
    );
  };

  const handleSaveManual = () => {
    upsertAbsensi.mutate({
      enrollment_id: enrollmentId,
      sakit: Number(sakit) || 0,
      izin: Number(izin) || 0,
      alpha: Number(alpa) || 0,
    });
  };

  return (
    <div className="space-y-5">
      {/* ─── Quick-Fill Panel — STANDALONE (no outer Card) ─── */}
      <QuickFillPanel<AbsensiLevel>
        title="Isi Cepat Absensi"
        itemLabel="kategori"
        totalItems={totalItems}
        filledItems={filledItems}
        levels={ABSENSI_LEVEL_OPTIONS}
        onPickLevel={handlePickLevel}
        isLoading={upsertAbsensi.isPending || upsertCatatan.isPending}
      />

      {/* ─── Manual Input Card ─── */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Input Manual
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1">
              <Label className="text-xs">Sakit (hari)</Label>
              <Input
                type="number"
                min={0}
                value={sakit}
                onChange={(e) => setSakit(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Izin (hari)</Label>
              <Input
                type="number"
                min={0}
                value={izin}
                onChange={(e) => setIzin(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Alpa (hari)</Label>
              <Input
                type="number"
                min={0}
                value={alpa}
                onChange={(e) => setAlpa(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSaveManual}
              disabled={upsertAbsensi.isPending || isLoading}
            >
              {upsertAbsensi.isPending ? (
                <>
                  <Spinner className="size-3 mr-2" /> Menyimpan…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3 w-3" /> Simpan Absensi
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Catatan Wali Kelas Card ─── */}
      <CatatanWaliCard
        enrollmentId={enrollmentId}
        namaSiswa={namaSiswa}
        level={level}
      />

      {/* ─── Dialog konfirmasi quick-fill (root scope) ─── */}
      <AbsensiQuickFillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        level={level}
        hasExistingAbsensi={hasExistingAbsensi}
        currentValues={{
          sakit: Number(sakit) || 0,
          izin: Number(izin) || 0,
          alpha: Number(alpa) || 0,
        }}
        isLoading={upsertAbsensi.isPending || upsertCatatan.isPending}
        onConfirm={handleConfirmQuickFill}
      />
    </div>
  );
}

// ============================================================
// ABSENSI QUICK-FILL DIALOG (preview angka + regenerate)
// TIDAK BERUBAH — udah clean
// ============================================================

function AbsensiQuickFillDialog({
  open,
  onOpenChange,
  level,
  hasExistingAbsensi,
  currentValues,
  isLoading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  level: AbsensiLevel;
  hasExistingAbsensi: boolean;
  currentValues: { sakit: number; izin: number; alpha: number };
  isLoading: boolean;
  onConfirm: (opts: {
    generated: { sakit: number; izin: number; alpha: number };
    withCatatan: boolean;
  }) => void;
}) {
  const [generated, setGenerated] = useState(() => generateAbsensi(level));
  const [withCatatan, setWithCatatan] = useState(true);

  useEffect(() => {
    if (open) {
      setGenerated(generateAbsensi(level));
      setWithCatatan(true);
    }
  }, [open, level]);

  const regenerate = () => {
    setGenerated(generateAbsensi(level));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Isi Cepat Absensi
          </DialogTitle>
          <DialogDescription>
            Target level:{" "}
            <span className="font-semibold text-foreground">
              {ABSENSI_LABEL[level].full}
            </span>{" "}
            — {ABSENSI_LABEL[level].desc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasExistingAbsensi && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
              <p className="font-medium text-amber-900 mb-1">
                Angka saat ini akan ditimpa:
              </p>
              <p className="text-amber-800">
                Sakit {currentValues.sakit} · Izin {currentValues.izin} · Alpa{" "}
                {currentValues.alpha}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Preview angka baru
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={regenerate}
                disabled={isLoading}
                className="h-7 gap-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Acak ulang
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <AbsensiStatCard
                icon={Heart}
                label="Sakit"
                value={generated.sakit}
                colorClass="bg-blue-50 text-blue-700 border-blue-200"
              />
              <AbsensiStatCard
                icon={FileWarning}
                label="Izin"
                value={generated.izin}
                colorClass="bg-amber-50 text-amber-700 border-amber-200"
              />
              <AbsensiStatCard
                icon={Ban}
                label="Alpa"
                value={generated.alpha}
                colorClass="bg-red-50 text-red-700 border-red-200"
              />
            </div>
          </div>

          <label
            className={cn(
              "flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer select-none",
              "hover:bg-muted/50 transition-colors",
              withCatatan && "border-primary/30 bg-primary/5"
            )}
          >
            <input
              type="checkbox"
              checked={withCatatan}
              onChange={(e) => setWithCatatan(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-input accent-primary cursor-pointer flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">
                  Generate catatan wali kelas sekalian
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Catatan naratif akan dibuat sesuai level{" "}
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {ABSENSI_LABEL[level].short}
                </Badge>
              </p>
            </div>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm({ generated, withCatatan })}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Spinner className="size-3.5" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {isLoading ? "Memproses…" : "Ya, Terapkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AbsensiStatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 flex flex-col items-center gap-1",
        colorClass
      )}
    >
      <Icon className="h-4 w-4" />
      <p className="text-[10px] font-medium uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-[10px] opacity-75">hari</p>
    </div>
  );
}

// ============================================================
// CATATAN WALI KELAS (lembar Raport) — TIDAK BERUBAH
// ============================================================

function CatatanWaliCard({
  enrollmentId,
  namaSiswa,
  level,
}: {
  enrollmentId: string;
  namaSiswa: string;
  level: AbsensiLevel;
}) {
  const { data: catatan, isLoading } = useCatatanByEnrollment(enrollmentId);
  const upsert = useUpsertCatatan();

  const [text, setText] = useState("");
  const [tanggapan, setTanggapan] = useState("");

  useEffect(() => {
    if (catatan) {
      setText(catatan.catatan ?? "");
      setTanggapan(catatan.tanggapan_ortu ?? "");
    }
  }, [catatan]);

  const handleSave = () => {
    upsert.mutate({
      enrollment_id: enrollmentId,
      catatan: text || null,
      tanggapan_ortu: tanggapan || null,
    });
  };

  const handleGenerate = () => {
    const generated = generateCatatanWali(level, namaSiswa);
    setText(generated);
    upsert.mutate({
      enrollment_id: enrollmentId,
      catatan: generated,
      tanggapan_ortu: tanggapan || null,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Catatan Wali Kelas</CardTitle>
            <CardDescription className="text-xs">
              Catatan wali kelas di lembar Raport (halaman 1).
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleGenerate}
            disabled={upsert.isPending}
            className="h-7 text-xs gap-1"
          >
            <Sparkles className="h-3 w-3" />
            Generate — {ABSENSI_LABEL[level].short}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1">
          <Label className="text-xs">Catatan</Label>
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contoh: Ananda menunjukkan perkembangan baik pada semester ini..."
            disabled={isLoading}
          />
          <p className="text-[11px] text-muted-foreground">
            Klik tombol &quot;Generate&quot; di atas untuk pakai template sesuai
            level absensi saat ini.
          </p>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Tanggapan Orang Tua (opsional)</Label>
          <Textarea
            rows={2}
            value={tanggapan}
            onChange={(e) => setTanggapan(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={upsert.isPending || isLoading}
          >
            {upsert.isPending ? (
              <>
                <Spinner className="size-3 mr-2" /> Menyimpan…
              </>
            ) : (
              <>
                <Save className="mr-2 h-3 w-3" /> Simpan Catatan
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}