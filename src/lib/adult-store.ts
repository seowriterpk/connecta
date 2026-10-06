"use client";

/**
 * Adult Mode Store (18+ toggle) — global, persisted in localStorage.
 *
 * Rules (production directive "Strict Adult Content Separation"):
 * - Default OFF: every indexing page (homepage, country, category, city, tag,
 *   populars) loads 100% CLEAN content on the first request.
 * - Adult content is never present in the server-rendered HTML DOM. It is
 *   only fetched from the API *after* the user explicitly enables 18+ mode.
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

interface AdultModeState {
  /** 18+ mode active — client fetches may include adult content. */
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
      enable: () => set({ enabled: true }),
      disable: () => set({ enabled: false }),
      requestToggle: () => {
        const s = get();
        if (!s.enabled && !s.ageConfirmed) {
          // The age-gate dialog handles this case (see adult-toggle.tsx);
          // store-level we simply refuse the silent flip.
          return;
        }
        set({ enabled: !s.enabled });
      },
      confirmAge: () => set({ enabled: true, ageConfirmed: true }),
    }),
    {
      name: ADULT_STORAGE_KEY,
      version: 1,
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
