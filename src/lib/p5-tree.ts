// ============================================================
// FILE PATH: src/lib/p5-tree.ts
// ============================================================
// Helper murni untuk compose data P5 dari raw arrays jadi struktur
// tree yang siap di-render di rapor PDF & form penilaian.
//
// Logic-nya extracted dari useP5Tree hook supaya bisa dipake juga
// di:
//   - rapor-pdf-viewer.tsx (single rapor preview)
//   - export-rapor-zip.tsx (batch ZIP export)
//
// Tidak ada side effect, tidak ada Supabase call — pure data
// transformation. Aman dipanggil dari client maupun server.
// ============================================================

import type {
  P5Dimensi,
  P5Elemen,
  P5SubElemen,
  P5DimensiTree,
  PredikatP5,
} from "@/types";

/**
 * Compose hierarki P5: dimensi → elemen → sub-elemen.
 * Sub-elemen yang di-pass udah di-filter per fase di caller.
 */
export function buildP5Tree(
  dimensiList: P5Dimensi[],
  elemenList: P5Elemen[],
  subElemenList: P5SubElemen[]
): P5DimensiTree[] {
  return dimensiList.map((d) => ({
    ...d,
    elemen: elemenList
      .filter((e) => e.dimensi_id === d.id)
      .map((e) => ({
        ...e,
        sub_elemen: subElemenList.filter((s) => s.elemen_id === e.id),
      })),
  }));
}

/**
 * Build Map sub_elemen_id → predikat dari array penilaian_p5.
 * Skip row yang predikat-nya null (siswa belum dinilai di sub-elemen itu).
 */
export function buildPenilaianP5Map(
  penilaianList: Array<{
    sub_elemen_id: number;
    predikat: PredikatP5 | string | null;
  }>
): Map<number, PredikatP5> {
  const map = new Map<number, PredikatP5>();
  penilaianList.forEach((p) => {
    if (p.predikat) {
      map.set(p.sub_elemen_id, p.predikat as PredikatP5);
    }
  });
  return map;
}