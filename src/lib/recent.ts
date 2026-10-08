"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GroupDTO } from "@/lib/types";

interface RecentState {
  items: GroupDTO[]; // most recent first
  push: (g: GroupDTO) => void;
  clear: () => void;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

const MAX_RECENT = 8;

export const useRecent = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      push: (g) =>
        set((s) => {
          const filtered = s.items.filter((x) => x.id !== g.id);
          // Store a slim snapshot to avoid bloat
          const slim: GroupDTO = {
            ...g,
            description: g.description.slice(0, 160),
            tags: g.tags.slice(0, 4),
          };
          return { items: [slim, ...filtered].slice(0, MAX_RECENT) };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "cg-recent",
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);
