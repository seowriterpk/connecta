"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Users, Eye, BadgeCheck, MapPin, Flame, ArrowRight, Filter, X, Loader2, Heart, Star, TrendingUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useGroupsFilter } from "@/lib/store";
import { useAdultModeHydrated } from "@/lib/adult-store";
import type { CategoryDTO, CountryDTO, GroupDTO } from "@/lib/types";
import { GroupImage } from "@/components/site/group-image";
import { useFavorites } from "@/lib/favorites";
import { CompareIconButton } from "@/components/site/compare-button";
import { AdultModeToggle } from "@/components/site/adult-toggle";
import { CountryFlag } from "@/components/site/country-flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  groups: GroupDTO[];
  categories: CategoryDTO[];
  countries: CountryDTO[];
  popularTags: { tag: string; count: number }[];
}

const PAGE_SIZE = 30;

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${n}`;
}

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

  const [groups, setGroups] = React.useState<GroupDTO[]>(initialGroups);
  const [loading, setLoading] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);
  // Adult taxonomies — fetched client-side only when 18+ is active.
  const [adultCategories, setAdultCategories] = React.useState<CategoryDTO[] | null>(null);
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
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (categoryId) params.set("cat", categoryId);
    if (countryId) params.set("pais", countryId);
    if (tag) params.set("tag", tag);
    if (sort) params.set("orden", sort);
    // 18+ ON → adult silo: ONLY adult groups (clean rows hidden).
    if (adultMode) params.set("adult", "only");
    params.set("limite", String(PAGE_SIZE));

    setLoading(true);
    Promise.all([
      fetch(`/api/groups?${params.toString()}&XTransformPort=3000`).then((r) => r.json()),
      fetch(`/api/groups/count?${params.toString()}&XTransformPort=3000`).then((r) => r.json()).catch(() => null),
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
                Explora {groups.length}+ comunidades activas en español.{" "}
                Contenido 100% apto para todos.
              </span>
            )}
          </p>
        </div>

        {/* Search + filters bar */}
        <div className="sticky top-16 z-30 -mx-4 border-y bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Buscar grupos: fútbol, memes, inglés, emprendimiento…"
                className="h-11 pl-10"
                aria-label="Buscar grupos"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryId ?? "_all"} onValueChange={(v) => setCategory(v === "_all" ? null : v)}>
                <SelectTrigger className="h-11 w-full sm:w-[170px]">
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
                <SelectTrigger className="h-11 w-full sm:w-[160px]">
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
                <SelectTrigger className="h-11 w-full sm:w-[140px]">
                  <Filter className="mr-1 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="destacados">Destacados</SelectItem>
                  <SelectItem value="populares">Más populares</SelectItem>
                  <SelectItem value="miembros">Más miembros</SelectItem>
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
                  className={`inline-flex h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition ${
                    favoritesOnly
                      ? "border-rose-400/60 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-background text-muted-foreground hover:bg-accent hover:text-rose-500"
                  }`}
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
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                    tag === t.tag
                      ? adultMode
                        ? "border-rose-400 bg-rose-500 text-white"
                        : "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  #{t.tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Groups rows */}
        <div className="mt-6">
          {loading && groups.length === 0 ? (
            <div className="space-y-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[104px] animate-pulse rounded-2xl border bg-muted/30" />
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
            <div className="space-y-2.5">
              {displayedGroups.map((g) => (
                <GroupRow key={g.id} group={g} searchQuery={search} />
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

// Category color gradients (same palette as GroupCard).
const ROW_GRADIENTS: Record<string, string> = {
  emerald: "from-emerald-500 to-teal-600",
  rose: "from-rose-500 to-pink-600",
  fuchsia: "from-fuchsia-500 to-purple-600",
  sky: "from-sky-500 to-blue-600",
  slate: "from-slate-500 to-gray-700",
  teal: "from-teal-500 to-cyan-600",
  lime: "from-lime-500 to-green-600",
  violet: "from-violet-500 to-purple-600",
  amber: "from-amber-500 to-orange-600",
  yellow: "from-yellow-400 to-amber-500",
  stone: "from-stone-500 to-zinc-700",
  orange: "from-orange-500 to-red-600",
  red: "from-red-500 to-rose-700",
  cyan: "from-cyan-500 to-sky-600",
  indigo: "from-indigo-500 to-blue-600",
  blue: "from-blue-500 to-indigo-600",
  pink: "from-pink-500 to-rose-600",
  green: "from-green-500 to-emerald-600",
  purple: "from-purple-500 to-violet-600",
};

function RowHeartButton({ id }: { id: string }) {
  const toggle = useFavorites((s) => s.toggle);
  const has = useFavorites((s) => s.ids.includes(id));
  return (
    <motion.button
      aria-label={has ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={has}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(id);
      }}
      whileTap={{ scale: 0.8 }}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
        has
          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
          : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
      }`}
    >
      <Heart className={`h-4 w-4 ${has ? "fill-current" : ""}`} />
    </motion.button>
  );
}

function GroupRow({ group, searchQuery }: { group: GroupDTO; searchQuery: string }) {
  const isActiveRecently = group.lastActiveAt
    ? Date.now() - new Date(group.lastActiveAt).getTime() < 7 * 86400000
    : false;
  const isHot = group.members >= 1000;
  const isTrending = group.views >= 50 || group.members >= 700;
  const gradient = ROW_GRADIENTS[group.category?.color ?? "emerald"] ?? ROW_GRADIENTS.emerald;
  // Adult directive: blank image title/alt on adult groups (SEO safety).
  const imgAlt = group.isAdult ? "" : group.title;
  const imgTitle = group.isAdult ? undefined : group.title;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-card p-3.5 pr-3 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:gap-4 sm:p-4"
    >
      {/* Category color left accent */}
      <span
        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${gradient} opacity-60 transition-opacity group-hover:opacity-100`}
        aria-hidden
      />
      {/* Decorative corner wash */}
      <span
        className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.07] blur-2xl transition group-hover:opacity-20`}
        aria-hidden
      />

      {/* Stretched link: whole row stays clickable; sits ABOVE static content
          (z-[1]) but BELOW interactive controls (details summary, actions). */}
      <Link
        href={`/grupo/${group.slug}`}
        title={imgTitle}
        aria-label={group.isAdult ? "Ver grupo 18+" : `Ver grupo ${group.title}`}
        className="absolute inset-0 z-[1] rounded-2xl"
      />

      {/* Image / icon */}
      <div className="relative shrink-0 pl-1">
        <GroupImage
          src={group.imageUrl}
          alt={imgAlt}
          title={imgTitle}
          size={56}
          className="rounded-xl transition duration-300 group-hover:scale-105 sm:h-16 sm:w-16"
          fallbackEmoji={group.category?.icon}
        />
        {isActiveRecently && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
          </span>
        )}
      </div>

      {/* Content: name + compact stats always visible; país/ciudad/categoría/
          descripción collapsed behind a native <details> dropdown (content
          stays in the HTML for Googlebot — we only minimize visually). */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary sm:text-base">
            <Highlight text={group.title} query={searchQuery} />
          </h3>
          {group.isAdult && (
            <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400" title="Contenido para adultos">
              18+
            </span>
          )}
          {group.isVerified && (
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Verificado" />
          )}
          {group.isFeatured && (
            <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-amber-500" aria-label="Destacado" />
          )}
          {isHot && <Flame className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" aria-label="Popular" />}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground/75">
            <Users className="h-3 w-3 text-primary/70" /> {fmt(group.members)}
          </span>
          {isTrending && (
            <span className="inline-flex items-center gap-0.5 text-orange-600 dark:text-orange-400">
              <TrendingUp className="h-3 w-3" /> Tendencia
            </span>
          )}
        </div>

        <details className="group/details relative z-[2]">
          <summary
            className="-ml-1 flex min-h-8 cursor-pointer select-none list-none items-center gap-1 rounded-md px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden"
            aria-label={`Mostrar país, ciudad, categoría y descripción de ${group.isAdult ? "este grupo 18+" : group.title}`}
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border bg-background/70 transition-colors group-hover/details:border-primary/40 group-hover/details:text-primary">
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-open/details:rotate-180" />
            </span>
            <span className="truncate">País, ciudad, categoría y descripción</span>
          </summary>
          <div className="space-y-1.5 px-1 pb-1 pt-1.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
              {group.country && (
                <span className="inline-flex items-center gap-1">
                  <CountryFlag code={group.country.code} name={group.country.name} /> {group.country.name}
                </span>
              )}
              {group.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {group.city}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> {fmt(group.views)}
              </span>
              {group.category && (
                <Badge variant="outline" className="gap-1 font-normal">
                  {group.category.icon} {group.category.name}
                </Badge>
              )}
            </div>
            <p className="line-clamp-3 break-words text-muted-foreground/90">
              <Highlight text={group.description} query={searchQuery} />
            </p>
          </div>
        </details>
      </div>

      {/* Actions: heart + compare + join CTA */}
      <div className="relative z-[2] flex shrink-0 flex-col items-center justify-center gap-1.5 pl-1 sm:flex-row sm:gap-2 sm:pl-2">
        <div className="flex flex-row items-center gap-0.5 sm:gap-1">
          <RowHeartButton id={group.id} />
          <CompareIconButton slug={group.slug} title={group.title} />
        </div>
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/25 transition-all duration-300 group-hover:shadow-md group-hover:shadow-emerald-500/40 group-hover:brightness-110 sm:px-4 sm:py-2"
          aria-hidden
        >
          Unirme
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.article>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || query.trim().length === 0) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-primary">{part}</mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
