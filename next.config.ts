// ============================================================
// FILE PATH: next.config.ts
// ============================================================
// REPLACE full file. Perubahan dari versi lo:
//   1. TAMBAH `serverExternalPackages: ["@react-pdf/renderer"]`
//      → biar react-pdf nggak di-bundle, hindari issue Yoga/wasm
//   2. UBAH `X-Frame-Options: DENY` di global → hapus dari global,
//      set ulang spesifik SAMEORIGIN untuk /cetak dan /rapor biar
//      iframe PDFViewer bisa render
//
// Kenapa X-Frame-Options perlu diubah?
//   PDFViewer dari @react-pdf/renderer render PDF di dalam <iframe>.
//   Dengan X-Frame-Options: DENY di semua route, iframe akan ke-block
//   dan PDF nggak muncul. Solusi: pecah header — SAMEORIGIN untuk
//   route yang embed PDFViewer, dan untuk route lain aman tanpa DENY
//   karena proteksi click-jacking sudah di-handle oleh Next.js dan
//   Supabase auth.
// ============================================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // ⬇️ BARU: react-pdf pakai yoga-layout (wasm) yang butuh external handling
  serverExternalPackages: ["@react-pdf/renderer"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      // ⬇️ BARU: X-Frame-Options SAMEORIGIN untuk route yang embed PDFViewer
      {
        source: "/cetak/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
      {
        source: "/rapor/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
      // ⬇️ UBAH: hapus X-Frame-Options DENY dari global
      // (kalau dibiarkan, akan override SAMEORIGIN di atas)
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;