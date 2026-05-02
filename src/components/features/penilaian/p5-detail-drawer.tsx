// ============================================================
// FILE PATH: src/components/features/penilaian/p5-detail-drawer.tsx
// ============================================================
// NEW. Drawer per-dimensi P5 — mirror pattern Nilai-Detail-Drawer.
//
// Pola:
//   - Compact list (p5-form) menampilkan 6 dimensi sebagai baris ringkas
//   - Tap dimensi → drawer ini terbuka dengan FULL editing context
//   - Drawer body: flat list elemen sebagai section header,
//     diikuti sub-elemen dengan 4 tombol predikat (MB/SB/BSH/SAB) inline
//   - Tap predikat = direct commit ke server (no draft, no cascade)
//
// Responsive direction (sama persis Nilai-Detail-Drawer):
//   - Desktop ≥768px: slide from right (max-w-md = 448px) — KONSISTEN
//   - Mobile <768px: slide from bottom (max 85vh)
//
// Penomoran sub-elemen RESET per elemen (1, 2, 3 di akhlak beragama,
// lalu 1, 2 di akhlak pribadi). Ini matching screenshot pattern lo.
//
// Karena lebar 448px sempit untuk deskripsi panjang + 4 tombol predikat,
// sub-elemen row pakai stack layout (deskripsi atas, tombol bawah)
// di semua viewport — drawer ini emang narrow.
// ============================================================

"use client";

import { Drawer } from "vaul";
import { useUpsertPenilaianP5 } from "@/hooks";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import type { P5DimensiTree, PredikatP5 } from "@/types";
import { Button } from "@/components/ui/button";
import { X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Dimensi yang dibuka. null saat drawer tertutup. */
  dimensi: P5DimensiTree | null;
  enrollmentId: string;
  /** Map sub_elemen_id → predikat saat ini. Dari parent. */
  penilaianMap: Map<number, PredikatP5>;
}

const PREDIKAT_LIST: Array<{ code: PredikatP5; desc: string }> = [
  { code: "MB", desc: "Mulai Berkembang" },
  { code: "SB", desc: "Sedang Berkembang" },
  { code: "BSH", desc: "Berkembang Sesuai Harapan" },
  { code: "SAB", desc: "Sangat Berkembang" },
];

// ============================================================
// Drawer per-dimensi
// ============================================================

export function P5DetailDrawer({
  open,
  onOpenChange,
  dimensi,
  enrollmentId,
  penilaianMap,
}: Props) {
  const isDesktop = useIsDesktop();
  const direction = isDesktop ? "right" : "bottom";

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={direction}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            "fixed z-50 flex flex-col bg-background outline-none",
            // Desktop: max-w-md = sama persis Nilai drawer (448px)
            isDesktop &&
            "right-0 top-0 bottom-0 w-full max-w-md border-l shadow-xl",
            !isDesktop &&
            "left-0 right-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t shadow-xl"
          )}
        >
          <Drawer.Title className="sr-only">
            Edit Profil Pelajar Pancasila
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Form penilaian sub-elemen untuk satu dimensi Profil Pelajar Pancasila
          </Drawer.Description>

          {!isDesktop && (
            <div className="mx-auto mt-2 mb-1 h-1 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />
          )}

          {dimensi ? (
            <DrawerBody
              dimensi={dimensi}
              enrollmentId={enrollmentId}
              penilaianMap={penilaianMap}
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
  dimensi,
  enrollmentId,
  penilaianMap,
  onClose,
}: {
  dimensi: P5DimensiTree;
  enrollmentId: string;
  penilaianMap: Map<number, PredikatP5>;
  onClose: () => void;
}) {
  const upsert = useUpsertPenilaianP5();

  // Counter: sub-elemen yang sudah punya predikat / total sub-elemen
  const totalSub = dimensi.elemen.reduce(
    (sum, el) => sum + el.sub_elemen.length,
    0
  );
  const filledSub = dimensi.elemen.reduce(
    (sum, el) =>
      sum + el.sub_elemen.filter((s) => penilaianMap.has(s.id)).length,
    0
  );

  // Tap predikat = direct commit. Toggle behavior: kalau klik
  // predikat yang sama dengan current, treat as un-set (predikat null).
  const handleClickPredikat = (
    subElemenId: number,
    next: PredikatP5
  ) => {
    const current = penilaianMap.get(subElemenId) ?? null;
    upsert.mutate({
      enrollment_id: enrollmentId,
      sub_elemen_id: subElemenId,
      predikat: current === next ? null : next,
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground font-mono mb-0.5">
            Dimensi {dimensi.nomor}
          </p>
          <p className="text-sm font-semibold leading-tight">{dimensi.nama}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filledSub} dari {totalSub} sub-elemen terisi
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

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {dimensi.elemen.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada elemen di dimensi ini.
          </div>
        ) : (
          <div className="divide-y">
            {dimensi.elemen.map((elemen) => (
              <ElemenSection
                key={elemen.id}
                elemen={elemen}
                penilaianMap={penilaianMap}
                onClickPredikat={handleClickPredikat}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-background px-4 py-3 sm:px-6">
        <Button variant="outline" onClick={onClose} className="w-full">
          Tutup
        </Button>
      </div>
    </>
  );
}

// ============================================================
// Elemen section — header + sub-elemen rows
// ============================================================

function ElemenSection({
  elemen,
  penilaianMap,
  onClickPredikat,
}: {
  elemen: P5DimensiTree["elemen"][number];
  penilaianMap: Map<number, PredikatP5>;
  onClickPredikat: (subElemenId: number, predikat: PredikatP5) => void;
}) {
  return (
    <div>
      {/* Elemen header */}
      <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 sm:px-6 text-xs font-medium text-muted-foreground">
        <BookOpen className="h-3 w-3 flex-shrink-0" />
        <span className="min-w-0 truncate">
          Elemen:{" "}
          <span className="text-foreground font-semibold">{elemen.nama}</span>
        </span>
      </div>

      {/* Sub-elemen list */}
      {elemen.sub_elemen.length === 0 ? (
        <p className="px-4 py-3 sm:px-6 text-xs italic text-muted-foreground">
          Belum ada sub-elemen untuk fase ini.
        </p>
      ) : (
        <ol className="divide-y">
          {elemen.sub_elemen.map((sub, i) => (
            <SubElemenRow
              key={sub.id}
              nomor={i + 1}
              deskripsi={sub.deskripsi}
              current={penilaianMap.get(sub.id) ?? null}
              onClick={(predikat) => onClickPredikat(sub.id, predikat)}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

// ============================================================
// Sub-elemen row — deskripsi + 4 tombol predikat (stack layout)
// ============================================================
// Stack di semua viewport karena drawer narrow (max-w-md):
//   [deskripsi panjang full-width]
//   [MB] [SB] [BSH] [SAB]  ← grid 4 kolom equal
// ============================================================

function SubElemenRow({
  nomor,
  deskripsi,
  current,
  onClick,
}: {
  nomor: number;
  deskripsi: string;
  current: PredikatP5 | null;
  onClick: (predikat: PredikatP5) => void;
}) {
  return (
    <li className="flex flex-col gap-2.5 px-4 py-3 sm:px-6">
      {/* Deskripsi: full width */}
      <div className="flex gap-2">
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums w-5 text-right pt-0.5">
          {nomor}.
        </span>
        <p className="text-sm leading-snug">{deskripsi}</p>
      </div>

      {/* Tombol predikat: grid 4 kolom equal */}
      <div className="grid grid-cols-4 gap-1.5 pl-7">
        {PREDIKAT_LIST.map((p) => (
          <button
            key={p.code}
            type="button"
            onClick={() => onClick(p.code)}
            title={p.desc}
            className={cn(
              "rounded-md border px-2 py-1.5 font-mono text-xs font-bold transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current === p.code
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "bg-background hover:bg-muted"
            )}
          >
            {p.code}
          </button>
        ))}
      </div>
    </li>
  );
}