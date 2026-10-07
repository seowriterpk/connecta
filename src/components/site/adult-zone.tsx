"use client";

/**
 * AdultZone — client-side 18+ content sections.
 *
 * Directives implemented:
 * - Adult content is NEVER server-rendered. These sections fetch their rows
 *   from the API only after the user's 18+ toggle is active.
 * - When the toggle is off, only an anonymous count hint is shown (no adult
 *   titles/links/text in the DOM).
 * - Age gate is handled by the shared AdultModeToggle dialog.
 */

import * as React from "react";
import { ShieldAlert, Eye, EyeOff, Loader2, Lock, Users } from "lucide-react";
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
// Adult category feed — replaces the server grid on adult category pages
// ---------------------------------------------------------------------------

export function AdultCategoryFeed({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const { enabled } = useAdultModeHydrated();
  const [groups, setGroups] = React.useState<GroupDTO[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [count, setCount] = React.useState<number | null>(null);

  // Anonymous count hint while the toggle is OFF (numbers only, no content).
  React.useEffect(() => {
    if (enabled) return;
    let cancelled = false;
    fetch(`/api/groups/count?cat=${encodeURIComponent(categoryId)}&adult=only&XTransformPort=3000`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.ok && typeof j.data === "number") setCount(j.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [categoryId, enabled]);

  // Fetch adult groups ONLY when the toggle is ON.
  React.useEffect(() => {
    if (!enabled) {
      setGroups(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/groups?cat=${encodeURIComponent(categoryId)}&adult=only&limite=48&XTransformPort=3000`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.ok && Array.isArray(j.data)) setGroups(j.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [categoryId, enabled]);

  const [ratings, setRatings] = React.useState<Record<string, { avg: number; count: number }>>({});
  React.useEffect(() => {
    if (!groups || groups.length === 0) return;
    const ids = groups.map((g) => g.id).join(",");
    fetch(`/api/groups/ratings-batch?ids=${encodeURIComponent(ids)}&XTransformPort=3000`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setRatings(j.data ?? {});
      })
      .catch(() => {});
  }, [groups]);

  return (
    <AdultZoneShell
      title={`Grupos 18+ de ${categoryName}`}
      subtitle="Contenido para adultos, separado del directorio general. Solo se carga si el modo 18+ está activo."
      icon={<Lock className="h-4.5 w-4.5" />}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!enabled ? (
          <motion.div
            key="gate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-rose-400/40 bg-background/60 px-6 py-12 text-center"
          >
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/10">
              <EyeOff className="h-8 w-8 text-rose-500/70" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Contenido bloqueado</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {count !== null && count > 0 ? (
                  <>
                    Hay {count} {count === 1 ? "grupo" : "grupos"} para adultos en esta categoría.
                    Activa el modo 18+ para verlos.
                  </>
                ) : (
                  "Activa el modo 18+ para ver el contenido de esta categoría."
                )}
              </p>
            </div>
            <AdultModeToggle variant="hero" />
            <p className="text-[11px] text-muted-foreground/80">
              Al activarlo confirmas que tienes 18 años o más. La preferencia se guarda en tu navegador.
            </p>
          </motion.div>
        ) : loading || groups === null ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl border bg-muted/30" />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando contenido 18+…
            </div>
          </motion.div>
        ) : groups.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed py-12 text-center"
          >
            <p className="font-semibold">Aún no hay grupos en esta zona</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Los grupos que se publiquen aquí aparecerán únicamente con el modo 18+ activo.
            </p>
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} rating={ratings[g.id] ?? null} />
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-rose-500/70" />
              {groups.length} {groups.length === 1 ? "grupo" : "grupos"} para adultos · este contenido no aparece en
              el directorio general
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AdultZoneShell>
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
