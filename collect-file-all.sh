#!/bin/bash

# ================================================
# E-RAPORT FEATURE COLLECTOR v12
# ================================================
# SKIP: components/ui only
# INCLUDE: semua file src termasuk supabase lib
#          proxy.ts | api/admin/users | auth-guard
# OUTPUT: collection/collected-features.txt
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
OUT="$COLLECTION_DIR/collected-features.txt"

# ── Counters ─────────────────────────────────────
SKIPPED=0
COLLECTED=0

# ── Init ─────────────────────────────────────────
mkdir -p "$COLLECTION_DIR"

{
    echo "# E-RAPORT FEATURES - Source Code Collection"
    echo "# Skip: components/ui only"
    echo "# Include: semua file src termasuk supabase lib, proxy.ts"
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
# 🔐 AUTH PAGES
# ================================================
section "🔐" "AUTH PAGES"
collect_file "$SRC/app/(auth)/layout.tsx"
collect_file "$SRC/app/(auth)/login/page.tsx"

# ================================================
# 🏠 DASHBOARD PAGES
# ================================================
section "🏠" "DASHBOARD PAGES"
collect_file "$SRC/app/(dashboard)/layout.tsx"
collect_file "$SRC/app/(dashboard)/admin/page.tsx"
collect_file "$SRC/app/(dashboard)/profile/page.tsx"

# ================================================
# 📝 PENILAIAN PAGES
# ================================================
section "📝" "PENILAIAN PAGES"
collect_file "$SRC/app/(dashboard)/penilaian/page.tsx"
collect_file "$SRC/app/(dashboard)/penilaian/[kelasId]/page.tsx"
collect_file "$SRC/app/(dashboard)/penilaian/[kelasId]/[enrollmentId]/page.tsx"

# ================================================
# 📊 RAPOR PAGES
# ================================================
section "📊" "RAPOR PAGES"
collect_file "$SRC/app/(dashboard)/rapor/page.tsx"
collect_file "$SRC/app/(dashboard)/rapor/[enrollmentId]/page.tsx"

# ================================================
# 🖨️ PRINT / CETAK
# ================================================
section "🖨️" "PRINT / CETAK"
collect_file "$SRC/app/(print)/layout.tsx"
collect_file "$SRC/app/(print)/cetak/[enrollmentId]/page.tsx"

# ================================================
# 🔑 API ROUTES
# ================================================
section "🔑" "API ROUTES"
collect_file "$SRC/app/api/auth/callback/route.ts"
collect_file "$SRC/app/api/admin/users/route.ts"
collect_file "$SRC/app/api/admin/users/[id]/route.ts"
collect_file "$SRC/app/api/admin/users/[id]/password/route.ts"

# ================================================
# 🔐 AUTH COMPONENTS
# ================================================
section "🔐" "AUTH COMPONENTS"
collect_file "$SRC/components/features/auth/index.ts"
collect_file "$SRC/components/features/auth/login-form.tsx"
collect_file "$SRC/components/features/auth/logout-button.tsx"

# ================================================
# 🏫 ADMIN COMPONENTS
# ================================================
section "🏫" "ADMIN COMPONENTS"
collect_file "$SRC/components/features/admin/index.ts"
collect_file "$SRC/components/features/admin/enrollment-dialog.tsx"
collect_file "$SRC/components/features/admin/import-siswa-dialog.tsx"
collect_file "$SRC/components/features/admin/tab-profil-pkbm.tsx"
collect_file "$SRC/components/features/admin/tab-siswa.tsx"
collect_file "$SRC/components/features/admin/tab-mata-pelajaran.tsx"
collect_file "$SRC/components/features/admin/tab-tahun-kelas.tsx"
collect_file "$SRC/components/features/admin/tab-predikat.tsx"
collect_file "$SRC/components/features/admin/tab-p5-master.tsx"
collect_file "$SRC/components/features/admin/tab-ekskul-preset.tsx"
collect_file "$SRC/components/features/admin/tab-users.tsx"
collect_file "$SRC/components/features/admin/tanggal-cetak-paket-form.tsx"
collect_file "$SRC/components/features/admin/tanggal-cetak-warning-badge.tsx"

# ================================================
# 📝 PENILAIAN COMPONENTS
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
# 📊 RAPOR COMPONENTS
# ================================================
section "📊" "RAPOR COMPONENTS"
collect_file "$SRC/components/features/rapor/index.ts"
collect_file "$SRC/components/features/rapor/export-zip-dialog.tsx"
collect_file "$SRC/components/features/rapor/rapor-kelas-drawer.tsx"
collect_file "$SRC/components/features/rapor/rapor-kelas-list.tsx"
collect_file "$SRC/components/features/rapor/rapor-pdf-document.tsx"
collect_file "$SRC/components/features/rapor/rapor-pdf-styles.ts"
collect_file "$SRC/components/features/rapor/rapor-pdf-viewer.tsx"

# ================================================
# 🔌 FEATURES INDEX
# ================================================
section "🔌" "FEATURES INDEX"
collect_file "$SRC/components/features/index.ts"

# ================================================
# 🎨 LAYOUT COMPONENTS
# ================================================
section "🎨" "LAYOUT COMPONENTS"
collect_file "$SRC/components/layout/index.ts"
collect_file "$SRC/components/layout/app-sidebar.tsx"
collect_file "$SRC/components/layout/header.tsx"
collect_file "$SRC/components/layout/mobile-nav.tsx"
collect_file "$SRC/components/layout/nav-config.ts"
collect_file "$SRC/components/layout/user-menu.tsx"

# ================================================
# 🧩 PROVIDERS
# ================================================
section "🧩" "PROVIDERS"
collect_file "$SRC/components/providers/index.ts"
collect_file "$SRC/components/providers/auth-provider.tsx"
collect_file "$SRC/components/providers/query-provider.tsx"

# ================================================
# 🔧 SHARED COMPONENTS
# ================================================
section "🔧" "SHARED COMPONENTS"
collect_file "$SRC/components/shared/index.ts"
collect_file "$SRC/components/shared/confirm-dialog.tsx"
collect_file "$SRC/components/shared/loading-spinner.tsx"
collect_file "$SRC/components/shared/offline-detector.tsx"

# ================================================
# 🗄️ SUPABASE LIB
# ================================================
section "🗄️" "SUPABASE LIB"
collect_file "$SRC/lib/supabase/client.ts"
collect_file "$SRC/lib/supabase/server.ts"
collect_file "$SRC/lib/supabase/admin.ts"
collect_file "$SRC/lib/supabase/proxy.ts"

# ================================================
# 🔀 PROXY
# ================================================
section "🔀" "PROXY"
collect_file "$SRC/proxy.ts"

# ================================================
# 📚 LIB & UTILS
# ================================================
section "📚" "LIB & UTILS"
collect_file "$SRC/lib/auth-guard.ts"
collect_file "$SRC/lib/export-rapor-zip.tsx"
collect_file "$SRC/lib/p5-tree.ts"
collect_file "$SRC/lib/query-client.ts"
collect_file "$SRC/lib/utils.ts"
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
# 🎣 HOOKS
# ================================================
section "🎣" "HOOKS"
collect_file "$SRC/hooks/index.ts"
collect_file "$SRC/hooks/use-auth.ts"
collect_file "$SRC/hooks/use-users.ts"
collect_file "$SRC/hooks/use-enrollment.ts"
collect_file "$SRC/hooks/use-is-desktop.ts"
collect_file "$SRC/hooks/use-kelas.ts"
collect_file "$SRC/hooks/use-kompetensi.ts"
collect_file "$SRC/hooks/use-mata-pelajaran.ts"
collect_file "$SRC/hooks/use-nilai.ts"
collect_file "$SRC/hooks/use-p5-master.ts"
collect_file "$SRC/hooks/use-predikat.ts"
collect_file "$SRC/hooks/use-rapor.ts"
collect_file "$SRC/hooks/use-satuan-pendidikan.ts"
collect_file "$SRC/hooks/use-siswa.ts"
collect_file "$SRC/hooks/use-tahun-pelajaran.ts"
collect_file "$SRC/hooks/use-ekskul-preset.ts"
collect_file "$SRC/hooks/use-tanggal-cetak-paket.ts"

# ================================================
# 🗃️ STORES
# ================================================
section "🗃️" "STORES"
collect_file "$SRC/stores/index.ts"
collect_file "$SRC/stores/auth-store.ts"

# ── Summary ──────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}✅ SELESAI!${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📄 Output    :${NC} $OUT"
echo -e "${CYAN}📝 Lines     :${NC} $(wc -l < "$OUT")"
echo -e "${CYAN}📦 Size      :${NC} $(du -h "$OUT" | cut -f1)"
echo -e "${GREEN}✓  Collected :${NC} $COLLECTED files"
echo -e "${YELLOW}✗  Skipped   :${NC} $SKIPPED files (not found)"
echo ""
echo -e "${YELLOW}⏭️  SKIPPED INTENTIONALLY:${NC}"
echo -e "   - src/components/ui/*       (shadcn)"
echo ""