"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Users, Eye, BadgeCheck, MapPin, Flame, ArrowUpRight, Filter, X, Loader2 } from "lucide-react";
import { useGroupsFilter } from "@/lib/store";
import type { CategoryDTO, CountryDTO, GroupDTO } from "@/lib/types";
import { GroupImage } from "@/components/site/group-image";
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

export function GroupsDirectoryTable({ groups: initialGroups, categories, countries, popularTags }: Props) {
  const {
    search, categoryId, countryId, sort, tag,
    setSearch, setCategory, setCountry, setTag, setSort, reset,
  } = useGroupsFilter();

  const [groups, setGroups] = React.useState<GroupDTO[]>(initialGroups);
  const [loading, setLoading] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState(search);
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);

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
  }, [search, categoryId, countryId, tag, sort]);

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

  const hasFilters = Boolean(search || categoryId || countryId || tag);
  const catName = categories.find((c) => c.id === categoryId)?.name;
  const countryName = countries.find((c) => c.id === countryId)?.name;

  return (
    <section id="grupos" className="border-t bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Directorio de grupos de WhatsApp
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explora {groups.length}+ comunidades activas en español. Usa los filtros para encontrar el grupo perfecto.
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
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="_all">Todas las categorías</SelectItem>
                  {categories.map((c) => (
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
                      {c.flag} {c.name}
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
            </div>
          </div>

          {/* Popular tags quick chips */}
          {popularTags.length > 0 && (
            <div className="cg-scroll mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="shrink-0 text-xs text-muted-foreground">Etiquetas:</span>
              {popularTags.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setTag(tag === t.tag ? null : t.tag)}
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                    tag === t.tag ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
                  }`}
                >
                  #{t.tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Groups table/rows */}
        <div className="mt-6">
          {loading && groups.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted/30" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center">
              <p className="font-semibold">No encontramos grupos con esos filtros</p>
              <p className="mt-1 text-sm text-muted-foreground">Prueba con otra categoría, país o búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
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

function GroupRow({ group, searchQuery }: { group: GroupDTO; searchQuery: string }) {
  const isActiveRecently = group.lastActiveAt
    ? Date.now() - new Date(group.lastActiveAt).getTime() < 7 * 86400000
    : false;
  const isHot = group.members >= 1000;

  return (
    <Link
      href={`/grupo/${group.slug}`}
      className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm sm:p-4"
    >
      {/* Image / icon */}
      <div className="relative shrink-0">
        <GroupImage
          src={group.imageUrl}
          alt={group.title}
          title={group.title}
          size={56}
          className="sm:h-16 sm:w-16"
          fallbackEmoji={group.category?.icon}
        />
        {isActiveRecently && (
          <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold sm:text-base">
            <Highlight text={group.title} query={searchQuery} />
          </h3>
          {group.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
          {isHot && <Flame className="h-4 w-4 shrink-0 text-orange-500" />}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
          <Highlight text={group.description} query={searchQuery} />
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {group.country && (
            <span className="inline-flex items-center gap-1">
              {group.country.flag} {group.country.name}
            </span>
          )}
          {group.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {group.city}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {fmt(group.members)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" /> {fmt(group.views)}
          </span>
          {group.category && (
            <Badge variant="outline" className="font-normal">{group.category.name}</Badge>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
    </Link>
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
