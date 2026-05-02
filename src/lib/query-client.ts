"use client";

import { QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data dianggap fresh selama 30 detik
        staleTime: 30 * 1000,
        // Retry 1x saja kalau error (default 3x terlalu agresif untuk Supabase)
        retry: 1,
        // Refetch on window focus — matiin biar ga ganggu pas user lagi ngetik nilai
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Singleton pattern:
 * - Server: buat instance baru tiap request (hindari shared state antar user)
 * - Browser: pakai satu instance yang sama selama sesi
 */
export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}
