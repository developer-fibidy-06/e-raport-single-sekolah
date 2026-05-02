// ============================================================
// FILE PATH: src/hooks/use-mata-pelajaran.ts
// ============================================================
// REPLACE versi sebelumnya (dari batch fix duplikasi).
//
// Perubahan dari versi sebelumnya:
//
//   1. NEW: useNilaiCountByMapel(mapelId) — count berapa row nilai_mapel
//      yang refer ke mapel ini. Dipakai di confirm dialog hapus mapel
//      biar admin tau dampak CASCADE sebelum klik Hapus.
//      → Pakai HEAD request (count: 'exact') = super murah, gak fetch row.
//      → Cache 5 detik biar refetch saat dialog dibuka ulang.
//
//   2. KEEP: Semua hook & helper sebelumnya — useCreateMataPelajaran
//      (dengan duplicate guard), useUpdateMataPelajaran (dengan
//      duplicate guard), useDeleteMataPelajaran, useMataPelajaran,
//      useAllMataPelajaran.
//
//   3. KEEP: Filter agama logic, isUniqueViolation detection,
//      checkDuplicateMapel helper.
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { MataPelajaranFormData } from "@/lib/validators";
import type { KelompokMapel, MataPelajaran } from "@/types";
import { toast } from "sonner";

// ── Whitelist agama (defensive validation) ──────────────────
const VALID_AGAMA = new Set([
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
]);

const QK = {
  all: ["mata_pelajaran"] as const,
  byPaket: (paket: string, kelompok?: KelompokMapel, agama?: string | null) => {
    const base: (string | KelompokMapel)[] = ["mata_pelajaran", paket];
    if (kelompok) base.push(kelompok);
    if (agama === undefined) base.push("__no_agama_filter");
    else if (agama === null || agama === "") base.push("__null_agama");
    else base.push(`agama:${agama}`);
    return base as readonly unknown[];
  },
  allIncl: ["mata_pelajaran", "all_including_inactive"] as const,
  nilaiCount: (mapelId: number) =>
    ["mata_pelajaran", "nilai_count", mapelId] as const,
};

// ============================================================
// HELPER: build duplicate key
// ============================================================
function buildDuplicateKey(values: {
  nama: string;
  paket: string;
  fase?: string | null;
  agama?: string | null;
}): string {
  const namaNorm = values.nama.trim().toLowerCase();
  const faseKey = values.fase ?? "__NULL__";
  const agamaKey = values.agama ?? "__NULL__";
  return `${namaNorm}||${values.paket}||${faseKey}||${agamaKey}`;
}

// ============================================================
// HELPER: Check duplikat dari DB
// ============================================================
async function checkDuplicateMapel(
  values: {
    nama: string;
    paket: string;
    fase?: string | null;
    agama?: string | null;
  },
  excludeId?: number
): Promise<MataPelajaran | null> {
  const supabase = createClient();
  const namaNorm = values.nama.trim();

  let query = supabase
    .from("mata_pelajaran")
    .select("*")
    .ilike("nama", namaNorm)
    .eq("paket", values.paket);

  if (values.fase === null || values.fase === undefined) {
    query = query.is("fase", null);
  } else {
    query = query.eq("fase", values.fase);
  }

  if (values.agama === null || values.agama === undefined) {
    query = query.is("agama", null);
  } else {
    query = query.eq("agama", values.agama);
  }

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1);
  if (error) throw error;

  if (!data || data.length === 0) return null;

  const found = data.find(
    (row) => row.nama.trim().toLowerCase() === namaNorm.toLowerCase()
  );
  return found ?? null;
}

function formatDuplicateMessage(existing: MataPelajaran): string {
  const parts: string[] = [`"${existing.nama}"`];
  parts.push(`di ${existing.paket}`);
  if (existing.fase) parts.push(existing.fase);
  if (existing.agama) parts.push(`agama ${existing.agama}`);
  return `Mata pelajaran ${parts.join(" · ")} sudah ada. Tidak boleh duplikat.`;
}

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "23505") return true;
  if (e.message && /duplicate key|unique constraint/i.test(e.message)) {
    return true;
  }
  return false;
}

// ============================================================
// QUERIES
// ============================================================

export function useMataPelajaran(
  paket?: string,
  kelompok?: KelompokMapel,
  siswaAgama?: string | null
) {
  const supabase = createClient();
  return useQuery({
    queryKey: paket ? QK.byPaket(paket, kelompok, siswaAgama) : QK.all,
    queryFn: async () => {
      let q = supabase
        .from("mata_pelajaran")
        .select("*")
        .eq("is_aktif", true)
        .order("urutan")
        .order("nama");
      if (paket) {
        q = q.in("paket", [paket, "Semua"]);
      }
      if (kelompok) {
        q = q.eq("kelompok", kelompok);
      }
      if (siswaAgama !== undefined) {
        if (siswaAgama === null || siswaAgama === "") {
          q = q.is("agama", null);
        } else if (
          typeof siswaAgama === "string" &&
          VALID_AGAMA.has(siswaAgama)
        ) {
          q = q.or(`agama.is.null,agama.eq.${siswaAgama}`);
        } else {
          q = q.is("agama", null);
        }
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllMataPelajaran() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.allIncl,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mata_pelajaran")
        .select("*")
        .order("paket")
        .order("kelompok")
        .order("urutan");
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ============================================================
// NEW: Count nilai_mapel yang refer ke mapel ini
// ============================================================
// Dipakai di confirm dialog hapus — supaya admin tau berapa
// nilai bakal ke-CASCADE-delete sebelum klik Hapus.
//
// Pakai HEAD request (head: true + count: 'exact') = super murah,
// gak fetch row data, cuma return count di header.
//
// staleTime 5s = kalau dialog dibuka ulang dalam 5 detik, pakai cache.
// Setelah > 5 detik, refetch biar count fresh (kalau ada nilai baru
// di-insert di tab lain antara open dialog).
// ============================================================

export function useNilaiCountByMapel(mapelId: number | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.nilaiCount(mapelId ?? 0),
    enabled: !!mapelId,
    staleTime: 5_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("nilai_mapel")
        .select("*", { count: "exact", head: true })
        .eq("mata_pelajaran_id", mapelId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// ============================================================
// MUTATIONS — dengan duplicate guard
// ============================================================

export function useCreateMataPelajaran() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: MataPelajaranFormData) => {
      const existing = await checkDuplicateMapel({
        nama: values.nama,
        paket: values.paket,
        fase: values.fase ?? null,
        agama: values.agama ?? null,
      });
      if (existing) {
        throw new Error(formatDuplicateMessage(existing));
      }

      const payload = {
        ...values,
        nama: values.nama.trim(),
        agama: values.agama || null,
      };
      const { error } = await supabase.from("mata_pelajaran").insert(payload);
      if (error) {
        if (isUniqueViolation(error)) {
          throw new Error(
            "Mata pelajaran dengan kombinasi nama, paket, fase, dan agama yang sama sudah ada."
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.allIncl });
      qc.invalidateQueries({ queryKey: ["mata_pelajaran"] });
      toast.success("Mata pelajaran berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateMataPelajaran() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: Partial<MataPelajaranFormData>;
    }) => {
      const isKeyFieldChanged =
        "nama" in values ||
        "paket" in values ||
        "fase" in values ||
        "agama" in values;

      if (isKeyFieldChanged) {
        const { data: current, error: eFetch } = await supabase
          .from("mata_pelajaran")
          .select("*")
          .eq("id", id)
          .single();
        if (eFetch) throw eFetch;

        const merged = {
          nama: values.nama ?? current.nama,
          paket: values.paket ?? current.paket,
          fase: "fase" in values ? values.fase ?? null : current.fase,
          agama: "agama" in values ? values.agama ?? null : current.agama,
        };

        const existing = await checkDuplicateMapel(merged, id);
        if (existing) {
          throw new Error(formatDuplicateMessage(existing));
        }
      }

      const payload: Partial<MataPelajaranFormData> = { ...values };
      if ("nama" in payload && typeof payload.nama === "string") {
        payload.nama = payload.nama.trim();
      }
      if ("agama" in payload) {
        payload.agama = payload.agama || null;
      }

      const { error } = await supabase
        .from("mata_pelajaran")
        .update(payload)
        .eq("id", id);
      if (error) {
        if (isUniqueViolation(error)) {
          throw new Error(
            "Perubahan ini bikin mata pelajaran jadi duplikat dengan yang sudah ada."
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.allIncl });
      qc.invalidateQueries({ queryKey: ["mata_pelajaran"] });
      toast.success("Mata pelajaran diperbarui");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteMataPelajaran() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("mata_pelajaran")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.allIncl });
      qc.invalidateQueries({ queryKey: ["mata_pelajaran"] });
      // Invalidate nilai cache juga karena CASCADE bisa hapus nilai
      qc.invalidateQueries({ queryKey: ["nilai_mapel"] });
      toast.success("Mata pelajaran dihapus");
    },
    onError: (err: Error) => toast.error("Gagal menghapus: " + err.message),
  });
}