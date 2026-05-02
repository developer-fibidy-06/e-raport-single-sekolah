// ============================================================
// FILE PATH: src/app/(dashboard)/layout.tsx
// ============================================================
// REPLACE. Perubahan tunggal: HAPUS <header> total.
//
// Konsekuensi:
//   - UserMenu yang tadinya di header sekarang sudah dipindah
//     ke profile page sebagai tombol Logout di Card paling bawah
//   - <main> langsung mulai dari top, no sticky header bar
//   - Sidebar (desktop) & MobileBottomNav (mobile) tetap ada
//
// Layout tetap pakai container mx-auto p-4 md:p-6 di main →
// width konsisten di semua halaman child (penilaian, rapor, profile).
// ============================================================

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { createClient } from "@/lib/supabase/client";
import { FullPageLoader } from "@/components/shared";
import { MobileBottomNav } from "@/components/layout/mobile-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const authListenerSetup = useRef(false);

  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasFetched = useAuthStore((state) => state.hasFetched);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const reset = useAuthStore((state) => state.reset);

  useEffect(() => {
    if (!hasFetched && !isLoading) fetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authListenerSetup.current) return;
    authListenerSetup.current = true;
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { reset(); router.push("/login"); }
      else if (event === "SIGNED_IN" && session) {
        if (!useAuthStore.getState().user) fetchUser();
      }
    });
    return () => { subscription.unsubscribe(); authListenerSetup.current = false; };
  }, [router, reset, fetchUser]);

  useEffect(() => {
    if (hasFetched && !isLoading && !user) router.push("/login");
  }, [hasFetched, isLoading, user, router]);

  if (!hasFetched) return <FullPageLoader text="Memuat..." />;
  if (isLoading) return <FullPageLoader text="Mengautentikasi..." />;
  if (!user) return <FullPageLoader text="Mengalihkan..." />;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <div className="flex flex-1 flex-col md:ml-64">
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}