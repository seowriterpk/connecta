"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useFavorites, FAVORITES_MAX } from "@/lib/favorites";

/**
 * FavoriteToggleAction — labeled pill toggle for listing-card dropdowns
 * (group cards + directory rows). The old surface-level heart icon was moved
 * INSIDE the dropdown (owner directive: it squeezed group titles on small
 * screens); this is its labeled replacement.
 */
export function FavoriteToggleAction({ id }: { id: string }) {
  const toggle = useFavorites((s) => s.toggle);
  const has = useFavorites((s) => s.ids.includes(id));

  return (
    <motion.button
      type="button"
      aria-pressed={has}
      aria-label={has ? "Quitar de favoritos" : "Añadir a favoritos"}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(id);
      }}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        has
          ? "border-rose-400/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
          : "border-border bg-background text-muted-foreground hover:border-rose-400/40 hover:bg-rose-500/5 hover:text-rose-600 dark:hover:text-rose-400"
      }`}
    >
      <Heart className={`h-3.5 w-3.5 ${has ? "fill-current" : ""}`} aria-hidden />
      {has ? "En favoritos" : "Me gusta"}
    </motion.button>
  );
}

/**
 * FavoritePillButton — heart toggle for the group detail sticky bar.
 *
 * - Mirrors ComparePillButton's pill design (rose accent = favorites system).
 * - Hydration-safe: renders the OFF state on server/first paint, syncs after
 *   mount via the `hydrated` gate in the favorites store.
 * - Full-state (FAVORITES_MAX reached) is visually disabled + no-ops.
 */
export function FavoritePillButton({ id }: { id: string }) {
  const hydrated = useFavorites((s) => s.hydrated);
  const ids = useFavorites((s) => s.ids);
  const toggle = useFavorites((s) => s.toggle);

  const has = hydrated && ids.includes(id);
  const full = !has && hydrated && ids.length >= FAVORITES_MAX;

  return (
    <motion.button
      aria-label={has ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={has}
      aria-disabled={full}
      onClick={() => {
        if (!full) toggle(id);
      }}
      whileTap={full ? undefined : { scale: 0.96 }}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition-all duration-200 sm:min-h-9 sm:px-3.5 ${
        has
          ? "border-rose-500/40 bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/30 hover:bg-rose-500/15 dark:text-rose-300"
          : full
          ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground/50"
          : "border-border bg-background text-foreground hover:border-rose-500/50 hover:bg-rose-500/5 hover:text-rose-600 dark:hover:text-rose-300"
      }`}
    >
      <Heart className={`h-3.5 w-3.5 ${has ? "fill-current" : ""}`} />
      <span className="hidden sm:inline">{has ? "En favoritos" : "Favorito"}</span>
      {has && ids.length > 1 && (
        <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-rose-600 dark:text-rose-300">
          {ids.length}
        </span>
      )}
    </motion.button>
  );
}
