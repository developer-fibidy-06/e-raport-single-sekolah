// ============================================================
// FILE PATH: src/components/features/penilaian/kelas-list.tsx
// ============================================================
// REPLACE. Perubahan tunggal dari versi sebelumnya:
//
//   Inner list per kelas (button stack divide-y) → <Table>
//   3 kolom: # | Kelas (nama + fase · wali_kelas) | chevron
//
//   Konsisten dengan rapor-kelas-list.tsx + admin panel pattern
//   (tab-tahun-kelas, tab-mata-pelajaran, tab-users):
//   TableRow onClick=cursor-pointer, nomor mono+tabular,
//   main col px-2 py-2.5 max-w-0 + truncate, chevron di kolom akhir.
//
// Yang TIDAK BERUBAH:
//   - Accordion per Paket (A/B/C) + trigger w/ Layers icon
//   - Info bar tahun aktif
//   - Empty/error states
//   - Navigation via router.push(ROUTES.PENILAIAN_KELAS(id))
// ============================================================

"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTahunPelajaranAktif, useAllKelas } from "@/hooks";
import { ROUTES } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronRight,
  BookOpen,
  AlertCircle,
  Calendar,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAKET_ORDER = ["Paket A", "Paket B", "Paket C"] as const;
type Paket = (typeof PAKET_ORDER)[number];

const PAKET_ICON_BG: Record<Paket, string> = {
  "Paket A": "bg-green-50",
  "Paket B": "bg-blue-50",
  "Paket C": "bg-purple-50",
};

const PAKET_ICON_FG: Record<Paket, string> = {
  "Paket A": "text-green-700",
  "Paket B": "text-blue-700",
  "Paket C": "text-purple-700",
};

export function KelasList() {
  const router = useRouter();
  const { data: tahunAktif, isLoading: loadingTahun } = useTahunPelajaranAktif();
  const { data: kelasList = [], isLoading: loadingKelas } = useAllKelas();

  const isLoading = loadingTahun || loadingKelas;

  // Filter hanya kelas di tahun aktif
  const kelasAktif = useMemo(
    () =>
      kelasList.filter(
        (k) => tahunAktif && k.tahun_pelajaran_id === tahunAktif.id
      ),
    [kelasList, tahunAktif]
  );

  // Group by Paket
  const grouped = useMemo(() => {
    const g: Record<Paket, typeof kelasAktif> = {
      "Paket A": [],
      "Paket B": [],
      "Paket C": [],
    };
    kelasAktif.forEach((k) => {
      const p = k.paket as Paket;
      if (g[p]) g[p].push(k);
    });
    // Sort within paket: by tingkat then paralel
    (Object.keys(g) as Paket[]).forEach((p) => {
      g[p].sort((a, b) => {
        if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
        return a.kelas_paralel.localeCompare(b.kelas_paralel);
      });
    });
    return g;
  }, [kelasAktif]);

  // Default open: semua paket yang punya kelas
  const defaultOpen = useMemo(
    () => PAKET_ORDER.filter((p) => grouped[p].length > 0),
    [grouped]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tahunAktif) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Belum ada tahun pelajaran aktif
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Minta admin untuk mengatur tahun pelajaran aktif di menu Admin.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (kelasAktif.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Belum ada kelas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tahun pelajaran {tahunAktif.nama} Semester {tahunAktif.semester}{" "}
              belum memiliki kelas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info bar — tahun aktif + count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 flex-shrink-0" />
        <span>
          {tahunAktif.nama} · Semester {tahunAktif.semester} ·{" "}
          <strong className="text-foreground">{kelasAktif.length} kelas</strong>
        </span>
      </div>

      {/* Accordion by Paket */}
      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        className="space-y-2"
      >
        {PAKET_ORDER.map((paket) => {
          const items = grouped[paket];
          if (items.length === 0) return null;

          return (
            <AccordionItem
              key={paket}
              value={paket}
              className="rounded-xl border bg-background overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      PAKET_ICON_BG[paket]
                    )}
                  >
                    <Layers className={cn("h-4 w-4", PAKET_ICON_FG[paket])} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold">{paket}</p>
                    <p className="text-xs text-muted-foreground">
                      {items.length} kelas
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="border-t">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 px-3 text-xs">#</TableHead>
                        <TableHead className="px-2 text-xs">Kelas</TableHead>
                        <TableHead className="w-8 px-2" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((k, idx) => (
                        <TableRow
                          key={k.id}
                          onClick={() =>
                            router.push(ROUTES.PENILAIAN_KELAS(k.id))
                          }
                          className="cursor-pointer"
                        >
                          <TableCell className="w-12 px-3 py-2.5 text-xs text-muted-foreground tabular-nums font-mono">
                            {idx + 1}.
                          </TableCell>
                          <TableCell className="px-2 py-2.5 max-w-0">
                            <p className="text-sm font-medium truncate">
                              {k.nama_kelas}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {k.fase}
                              {k.wali_kelas ? ` · ${k.wali_kelas}` : ""}
                            </p>
                          </TableCell>
                          <TableCell className="w-8 px-2 py-2.5">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}