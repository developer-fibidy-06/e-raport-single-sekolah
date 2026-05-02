"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TahunPelajaranFormData } from "@/lib/validators";
import { toast } from "sonner";

const QK = {
  all:   ["tahun_pelajaran"] as const,
  aktif: ["tahun_pelajaran", "aktif"] as const,
};

export function useTahunPelajaran() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tahun_pelajaran")
        .select("*")
        .order("nama", { ascending: false })
        .order("semester");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTahunPelajaranAktif() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.aktif,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tahun_pelajaran")
        .select("*")
        .eq("is_aktif", true)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useCreateTahunPelajaran() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: TahunPelajaranFormData) => {
      const { error } = await supabase.from("tahun_pelajaran").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Tahun pelajaran berhasil ditambahkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useSetTahunPelajaranAktif() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error: e1 } = await supabase
        .from("tahun_pelajaran")
        .update({ is_aktif: false })
        .neq("id", 0);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("tahun_pelajaran")
        .update({ is_aktif: true })
        .eq("id", id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Tahun pelajaran aktif diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useDeleteTahunPelajaran() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("tahun_pelajaran").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Tahun pelajaran dihapus");
    },
    onError: (err: Error) => toast.error("Gagal menghapus: " + err.message),
  });
}
