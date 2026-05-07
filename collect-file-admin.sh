#!/bin/bash

# ================================================
# E-RAPORT ADMIN FEATURE COLLECTOR v1
# ================================================
# FOKUS: Hanya fitur Admin (Master Data, Akademik, Sistem)
#
# Cakupan:
#   - Admin entry page (app/(dashboard)/admin)
#   - Admin components (components/features/admin/*)
#   - API routes admin-only (api/admin/users/*)
#   - Hooks yang dipakai oleh admin tabs
#   - Lib pendukung admin (auth-guard, validators, utils)
#   - Supabase admin client + server client + proxy
#   - Types, constants, stores yang terpakai admin
#
# SKIP:
#   - components/ui/* (shadcn)
#   - Halaman penilaian, rapor, cetak (bukan admin)
#   - Auth pages (login form, dll)
#   - Layout components umum (sidebar/mobile-nav)
#   - Shared components umum
#   - Hooks khusus penilaian (nilai, rapor, dll)
#
# OUTPUT: collection/collected-admin.txt
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
OUT="$COLLECTION_DIR/collected-admin.txt"

# ── Counters ─────────────────────────────────────
SKIPPED=0
COLLECTED=0

# ── Init ─────────────────────────────────────────
mkdir -p "$COLLECTION_DIR"

{
    echo "# E-RAPORT ADMIN FEATURES - Source Code Collection"
    echo "# Fokus: hanya fitur admin (Master Data, Akademik, Sistem)"
    echo "# Skip: components/ui, penilaian, rapor, cetak, auth pages"
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
# 🏠 ADMIN ENTRY PAGE
# ================================================
section "🏠" "ADMIN ENTRY PAGE"
collect_file "$SRC/app/(dashboard)/admin/page.tsx"

# ================================================
# 🔑 API ROUTES (Admin only - super_admin guard)
# ================================================
section "🔑" "API ROUTES (Admin)"
collect_file "$SRC/app/api/admin/users/route.ts"
collect_file "$SRC/app/api/admin/users/[id]/route.ts"
collect_file "$SRC/app/api/admin/users/[id]/password/route.ts"

# ================================================
# 🏫 ADMIN COMPONENTS (semua tab + dialog)
# ================================================
section "🏫" "ADMIN COMPONENTS"
collect_file "$SRC/components/features/admin/index.ts"
collect_file "$SRC/components/features/admin/tab-profil-pkbm.tsx"
collect_file "$SRC/components/features/admin/tab-tahun-kelas.tsx"
collect_file "$SRC/components/features/admin/tab-siswa.tsx"
collect_file "$SRC/components/features/admin/tab-mata-pelajaran.tsx"
collect_file "$SRC/components/features/admin/tab-p5-master.tsx"
collect_file "$SRC/components/features/admin/tab-predikat.tsx"
collect_file "$SRC/components/features/admin/tab-ekskul-preset.tsx"
collect_file "$SRC/components/features/admin/tab-users.tsx"
collect_file "$SRC/components/features/admin/enrollment-dialog.tsx"
collect_file "$SRC/components/features/admin/import-siswa-dialog.tsx"
collect_file "$SRC/components/features/admin/tanggal-cetak-paket-form.tsx"
collect_file "$SRC/components/features/admin/tanggal-cetak-warning-badge.tsx"

# ================================================
# 🎣 ADMIN HOOKS (yang dipakai admin tabs)
# ================================================
section "🎣" "ADMIN HOOKS"
collect_file "$SRC/hooks/index.ts"
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
collect_file "$SRC/hooks/use-users.ts"
collect_file "$SRC/hooks/use-tanggal-cetak-paket.ts"
collect_file "$SRC/hooks/use-is-desktop.ts"
collect_file "$SRC/hooks/use-auth.ts"

# ================================================
# 🗄️ SUPABASE LIB (admin butuh service role + server)
# ================================================
section "🗄️" "SUPABASE LIB"
collect_file "$SRC/lib/supabase/client.ts"
collect_file "$SRC/lib/supabase/server.ts"
collect_file "$SRC/lib/supabase/admin.ts"
collect_file "$SRC/lib/supabase/proxy.ts"

# ================================================
# 🔀 PROXY (route guard)
# ================================================
section "🔀" "PROXY"
collect_file "$SRC/proxy.ts"

# ================================================
# 📚 LIB & UTILS (auth-guard + validators admin)
# ================================================
section "📚" "LIB & UTILS"
collect_file "$SRC/lib/auth-guard.ts"
collect_file "$SRC/lib/validators.ts"
collect_file "$SRC/lib/utils.ts"
collect_file "$SRC/lib/query-client.ts"

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
# 🗃️ STORES (auth store dipake guard isAdmin)
# ================================================
section "🗃️" "STORES"
collect_file "$SRC/stores/index.ts"
collect_file "$SRC/stores/auth-store.ts"

# ── Summary ──────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}✅ SELESAI - ADMIN COLLECTION${NC}"
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
echo -e "   - app/(auth)/*                     (login pages)"
echo -e "   - app/(dashboard)/penilaian/*      (bukan admin)"
echo -e "   - app/(dashboard)/rapor/*          (bukan admin)"
echo -e "   - app/(print)/*                    (bukan admin)"
echo -e "   - components/features/auth/*       (login form)"
echo -e "   - components/features/penilaian/*  (bukan admin)"
echo -e "   - components/features/rapor/*      (bukan admin)"
echo -e "   - components/layout/*              (sidebar/nav umum)"
echo -e "   - components/shared/*              (umum)"
echo -e "   - components/providers/*           (umum)"
echo -e "   - hooks/use-nilai.ts               (penilaian)"
echo -e "   - hooks/use-rapor.ts               (rapor)"
echo -e "   - lib/export-rapor-zip.tsx         (rapor)"
echo -e "   - lib/p5-tree.ts                   (rapor render)"
echo -e "   - lib/quick-fill*.ts               (penilaian)"
echo ""