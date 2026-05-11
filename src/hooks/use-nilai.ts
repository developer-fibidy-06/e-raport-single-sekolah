// ============================================================
// FILE PATH: src/hooks/use-nilai.ts
// ============================================================
// REPLACE. Sync ke schema v2.1:
//   - useNilaiByEnrollment: DROP `kode` dari select mata_pelajaran,
//     DROP `kompetensi_dasar(...)` join (FK dihapus)
//   - useUpsertNilai: DROP `kompetensi_dasar_id` dari payload
//   - useBatchUpsertNilai: DROP `kompetensi_dasar_id` dari rows
//   - fetchFirstKdByMapel: KEEP — masih dipakai untuk capaian auto-fill
//     via RPC get_capaian_kompetensi (kompetensi_dasar table masih
//     ada, cuma orphan dari nilai_mapel)
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores";
import type { PredikatP5 } from "@/types";
import { toast } from "sonner";

const QK = {
  byEnrollment: (id: string) => ["nilai_mapel", id] as const,
  penilaianP5: (id: string) => ["penilaian_p5", id] as const,
  catatanP5: (id: string) => ["catatan_p5", id] as const,
  ekskul: (id: string) => ["ekskul", id] as const,
  absensi: (id: string) => ["absensi", id] as const,
  catatan: (id: string) => ["catatan", id] as const,
};

// ── Derive predikat dari nilai (RPC) ─────────────────────────
export async function derivePredikat(nilai: number): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("derive_predikat", { p_nilai: nilai });
  if (error) {
    console.warn("[derive_predikat] RPC failed:", error.message);
    return null;
  }
  return data as string;
}

// ── Get capaian kompetensi otomatis (RPC) ────────────────────
// kd_id di-pass manual dari client (bukan FK lagi di nilai_mapel).
export async function getCapaianKompetensi(kdId: number, nilai: number): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_capaian_kompetensi", {
    p_kd_id: kdId,
    p_nilai: nilai,
  });
  if (error) {
    console.warn("[get_capaian_kompetensi] RPC failed:", error.message);
    return "";
  }
  return (data as string) ?? "";
}

// ── Fetch KD pertama untuk sekumpulan mapel ──────────────────
export async function fetchFirstKdByMapel(
  mapelIds: number[]
): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  if (mapelIds.length === 0) return out;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("kompetensi_dasar")
    .select("id, mata_pelajaran_id, urutan")
    .in("mata_pelajaran_id", mapelIds)
    .eq("is_aktif", true)
    .order("urutan", { ascending: true });
  if (error) return out;

  (data ?? []).forEach((kd) => {
    if (!out.has(kd.mata_pelajaran_id)) {
      out.set(kd.mata_pelajaran_id, kd.id);
    }
  });
  return out;
}

// ── Fetch nilai per enrollment ────────────────────────────────
export function useNilaiByEnrollment(enrollmentId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byEnrollment(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nilai_mapel")
        .select(`
          *,
          mata_pelajaran(id, nama, urutan, kelompok)
        `)
        .eq("enrollment_id", enrollmentId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Upsert satu nilai mapel ───────────────────────────────────
// v2.1: kompetensi_dasar_id di-drop dari payload — kolomnya udah
// gak ada di nilai_mapel.
export function useUpsertNilai() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: {
      enrollment_id: string;
      mata_pelajaran_id: number;
      nilai_akhir: number | null;
      predikat: string | null;
      capaian_kompetensi: string | null;
    }) => {
      const { error } = await supabase
        .from("nilai_mapel")
        .upsert(
          { ...payload, input_by: userId ?? null },
          { onConflict: "enrollment_id,mata_pelajaran_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.byEnrollment(vars.enrollment_id) });
    },
    onError: (err: Error) => toast.error("Gagal simpan nilai: " + err.message),
  });
}

// ── Batch upsert nilai mapel ──────────────────────────────────
export function useBatchUpsertNilai() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (
      rows: Array<{
        enrollment_id: string;
        mata_pelajaran_id: number;
        nilai_akhir: number | null;
        predikat: string | null;
        capaian_kompetensi: string | null;
      }>
    ) => {
      if (rows.length === 0) return;
      const payload = rows.map((r) => ({
        ...r,
        input_by: userId ?? null,
      }));
      const { error } = await supabase
        .from("nilai_mapel")
        .upsert(payload, { onConflict: "enrollment_id,mata_pelajaran_id" });
      if (error) throw error;
    },
    onSuccess: (_, rows) => {
      const enrollmentIds = [...new Set(rows.map((r) => r.enrollment_id))];
      enrollmentIds.forEach((id) =>
        qc.invalidateQueries({ queryKey: QK.byEnrollment(id) })
      );
      toast.success(`${rows.length} nilai berhasil disimpan`);
    },
    onError: (err: Error) => toast.error("Gagal simpan batch: " + err.message),
  });
}

// ============================================================
// PENILAIAN P5
// ============================================================

export function usePenilaianP5ByEnrollment(enrollmentId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.penilaianP5(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("penilaian_p5")
        .select("*")
        .eq("enrollment_id", enrollmentId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertPenilaianP5() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: {
      enrollment_id: string;
      sub_elemen_id: number;
      predikat: PredikatP5 | null;
    }) => {
      if (payload.predikat === null) {
        const { error } = await supabase
          .from("penilaian_p5")
          .delete()
          .eq("enrollment_id", payload.enrollment_id)
          .eq("sub_elemen_id", payload.sub_elemen_id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("penilaian_p5")
        .upsert(
          { ...payload, input_by: userId ?? null },
          { onConflict: "enrollment_id,sub_elemen_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.penilaianP5(vars.enrollment_id) });
    },
    onError: (err: Error) => toast.error("Gagal simpan P5: " + err.message),
  });
}

export function useBatchUpsertPenilaianP5() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: {
      enrollment_id: string;
      predikat_map: Map<number, PredikatP5>;
      overwriteExisting: boolean;
    }) => {
      const allIds = Array.from(payload.predikat_map.keys());
      if (allIds.length === 0) {
        return { touched: 0, skipped: 0 };
      }

      let idsToUpsert = allIds;

      if (!payload.overwriteExisting) {
        const { data: existing, error: qErr } = await supabase
          .from("penilaian_p5")
          .select("sub_elemen_id")
          .eq("enrollment_id", payload.enrollment_id)
          .in("sub_elemen_id", allIds)
          .not("predikat", "is", null);
        if (qErr) throw qErr;

        const filledIds = new Set(
          (existing ?? []).map((r) => r.sub_elemen_id)
        );
        idsToUpsert = allIds.filter((id) => !filledIds.has(id));
      }

      if (idsToUpsert.length === 0) {
        return { touched: 0, skipped: allIds.length };
      }

      const rows = idsToUpsert.map((sub_elemen_id) => ({
        enrollment_id: payload.enrollment_id,
        sub_elemen_id,
        predikat: payload.predikat_map.get(sub_elemen_id)!,
        input_by: userId ?? null,
      }));

      const { error } = await supabase
        .from("penilaian_p5")
        .upsert(rows, { onConflict: "enrollment_id,sub_elemen_id" });
      if (error) throw error;

      return {
        touched: idsToUpsert.length,
        skipped: allIds.length - idsToUpsert.length,
      };
    },
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: QK.penilaianP5(vars.enrollment_id) });
      if (result.touched > 0) {
        const skipMsg =
          result.skipped > 0 ? ` (${result.skipped} sudah terisi dilewati)` : "";
        toast.success(
          `${result.touched} sub-elemen berhasil diisi${skipMsg}`
        );
      } else if (result.skipped > 0) {
        toast.info(
          "Semua sub-elemen sudah terisi. Aktifkan 'Timpa nilai yang sudah ada' untuk mengisi ulang."
        );
      }
    },
    onError: (err: Error) => toast.error("Gagal simpan batch P5: " + err.message),
  });
}

// ============================================================
// CATATAN P5
// ============================================================

export function useCatatanP5ByEnrollment(enrollmentId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.catatanP5(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catatan_p5")
        .select("*")
        .eq("enrollment_id", enrollmentId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useUpsertCatatanP5() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: {
      enrollment_id: string;
      catatan: string | null;
    }) => {
      const { error } = await supabase
        .from("catatan_p5")
        .upsert(
          { ...payload, input_by: userId ?? null },
          { onConflict: "enrollment_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.catatanP5(vars.enrollment_id) });
    },
    onError: (err: Error) => toast.error("Gagal simpan catatan P5: " + err.message),
  });
}

// ============================================================
// EKSKUL
// ============================================================

export function useEkskulByEnrollment(enrollmentId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.ekskul(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ekstrakurikuler")
        .select("*")
        .eq("enrollment_id", enrollmentId!)
        .order("nama_ekskul");
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── 1) useUpsertEkskul — sekarang support update mode ────────

export function useUpsertEkskul() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      enrollment_id: string;
      nama_ekskul: string;
      predikat?: string | null;
      keterangan?: string | null;
    }) => {
      // UPDATE mode: id ada → update existing row
      if (payload.id) {
        const { error } = await supabase
          .from("ekstrakurikuler")
          .update({
            nama_ekskul: payload.nama_ekskul,
            predikat: payload.predikat ?? null,
            keterangan: payload.keterangan ?? null,
            input_by: userId ?? null,
          })
          .eq("id", payload.id);
        if (error) throw error;
        return;
      }

      // INSERT mode: id undefined → insert row baru
      const { error } = await supabase.from("ekstrakurikuler").insert({
        enrollment_id: payload.enrollment_id,
        nama_ekskul: payload.nama_ekskul,
        predikat: payload.predikat ?? null,
        keterangan: payload.keterangan ?? null,
        input_by: userId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.ekskul(vars.enrollment_id) });
      // Toast feedback — beda message untuk insert vs update
      if (vars.id) {
        toast.success("Ekskul berhasil diperbarui");
      } else {
        toast.success("Ekskul berhasil ditambahkan");
      }
    },
    onError: (err: Error) => toast.error("Gagal simpan ekskul: " + err.message),
  });
}

// ─── 2) useBatchInsertEkskul — keterangan type fix ────────────

export function useBatchInsertEkskul() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: {
      enrollment_id: string;
      rows: Array<{
        enrollment_id: string;
        nama_ekskul: string;
        predikat: "A" | "B";
        keterangan: string; // ← CHANGED dari `null` ke `string`
      }>;
    }) => {
      if (payload.rows.length === 0) {
        return { inserted: 0, skipped: 0 };
      }

      const { data: existing, error: qErr } = await supabase
        .from("ekstrakurikuler")
        .select("nama_ekskul")
        .eq("enrollment_id", payload.enrollment_id);
      if (qErr) throw qErr;

      const existingNames = new Set(
        (existing ?? []).map((r) => r.nama_ekskul.toLowerCase())
      );

      const toInsert = payload.rows.filter(
        (r) => !existingNames.has(r.nama_ekskul.toLowerCase())
      );

      if (toInsert.length === 0) {
        return { inserted: 0, skipped: payload.rows.length };
      }

      const rowsWithUser = toInsert.map((r) => ({
        ...r,
        input_by: userId ?? null,
      }));

      const { error } = await supabase
        .from("ekstrakurikuler")
        .insert(rowsWithUser);
      if (error) throw error;

      return {
        inserted: toInsert.length,
        skipped: payload.rows.length - toInsert.length,
      };
    },
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: QK.ekskul(vars.enrollment_id) });
      if (result.inserted > 0) {
        const skipMsg =
          result.skipped > 0 ? ` (${result.skipped} sudah ada, dilewati)` : "";
        toast.success(`${result.inserted} ekskul ditambahkan${skipMsg}`);
      } else if (result.skipped > 0) {
        toast.info("Semua preset ekskul sudah ditambahkan sebelumnya.");
      }
    },
    onError: (err: Error) => toast.error("Gagal quick-fill: " + err.message),
  });
}

export function useDeleteEkskul() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enrollmentId: _e }: { id: string; enrollmentId: string }) => {
      const { error } = await supabase.from("ekstrakurikuler").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.ekskul(vars.enrollmentId) });
    },
    onError: (err: Error) => toast.error("Gagal hapus: " + err.message),
  });
}

// ============================================================
// ABSENSI
// ============================================================

export function useAbsensiByEnrollment(enrollmentId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.absensi(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ketidakhadiran")
        .select("*")
        .eq("enrollment_id", enrollmentId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useUpsertAbsensi() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: {
      enrollment_id: string;
      sakit: number;
      izin: number;
      alpha: number;
    }) => {
      const { error } = await supabase
        .from("ketidakhadiran")
        .upsert(
          { ...payload, input_by: userId ?? null },
          { onConflict: "enrollment_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.absensi(vars.enrollment_id) });
      toast.success("Absensi disimpan");
    },
    onError: (err: Error) => toast.error("Gagal simpan absensi: " + err.message),
  });
}

// ============================================================
// CATATAN WALI KELAS
// ============================================================

export function useCatatanByEnrollment(enrollmentId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.catatan(enrollmentId ?? ""),
    enabled: !!enrollmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catatan_wali_kelas")
        .select("*")
        .eq("enrollment_id", enrollmentId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useUpsertCatatan() {
  const supabase = createClient();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: async (payload: {
      enrollment_id: string;
      catatan?: string | null;
      tanggapan_ortu?: string | null;
    }) => {
      const { error } = await supabase
        .from("catatan_wali_kelas")
        .upsert(
          { ...payload, input_by: userId ?? null },
          { onConflict: "enrollment_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.catatan(vars.enrollment_id) });
      toast.success("Catatan disimpan");
    },
    onError: (err: Error) => toast.error("Gagal simpan catatan: " + err.message),
  });
}