"use client";

/**
 * AdultZone — client-side 18+ content section for country pages.
 *
 * Directives implemented:
 * - Adult content is NEVER server-rendered. The zone fetches its rows
 *   from the API only after the user's 18+ toggle is active.
 * - When the toggle is off, only an anonymous count hint is shown (no adult
 *   titles/links/text in the DOM).
 * - Age gate is handled by the shared AdultModeToggle dialog.
 * - Category pages no longer use a zone: adult categories load their groups
 *   directly via CategoryGroupsFeed (client AJAX, no toggle).
 */

import * as React from "react";
import { ShieldAlert, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdultModeHydrated, useAdultMode } from "@/lib/adult-store";
import { AdultModeToggle } from "@/components/site/adult-toggle";
import { GroupCard } from "@/components/site/group-card";
import type { GroupDTO } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared shell — rose-tinted 18+ section frame
// ---------------------------------------------------------------------------

function AdultZoneShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="adult-zone-heading"
      className="rounded-3xl border border-rose-500/25 bg-gradient-to-b from-rose-500/[0.06] to-transparent p-5 sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="adult-zone-heading"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight sm:text-xl"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              {icon ?? <ShieldAlert className="h-5 w-5" />}
            </span>
            <span>{title}</span>
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              18+
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <AdultModeToggle variant="compact" />
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Adult country zone — appended to country pages
// ---------------------------------------------------------------------------

export function AdultCountryZone({ countryId, countryName }: { countryId: string; countryName: string }) {
  const { enabled } = useAdultModeHydrated();
  const [groups, setGroups] = React.useState<GroupDTO[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (enabled) return;
    let cancelled = false;
    fetch(`/api/groups/count?pais=${encodeURIComponent(countryId)}&adult=only&XTransformPort=3000`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.ok && typeof j.data === "number") setCount(j.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [countryId, enabled]);

  React.useEffect(() => {
    if (!enabled) {
      setGroups(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/groups?pais=${encodeURIComponent(countryId)}&adult=only&limite=24&XTransformPort=3000`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.ok && Array.isArray(j.data)) setGroups(j.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [countryId, enabled]);

  // No hint and no zone when there is nothing to show.
  if (!enabled && (count === null || count === 0)) return null;

  return (
    <AdultZoneShell
      title={`Zona 18+ · ${countryName}`}
      subtitle="Grupos para adultos de esta región, visibles solo con el modo 18+ activo."
    >
      <AnimatePresence mode="wait" initial={false}>
        {!enabled ? (
          <motion.button
            key="hint"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => useAdultMode.getState().enable()}
            className="group flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-400/35 bg-background/70 px-5 py-4 text-left transition hover:border-rose-400/60 hover:bg-rose-500/[0.04]"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Lock className="h-5 w-5" />
              </span>
              <span className="text-sm">
                <span className="font-semibold">
                  {count} {count === 1 ? "grupo 18+ disponible" : "grupos 18+ disponibles"} en {countryName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Pulsa para desbloquear (se te pedirá confirmación de edad)
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition group-hover:bg-rose-500/20">
              <Eye className="h-3.5 w-3.5" /> Mostrar
            </span>
          </motion.button>
        ) : loading || groups === null ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border bg-muted/30" />
            ))}
          </motion.div>
        ) : groups.length === 0 ? (
          <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center text-sm text-muted-foreground">
            No hay grupos 18+ en {countryName} por ahora.
          </motion.p>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </AdultZoneShell>
  );
}
