// ============================================================
// FILE PATH: src/lib/auth-guard.ts
// ============================================================
// Reusable guard untuk API route server-side.
// Pakai di tiap /api/admin/* — pastikan caller login dan role=super_admin.
//
// Return NextResponse (401/403) kalau gagal, atau `null` kalau authorized.
// Convenience: `requireSuperAdmin()` juga return userId caller kalau lolos.
// ============================================================

import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type GuardOk = {
  ok: true;
  userId: string;
};

export type GuardErr = {
  ok: false;
  response: NextResponse;
};

/**
 * Cek user login + role=super_admin.
 * Pakai di awal setiap API route /api/admin/*.
 *
 * Usage:
 *   const g = await requireSuperAdmin();
 *   if (!g.ok) return g.response;
 *   // lanjut business logic pakai g.userId
 */
export async function requireSuperAdmin(): Promise<GuardOk | GuardErr> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Profile not found" },
        { status: 403 }
      ),
    };
  }

  if (!profile.is_active) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Akun Anda dinonaktifkan" },
        { status: 403 }
      ),
    };
  }

  if (profile.role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Hanya Super Admin yang dapat mengakses endpoint ini" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: user.id };
}