"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const FAVORITES_MAX = 120;

interface FavoritesState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  /** Merge imported ids (dedup + cap). Returns how many were newly added. */
  importIds: (ids: string[]) => number;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id)
            ? s.ids.filter((x) => x !== id)
            : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
      importIds: (incoming) => {
        const valid = incoming.filter(
          (id) => typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id)
        );
        const existing = new Set(get().ids);
        const added: string[] = [];
        for (const id of valid) {
          if (!existing.has(id) && existing.size + added.length < FAVORITES_MAX) {
            added.push(id);
          }
        }
        if (added.length > 0) set({ ids: [...get().ids, ...added] });
        return added.length;
      },
    }),
    {
      name: "cg-favorites",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
