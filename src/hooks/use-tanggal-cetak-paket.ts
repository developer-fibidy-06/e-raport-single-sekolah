// ============================================================
// FILE PATH: src/hooks/use-tanggal-cetak-paket.ts
// ============================================================
// FILE BARU. Hook untuk manage tanggal cetak rapor per paket per
// tahun pelajaran.
//
// Fungsi:
//   - useTanggalCetakByTP(tahunPelajaranId)
//       → Fetch semua tanggal cetak (Paket A/B/C) untuk 1 TP
//       → Return: { 'Paket A': '2025-12-20', 'Paket B': null, ... }
//   - useTanggalCetakByTPDanPaket(tpId, paket)
//       → Fetch 1 tanggal spesifik (untuk validation di rapor PDF)
//   - useUpsertTanggalCetak()
//       → Set/update tanggal cetak per paket. Idempotent via UNIQUE.
//   - useDeleteTanggalCetak()
//       → Hapus tanggal cetak (admin reset)
//   - useTPMissingTanggalCetak()
//       → List TP × paket yang belum di-set (untuk warning badge)
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ============================================================
// CONSTANTS
// ============================================================

export const PAKET_LIST = ["Paket A", "Paket B", "Paket C"] as const;
export type PaketType = (typeof PAKET_LIST)[number];

// ============================================================
// TYPES
// ============================================================

export interface TanggalCetakRow {
  id: number;
  tahun_pelajaran_id: number;
  paket: PaketType;
  tanggal_cetak: string; // ISO date string YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

// Map yang di-return: { 'Paket A': '2025-12-20', 'Paket B': null, ... }
export type TanggalCetakMap = Record<PaketType, string | null>;

// ============================================================
// QUERY KEYS
// ============================================================

const QK = {
  byTP: (tpId: number) => ["tanggal_cetak_paket", "by_tp", tpId] as const,
  byTPDanPaket: (tpId: number, paket: PaketType) =>
    ["tanggal_cetak_paket", "by_tp_paket", tpId, paket] as const,
  missing: ["tanggal_cetak_paket", "missing"] as const,
  all: ["tanggal_cetak_paket"] as const,
};

// ============================================================
// HELPERS
// ============================================================

function buildEmptyMap(): TanggalCetakMap {
  return {
    "Paket A": null,
    "Paket B": null,
    "Paket C": null,
  };
}

// ============================================================
// QUERIES
// ============================================================

/**
 * Fetch semua tanggal cetak untuk 1 TP, dalam bentuk map.
 * Return shape selalu lengkap 3 paket — paket yang belum di-set
 * value-nya null.
 */
export function useTanggalCetakByTP(tahunPelajaranId: number | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byTP(tahunPelajaranId ?? 0),
    enabled: !!tahunPelajaranId,
    queryFn: async (): Promise<TanggalCetakMap> => {
      const { data, error } = await supabase
        .from("tanggal_cetak_paket")
        .select("paket, tanggal_cetak")
        .eq("tahun_pelajaran_id", tahunPelajaranId!);
      if (error) throw error;

      const map = buildEmptyMap();
      (data ?? []).forEach((row) => {
        if (PAKET_LIST.includes(row.paket as PaketType)) {
          map[row.paket as PaketType] = row.tanggal_cetak;
        }
      });
      return map;
    },
  });
}

/**
 * Fetch 1 tanggal cetak spesifik. Dipake di useRaporFullData buat
 * validasi sebelum render PDF — kalau null, throw error tolak cetak.
 */
export function useTanggalCetakByTPDanPaket(
  tahunPelajaranId: number | null,
  paket: PaketType | null
) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byTPDanPaket(tahunPelajaranId ?? 0, paket ?? ("Paket A" as PaketType)),
    enabled: !!tahunPelajaranId && !!paket,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("tanggal_cetak_paket")
        .select("tanggal_cetak")
        .eq("tahun_pelajaran_id", tahunPelajaranId!)
        .eq("paket", paket!)
        .maybeSingle();
      if (error) throw error;
      return data?.tanggal_cetak ?? null;
    },
  });
}

/**
 * List semua TP × paket yang BELUM di-set tanggal cetak.
 * Dipake buat bikin warning badge di tab Tahun & Semester.
 *
 * Return: array of { tahun_pelajaran_id, paket, tahun_pelajaran_nama }
 */
export function useTPMissingTanggalCetak() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.missing,
    queryFn: async () => {
      // Fetch semua TP + semua tanggal cetak yang udah ada
      const [tpRes, tcpRes] = await Promise.all([
        supabase
          .from("tahun_pelajaran")
          .select("id, nama, semester, is_aktif")
          .order("nama")
          .order("semester"),
        supabase
          .from("tanggal_cetak_paket")
          .select("tahun_pelajaran_id, paket"),
      ]);
      if (tpRes.error) throw tpRes.error;
      if (tcpRes.error) throw tcpRes.error;

      const existingSet = new Set(
        (tcpRes.data ?? []).map((r) => `${r.tahun_pelajaran_id}::${r.paket}`)
      );

      const missing: Array<{
        tahun_pelajaran_id: number;
        tahun_pelajaran_nama: string;
        semester: number;
        is_aktif: boolean;
        paket: PaketType;
      }> = [];

      (tpRes.data ?? []).forEach((tp) => {
        PAKET_LIST.forEach((paket) => {
          if (!existingSet.has(`${tp.id}::${paket}`)) {
            missing.push({
              tahun_pelajaran_id: tp.id,
              tahun_pelajaran_nama: tp.nama,
              semester: tp.semester,
              is_aktif: tp.is_aktif,
              paket,
            });
          }
        });
      });

      return missing;
    },
  });
}

// ============================================================
// MUTATIONS
// ============================================================

export function useUpsertTanggalCetak() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tahun_pelajaran_id: number;
      paket: PaketType;
      tanggal_cetak: string; // ISO date YYYY-MM-DD
    }) => {
      // Pakai upsert dengan onConflict di kolom unique
      const { error } = await supabase
        .from("tanggal_cetak_paket")
        .upsert(
          {
            tahun_pelajaran_id: input.tahun_pelajaran_id,
            paket: input.paket,
            tanggal_cetak: input.tanggal_cetak,
          },
          { onConflict: "tahun_pelajaran_id,paket" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Tanggal cetak berhasil disimpan");
    },
    onError: (err: Error) =>
      toast.error("Gagal simpan tanggal: " + err.message),
  });
}

export function useDeleteTanggalCetak() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tahun_pelajaran_id: number;
      paket: PaketType;
    }) => {
      const { error } = await supabase
        .from("tanggal_cetak_paket")
        .delete()
        .eq("tahun_pelajaran_id", input.tahun_pelajaran_id)
        .eq("paket", input.paket);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Tanggal cetak dihapus");
    },
    onError: (err: Error) =>
      toast.error("Gagal hapus tanggal: " + err.message),
  });
}