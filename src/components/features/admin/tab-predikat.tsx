// ============================================================
// FILE PATH: src/components/features/admin/tab-predikat.tsx
// ============================================================
// REPLACE. Major refactor:
//   1. HAPUS heading "Range Nilai Predikat" + subtitle deskriptif
//   2. Card colored boxes (4 stack vertikal) → Table 3 kolom
//      (Predikat | Nilai Min | Nilai Max)
//   3. Predikat letter tetep ada warna lewat badge kecil di kolom
//      pertama, bukan di seluruh row background — lebih clean &
//      konsisten dengan style Table di tab lainnya
//   4. Inline edit di Input cell, FormMessage tetep render kalau
//      ada validasi error
//   5. Tombol "Simpan Range" stay di bawah, single submit handle
//      semua 4 row
//
// Tidak butuh kebab menu — predikat itu fixed 4 (A/B/C/D), ga ada
// concept Edit/Hapus per row. Cuma update min/max inline.
// ============================================================

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { typedResolver } from "@/lib/validators";
import { usePredikatGlobal, useUpdatePredikat } from "@/hooks";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// SCHEMA
// ============================================================

const schema = z.object({
  A_min: z.coerce.number().int().min(0).max(100),
  A_max: z.coerce.number().int().min(0).max(100),
  B_min: z.coerce.number().int().min(0).max(100),
  B_max: z.coerce.number().int().min(0).max(100),
  C_min: z.coerce.number().int().min(0).max(100),
  C_max: z.coerce.number().int().min(0).max(100),
  D_min: z.coerce.number().int().min(0).max(100),
  D_max: z.coerce.number().int().min(0).max(100),
});
type FormData = z.infer<typeof schema>;

// ============================================================
// CONSTANTS
// ============================================================

const PREDIKAT_META: Record<
  "A" | "B" | "C" | "D",
  { label: string; badgeColor: string }
> = {
  A: {
    label: "Sangat Baik",
    badgeColor: "bg-green-100 text-green-700 border-green-200",
  },
  B: {
    label: "Baik",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
  },
  C: {
    label: "Cukup",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
  },
  D: {
    label: "Perlu Bimbingan",
    badgeColor: "bg-red-100 text-red-700 border-red-200",
  },
};

const PREDIKAT_LIST = ["A", "B", "C", "D"] as const;

// ============================================================
// MAIN
// ============================================================

export function TabPredikat() {
  const { data: rows, isLoading } = usePredikatGlobal();
  const update = useUpdatePredikat();

  const form = useForm<FormData>({
    resolver: typedResolver(schema),
    defaultValues: {
      A_min: 90,
      A_max: 100,
      B_min: 75,
      B_max: 89,
      C_min: 60,
      C_max: 74,
      D_min: 0,
      D_max: 59,
    },
  });

  useEffect(() => {
    if (!rows?.length) return;
    const patch: Partial<FormData> = {};
    rows.forEach((r) => {
      patch[`${r.predikat}_min` as keyof FormData] = r.nilai_min as never;
      patch[`${r.predikat}_max` as keyof FormData] = r.nilai_max as never;
    });
    form.reset(patch as FormData);
  }, [rows, form]);

  const onSubmit = (values: FormData) => {
    const payload = PREDIKAT_LIST.map((p) => ({
      predikat: p,
      nilai_min: values[`${p}_min`],
      nilai_max: values[`${p}_max`],
    }));
    update.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-3 text-xs">Predikat</TableHead>
                <TableHead className="w-32 px-2 text-xs">Nilai Min</TableHead>
                <TableHead className="w-32 px-2 text-xs">Nilai Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PREDIKAT_LIST.map((p) => {
                const meta = PREDIKAT_META[p];
                return (
                  <TableRow key={p}>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex items-center justify-center w-7 h-7 rounded border font-bold text-sm flex-shrink-0",
                            meta.badgeColor
                          )}
                        >
                          {p}
                        </span>
                        <span className="text-sm">{meta.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-32 px-2 py-2.5">
                      <FormField
                        control={form.control}
                        name={`${p}_min` as keyof FormData}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                inputMode="numeric"
                                className="h-8 text-sm tabular-nums"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="w-32 px-2 py-2.5">
                      <FormField
                        control={form.control}
                        name={`${p}_max` as keyof FormData}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                inputMode="numeric"
                                className="h-8 text-sm tabular-nums"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan Range
          </Button>
        </div>
      </form>
    </Form>
  );
}