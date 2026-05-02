// ============================================================
// FILE PATH: src/app/api/admin/users/[id]/password/route.ts
// ============================================================
// Super-admin only.
//
// POST {password} → reset password untuk user tertentu.
// Admin share password baru manual ke user (misal via WA).
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { userResetPasswordSchema } from "@/lib/validators";

export async function POST(
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

  const parsed = userResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}