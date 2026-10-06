"use client";

import { create } from "zustand";

export type SortOption = "recientes" | "populares" | "miembros" | "destacados";

interface GroupsFilterState {
  search: string;
  categoryId: string | null;
  countryId: string | null;
  region: string | null;
  tag: string | null;
  sort: SortOption;
  favoritesOnly: boolean;
  setSearch: (v: string) => void;
  setCategory: (id: string | null) => void;
  setCountry: (id: string | null) => void;
  setRegion: (r: string | null) => void;
  setTag: (t: string | null) => void;
  setSort: (s: SortOption) => void;
  setFavoritesOnly: (v: boolean) => void;
  reset: () => void;
}

export const useGroupsFilter = create<GroupsFilterState>((set) => ({
  search: "",
  categoryId: null,
  countryId: null,
  region: null,
  tag: null,
  sort: "recientes",
  favoritesOnly: false,
  setSearch: (v) => set({ search: v }),
  setCategory: (id) => set({ categoryId: id, countryId: null }),
  setCountry: (id) => set({ countryId: id }),
  setRegion: (r) => set({ region: r, countryId: null }),
  setTag: (t) => set({ tag: t }),
  setSort: (s) => set({ sort: s }),
  setFavoritesOnly: (v) => set({ favoritesOnly: v }),
  reset: () =>
    set({
      search: "",
      categoryId: null,
      countryId: null,
      region: null,
      tag: null,
      sort: "recientes",
      favoritesOnly: false,
    }),
}));
