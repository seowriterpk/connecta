"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GroupDTO } from "@/lib/types";
import { toGroupCardDTO, type GroupCardDTO } from "@/lib/lite-dto";

interface RecentState {
  items: GroupCardDTO[]; // most recent first
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
      setHydrated: (v: boolean) => set({ hydrated: v }),
      push: (g) =>
        set((s) => {
          const filtered = s.items.filter((x) => x.id !== g.id);
          // Store a slim snapshot (SEO directive, owner: the group
          // description is rendered ONLY on /grupo/[slug] — it must not be
          // persisted, shipped or shown anywhere else). toGroupCardDTO maps
          // the visited group down to the card-lite shape.
          const slim = toGroupCardDTO(g);
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
