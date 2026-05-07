// ============================================================
// FILE PATH: src/hooks/use-kelas-deletion-impact.ts
// ============================================================
// FILE BARU. Pre-fetch impact count sebelum admin hapus kelas.
// Dipake di confirm dialog: kasih tau berapa enrollment + nilai
// + rapor published yang bakal ke-CASCADE-delete.
//
// Strategy:
//   1. Fetch semua enrollment di kelas (ambil ID + status)
//   2. Paralel HEAD count untuk nilai_mapel + rapor_header
//      (head: true + count: 'exact' = super murah, gak fetch row)
//
// staleTime 5s = dialog dibuka ulang dalam 5 detik pakai cache.
// enabled: !!kelasId = gak query saat kelasId null.
// ============================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface KelasDeletionImpact {
  enrollmentCount: number;
  enrollmentAktifCount: number;
  nilaiCount: number;
  raporPublishedCount: number;
}

const QK = {
  byKelas: (kelasId: number) =>
    ["kelas_deletion_impact", kelasId] as const,
};

export function useKelasDeletionImpact(kelasId: number | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: QK.byKelas(kelasId ?? 0),
    enabled: !!kelasId,
    staleTime: 5_000,
    queryFn: async (): Promise<KelasDeletionImpact> => {
      // 1. Ambil semua enrollment di kelas ini (semua status)
      //    Sekaligus dapet ID buat query nilai + rapor di step 2
      const { data: enrollments, error: e1 } = await supabase
        .from("enrollment")
        .select("id, status")
        .eq("rombongan_belajar_id", kelasId!);
      if (e1) throw e1;

      const enrollmentIds = (enrollments ?? []).map((e) => e.id);
      const enrollmentCount = enrollmentIds.length;
      const enrollmentAktifCount = (enrollments ?? []).filter(
        (e) => e.status === "aktif"
      ).length;

      // Early return: kalau gak ada enrollment, gak perlu query lanjutan
      if (enrollmentIds.length === 0) {
        return {
          enrollmentCount: 0,
          enrollmentAktifCount: 0,
          nilaiCount: 0,
          raporPublishedCount: 0,
        };
      }

      // 2. Count nilai + rapor published paralel (HEAD requests, super murah)
      const [nilaiRes, raporRes] = await Promise.all([
        supabase
          .from("nilai_mapel")
          .select("*", { count: "exact", head: true })
          .in("enrollment_id", enrollmentIds),
        supabase
          .from("rapor_header")
          .select("*", { count: "exact", head: true })
          .in("enrollment_id", enrollmentIds)
          .eq("status", "published"),
      ]);

      if (nilaiRes.error) throw nilaiRes.error;
      if (raporRes.error) throw raporRes.error;

      return {
        enrollmentCount,
        enrollmentAktifCount,
        nilaiCount: nilaiRes.count ?? 0,
        raporPublishedCount: raporRes.count ?? 0,
      };
    },
  });
}
