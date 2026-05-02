"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PredikatGlobalFormData } from "@/lib/validators";
import { toast } from "sonner";

const QK = { all: ["predikat_global"] as const };

export function usePredikatGlobal() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predikat_global")
        .select("*")
        .order("nilai_min", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// FIX: tambah onConflict pada unique (predikat)
export function useUpdatePredikat() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: PredikatGlobalFormData[]) => {
      const { error } = await supabase
        .from("predikat_global")
        .upsert(rows, { onConflict: "predikat" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("Range predikat berhasil disimpan");
    },
    onError: (err: Error) => toast.error("Gagal menyimpan: " + err.message),
  });
}
