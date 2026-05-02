// ============================================================
// FILE PATH: src/components/layout/nav-config.ts
// ============================================================
// REPLACE. Restore item "Rapor" sebagai ARCHIVE entry point.
//
// Role separation (revisi vision):
//   /penilaian  = EDIT MODE (input nilai, action publish/cetak/download)
//   /rapor      = ARCHIVE MODE (read-only, browse per kelas, download ZIP)
//
// Mereka bukan duplikat — beda lens terhadap data yang sama.
//
// Icon `Archive` dipakai untuk Rapor supaya visually beda dari `ClipboardList`
// di Penilaian.
// ============================================================

import {
  ClipboardList,
  Archive,
  User,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const mainNavItems: NavItem[] = [
  {
    title: "Penilaian",
    href: ROUTES.PENILAIAN,
    icon: ClipboardList,
  },
  {
    title: "Rapor",
    href: ROUTES.RAPOR,
    icon: Archive,
  },
  {
    title: "Profil",
    href: ROUTES.PROFILE,
    icon: User,
  },
];

export const adminNavItems: NavItem[] = [
  {
    title: "Admin",
    href: ROUTES.ADMIN,
    icon: ShieldCheck,
    adminOnly: true,
  },
];

export function getNavItems(isAdmin: boolean): NavSection[] {
  if (isAdmin) {
    return [
      {
        title: "Menu",
        items: mainNavItems,
      },
      {
        title: "Administrasi",
        items: adminNavItems,
      },
    ];
  }

  return [
    {
      items: mainNavItems,
    },
  ];
}

export function getAllNavItems(isAdmin: boolean): NavItem[] {
  if (isAdmin) {
    return [...mainNavItems, ...adminNavItems];
  }
  return mainNavItems;
}