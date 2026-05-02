"use client";

import Link from "next/link";
import Image from "next/image";
import { UserMenu } from "./user-menu";
import { ROUTES } from "@/constants";

/**
 * Header — dipakai di dashboard layout.
 * UserMenu dirender di sini, bukan inline di layout.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      <Link href={ROUTES.PROFILE} className="flex items-center gap-2">
        <div className="relative w-8 h-8">
          <Image
            src="/icon/icon-96x96.png"
            alt="E-Raport PKBM"
            fill
            className="object-contain"
          />
        </div>
        <span className="font-semibold text-sm md:text-base">E-Raport PKBM</span>
      </Link>

      <div className="flex-1" />

      <UserMenu />
    </header>
  );
}