// ============================================================
// FILE PATH: src/app/api/admin/users/[id]/route.ts
// ============================================================
// Super-admin only.
//
// PATCH  → update profile: {full_name, role, phone, is_active}
// DELETE → hard delete auth user + user_profiles cascade
//          ⚠️ Dihindari karena FK di nilai_mapel.input_by dll.
//          Prefer PATCH {is_active: false}.
//
// Proteksi: super_admin nggak boleh demote/nonaktifkan diri sendiri
// (biar nggak terkunci keluar sistem).
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { userUpdateSchema } from "@/lib/validators";

// ── PATCH: update user profile ───────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const g = await requireSuperAdmin();
  if (!g.ok) return g.response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { full_name, role, phone, is_active } = parsed.data;

  // Guard: caller tidak boleh demote atau nonaktifkan akun dirinya sendiri
  if (id === g.userId) {
    if (role !== "super_admin") {
      return NextResponse.json(
        { error: "Tidak dapat mengubah role Super Admin diri sendiri" },
        { status: 400 }
      );
    }
    if (!is_active) {
      return NextResponse.json(
        { error: "Tidak dapat menonaktifkan akun Anda sendiri" },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();

  // Upsert (kalau profile belum ada — harusnya sudah ada, tapi jaga-jaga)
  const { error } = await admin
    .from("user_profiles")
    .upsert(
      {
        id,
        full_name,
        role,
        phone: phone ?? null,
        is_active,
      },
      { onConflict: "id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ── DELETE: hard delete user ─────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const g = await requireSuperAdmin();
  if (!g.ok) return g.response;

  const { id } = await params;

  // Guard: nggak boleh hapus diri sendiri
  if (id === g.userId) {
    return NextResponse.json(
      { error: "Tidak dapat menghapus akun Anda sendiri" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Coba delete profile dulu — kalau ada FK violation, kasih tau user
  const { error: eProfile } = await admin
    .from("user_profiles")
    .delete()
    .eq("id", id);

  if (eProfile) {
    return NextResponse.json(
      {
        error:
          "Tidak dapat menghapus: user masih punya data terkait (nilai, enrollment, dll). Gunakan tombol 'Nonaktifkan' saja.",
      },
      { status: 409 }
    );
  }

  // Delete auth user
  const { error: eAuth } = await admin.auth.admin.deleteUser(id);
  if (eAuth) {
    return NextResponse.json({ error: eAuth.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}