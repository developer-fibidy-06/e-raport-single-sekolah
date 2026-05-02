// ============================================================
// FILE PATH: src/app/api/admin/users/route.ts
// ============================================================
// Super-admin only.
//
// GET   → list semua user (gabungkan auth.users + user_profiles)
// POST  → create user baru: {email, password, full_name, role, phone?}
//         → create di auth.admin, lalu insert/upsert ke user_profiles
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { userCreateSchema } from "@/lib/validators";

// ── GET: list users ──────────────────────────────────────────
export async function GET() {
  const g = await requireSuperAdmin();
  if (!g.ok) return g.response;

  const admin = createAdminClient();

  // Ambil semua auth users (pagination: 1 halaman = 1000 user; PKBM jelas < itu)
  const { data: authList, error: eAuth } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (eAuth) {
    return NextResponse.json({ error: eAuth.message }, { status: 500 });
  }

  // Ambil semua user_profiles sekaligus
  const { data: profiles, error: eProf } = await admin
    .from("user_profiles")
    .select("*");
  if (eProf) {
    return NextResponse.json({ error: eProf.message }, { status: 500 });
  }

  // Gabungkan — key by id
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const merged = (authList.users ?? []).map((u) => {
    const p = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      last_sign_in_at: u.last_sign_in_at ?? null,
      created_at: u.created_at,
      full_name: p?.full_name ?? "(belum set)",
      role: p?.role ?? "user",
      phone: p?.phone ?? null,
      is_active: p?.is_active ?? false,
      has_profile: !!p,
    };
  });

  // Sort: super_admin dulu, lalu aktif, lalu alfabet
  merged.sort((a, b) => {
    if (a.role === "super_admin" && b.role !== "super_admin") return -1;
    if (a.role !== "super_admin" && b.role === "super_admin") return 1;
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.full_name.localeCompare(b.full_name, "id");
  });

  return NextResponse.json({ users: merged });
}

// ── POST: create user ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const g = await requireSuperAdmin();
  if (!g.ok) return g.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, password, full_name, role, phone } = parsed.data;

  const admin = createAdminClient();

  // 1. Create auth user
  const { data: created, error: eCreate } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // langsung aktif, no email verification
  });
  if (eCreate || !created.user) {
    return NextResponse.json(
      { error: eCreate?.message ?? "Gagal membuat auth user" },
      { status: 500 }
    );
  }

  // 2. Insert profile
  const { error: eProfile } = await admin.from("user_profiles").insert({
    id: created.user.id,
    full_name,
    role,
    phone: phone ?? null,
    is_active: true,
  });

  if (eProfile) {
    // Rollback — hapus auth user yang barusan dibuat
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Gagal buat profil: " + eProfile.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: created.user.id,
    email: created.user.email,
    full_name,
    role,
  });
}