// ============================================================
// FILE PATH: src/hooks/use-siswa-deletion-impact.ts
// ============================================================
// FILE BARU. Pre-fetch impact count untuk confirm dialog hapus
// siswa (single + bulk).
//
// Strategy:
//   1. Fetch enrollment IDs untuk siswa terkait (1 query)
//   2. Kalau ada enrollment, parallel fetch:
//      - count nilai_mapel WHERE enrollment_id IN (...)
//      - count rapor_header WHERE enrollment_id IN (...)
//        AND status = 'published'
//   3. Return aggregate counts buat di-render di confirm dialog
//
// Dipake di:
//   - DeleteSiswaConfirm (single, lewat kebab menu)
//   - BulkDeleteSiswaConfirm (multiple, lewat action bar)
//
// Severity colors di UI:
//   - Hijau / muted: siswa kosong, aman
//   - Amber: ada enrollment + nilai (CASCADE warning)
//   - Rose: ada rapor published (extra warning + ring tebal)
//
// staleTime 5s = kalau dialog dibuka ulang dalam 5 detik, pakai cache.
// Untuk bulk, query key di-derive dari sorted ID list biar stable.
// ============================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface SiswaDeletionImpact {
  enrollmentCount: number;
  enrollmentAktifCount: number;
  nilaiCount: number;
  raporPublishedCount: number;
}

const QK = {
  single: (id: string) => ["siswa_deletion_impact", "single", id] as const,
  bulk: (ids: string[]) =>
    ["siswa_deletion_impact", "bulk", [...ids].sort().join(",")] as const,
};

// ============================================================
// SHARED CORE — fetch impact untuk sekumpulan siswa IDs
// ============================================================

async function fetchImpactForIds(
  siswaIds: string[]
): Promise<SiswaDeletionImpact> {
  const supabase = createClient();

  if (siswaIds.length === 0) {
    return {
      enrollmentCount: 0,
      enrollmentAktifCount: 0,
      nilaiCount: 0,
      raporPublishedCount: 0,
    };
  }

  // Step 1: Fetch enrollment IDs + status untuk semua siswa terkait
  const { data: enrollments, error: e1 } = await supabase
    .from("enrollment")
    .select("id, status")
    .in("peserta_didik_id", siswaIds);
  if (e1) throw e1;

  const enrollmentRows = enrollments ?? [];
  const enrollmentIds = enrollmentRows.map((e) => e.id);
  const enrollmentCount = enrollmentRows.length;
  const enrollmentAktifCount = enrollmentRows.filter(
    (e) => e.status === "aktif"
  ).length;

  // Kalau gak ada enrollment sama sekali, skip query lanjutan
  if (enrollmentIds.length === 0) {
    return {
      enrollmentCount: 0,
      enrollmentAktifCount: 0,
      nilaiCount: 0,
      raporPublishedCount: 0,
    };
  }

  // Step 2: Parallel count nilai_mapel + rapor_header (status=published)
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
}

// ============================================================
// SINGLE — impact buat 1 siswa (kebab menu → Hapus)
// ============================================================

export function useSiswaDeletionImpact(siswaId: string | null) {
  return useQuery({
    queryKey: QK.single(siswaId ?? ""),
    enabled: !!siswaId,
    staleTime: 5_000,
    queryFn: async (): Promise<SiswaDeletionImpact> => {
      return fetchImpactForIds([siswaId!]);
    },
  });
}

// ============================================================
// BULK — aggregate impact buat banyak siswa (action bar → Hapus Terpilih)
// ============================================================

export function useBulkSiswaDeletionImpact(siswaIds: string[]) {
  return useQuery({
    queryKey: QK.bulk(siswaIds),
    enabled: siswaIds.length > 0,
    staleTime: 5_000,
    queryFn: async (): Promise<SiswaDeletionImpact> => {
      return fetchImpactForIds(siswaIds);
    },
  });
}
