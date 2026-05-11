// ============================================================
// FILE PATH: src/hooks/use-ekskul-preset.ts
// ============================================================
// FULL FILE. Pastikan diekspor dari src/hooks/index.ts:
//
//   export * from "./use-ekskul-preset";
//
// Pattern ini SELARAS dengan use-mata-pelajaran.ts:
//   - useEkskulPresets() → all rows (admin view)
//   - useActiveEkskulPresets() → cuma is_aktif=true (filter di
//     form penilaian)
//   - useCreateEkskulPreset() → insert
//   - useUpdateEkskulPreset() → update by id
//   - useDeleteEkskulPreset() → delete by id
//
// CATATAN: kalau hooks ini udah ada di codebase lo (dengan nama
// lain atau gabungan), HAPUS file lama dan replace dengan ini —
// atau adjust import di tab-ekskul-preset.tsx supaya match nama
// hook yang lo udah punya.
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { EkskulPreset } from "@/types";
import type { EkskulPresetFormValues } from "@/lib/validators";
import { toast } from "sonner";

const QK = {
  all: ["ekskul_preset"] as const,
  active: ["ekskul_preset", "active"] as const,
};

// ─── List semua preset (untuk admin view) ────────────────────

export function useEkskulPresets() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.all,
    queryFn: async (): Promise<EkskulPreset[]> => {
      const { data, error } = await supabase
        .from("ekskul_preset")
        .select("*")
        .order("urutan", { ascending: true })
        .order("nama_ekskul", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EkskulPreset[];
    },
  });
}

// ─── List preset aktif (untuk form penilaian) ────────────────

export function useActiveEkskulPresets() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.active,
    queryFn: async (): Promise<EkskulPreset[]> => {
      const { data, error } = await supabase
        .from("ekskul_preset")
        .select("*")
        .eq("is_aktif", true)
        .order("urutan", { ascending: true })
        .order("nama_ekskul", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EkskulPreset[];
    },
  });
}

// ─── Create preset baru ──────────────────────────────────────

export function useCreateEkskulPreset() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (values: EkskulPresetFormValues) => {
      const { error } = await supabase.from("ekskul_preset").insert({
        nama_ekskul: values.nama_ekskul,
        gender: values.gender,
        is_aktif: values.is_aktif ?? true,
        urutan: values.urutan ?? 0,
        keterangan_a: values.keterangan_a ?? null,
        keterangan_b: values.keterangan_b ?? null,
        keterangan_c: values.keterangan_c ?? null,
        keterangan_d: values.keterangan_d ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.active });
      toast.success("Preset ekskul berhasil ditambahkan");
    },
    onError: (err: Error) =>
      toast.error("Gagal tambah preset: " + err.message),
  });
}

// ─── Update preset by id ─────────────────────────────────────

export function useUpdateEkskulPreset() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      values: EkskulPresetFormValues;
    }) => {
      const { error } = await supabase
        .from("ekskul_preset")
        .update({
          nama_ekskul: payload.values.nama_ekskul,
          gender: payload.values.gender,
          is_aktif: payload.values.is_aktif ?? true,
          urutan: payload.values.urutan ?? 0,
          keterangan_a: payload.values.keterangan_a ?? null,
          keterangan_b: payload.values.keterangan_b ?? null,
          keterangan_c: payload.values.keterangan_c ?? null,
          keterangan_d: payload.values.keterangan_d ?? null,
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.active });
      toast.success("Preset ekskul berhasil diperbarui");
    },
    onError: (err: Error) =>
      toast.error("Gagal update preset: " + err.message),
  });
}

// ─── Delete preset by id ─────────────────────────────────────

export function useDeleteEkskulPreset() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ekskul_preset")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.active });
      toast.success("Preset ekskul berhasil dihapus");
    },
    onError: (err: Error) =>
      toast.error("Gagal hapus preset: " + err.message),
  });
}