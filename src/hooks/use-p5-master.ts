"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  P5DimensiFormData,
  P5ElemenFormData,
  P5SubElemenFormData,
} from "@/lib/validators";
import type { P5DimensiTree } from "@/types";
import { toast } from "sonner";

// ============================================================
// Query keys
// ============================================================
const QK = {
  dimensi: ["p5_dimensi"] as const,
  elemen: (dimensiId: number) => ["p5_elemen", dimensiId] as const,
  subElemen: (elemenId: number, fase?: string) =>
    fase
      ? (["p5_sub_elemen", elemenId, fase] as const)
      : (["p5_sub_elemen", elemenId] as const),
  tree: (fase: string) => ["p5_tree", fase] as const,
};

// ============================================================
// P5 TREE — dimensi → elemen → sub_elemen (per fase)
// Dipakai untuk rendering form penilaian P5 dan rapor lembar 2.
// ============================================================

export function useP5Tree(fase: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.tree(fase ?? ""),
    enabled: !!fase,
    queryFn: async (): Promise<P5DimensiTree[]> => {
      // 1. Ambil semua dimensi aktif
      const { data: dimensiList, error: e1 } = await supabase
        .from("p5_dimensi")
        .select("*")
        .eq("is_aktif", true)
        .order("urutan");
      if (e1) throw e1;

      // 2. Ambil semua elemen aktif
      const { data: elemenList, error: e2 } = await supabase
        .from("p5_elemen")
        .select("*")
        .eq("is_aktif", true)
        .order("urutan");
      if (e2) throw e2;

      // 3. Ambil semua sub-elemen untuk fase ini
      const { data: subList, error: e3 } = await supabase
        .from("p5_sub_elemen")
        .select("*")
        .eq("fase", fase!)
        .eq("is_aktif", true)
        .order("urutan");
      if (e3) throw e3;

      // Compose tree
      return (dimensiList ?? []).map((d) => ({
        ...d,
        elemen: (elemenList ?? [])
          .filter((e) => e.dimensi_id === d.id)
          .map((e) => ({
            ...e,
            sub_elemen: (subList ?? []).filter((s) => s.elemen_id === e.id),
          })),
      }));
    },
  });
}

// ============================================================
// DIMENSI CRUD
// ============================================================

export function useP5Dimensi() {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.dimensi,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("p5_dimensi")
        .select("*")
        .order("urutan");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateDimensi() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: P5DimensiFormData) => {
      const { error } = await supabase.from("p5_dimensi").insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.dimensi });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Dimensi ditambahkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useUpdateDimensi() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<P5DimensiFormData> }) => {
      const { error } = await supabase.from("p5_dimensi").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.dimensi });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Dimensi diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useDeleteDimensi() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("p5_dimensi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.dimensi });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Dimensi dihapus");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

// ============================================================
// ELEMEN CRUD
// ============================================================

export function useP5ElemenByDimensi(dimensiId: number | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.elemen(dimensiId ?? 0),
    enabled: !!dimensiId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("p5_elemen")
        .select("*")
        .eq("dimensi_id", dimensiId!)
        .order("urutan");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateElemen() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: P5ElemenFormData) => {
      const { error } = await supabase.from("p5_elemen").insert(values);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.elemen(vars.dimensi_id) });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Elemen ditambahkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useUpdateElemen() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<P5ElemenFormData> }) => {
      const { error } = await supabase.from("p5_elemen").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["p5_elemen"] });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Elemen diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useDeleteElemen() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dimensiId: _d }: { id: number; dimensiId: number }) => {
      const { error } = await supabase.from("p5_elemen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.elemen(vars.dimensiId) });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Elemen dihapus");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

// ============================================================
// SUB-ELEMEN CRUD
// ============================================================

export function useP5SubElemenByElemen(elemenId: number | null, fase?: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: QK.subElemen(elemenId ?? 0, fase),
    enabled: !!elemenId,
    queryFn: async () => {
      let q = supabase
        .from("p5_sub_elemen")
        .select("*")
        .eq("elemen_id", elemenId!)
        .order("urutan");
      if (fase) q = q.eq("fase", fase);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSubElemen() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: P5SubElemenFormData) => {
      const { error } = await supabase.from("p5_sub_elemen").insert(values);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["p5_sub_elemen", vars.elemen_id] });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Sub-elemen ditambahkan");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useUpdateSubElemen() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: Partial<P5SubElemenFormData> }) => {
      const { error } = await supabase.from("p5_sub_elemen").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["p5_sub_elemen"] });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Sub-elemen diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

export function useDeleteSubElemen() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, elemenId: _e }: { id: number; elemenId: number }) => {
      const { error } = await supabase.from("p5_sub_elemen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["p5_sub_elemen", vars.elemenId] });
      qc.invalidateQueries({ queryKey: ["p5_tree"] });
      toast.success("Sub-elemen dihapus");
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}