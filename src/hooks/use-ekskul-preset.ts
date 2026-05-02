// ============================================================
// FILE PATH: src/hooks/use-ekskul-preset.ts
// ============================================================
// CRUD untuk tabel `ekskul_preset` (admin-editable global list).
// Dipakai di:
//   - Admin tab untuk kelola preset
//   - EkskulForm untuk quick-fill per siswa
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { EkskulPresetFormData } from "@/lib/validators";
import { toast } from "sonner";

const QK = {
  all: ["ekskul_preset"] as const,
  active: ["ekskul_preset", "active"] as const,
};

/** Semua preset (termasuk non-aktif) untuk admin panel. */
export function useEkskulPresets() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ekskul_preset")
        .select("*")
        .order("gender")
        .order("urutan")
        .order("nama_ekskul");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Hanya preset aktif. Dipakai di EkskulForm untuk quick-fill. */
export function useActiveEkskulPresets() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ekskul_preset")
        .select("*")
        .eq("is_aktif", true)
        .order("urutan");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateEkskulPreset() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: EkskulPresetFormData) => {
      const { error } = await supabase.from("ekskul_preset").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.active });
      toast.success("Preset ekskul ditambahkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useUpdateEkskulPreset() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: Partial<EkskulPresetFormData>;
    }) => {
      const { error } = await supabase
        .from("ekskul_preset")
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.active });
      toast.success("Preset ekskul diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useDeleteEkskulPreset() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("ekskul_preset")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      qc.invalidateQueries({ queryKey: QK.active });
      toast.success("Preset ekskul dihapus");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}