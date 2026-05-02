"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

export function useAuth() {
  const user            = useAuthStore((s) => s.user);
  const isLoading       = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin         = useAuthStore((s) => s.isAdmin);
  const hasFetched      = useAuthStore((s) => s.hasFetched);
  const fetchUser       = useAuthStore((s) => s.fetchUser);
  const storeLogout     = useAuthStore((s) => s.logout);
  const router          = useRouter();

  useEffect(() => {
    if (!hasFetched && !isLoading) fetchUser();
  }, [hasFetched, isLoading, fetchUser]);

  const logout = useCallback(async () => {
    await storeLogout();
    router.push("/login");
  }, [storeLogout, router]);

  return { user, isLoading, isAuthenticated, isAdmin, hasFetched, logout };
}
