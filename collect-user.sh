#!/bin/bash

# ================================================
# E-RAPORT USER FEATURE COLLECTOR v1
# ================================================
# FOKUS: Fitur User (Penilaian / Input Nilai harian)
#
# Cakupan:
#   - Auth pages + auth API + auth components (login flow)
#   - Dashboard shell (layout + profile + sidebar/nav)
#   - Penilaian pages (list kelas → list siswa → detail input)
#   - Penilaian components (nilai/P5/ekskul/absensi forms + drawer + quick-fill)
#   - Hooks yang dipakai user untuk input penilaian
#   - Supabase client/server/proxy + auth proxy
#   - Validators + utils + quick-fill helpers
#
# SKIP:
#   - components/ui/* (shadcn)
#   - Halaman admin (master data, akademik, sistem)
#   - Halaman rapor & cetak (preview/print PDF)
#   - Components admin & rapor
#   - API routes /api/admin/* (super_admin only)
#   - Hooks khusus admin (use-users) atau rapor (use-rapor)
#   - Lib khusus rapor (export-rapor-zip, p5-tree)
#   - lib/auth-guard (server guard untuk admin API)
#   - lib/supabase/admin (service role, hanya dipakai API admin)
#
# OUTPUT: collection/collected-user.txt
# ================================================

# ── Colors ──────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# ── Paths ────────────────────────────────────────
WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$WORKSPACE_ROOT/src"
COLLECTION_DIR="$WORKSPACE_ROOT/collection"
OUT="$COLLECTION_DIR/collected-user.txt"

# ── Counters ─────────────────────────────────────
SKIPPED=0
COLLECTED=0

# ── Init ─────────────────────────────────────────
mkdir -p "$COLLECTION_DIR"

{
    echo "# E-RAPORT USER FEATURES - Source Code Collection"
    echo "# Fokus: fitur user (Penilaian / Input Nilai harian)"
    echo "# Skip: components/ui, admin pages, rapor pages, cetak"
    echo ""
    echo "---"
    echo ""
} > "$OUT"

# ── Helpers ──────────────────────────────────────

section() {
    local icon="$1"
    local label="$2"
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}${icon} ${label}${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "" >> "$OUT"
    echo "# ${icon} ${label}" >> "$OUT"
    echo "" >> "$OUT"
}

collect_file() {
    local file="$1"
    local rel="${file#$WORKSPACE_ROOT/}"
    local ext="${file##*.}"

    if [ ! -f "$file" ]; then
        echo -e "  ${RED}✗ SKIP${NC} ${YELLOW}(not found)${NC}: $rel"
        SKIPPED=$((SKIPPED + 1))
        return
    fi

    local lines
    lines=$(wc -l < "$file" 2>/dev/null)
    lines="${lines// /}"

    echo -e "  ${GREEN}✓${NC} $rel ${CYAN}(${lines} lines)${NC}"
    COLLECTED=$((COLLECTED + 1))

    echo "" >> "$OUT"
    echo "## \`${rel}\`" >> "$OUT"
    echo "" >> "$OUT"
    echo "**Lines:** ${lines}" >> "$OUT"
    echo "" >> "$OUT"
    echo '```'"${ext}" >> "$OUT"
    cat "$file" >> "$OUT"
    echo "" >> "$OUT"
    echo '```' >> "$OUT"
    echo "" >> "$OUT"
    echo "---" >> "$OUT"
    echo "" >> "$OUT"
}

# ================================================
# 📁 APP ROOT
# ================================================
section "📁" "APP ROOT"
collect_file "$SRC/app/layout.tsx"
collect_file "$SRC/app/page.tsx"
collect_file "$SRC/app/globals.css"

# ================================================
# 🔐 AUTH PAGES + COMPONENTS
# ================================================
section "🔐" "AUTH PAGES & COMPONENTS"
collect_file "$SRC/app/(auth)/layout.tsx"
collect_file "$SRC/app/(auth)/login/page.tsx"
collect_file "$SRC/app/api/auth/callback/route.ts"
collect_file "$SRC/components/features/auth/index.ts"
collect_file "$SRC/components/features/auth/login-form.tsx"
collect_file "$SRC/components/features/auth/logout-button.tsx"

# ================================================
# 🏠 DASHBOARD SHELL & PROFILE
# ================================================
section "🏠" "DASHBOARD SHELL & PROFILE"
collect_file "$SRC/app/(dashboard)/layout.tsx"
collect_file "$SRC/app/(dashboard)/profile/page.tsx"

# ================================================
# 📝 PENILAIAN PAGES (input nilai workflow)
# ================================================
section "📝" "PENILAIAN PAGES"
collect_file "$SRC/app/(dashboard)/penilaian/page.tsx"
collect_file "$SRC/app/(dashboard)/penilaian/[kelasId]/page.tsx"
collect_file "$SRC/app/(dashboard)/penilaian/[kelasId]/[enrollmentId]/page.tsx"

# ================================================
# 📝 PENILAIAN COMPONENTS (forms, drawer, quick-fill)
# ================================================
section "📝" "PENILAIAN COMPONENTS"
collect_file "$SRC/components/features/penilaian/index.ts"
collect_file "$SRC/components/features/penilaian/kelas-list.tsx"
collect_file "$SRC/components/features/penilaian/siswa-list.tsx"
collect_file "$SRC/components/features/penilaian/nilai-form.tsx"
collect_file "$SRC/components/features/penilaian/nilai-detail-drawer.tsx"
collect_file "$SRC/components/features/penilaian/p5-form.tsx"
collect_file "$SRC/components/features/penilaian/p5-detail-drawer.tsx"
collect_file "$SRC/components/features/penilaian/absensi-catatan-form.tsx"
collect_file "$SRC/components/features/penilaian/ekskul-form.tsx"
collect_file "$SRC/components/features/penilaian/quick-fill-inline.tsx"
collect_file "$SRC/components/features/penilaian/quick-fill-panel.tsx"
collect_file "$SRC/components/features/penilaian/quick-fill-dialog.tsx"
collect_file "$SRC/components/features/penilaian/quick-fill-simple-dialog.tsx"

# ================================================
# 🎨 LAYOUT (sidebar, mobile-nav, user-menu, nav-config)
# ================================================
section "🎨" "LAYOUT COMPONENTS"
collect_file "$SRC/components/layout/index.ts"
collect_file "$SRC/components/layout/header.tsx"
collect_file "$SRC/components/layout/app-sidebar.tsx"
collect_file "$SRC/components/layout/mobile-nav.tsx"
collect_file "$SRC/components/layout/user-menu.tsx"
collect_file "$SRC/components/layout/nav-config.ts"

# ================================================
# 🧩 PROVIDERS & SHARED
# ================================================
section "🧩" "PROVIDERS & SHARED"
collect_file "$SRC/components/providers/index.ts"
collect_file "$SRC/components/providers/auth-provider.tsx"
collect_file "$SRC/components/providers/query-provider.tsx"
collect_file "$SRC/components/shared/index.ts"
collect_file "$SRC/components/shared/confirm-dialog.tsx"
collect_file "$SRC/components/shared/loading-spinner.tsx"
collect_file "$SRC/components/shared/offline-detector.tsx"

# ================================================
# 🎣 HOOKS (untuk input penilaian)
# ================================================
section "🎣" "HOOKS"
collect_file "$SRC/hooks/index.ts"
collect_file "$SRC/hooks/use-auth.ts"
collect_file "$SRC/hooks/use-is-desktop.ts"
collect_file "$SRC/hooks/use-satuan-pendidikan.ts"
collect_file "$SRC/hooks/use-tahun-pelajaran.ts"
collect_file "$SRC/hooks/use-kelas.ts"
collect_file "$SRC/hooks/use-siswa.ts"
collect_file "$SRC/hooks/use-enrollment.ts"
collect_file "$SRC/hooks/use-mata-pelajaran.ts"
collect_file "$SRC/hooks/use-kompetensi.ts"
collect_file "$SRC/hooks/use-p5-master.ts"
collect_file "$SRC/hooks/use-predikat.ts"
collect_file "$SRC/hooks/use-ekskul-preset.ts"
collect_file "$SRC/hooks/use-nilai.ts"
collect_file "$SRC/hooks/use-rapor.ts"

# ================================================
# 🗄️ SUPABASE LIB (client + server + proxy, no admin)
# ================================================
section "🗄️" "SUPABASE LIB"
collect_file "$SRC/lib/supabase/client.ts"
collect_file "$SRC/lib/supabase/server.ts"
collect_file "$SRC/lib/supabase/proxy.ts"

# ================================================
# 🔀 PROXY (route guard)
# ================================================
section "🔀" "PROXY"
collect_file "$SRC/proxy.ts"

# ================================================
# 📚 LIB & UTILS (validators, quick-fill helpers)
# ================================================
section "📚" "LIB & UTILS"
collect_file "$SRC/lib/utils.ts"
collect_file "$SRC/lib/query-client.ts"
collect_file "$SRC/lib/validators.ts"
collect_file "$SRC/lib/quick-fill.ts"
collect_file "$SRC/lib/quick-fill-absensi.ts"
collect_file "$SRC/lib/quick-fill-ekskul.ts"
collect_file "$SRC/lib/quick-fill-p5.ts"

# ================================================
# 📝 TYPES
# ================================================
section "📝" "TYPES"
collect_file "$SRC/types/index.ts"
collect_file "$SRC/types/database.ts"

# ================================================
# ⚙️ CONSTANTS
# ================================================
section "⚙️" "CONSTANTS"
collect_file "$SRC/constants/index.ts"
collect_file "$SRC/constants/routes.ts"

# ================================================
# 🗃️ STORES
# ================================================
section "🗃️" "STORES"
collect_file "$SRC/stores/index.ts"
collect_file "$SRC/stores/auth-store.ts"

# ── Summary ──────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}✅ SELESAI - USER COLLECTION${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📄 Output    :${NC} $OUT"
echo -e "${CYAN}📝 Lines     :${NC} $(wc -l < "$OUT")"
echo -e "${CYAN}📦 Size      :${NC} $(du -h "$OUT" | cut -f1)"
echo -e "${GREEN}✓  Collected :${NC} $COLLECTED files"
echo -e "${YELLOW}✗  Skipped   :${NC} $SKIPPED files (not found)"
echo ""
echo -e "${YELLOW}⏭️  SKIPPED INTENTIONALLY:${NC}"
echo -e "   - src/components/ui/*              (shadcn)"
echo -e "   - app/(dashboard)/admin/*          (admin only)"
echo -e "   - app/(dashboard)/rapor/*          (rapor preview)"
echo -e "   - app/(print)/*                    (print layout)"
echo -e "   - app/api/admin/*                  (super_admin API)"
echo -e "   - components/features/admin/*      (admin tabs)"
echo -e "   - components/features/rapor/*      (PDF render)"
echo -e "   - hooks/use-users.ts               (admin only)"
echo -e "   - hooks/use-tanggal-cetak-paket.ts (admin set)"
echo -e "   - lib/auth-guard.ts                (server guard admin)"
echo -e "   - lib/supabase/admin.ts            (service role)"
echo -e "   - lib/export-rapor-zip.tsx         (PDF batch)"
echo -e "   - lib/p5-tree.ts                   (PDF render helper)"
echo ""