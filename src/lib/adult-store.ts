"use client";

/**
 * Adult Mode Store (18+ toggle) — global, persisted in localStorage.
 *
 * Rules (production directive "Strict Adult Content Separation"):
 * - Default OFF: every general-audience page (homepage, country, category,
 *   city, tag, populars) renders 100% CLEAN content on the SERVER, unless
 *   18+ mode is confirmed server-side via the cookie bridge below.
 * - Cookie bridge: localStorage is invisible to the server, so the client
 *   mirrors the preference into the `gh_adult` cookie (1 year, samesite=lax).
 *   Server components (e.g. /ciudad pages) read that cookie and only then
 *   include adult groups in the server-rendered HTML (those pages go
 *   noindex, follow). Crawlers never send the cookie → always clean.
 * - Preference persists in localStorage ("cg-adult-18") across refreshes
 *   and navigation.
 * - Personal pages (favoritos, recientes, búsqueda, comparar, listas
 *   compartidas) may display adult content regardless of the toggle —
 *   those pages are personal/noindex and exempt from the clean-default rule.
 */

import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ADULT_STORAGE_KEY = "cg-adult-18";

/** Server-side mirror of the 18+ preference (read by server components). */
export const ADULT_COOKIE_NAME = "gh_adult";

/**
 * Cookie bridge — keep the `gh_adult` cookie in sync with the store so
 * SERVER-rendered pages can gate adult content at the query level.
 * SSR-safe: no-op when `document` is not available.
 */
export function syncAdultCookie(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = enabled
    ? `${ADULT_COOKIE_NAME}=1; path=/; max-age=31536000; samesite=lax`
    : `${ADULT_COOKIE_NAME}=1; path=/; max-age=0`;
}

interface AdultModeState {
  /** 18+ mode active — client fetches and the `gh_adult` cookie include 18+ content. */
  enabled: boolean;
  /** User confirmed being 18+ at least once (age gate). */
  ageConfirmed: boolean;
  /** Enable (age confirmation already on file). */
  enable: () => void;
  disable: () => void;
  /** Toggle with guard: enabling without confirmation is rejected. */
  requestToggle: () => void;
  /** Age-gate confirmation — enables and remembers. */
  confirmAge: () => void;
}

export const useAdultMode = create<AdultModeState>()(
  persist(
    (set, get) => ({
      enabled: false,
      ageConfirmed: false,
      enable: () => {
        set({ enabled: true });
        syncAdultCookie(true);
      },
      disable: () => {
        set({ enabled: false });
        syncAdultCookie(false);
      },
      requestToggle: () => {
        const s = get();
        if (!s.enabled && !s.ageConfirmed) {
          // The age-gate dialog handles this case (see adult-toggle.tsx);
          // store-level we simply refuse the silent flip.
          return;
        }
        const next = !s.enabled;
        set({ enabled: next });
        syncAdultCookie(next);
      },
      confirmAge: () => {
        set({ enabled: true, ageConfirmed: true });
        syncAdultCookie(true);
      },
    }),
    {
      name: ADULT_STORAGE_KEY,
      version: 1,
      // Users who confirmed 18+ before the cookie bridge existed: mirror the
      // rehydrated preference into the cookie so server-rendered listings
      // (city pages) keep honoring it on the next navigation.
      onRehydrateStorage: () => (state) => {
        if (state?.enabled) syncAdultCookie(true);
      },
    }
  )
);

/**
 * Hydration-safe hook: SSR and first client paint always see `false` (clean),
 * then the persisted value applies after mount. This guarantees adult
 * content never renders before the post-mount client fetch.
 */
export function useAdultModeHydrated(): { enabled: boolean; ready: boolean } {
  const enabled = useAdultMode((s) => s.enabled);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  return { enabled: ready && enabled, ready };
}
