#!/bin/bash

# ================================================
# E-RAPORT CETAK/PREVIEW COLLECTOR v1
# ================================================
# FOKUS: Fitur Rapor (Cetak / Preview / Archive ZIP)
#
# Cakupan:
#   - Halaman rapor (list kelas → preview siswa)
#   - Halaman cetak (clean print, no sidebar)
#   - Components rapor (PDF document, styles, viewer, drawer, ZIP dialog)
#   - Lib export-rapor-zip + p5-tree (PDF data composition)
#   - Hook use-rapor (full data + validasi tanggal cetak)
#   - Hooks pendukung yang dipakai untuk fetch data rapor
#   - Layout shell + supabase client
#
# SKIP:
#   - components/ui/* (shadcn)
#   - Halaman admin (master data, akademik, sistem)
#   - Halaman penilaian (input nilai)
#   - Components admin & penilaian
#   - API routes /api/admin/*
#   - Hooks input nilai (use-nilai)
#   - lib/auth-guard, lib/supabase/admin (admin-only)
#   - lib/quick-fill* (penilaian only)
#
# OUTPUT: collection/collected-rapor.txt
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
OUT="$COLLECTION_DIR/collected-rapor.txt"

# ── Counters ─────────────────────────────────────
SKIPPED=0
COLLECTED=0

# ── Init ─────────────────────────────────────────
mkdir -p "$COLLECTION_DIR"

{
    echo "# E-RAPORT CETAK/PREVIEW - Source Code Collection"
    echo "# Fokus: fitur rapor (preview PDF + cetak + ZIP archive)"
    echo "# Skip: components/ui, admin pages, penilaian pages"
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
# 🏠 LAYOUT SHELL (root + dashboard, untuk konteks)
# ================================================
section "🏠" "LAYOUT SHELL"
collect_file "$SRC/app/layout.tsx"
collect_file "$SRC/app/(dashboard)/layout.tsx"

# ================================================
# 📊 RAPOR PAGES (preview & list per kelas)
# ================================================
section "📊" "RAPOR PAGES"
collect_file "$SRC/app/(dashboard)/rapor/page.tsx"
collect_file "$SRC/app/(dashboard)/rapor/[enrollmentId]/page.tsx"

# ================================================
# 🖨️ PRINT / CETAK (clean print layout)
# ================================================
section "🖨️" "PRINT / CETAK"
collect_file "$SRC/app/(print)/layout.tsx"
collect_file "$SRC/app/(print)/cetak/[enrollmentId]/page.tsx"

# ================================================
# 📊 RAPOR COMPONENTS (PDF + viewer + ZIP)
# ================================================
section "📊" "RAPOR COMPONENTS"
collect_file "$SRC/components/features/rapor/index.ts"
collect_file "$SRC/components/features/rapor/rapor-pdf-document.tsx"
collect_file "$SRC/components/features/rapor/rapor-pdf-styles.ts"
collect_file "$SRC/components/features/rapor/rapor-pdf-viewer.tsx"
collect_file "$SRC/components/features/rapor/rapor-kelas-list.tsx"
collect_file "$SRC/components/features/rapor/rapor-kelas-drawer.tsx"
collect_file "$SRC/components/features/rapor/export-zip-dialog.tsx"

# ================================================
# 🎨 LAYOUT (sidebar + nav untuk dashboard rapor)
# ================================================
section "🎨" "LAYOUT COMPONENTS"
collect_file "$SRC/components/layout/index.ts"
collect_file "$SRC/components/layout/app-sidebar.tsx"
collect_file "$SRC/components/layout/mobile-nav.tsx"
collect_file "$SRC/components/layout/nav-config.ts"

# ================================================
# 🧩 PROVIDERS & SHARED
# ================================================
section "🧩" "PROVIDERS & SHARED"
collect_file "$SRC/components/providers/index.ts"
collect_file "$SRC/components/providers/auth-provider.tsx"
collect_file "$SRC/components/providers/query-provider.tsx"
collect_file "$SRC/components/shared/index.ts"
collect_file "$SRC/components/shared/loading-spinner.tsx"

# ================================================
# 🎣 HOOKS (untuk fetch data rapor)
# ================================================
section "🎣" "HOOKS"
collect_file "$SRC/hooks/index.ts"
collect_file "$SRC/hooks/use-auth.ts"
collect_file "$SRC/hooks/use-is-desktop.ts"
collect_file "$SRC/hooks/use-rapor.ts"
collect_file "$SRC/hooks/use-enrollment.ts"
collect_file "$SRC/hooks/use-kelas.ts"
collect_file "$SRC/hooks/use-tahun-pelajaran.ts"
collect_file "$SRC/hooks/use-tanggal-cetak-paket.ts"
collect_file "$SRC/hooks/use-p5-master.ts"

# ================================================
# 📚 LIB - RAPOR SPECIFIC
# ================================================
section "📚" "LIB - RAPOR"
collect_file "$SRC/lib/export-rapor-zip.tsx"
collect_file "$SRC/lib/p5-tree.ts"
collect_file "$SRC/lib/utils.ts"
collect_file "$SRC/lib/query-client.ts"

# ================================================
# 🗄️ SUPABASE LIB (client + server, no admin)
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
echo -e "${BOLD}${GREEN}✅ SELESAI - RAPOR/CETAK COLLECTION${NC}"
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
echo -e "   - app/(dashboard)/penilaian/*      (input nilai)"
echo -e "   - app/(dashboard)/profile/*        (user profile)"
echo -e "   - app/(auth)/*                     (login)"
echo -e "   - app/api/admin/*                  (super_admin)"
echo -e "   - app/api/auth/*                   (auth callback)"
echo -e "   - components/features/admin/*      (admin tabs)"
echo -e "   - components/features/penilaian/*  (input forms)"
echo -e "   - components/features/auth/*       (login form)"
echo -e "   - components/layout/header.tsx     (dashboard chrome)"
echo -e "   - components/layout/user-menu.tsx  (avatar menu)"
echo -e "   - hooks/use-nilai.ts               (input nilai)"
echo -e "   - hooks/use-users.ts               (admin only)"
echo -e "   - hooks/use-mata-pelajaran.ts      (admin)"
echo -e "   - hooks/use-kompetensi.ts          (admin)"
echo -e "   - hooks/use-predikat.ts            (admin)"
echo -e "   - hooks/use-ekskul-preset.ts       (admin)"
echo -e "   - hooks/use-siswa.ts               (admin)"
echo -e "   - hooks/use-satuan-pendidikan.ts   (admin)"
echo -e "   - lib/auth-guard.ts                (admin server)"
echo -e "   - lib/supabase/admin.ts            (service role)"
echo -e "   - lib/quick-fill*.ts               (penilaian)"
echo -e "   - lib/validators.ts                (admin form schemas)"
echo ""