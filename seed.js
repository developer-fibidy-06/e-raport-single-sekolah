// ============================================================
// FILE PATH: scripts/seed.js
// ============================================================
// E-RAPORT PKBM — SEED USERS
// Jalankan: node scripts/seed.js
// Butuh: NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
//        di .env.local
//
// CHANGELOG dari versi sebelumnya:
//   - Hapus reliance pada trigger handle_new_user (yang gak ada
//     di supabase-setup.sql v2.4 — fix PGRST116).
//   - Pakai eksplisit upsert ke user_profiles setelah createUser
//     auth.admin → idempotent, gak butuh sleep 800ms.
//   - Pakai .maybeSingle() bukan .single() biar gak throw saat
//     row gak ada.
//   - Set is_active=true eksplisit (default schema = TRUE, tapi
//     better explicit biar jelas intent-nya).
//   - Destruct `error` di setiap query — gak ada lagi silent fail.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY " +
    "tidak ditemukan di .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// 📋 DATA USER — GANTI SESUAI KEBUTUHAN
// ============================================================
const userList = [
  {
    full_name: "Administrator",
    email: "admin@pkbm.com",
    password: "Admin@2026",
    role: "super_admin",
    phone: null,
  },
  {
    full_name: "Nama User",
    email: "user@pkbm.com",
    password: "User@2026",
    role: "user",
    phone: null,
  },
];

// ============================================================
// 🔧 HELPER — upsert profile (idempotent)
// ============================================================
async function upsertProfile(authUserId, userData) {
  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        id: authUserId,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone ?? null,
        is_active: true,
      },
      { onConflict: "id" }
    );

  if (error) {
    throw new Error(`Upsert profile gagal: ${error.message}`);
  }
}

// ============================================================
// 🚀 FUNGSI CREATE USER
// ============================================================
async function createUser(userData) {
  try {
    console.log(`\n📝 Processing: ${userData.full_name} (${userData.email})`);

    // 1. Cek apakah auth user udah ada
    const { data: authList, error: listError } =
      await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existing = authList.users.find((u) => u.email === userData.email);

    let authUserId;
    let createdNew = false;

    if (existing) {
      console.log(`   ⏭️  Auth user sudah ada (ID: ${existing.id})`);
      authUserId = existing.id;
    } else {
      // 2a. Buat auth user baru
      console.log(`   🔐 Membuat auth user...`);
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: { full_name: userData.full_name },
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned");

      authUserId = authData.user.id;
      createdNew = true;
      console.log(`   ✅ Auth user dibuat: ${authUserId}`);
    }

    // 3. Cek apakah profile udah ada (pakai maybeSingle, gak throw kalau 0 rows)
    const { data: existingProfile, error: profileSelectError } = await supabase
      .from("user_profiles")
      .select("id, role, full_name")
      .eq("id", authUserId)
      .maybeSingle();

    if (profileSelectError) throw profileSelectError;

    // 4. Upsert profile — bikin baru kalau belum ada, update kalau udah ada
    //    (idempotent, aman di-rerun berkali-kali)
    await upsertProfile(authUserId, userData);

    if (!existingProfile) {
      console.log(
        `   ✅ Profile dibuat dengan role: ${userData.role}, full_name: ${userData.full_name}`
      );
      return {
        status: createdNew ? "created" : "linked",
        ...userData,
        auth_id: authUserId,
      };
    }

    // Profile udah ada — cek apakah ada perubahan
    const changed =
      existingProfile.role !== userData.role ||
      existingProfile.full_name !== userData.full_name;

    if (changed) {
      console.log(
        `   🔄 Profile diupdate: role=${userData.role}, full_name=${userData.full_name}`
      );
      return { status: "updated", ...userData, auth_id: authUserId };
    }

    console.log(`   ⏭️  Profile sudah sesuai, skip.`);
    return { status: "skipped", ...userData, auth_id: authUserId };
  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return { status: "failed", ...userData, error: error.message };
  }
}

// ============================================================
// 🎬 MAIN
// ============================================================
async function main() {
  console.log("🚀 SEED USERS - E-RAPORT PKBM");
  console.log("=============================================\n");
  console.log(`📋 Total user: ${userList.length}\n`);

  const results = {
    created: [],
    linked: [],
    updated: [],
    skipped: [],
    failed: [],
  };

  for (const user of userList) {
    const result = await createUser(user);
    results[result.status]?.push(result);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log("\n\n=============================================");
  console.log("📊 HASIL");
  console.log("=============================================\n");

  console.log(`✅ Created : ${results.created.length}`);
  results.created.forEach((r) =>
    console.log(`   ✅ ${r.full_name} (${r.email}) — ${r.role}`)
  );

  console.log(`\n🔗 Linked  : ${results.linked.length}`);
  results.linked.forEach((r) =>
    console.log(`   🔗 ${r.full_name} (${r.email}) — auth ada, profile baru dibuat`)
  );

  console.log(`\n🔄 Updated : ${results.updated.length}`);
  results.updated.forEach((r) =>
    console.log(`   🔄 ${r.full_name} (${r.email})`)
  );

  console.log(`\n⏭️  Skipped : ${results.skipped.length}`);
  results.skipped.forEach((r) =>
    console.log(`   ⏭️  ${r.full_name} (${r.email})`)
  );

  console.log(`\n❌ Failed  : ${results.failed.length}`);
  results.failed.forEach((r) =>
    console.log(`   ❌ ${r.full_name} (${r.email}): ${r.error}`)
  );

  console.log("\n\n=============================================");
  console.log("🔑 LOGIN CREDENTIALS");
  console.log("=============================================\n");
  userList.forEach((u) => {
    console.log(`👤 ${u.full_name} (${u.role})`);
    console.log(`   Email    : ${u.email}`);
    console.log(`   Password : ${u.password}\n`);
  });
  console.log("⚠️  Ganti password setelah login pertama!\n");
}

main()
  .then(() => {
    console.log("✅ Script selesai!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script gagal:", error);
    process.exit(1);
  });