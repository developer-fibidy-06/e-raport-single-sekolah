"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SatuanPendidikanFormData } from "@/lib/validators";
import { toast } from "sonner";

const QK = { all: ["satuan_pendidikan"] as const };

export function useSatuanPendidikan() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("satuan_pendidikan")
        .select("*")
        .order("id")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useUpsertSatuanPendidikan() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: SatuanPendidikanFormData & { id?: number }) => {
      const { error } = await supabase
        .from("satuan_pendidikan")
        .upsert({ ...values, id: values.id ?? 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Profil PKBM berhasil disimpan");
    },
    onError: (err: Error) => toast.error("Gagal menyimpan: " + err.message),
  });
}
