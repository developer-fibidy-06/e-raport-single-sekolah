// ============================================================
// FILE PATH: src/hooks/use-users.ts
// ============================================================
// Hook untuk user management via /api/admin/users.
// Super-admin only — guard di server-side, client tinggal fetch.
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  UserCreateFormData,
  UserUpdateFormData,
  UserResetPasswordFormData,
} from "@/lib/validators";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  full_name: string;
  role: string;
  phone: string | null;
  is_active: boolean;
  has_profile: boolean;
}

const QK = {
  all: ["admin_users"] as const,
};

async function throwIfError(res: Response): Promise<void> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
}

// ── List users ───────────────────────────────────────────────
export function useAdminUsers() {
  return useQuery({
    queryKey: QK.all,
    queryFn: async (): Promise<AdminUser[]> => {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      await throwIfError(res);
      const json = (await res.json()) as { users: AdminUser[] };
      return json.users;
    },
  });
}

// ── Create user ──────────────────────────────────────────────
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: UserCreateFormData) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      await throwIfError(res);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("User berhasil dibuat");
    },
    onError: (err: Error) => toast.error("Gagal buat user: " + err.message),
  });
}

// ── Update user profile ──────────────────────────────────────
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: UserUpdateFormData;
    }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      await throwIfError(res);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("User berhasil diperbarui");
    },
    onError: (err: Error) => toast.error("Gagal update: " + err.message),
  });
}

// ── Toggle is_active (shortcut pakai PATCH) ──────────────────
export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: AdminUser) => {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: user.full_name,
          role: user.role,
          phone: user.phone,
          is_active: !user.is_active,
        }),
      });
      await throwIfError(res);
      return res.json();
    },
    onSuccess: (_, user) => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success(
        user.is_active ? "User dinonaktifkan" : "User diaktifkan kembali"
      );
    },
    onError: (err: Error) => toast.error("Gagal: " + err.message),
  });
}

// ── Reset password ───────────────────────────────────────────
export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: UserResetPasswordFormData;
    }) => {
      const res = await fetch(`/api/admin/users/${id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      await throwIfError(res);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Password berhasil direset");
    },
    onError: (err: Error) => toast.error("Gagal reset: " + err.message),
  });
}

// ── Delete user (hard) ──────────────────────────────────────
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      await throwIfError(res);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.all });
      toast.success("User dihapus");
    },
    onError: (err: Error) => toast.error("Gagal hapus: " + err.message),
  });
}