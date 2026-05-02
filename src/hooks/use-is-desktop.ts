// ============================================================
// FILE PATH: src/hooks/use-is-desktop.ts
// ============================================================
// Shared hook untuk detect viewport ≥768px.
//
// Dipakai di komponen yang punya layout responsive berbeda
// (misal: vaul Drawer dengan direction "right" desktop / "bottom" mobile).
//
// Default false saat SSR / initial render → render mobile-first.
// Listener via matchMedia → re-render saat user resize.
// ============================================================

"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = "(min-width: 768px)";

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT);
    const onChange = () => setIsDesktop(mq.matches);
    onChange(); // initial sync
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}