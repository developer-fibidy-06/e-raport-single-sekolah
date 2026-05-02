// ============================================================
// FILE PATH: src/lib/supabase/admin.ts
// ============================================================
// Admin client dengan SERVICE_ROLE_KEY. Bypass RLS, bisa create/delete
// auth users. WAJIB hanya dipakai di server (API route), nggak boleh
// diimport di client component.
//
// ENV yang dibutuhkan:
//   - NEXT_PUBLIC_SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY  (rahasia, jangan prefix NEXT_PUBLIC_)
// ============================================================

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceKey) {
    throw new Error(
      "Missing env: SUPABASE_SERVICE_ROLE_KEY (set di .env.local untuk user management)"
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}