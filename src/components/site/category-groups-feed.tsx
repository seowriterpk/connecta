"use client";

/**
 * CategoryGroupsFeed — the category page groups feed.
 *
 * Design goals (SEO + UX directive):
 * - CLEAN categories: first batch is server-rendered (crawlable HTML, fast
 *   first paint). Filter changes and deeper pages load via AJAX.
 * - ADULT categories: NO toggle, NO age-gate UI — the groups load directly
 *   via client-side AJAX (never server-rendered, so Googlebot / SafeSearch
 *   never see adult rows in the HTML source).
 * - Filters: a compact "Populares | Nuevos" row on top (one row, mobile 390px).
 * - Load-more AJAX pagination with offset ("Cargar más").
 * - One canonical URL per category: filter state is client-only (URL untouched),
 *   so crawlers always see the same clean, canonical page.
 */

import * as React from "react";
import { Loader2, Sparkles, Clock, Plus, Eye } from "lucide-react";
import { GroupCard } from "@/components/site/group-card";
import { Button } from "@/components/ui/button";
import type { GroupDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "populares" | "recientes";

const SORTS: { key: SortKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "populares", label: "Populares", icon: Sparkles },
  { key: "recientes", label: "Nuevos", icon: Clock },
];

const BATCH = 24;

interface Props {
  categoryId: string;
  isAdult: boolean;
  initialGroups: GroupDTO[];
  initialTotal: number;
  initialRatings?: Record<string, { avg: number; count: number }>;
}

export function CategoryGroupsFeed({
  categoryId,
  isAdult,
  initialGroups,
  initialTotal,
  initialRatings = {},
}: Props) {
  const [sort, setSort] = React.useState<SortKey>("populares");
  const [groups, setGroups] = React.useState<GroupDTO[]>(initialGroups);
  const [total, setTotal] = React.useState<number>(initialTotal);
  const [ratings, setRatings] = React.useState<Record<string, { avg: number; count: number }>>(initialRatings);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  // True while the initial fetch for an adult category is in flight (nothing
  // server-rendered there, so a skeleton is shown for a few ms).
  const bootstrapping = isAdult && groups.length === 0 && loading;

  // Build API query params for the current feed (silo + sort + offset).
  const apiParams = (orden: SortKey, desde: number) => {
    const params = new URLSearchParams();
    params.set("cat", categoryId);
    params.set("orden", orden);
    params.set("limite", String(BATCH));
    params.set("desde", String(desde));
    if (isAdult) params.set("adult", "only");
    return params;
  };

  const fetchRatings = React.useCallback((list: GroupDTO[]) => {
    if (list.length === 0) return;
    const ids = list.map((g) => g.id).join(",");
    fetch(`/api/groups/ratings-batch?ids=${encodeURIComponent(ids)}&XTransformPort=3000`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j.data) setRatings((prev) => ({ ...prev, ...j.data }));
      })
      .catch(() => {});
  }, []);

  // Adult categories: fetch the first batch on mount (client-only).
  React.useEffect(() => {
    if (!isAdult) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/groups?${apiParams("populares", 0).toString()}&XTransformPort=3000`).then((r) => r.json()),
      fetch(`/api/groups/count?cat=${encodeURIComponent(categoryId)}&adult=only&XTransformPort=3000`)
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([json, countJson]) => {
        if (cancelled) return;
        if (json?.ok && Array.isArray(json.data)) {
          setGroups(json.data);
          fetchRatings(json.data);
        }
        if (countJson?.ok && typeof countJson.data === "number") setTotal(countJson.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isAdult, categoryId, fetchRatings]);

  // Filter change → refetch the first batch (clean categories only; the adult
  // bootstrap above already handles its own initial load).
  function onSortChange(next: SortKey) {
    if (next === sort || loading || loadingMore) return;
    setSort(next);
    setLoading(true);
    fetch(`/api/groups?${apiParams(next, 0).toString()}&XTransformPort=3000`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok && Array.isArray(json.data)) {
          setGroups(json.data);
          fetchRatings(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function loadMore() {
    if (loadingMore || loading) return;
    setLoadingMore(true);
    fetch(`/api/groups?${apiParams(sort, groups.length).toString()}&XTransformPort=3000`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.ok && Array.isArray(json.data)) {
          const fresh = json.data.filter((g: GroupDTO) => !groups.some((x) => x.id === g.id));
          setGroups((prev) => [...prev, ...fresh]);
          if (fresh.length > 0) fetchRatings(fresh);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  const hasMore = groups.length < total;
  const showSkeleton = bootstrapping || (loading && groups.length === 0);

  return (
    <div>
      {/* Filters row — compact, one row, mobile-first (390px) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Ordenar grupos"
          className="inline-flex rounded-full border bg-muted/40 p-0.5"
        >
          {SORTS.map((s) => {
            const active = sort === s.key;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={active}
                onClick={() => onSortChange(s.key)}
                disabled={loading || loadingMore}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition sm:h-10 sm:px-4 sm:text-sm",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  (loading || loadingMore) && "cursor-not-allowed opacity-60"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "")} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground" aria-live="polite">
          {isAdult && (
            <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-600 dark:text-rose-400">
              <Eye className="h-3 w-3" /> 18+
            </span>
          )}
          {loading
            ? "Actualizando…"
            : total > 0
            ? `${groups.length} de ${total} ${total === 1 ? "grupo" : "grupos"}`
            : ""}
        </p>
      </div>

      {/* Groups grid */}
      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border bg-muted/30" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-12 text-center">
          <p className="font-semibold">{isAdult ? "Aún no hay grupos 18+ aquí" : "Aún no hay grupos"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdult
              ? "Los grupos que se publiquen en esta categoría aparecerán aquí."
              : "Vuelve pronto o envía el primero con el botón de arriba."}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            loading && "opacity-60"
          )}
        >
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} rating={ratings[g.id] ?? null} />
          ))}
        </div>
      )}

      {/* Load more — AJAX offset pagination */}
      {hasMore && !showSkeleton && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button onClick={loadMore} disabled={loadingMore || loading} variant="outline" size="lg" className="gap-2">
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Cargar más grupos
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Mostrando {groups.length} de {total} grupos
          </p>
        </div>
      )}
    </div>
  );
}
