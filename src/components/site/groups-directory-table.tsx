"use client";

import * as React from "react";
import Link from "next/link";
import { Filter, X, Loader2, Heart } from "lucide-react";
import { useGroupsFilter } from "@/lib/store";
import { useAdultModeHydrated } from "@/lib/adult-store";
import type {
  CategoryLiteDTO,
  CountryLiteDTO,
  GroupCardDTO,
} from "@/lib/lite-dto";
import { GroupCard, SkeletonCard } from "@/components/site/group-card";
import { SearchPredictive } from "@/components/site/search-predictive";
import { useFavorites } from "@/lib/favorites";
import { AdultModeToggle } from "@/components/site/adult-toggle";
import { CountryFlag } from "@/components/site/country-flag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  groups: GroupCardDTO[];
  categories: CategoryLiteDTO[];
  countries: CountryLiteDTO[];
  popularTags: { tag: string; count: number }[];
}

const PAGE_SIZE = 30;

// 2026 card redesign (owner): the homepage directory renders the same
// image-top cards as every other listing surface — 2 columns on mobile so
// users scan more groups per scroll, 3–4 columns on larger screens.
const CARD_GRID = "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:gap-3.5";

export function GroupsDirectoryTable({ groups: initialGroups, categories: cleanCategories, countries, popularTags: cleanTags }: Props) {
  const {
    search, categoryId, countryId, sort, tag, favoritesOnly,
    setSearch, setCategory, setCountry, setTag, setSort, setFavoritesOnly, reset,
  } = useGroupsFilter();
  const favoriteIds = useFavorites((s) => s.ids);
  // 18+ mode: when ON the whole directory switches to the adult silo —
  // ONLY adult groups are listed (clean rows hidden), and the filter row
  // swaps to adult categories / adult tags. Adult rows are never in SSR HTML.
  const { enabled: adultMode } = useAdultModeHydrated();

  const [groups, setGroups] = React.useState<GroupCardDTO[]>(initialGroups);
  const [loading, setLoading] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);
  // Skip the redundant initial groups re-fetch when SSR already provided the
  // exact default view (see the fetch effect below).
  const skipInitialRef = React.useRef(true);
  // Adult taxonomies — fetched client-side only when 18+ is active.
  const [adultCategories, setAdultCategories] = React.useState<CategoryLiteDTO[] | null>(null);
  const [adultTags, setAdultTags] = React.useState<{ tag: string; count: number }[] | null>(null);

  // Fetch adult categories + tags for the filter row (client-only, adult silo).
  React.useEffect(() => {
    if (!adultMode) {
      setAdultCategories(null);
      setAdultTags(null);
      return;
    }
    let cancelled = false;
    fetch("/api/categories?adult=only&XTransformPort=3000")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.ok && Array.isArray(j.data)) setAdultCategories(j.data);
      })
      .catch(() => {});
    fetch("/api/tags?adult=only&limite=14&XTransformPort=3000")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.ok && Array.isArray(j.data)) setAdultTags(j.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [adultMode]);

  // Track the silo so a category chosen in one silo never leaks into the other.
  const prevAdultMode = React.useRef(false);
  React.useEffect(() => {
    if (prevAdultMode.current !== adultMode) {
      prevAdultMode.current = adultMode;
      // Silo switch: the active category/tag may not exist in the new silo.
      if (categoryId) useGroupsFilter.getState().setCategory(null);
      if (tag) useGroupsFilter.getState().setTag(null);
    }
  }, [adultMode, categoryId, tag]);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(localSearch), 250);
    return () => clearTimeout(t);
  }, [localSearch, setSearch]);

  React.useEffect(() => {
    let cancelled = false;
    const ctl = new AbortController();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (categoryId) params.set("cat", categoryId);
    if (countryId) params.set("pais", countryId);
    if (tag) params.set("tag", tag);
    if (sort) params.set("orden", sort);
    // 18+ ON → adult silo: ONLY adult groups (clean rows hidden).
    if (adultMode) params.set("adult", "only");
    params.set("limite", String(PAGE_SIZE));

    // First mount on the default view: SSR already rendered exactly this list
    // (sort=recientes, no filters, clean silo) — skip re-downloading the 30
    // groups, fetch ONLY the total count for the pagination footer.
    const isDefaultView =
      !search && !categoryId && !countryId && !tag && sort === "recientes" && !adultMode;
    if (skipInitialRef.current && isDefaultView && initialGroups.length > 0) {
      skipInitialRef.current = false;
      fetch(`/api/groups/count?${params.toString()}&XTransformPort=3000`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((j) => {
          if (!cancelled && j?.ok && typeof j.data === "number") setTotalCount(j.data);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
        ctl.abort();
      };
    }
    skipInitialRef.current = false;

    setLoading(true);
    Promise.all([
      fetch(`/api/groups?${params.toString()}&XTransformPort=3000`, { signal: ctl.signal }).then((r) => r.json()),
      fetch(`/api/groups/count?${params.toString()}&XTransformPort=3000`, { signal: ctl.signal }).then((r) => r.json()).catch(() => null),
    ])
      .then(([json, countJson]) => {
        if (cancelled) return;
        if (json.ok && Array.isArray(json.data)) {
          setGroups(json.data);
          setLimit(PAGE_SIZE);
          if (countJson?.ok && typeof countJson.data === "number") {
            setTotalCount(countJson.data);
          }
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      ctl.abort();
    };
    return () => { cancelled = true; };
  }, [search, categoryId, countryId, tag, sort, adultMode]);

  function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextLimit = limit + PAGE_SIZE;
    setLimit(nextLimit);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (categoryId) params.set("cat", categoryId);
    if (countryId) params.set("pais", countryId);
    if (tag) params.set("tag", tag);
    if (sort) params.set("orden", sort);
    if (adultMode) params.set("adult", "only");
    params.set("limite", String(nextLimit));
    fetch(`/api/groups?${params.toString()}&XTransformPort=3000`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && Array.isArray(json.data)) {
          setGroups(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  const hasMore = totalCount !== null ? groups.length < totalCount : groups.length >= PAGE_SIZE;

  // Client-side favorites filter (localStorage ids).
  const displayedGroups = favoritesOnly
    ? groups.filter((g) => favoriteIds.includes(g.id))
    : groups;

  const hasFilters = Boolean(search || categoryId || countryId || tag || favoritesOnly);
  // Active taxonomies follow the active silo (clean vs adult-only).
  const activeCategories = adultMode ? (adultCategories ?? []) : cleanCategories;
  const activeTags = adultMode ? (adultTags ?? []) : cleanTags;
  const catName = activeCategories.find((c) => c.id === categoryId)?.name;
  const countryName = countries.find((c) => c.id === countryId)?.name;

  return (
    <section id="grupos" className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {adultMode ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                Directorio 18+
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">Solo adultos</span>
              </span>
            ) : (
              "Directorio de grupos de WhatsApp"
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {adultMode ? (
              <span>
                Mostrando <span className="font-semibold text-rose-600 dark:text-rose-400">solo grupos 18+</span>. El resto del directorio está oculto mientras el modo esté activo.
              </span>
            ) : (
              <span>
                Explora las comunidades publicadas en español.{" "}
                Contenido 100% apto para todos.
              </span>
            )}
          </p>
        </div>

        {/* Search + filters bar */}
        <div className="sticky top-16 z-30 -mx-4 border-y bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="flex-1">
              <SearchPredictive
                value={localSearch}
                onChange={setLocalSearch}
                onSubmit={(q) => {
                  if (q) {
                    setLocalSearch(q);
                    setSearch(q);
                  }
                }}
                placeholder="Buscar grupos: fútbol, memes, inglés, emprendimiento…"
                adultParam={adultMode ? "only" : undefined}
                ariaLabel="Buscar grupos"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryId ?? "_all"} onValueChange={(v) => setCategory(v === "_all" ? null : v)}>
                {/* Active-filter state (13-b): tinted trigger so taps leave a visible trace. */}
                <SelectTrigger
                  className={cn(
                    "h-11 w-full sm:w-[170px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    categoryId && "border-primary/40 bg-primary/10 font-medium text-primary"
                  )}
                >
                  <SelectValue placeholder={adultMode ? "Categoría 18+" : "Categoría"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="_all">{adultMode ? "Todas las 18+" : "Todas las categorías"}</SelectItem>
                  {activeCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryId ?? "_all"} onValueChange={(v) => useGroupsFilter.getState().setCountry(v === "_all" ? null : v)}>
                {/* Active-filter state (13-b). */}
                <SelectTrigger
                  className={cn(
                    "h-11 w-full sm:w-[160px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    countryId && "border-primary/40 bg-primary/10 font-medium text-primary"
                  )}
                >
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="_all">Todos los países</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <CountryFlag code={c.code} name={c.name} /> {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => useGroupsFilter.getState().setSort(v as any)}>
                {/* Active-filter state (13-b): non-default sort tints the trigger. */}
                <SelectTrigger
                  className={cn(
                    "h-11 w-full sm:w-[140px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    sort !== "recientes" && "border-primary/40 bg-primary/10 font-medium text-primary"
                  )}
                >
                  <Filter className="mr-1 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="destacados">Destacados</SelectItem>
                  <SelectItem value="populares">Más populares</SelectItem>
                  <SelectItem value="recientes">Más recientes</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="h-11 gap-1" onClick={reset}>
                  <X className="h-4 w-4" /> Limpiar
                </Button>
              )}
              {favoriteIds.length > 0 && (
                <button
                  onClick={() => setFavoritesOnly(!favoritesOnly)}
                  aria-pressed={favoritesOnly}
                  className={cn(
                    "inline-flex h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    favoritesOnly
                      ? "border-rose-400/60 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-background text-muted-foreground hover:bg-accent hover:text-rose-500"
                  )}
                >
                  <Heart className={`h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
                  Solo favoritos
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    favoritesOnly ? "bg-rose-500/20" : "bg-muted"
                  }`}>
                    {favoriteIds.length}
                  </span>
                </button>
              )}
              {/* 18+ mode toggle — controls whether adult rows are fetched */}
              <div className="flex h-11 items-center">
                <AdultModeToggle variant="compact" />
              </div>
            </div>
          </div>

          {/* Popular tags quick chips (clean tags, or adult tags in 18+ mode) */}
          {activeTags.length > 0 && (
            <div className="cg-scroll mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="shrink-0 text-xs text-muted-foreground">Etiquetas:</span>
              {activeTags.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setTag(tag === t.tag ? null : t.tag)}
                  aria-pressed={tag === t.tag}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    tag === t.tag
                      ? adultMode
                        ? "border-rose-400 bg-rose-500 text-white shadow-sm"
                        : "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "bg-background hover:bg-accent"
                  )}
                >
                  #{t.tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Groups grid — image-top cards (2026 redesign) */}
        <div className="mt-6">
          {loading && groups.length === 0 ? (
            <div className={CARD_GRID}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : displayedGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center">
              <p className="font-semibold">
                {favoritesOnly
                  ? "No hay grupos guardados que coincidan"
                  : "No encontramos grupos con esos filtros"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {favoritesOnly
                  ? "Guarda grupos con el corazón ♡ para verlos aquí filtrados."
                  : "Prueba con otra categoría, país o búsqueda."}
              </p>
            </div>
          ) : (
            <div className={CARD_GRID}>
              {displayedGroups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </div>

        {/* Load more button */}
        {hasMore && !loading && groups.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <Button onClick={loadMore} disabled={loadingMore} variant="outline" size="lg" className="gap-2">
              <Loader2 className={`h-4 w-4 animate-spin ${loadingMore ? "inline" : "hidden"}`} />
              <span className={loadingMore ? "inline" : "hidden"}>Cargando…</span>
              <span className={loadingMore ? "hidden" : "inline"}>Cargar más grupos</span>
            </Button>
            {totalCount !== null && (
              <p className="text-xs text-muted-foreground">
                Mostrando {groups.length} de {totalCount} grupos
              </p>
            )}
          </div>
        )}
        {!hasMore && !loading && groups.length > 0 && totalCount !== null && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {groups.length} {groups.length === 1 ? "grupo" : "grupos"} encontrados
          </p>
        )}

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/agregar-grupo">Publica tu grupo en el directorio</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
