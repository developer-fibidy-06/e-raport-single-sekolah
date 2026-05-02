// ============================================================
// FILE PATH: src/components/features/penilaian/nilai-detail-drawer.tsx
// ============================================================
// REPLACE. Sync ke schema v2.1:
//   - Header: drop conditional `mapel.kode ?` display (kolom dihapus)
//   - handleSave mutation: drop kompetensi_dasar_id dari payload
//     (FK dihapus dari nilai_mapel di DB)
//   - NilaiDraftPartial type: KEEP kompetensi_dasar_id (transient
//     client state untuk auto-fill capaian via RPC)
//
// KD picker UI dipertahankan sebagai UX helper untuk auto-fill capaian
// text via RPC get_capaian_kompetensi. Pilihannya tidak persisted ke DB.
// Tabel kompetensi_dasar di DB masih ada (orphan), masih bisa di-query.
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { Drawer } from "vaul";
import {
  useKompetensiByMapel,
  useUpsertNilai,
  derivePredikat,
  getCapaianKompetensi,
} from "@/hooks";
import type { MataPelajaran, PredikatP5 } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickFillInline } from "./quick-fill-inline";
import { generateNilai } from "@/lib/quick-fill";
import { Loader2, Save, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Hook: detect viewport
// ============================================================
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

// ============================================================
// Types
// ============================================================
// kompetensi_dasar_id: TRANSIENT — dipakai client-side aja untuk
// trigger auto-fill capaian via RPC. Tidak dikirim ke DB pas upsert.
// ============================================================
export type NilaiDraftPartial = {
  kompetensi_dasar_id: number | null;
  nilai_akhir: number | null;
  predikat: string | null;
  capaian_kompetensi: string | null;
  capaianEditedManually: boolean;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mapel: MataPelajaran | null;
  enrollmentId: string;
  initialDraft: NilaiDraftPartial;
  onCommitDraft: (next: NilaiDraftPartial) => void;
  onSaved?: () => void;
}

// ============================================================
// Drawer per-mapel
// ============================================================
export function NilaiDetailDrawer({
  open,
  onOpenChange,
  mapel,
  enrollmentId,
  initialDraft,
  onCommitDraft,
  onSaved,
}: Props) {
  const isDesktop = useIsDesktop();
  const direction = isDesktop ? "right" : "bottom";

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
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
          <Drawer.Title className="sr-only">
            Edit Nilai Mata Pelajaran
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Form edit nilai untuk satu mata pelajaran lengkap dengan KD dan
            capaian kompetensi
          </Drawer.Description>

          {!isDesktop && (
            <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          {mapel ? (
            <DrawerBody
              mapel={mapel}
              enrollmentId={enrollmentId}
              initialDraft={initialDraft}
              onCommitDraft={onCommitDraft}
              onSaved={onSaved}
              onClose={() => onOpenChange(false)}
            />
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// ============================================================
// Drawer body
// ============================================================
function DrawerBody({
  mapel,
  enrollmentId,
  initialDraft,
  onCommitDraft,
  onSaved,
  onClose,
}: {
  mapel: MataPelajaran;
  enrollmentId: string;
  initialDraft: NilaiDraftPartial;
  onCommitDraft: (next: NilaiDraftPartial) => void;
  onSaved?: () => void;
  onClose: () => void;
}) {
  const { data: kdList = [] } = useKompetensiByMapel(mapel.id);
  const upsert = useUpsertNilai();

  const [draft, setDraft] = useState<NilaiDraftPartial>(initialDraft);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(initialDraft);
    setSavedFlash(false);
  }, [initialDraft, mapel.id]);

  const patch = useCallback(
    (partial: Partial<NilaiDraftPartial>) => {
      setDraft((prev) => {
        const next = { ...prev, ...partial };
        onCommitDraft(next);
        return next;
      });
    },
    [onCommitDraft]
  );

  // ─── Cascade: nilai → predikat → KD → capaian ─────────────
  const handleNilaiChange = async (v: string) => {
    const num = v === "" ? null : Number(v);
    patch({ nilai_akhir: num });
    if (num === null || Number.isNaN(num)) return;

    const predikat = await derivePredikat(num);
    let kdId = draft.kompetensi_dasar_id;
    if (!kdId && kdList.length > 0) kdId = kdList[0].id;

    let capaian = draft.capaian_kompetensi;
    if (kdId && !draft.capaianEditedManually) {
      const text = await getCapaianKompetensi(kdId, num);
      if (text) capaian = text;
    }

    patch({
      predikat: predikat ?? draft.predikat,
      kompetensi_dasar_id: kdId,
      capaian_kompetensi: capaian,
    });
  };

  const handleKdChange = async (v: string) => {
    const kdId = v ? Number(v) : null;
    patch({ kompetensi_dasar_id: kdId });

    if (kdId && draft.nilai_akhir !== null && !draft.capaianEditedManually) {
      const text = await getCapaianKompetensi(kdId, draft.nilai_akhir);
      if (text) patch({ capaian_kompetensi: text });
    }
  };

  const handleCapaianChange = (v: string) => {
    patch({ capaian_kompetensi: v, capaianEditedManually: true });
  };

  const handleResetCapaian = async () => {
    if (!draft.kompetensi_dasar_id || draft.nilai_akhir === null) return;
    const text = await getCapaianKompetensi(
      draft.kompetensi_dasar_id,
      draft.nilai_akhir
    );
    patch({
      capaian_kompetensi: text || null,
      capaianEditedManually: false,
    });
  };

  // ─── Inline quick-fill ────────────────────────────────────
  const handleInlineQuickFill = async (level: PredikatP5) => {
    const nilai = generateNilai(level);
    const predikat = (await derivePredikat(nilai)) ?? null;

    let kdId = draft.kompetensi_dasar_id;
    if (!kdId && kdList.length > 0) kdId = kdList[0].id;

    let capaian = draft.capaian_kompetensi;
    if (kdId) {
      const text = await getCapaianKompetensi(kdId, nilai);
      if (text) capaian = text;
    }

    patch({
      nilai_akhir: nilai,
      predikat,
      kompetensi_dasar_id: kdId,
      capaian_kompetensi: capaian,
      capaianEditedManually: false,
    });
  };

  // ─── Save langsung ke DB ──────────────────────────────────
  // v2.1: drop kompetensi_dasar_id dari payload (kolom dihapus dari DB).
  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        enrollment_id: enrollmentId,
        mata_pelajaran_id: mapel.id,
        nilai_akhir: draft.nilai_akhir,
        predikat: draft.predikat,
        capaian_kompetensi: draft.capaian_kompetensi,
      });
      onSaved?.();
      setSavedFlash(true);
      setTimeout(() => {
        setSavedFlash(false);
        onClose();
      }, 800);
    } catch {
      // toast handled by hook
    }
  };

  const canAutoCapaian =
    draft.kompetensi_dasar_id !== null && draft.nilai_akhir !== null;

  return (
    <>
      {/* Header — drop kode display */}
      <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{mapel.nama}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mapel.paket}
            {mapel.fase ? ` · ${mapel.fase}` : ""}
          </p>
        </div>
        {savedFlash && (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-300 bg-emerald-50 text-xs text-emerald-700 flex-shrink-0"
          >
            <Save className="h-3 w-3" /> Tersimpan
          </Badge>
        )}
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

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4">
        {/* Inline quick-fill */}
        <div className="rounded-md border bg-muted/30 p-3">
          <QuickFillInline onFill={handleInlineQuickFill} />
        </div>

        {/* Nilai + Predikat */}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Nilai Akhir</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={draft.nilai_akhir ?? ""}
              onChange={(e) => handleNilaiChange(e.target.value)}
              placeholder="0-100"
              inputMode="numeric"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Predikat</Label>
            <Select
              value={draft.predikat ?? ""}
              onValueChange={(v) => patch({ predikat: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KD — UI helper untuk auto-fill capaian, transient client-side */}
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Kompetensi Dasar</Label>
            {kdList.length > 0 && !draft.kompetensi_dasar_id && (
              <span className="text-[10px] text-muted-foreground">
                Auto-pick saat nilai diisi
              </span>
            )}
          </div>
          <Select
            value={draft.kompetensi_dasar_id?.toString() ?? ""}
            onValueChange={handleKdChange}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  kdList.length === 0 ? "Belum ada KD" : "Pilih KD"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {kdList.map((kd) => (
                <SelectItem key={kd.id} value={kd.id.toString()}>
                  {kd.nama_kompetensi}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            KD dipakai untuk auto-fill capaian via template. Pilihan KD tidak
            disimpan, hanya transient di drawer ini.
          </p>
        </div>

        {/* Capaian */}
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Capaian Kompetensi</Label>
              {draft.capaianEditedManually ? (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 border-orange-200 text-orange-700 bg-orange-50"
                >
                  Diedit manual
                </Badge>
              ) : canAutoCapaian ? (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 border-emerald-200 text-emerald-700 bg-emerald-50 gap-1"
                >
                  <Zap className="h-2.5 w-2.5" />
                  Auto-sync
                </Badge>
              ) : null}
            </div>
            {canAutoCapaian && draft.capaianEditedManually && (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={handleResetCapaian}
                className="h-6 gap-1 text-[11px] px-2"
              >
                <Zap className="h-2.5 w-2.5" /> Ambil dari KD
              </Button>
            )}
          </div>
          <Textarea
            rows={4}
            value={draft.capaian_kompetensi ?? ""}
            onChange={(e) => handleCapaianChange(e.target.value)}
            placeholder={
              canAutoCapaian
                ? "Akan terisi otomatis dari KD + nilai…"
                : "Isi nilai & pilih KD untuk auto-fill, atau ketik manual…"
            }
          />
          <p className="text-[10px] text-muted-foreground">
            {draft.capaianEditedManually
              ? "Capaian diedit manual — ubah nilai/KD tidak akan overwrite. Klik 'Ambil dari KD' untuk kembali auto."
              : "Capaian ter-sync otomatis: ganti nilai atau KD → teks terupdate."}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 border-t bg-background px-4 py-3 sm:px-6">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Tutup
        </Button>
        <Button onClick={handleSave} disabled={upsert.isPending} className="flex-1">
          {upsert.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          Simpan Mapel
        </Button>
      </div>
    </>
  );
}