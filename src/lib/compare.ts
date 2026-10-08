"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompareState {
  /** Slugs of the groups currently selected for comparison (max 3, slot order). */
  slugs: string[];
  add: (slug: string) => void;
  remove: (slug: string) => void;
  setAll: (slugs: string[]) => void;
  clearAll: () => void;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const MAX_COMPARE = 3;

export const useCompare = create<CompareState>()(
  persist(
    (set) => ({
      slugs: [],
      add: (slug) =>
        set((s) =>
          s.slugs.includes(slug) || s.slugs.length >= MAX_COMPARE
            ? s
            : { slugs: [...s.slugs, slug] }
        ),
      remove: (slug) => set((s) => ({ slugs: s.slugs.filter((x) => x !== slug) })),
      setAll: (slugs) =>
        set({ slugs: Array.from(new Set(slugs)).filter(Boolean).slice(0, MAX_COMPARE) }),
      clearAll: () => set({ slugs: [] }),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "cg-compare",
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);
