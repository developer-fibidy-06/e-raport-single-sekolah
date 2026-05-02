// ============================================================
// FILE PATH: src/app/(dashboard)/admin/page.tsx
// ============================================================
// REPLACE. Perubahan dari versi sebelumnya:
//
//   HAPUS active tab indicator (breadcrumb 2-line di bawah nav).
//   Konsekuensi: setelah pilih tab dari dropdown, langsung render
//   konten tab tanpa "header context" tambahan.
//
//   - findTab() helper dihapus karena gak dipakai lagi
//   - activeTab variable dihapus
//   - Block JSX breadcrumb dihapus
//
//   Top-level icon-only nav, dropdown items, dan tab routing TIDAK
//   BERUBAH.
// ============================================================

"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores";
import {
  TabProfilPkbm,
  TabTahunKelas,
  TabSiswa,
  TabMataPelajaran,
  TabP5Master,
  TabPredikat,
  TabEkskulPreset,
  TabUsers,
} from "@/components/features/admin";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  Building2,
  CalendarRange,
  Users,
  BookOpen,
  Sparkles,
  Award,
  Medal,
  UsersRound,
  Database,
  GraduationCap,
  Settings,
  type LucideIcon,
} from "lucide-react";

type TabKey =
  | "profil"
  | "tahun-kelas"
  | "siswa"
  | "mapel"
  | "p5-master"
  | "predikat"
  | "ekskul-preset"
  | "users";

type TabDef = {
  key: TabKey;
  label: string;
  desc: string;
  icon: LucideIcon;
};

const MASTER_DATA_TABS: TabDef[] = [
  {
    key: "profil",
    label: "Profil PKBM",
    desc: "Identitas lembaga, alamat, kontak",
    icon: Building2,
  },
  {
    key: "tahun-kelas",
    label: "Tahun & Kelas",
    desc: "Tahun pelajaran, rombongan belajar, enrollment",
    icon: CalendarRange,
  },
  {
    key: "siswa",
    label: "Siswa",
    desc: "Master data peserta didik",
    icon: Users,
  },
];

const AKADEMIK_TABS: TabDef[] = [
  {
    key: "mapel",
    label: "Mata Pelajaran",
    desc: "Mapel per paket + kompetensi dasar",
    icon: BookOpen,
  },
  {
    key: "p5-master",
    label: "Profil Pancasila",
    desc: "6 dimensi → elemen → sub-elemen",
    icon: Sparkles,
  },
  {
    key: "predikat",
    label: "Predikat",
    desc: "Range nilai untuk konversi A/B/C/D",
    icon: Award,
  },
  {
    key: "ekskul-preset",
    label: "Preset Ekskul",
    desc: "Daftar ekskul global per gender",
    icon: Medal,
  },
];

const SISTEM_TABS: TabDef[] = [
  {
    key: "users",
    label: "Users",
    desc: "Kelola akun pengguna sistem",
    icon: UsersRound,
  },
];

export default function AdminPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [active, setActive] = useState<TabKey>("profil");

  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "#";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-2">
      {/* NavigationMenu — icon-only triggers */}
      <div className="border-b pb-2">
        <NavigationMenu>
          <NavigationMenuList>
            {/* Master Data */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                title="Master Data"
                aria-label="Master Data"
                className="px-3"
              >
                <Database className="h-4 w-4" />
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-[280px] p-1.5">
                  {MASTER_DATA_TABS.map((tab) => (
                    <DropdownItem
                      key={tab.key}
                      tab={tab}
                      isActive={active === tab.key}
                      onSelect={() => setActive(tab.key)}
                    />
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Akademik */}
            <NavigationMenuItem>
              <NavigationMenuTrigger
                title="Akademik"
                aria-label="Akademik"
                className="px-3"
              >
                <GraduationCap className="h-4 w-4" />
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-[280px] p-1.5">
                  {AKADEMIK_TABS.map((tab) => (
                    <DropdownItem
                      key={tab.key}
                      tab={tab}
                      isActive={active === tab.key}
                      onSelect={() => setActive(tab.key)}
                    />
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Sistem — super_admin only */}
            {isAdmin && (
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  title="Sistem"
                  aria-label="Sistem"
                  className="px-3"
                >
                  <Settings className="h-4 w-4" />
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-[280px] p-1.5">
                    {SISTEM_TABS.map((tab) => (
                      <DropdownItem
                        key={tab.key}
                        tab={tab}
                        isActive={active === tab.key}
                        onSelect={() => setActive(tab.key)}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            {/* Docs */}
            <NavigationMenuItem>
              <NavigationMenuLink
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Docs"
                aria-label="Docs"
                className={cn(navigationMenuTriggerStyle(), "px-3")}
              >
                <BookOpen className="h-4 w-4" />
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Content — langsung render tab tanpa breadcrumb */}
      <main className="min-w-0">
        {active === "profil" && <TabProfilPkbm />}
        {active === "tahun-kelas" && <TabTahunKelas />}
        {active === "siswa" && <TabSiswa />}
        {active === "mapel" && <TabMataPelajaran />}
        {active === "p5-master" && <TabP5Master />}
        {active === "predikat" && <TabPredikat />}
        {active === "ekskul-preset" && <TabEkskulPreset />}
        {active === "users" && <TabUsers />}
      </main>
    </div>
  );
}

// ─── Dropdown item — compact ────────────────────────────────
function DropdownItem({
  tab,
  isActive,
  onSelect,
}: {
  tab: TabDef;
  isActive: boolean;
  onSelect: () => void;
}) {
  const Icon = tab.icon;
  return (
    <li>
      <NavigationMenuLink asChild>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "flex w-full select-none flex-col gap-0.5 rounded-md p-2 text-left leading-none no-underline outline-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:bg-accent focus:text-accent-foreground",
            isActive && "bg-accent/60 text-accent-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "h-3.5 w-3.5 flex-shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="text-sm font-medium">{tab.label}</span>
          </div>
          <p className="line-clamp-1 pl-[22px] text-xs text-muted-foreground">
            {tab.desc}
          </p>
        </button>
      </NavigationMenuLink>
    </li>
  );
}