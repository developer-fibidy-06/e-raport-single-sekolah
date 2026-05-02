"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { KompetensiDasarFormData } from "@/lib/validators";
import { toast } from "sonner";

const QK = {
  byMapel: (mapelId: number) => ["kompetensi_dasar", mapelId] as const,
  all:     ["kompetensi_dasar"] as const,
};

export function useKompetensiByMapel(mataPelajaranId: number | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.byMapel(mataPelajaranId ?? 0),
    enabled: !!mataPelajaranId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kompetensi_dasar")
        .select("*")
        .eq("mata_pelajaran_id", mataPelajaranId!)
        .order("urutan");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateKompetensi() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: KompetensiDasarFormData) => {
      const { error } = await supabase.from("kompetensi_dasar").insert(values);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.byMapel(vars.mata_pelajaran_id) });
      toast.success("Kompetensi berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useUpdateKompetensi() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<KompetensiDasarFormData> }) => {
      const { error } = await supabase.from("kompetensi_dasar").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Kompetensi diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useDeleteKompetensi() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mapelId }: { id: number; mapelId: number }) => {
      const { error } = await supabase.from("kompetensi_dasar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.byMapel(vars.mapelId) });
      toast.success("Kompetensi dihapus");
    },
    onError: (err: Error) => toast.error("Gagal menghapus: " + err.message),
  });
}
