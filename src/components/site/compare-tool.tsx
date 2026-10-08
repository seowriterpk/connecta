"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Calendar,
  Eye,
  Globe2,
  LayoutGrid,
  Loader2,
  MousePointerClick,
  Plus,
  Search,
  Scale,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { GroupDTO } from "@/lib/types";
import { GroupImage } from "@/components/site/group-image";
import { useCompare, MAX_COMPARE } from "@/lib/compare";
import { CountryFlag } from "@/components/site/country-flag";

type Ratings = Record<string, { avg: number; count: number }>;

function timeAgoShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 1) return "hoy";
  if (days < 30) return days === 1 ? "1 día" : `${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 mes" : `${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 año" : `${years} años`;
}

function formatNum(n: number): string {
  return n.toLocaleString("es-ES");
}

/** Expand the compact slug list into fixed 3 slots (null = empty slot). */
function toSlots(slugs: string[]): (string | null)[] {
  return [...slugs, ...Array(MAX_COMPARE).fill(null)].slice(0, MAX_COMPARE);
}

export function CompareTool({ suggestions }: { suggestions: GroupDTO[] }) {
  // Zustand store (localStorage-persisted)
  const storeSlugs = useCompare((s) => s.slugs);
  const addSlug = useCompare((s) => s.add);
  const removeSlug = useCompare((s) => s.remove);
  const setAllSlugs = useCompare((s) => s.setAll);
  const clearAll = useCompare((s) => s.clearAll);
  const hydrated = useCompare((s) => s.hydrated);

  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [ratings, setRatings] = useState<Ratings>({});
  const [loadedKey, setLoadedKey] = useState("");

  // Search picker state
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupDTO[]>([]);
  const [resultsQuery, setResultsQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeKey = storeSlugs.join(",");

  // --- On mount: URL ?g= wins over localStorage; then keep URL in sync ---
  useEffect(() => {
    const url = new URL(window.location.href);
    const g = url.searchParams.get("g");
    if (g) setAllSlugs(g.split(",").map((s) => s.trim()).filter(Boolean));
  }, [setAllSlugs]);

  useEffect(() => {
    // Idempotent URL sync (shareable links) — no React state involved.
    try {
      const url = new URL(window.location.href);
      if (storeSlugs.length > 0) url.searchParams.set("g", activeKey);
      else url.searchParams.delete("g");
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* ignore */
    }
  }, [activeKey, storeSlugs.length]);

  // --- Fetch selected groups (all setState happens in async callbacks) ---
  useEffect(() => {
    if (!hydrated || activeKey === "") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/groups/compare?slugs=${encodeURIComponent(activeKey)}&XTransformPort=3000`
        );
        const json = await res.json();
        if (cancelled || !json.ok) return;
        setGroups(json.data.groups);
        setRatings(json.data.ratings ?? {});
        setLoadedKey(activeKey);
      } catch {
        /* keep previous data on transient errors */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeKey, hydrated]);

  // --- Derived loading: data incomplete while a fetch is in flight ---
  const shownGroups = useMemo(
    () => groups.filter((g) => storeSlugs.includes(g.slug)),
    [groups, storeSlugs]
  );
  const loading =
    hydrated && storeSlugs.length > 0 && (loadedKey !== activeKey || shownGroups.length !== storeSlugs.length);

  // --- Debounced search while the picker is open ---
  const trimmedQuery = query.trim();
  const searching = activeSlot !== null && trimmedQuery !== "" && resultsQuery !== trimmedQuery;

  useEffect(() => {
    if (activeSlot === null || !trimmedQuery) return;
    const t = setTimeout(() => {
      fetch(`/api/groups?q=${encodeURIComponent(trimmedQuery)}&orden=populares&limite=8&XTransformPort=3000`)
        .then((r) => r.json())
        .then((res) => {
          if (res.ok) {
            setResults(res.data);
            setResultsQuery(trimmedQuery);
          }
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [trimmedQuery, activeSlot]);

  // Focus the search input shortly after the picker opens (async → lint-safe)
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (activeSlot !== null) {
      focusTimerRef.current = setTimeout(() => searchInputRef.current?.focus(), 60);
    }
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [activeSlot]);

  const openPicker = useCallback((slot: number) => {
    setQuery("");
    setResults([]);
    setResultsQuery("");
    setActiveSlot(slot);
  }, []);

  const closePicker = useCallback(() => setActiveSlot(null), []);

  const addGroup = useCallback(
    (slug: string) => {
      addSlug(slug);
      setQuery("");
      setResults([]);
      setResultsQuery("");
      setActiveSlot(null);
    },
    [addSlug]
  );

  // --- Winner computation per numeric row ---
  const winner = useCallback(
    (metric: (g: GroupDTO) => number): string | null => {
      const eligible = shownGroups.map((g) => ({ id: g.id, v: metric(g) }));
      const max = Math.max(...eligible.map((e) => e.v));
      if (!isFinite(max) || max <= 0) return null;
      const tops = eligible.filter((e) => e.v === max);
      return tops.length === 1 ? tops[0].id : null;
    },
    [shownGroups]
  );

  const ratingOf = useCallback((g: GroupDTO) => ratings[g.id] ?? null, [ratings]);

  const winners = useMemo(
    () => ({
      members: winner((g) => g.members || 0),
      views: winner((g) => g.views || 0),
      clicks: winner((g) => g.clicks || 0),
      rating: winner((g) => (ratingOf(g) && ratingOf(g)!.count > 0 ? ratingOf(g)!.avg : 0)),
    }),
    [winner, ratingOf]
  );

  const slots = toSlots(storeSlugs);
  const firstEmptySlot = slots.findIndex((s) => s === null);
  const tableCols = `minmax(96px, 140px) repeat(${shownGroups.length}, minmax(0, 1fr))`;

  return (
    <div className="space-y-5">
      {/* ==== Slot picker ==== */}
      <section aria-label="Selección de grupos a comparar" className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {slots.map((slug, i) => {
            const group = shownGroups.find((g) => g.slug === slug);
            return (
              <div key={i}>
                {group ? (
                  <div className="relative flex items-center gap-3 rounded-xl border bg-background p-3 shadow-sm transition hover:border-primary/40">
                    <GroupImage src={group.imageUrl} alt={group.title} size={44} className="rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/grupo/${group.slug}`}
                        className="line-clamp-1 text-sm font-semibold hover:text-primary"
                        title={group.title}
                      >
                        {group.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {group.country && <CountryFlag code={group.country.code} />} {group.country?.name} · {group.category?.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlug(group.slug)}
                      aria-label={`Quitar ${group.title} de la comparación`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openPicker(i)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Grupo {i + 1}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick picks (popular suggestions) for one-tap add */}
        {firstEmptySlot !== -1 && activeSlot === null && suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Populares:
            </span>
            {suggestions.slice(0, 6).map((s) => {
              const already = storeSlugs.includes(s.slug);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={already}
                  onClick={() => addGroup(s.slug)}
                  className="inline-flex max-w-[220px] items-center gap-1.5 whitespace-nowrap rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground disabled:opacity-40"
                  title={s.title}
                >
                  {s.country && <CountryFlag code={s.country.code} />}
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ==== Search picker ==== */}
      {activeSlot !== null && (
        <section
          aria-label="Buscar grupo para comparar"
          className="rounded-2xl border-2 border-primary/30 bg-card p-4 shadow-lg shadow-primary/5 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="compare-search" className="inline-flex items-center gap-2 text-sm font-semibold">
              <Search className="h-4 w-4 text-primary" aria-hidden />
              Elige el grupo {activeSlot + 1}
            </label>
            <button
              type="button"
              onClick={closePicker}
              className="grid h-7 w-7 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-accent"
              aria-label="Cancelar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            id="compare-search"
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe el nombre de un grupo… (ej. memes, fútbol, empleos)"
            className="mt-3 w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/40"
            autoComplete="off"
          />
          <div className="mt-3 max-h-72 overflow-y-auto" role="listbox" aria-label="Resultados de búsqueda">
            {searching && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Buscando grupos…
              </div>
            )}
            {!searching && trimmedQuery && resultsQuery === trimmedQuery && results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No encontramos grupos con «{trimmedQuery}». Prueba con otra palabra.
              </p>
            )}
            {!searching &&
              resultsQuery === trimmedQuery &&
              results.map((g) => {
                const already = storeSlugs.includes(g.slug);
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    disabled={already}
                    onClick={() => addGroup(g.slug)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent disabled:opacity-40"
                  >
                    <GroupImage src={g.imageUrl} alt={g.title} size={36} className="rounded-md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{g.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {g.country && <CountryFlag code={g.country.code} />} {g.country?.name} · {g.category?.name} ·{" "}
                        {formatNum(g.views)} vistas
                      </span>
                    </span>
                    {already ? (
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Añadido</span>
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    )}
                  </button>
                );
              })}
          </div>
        </section>
      )}

      {/* ==== Comparison table ==== */}
      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Cargando la comparación…
        </div>
      )}

      {!loading && shownGroups.length > 0 && (
        <section aria-label="Tabla comparativa" className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
          {/* Header row: group identities */}
          <div className="grid border-b bg-muted/40" style={{ gridTemplateColumns: tableCols }}>
            <div className="flex items-center justify-center p-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Scale className="h-4 w-4" aria-hidden />
              <span className="sr-only">Comparativa</span>
            </div>
            {shownGroups.map((g) => (
              <div key={g.id} className="border-l p-3 text-center">
                <div className="mx-auto w-fit">
                  <GroupImage src={g.imageUrl} alt={g.title} size={52} className="rounded-xl" />
                </div>
                <Link
                  href={`/grupo/${g.slug}`}
                  className="mt-2 block line-clamp-2 text-[13px] font-semibold leading-snug hover:text-primary"
                  title={g.title}
                >
                  {g.title}
                </Link>
              </div>
            ))}
          </div>

          {/* Attribute rows */}
          {(
            [
              {
                label: "Miembros (est.)",
                icon: Users,
                value: (g: GroupDTO) => (
                  <span className="tabular-nums font-semibold">{formatNum(g.members || 0)}</span>
                ),
                winnerId: winners.members,
              },
              {
                label: "Vistas",
                icon: Eye,
                value: (g: GroupDTO) => (
                  <span className="tabular-nums font-semibold">{formatNum(g.views || 0)}</span>
                ),
                winnerId: winners.views,
              },
              {
                label: "Clics de unión",
                icon: MousePointerClick,
                value: (g: GroupDTO) => (
                  <span className="tabular-nums font-semibold">{formatNum(g.clicks || 0)}</span>
                ),
                winnerId: winners.clicks,
              },
              {
                label: "Valoración",
                icon: Star,
                value: (g: GroupDTO) => {
                  const r = ratingOf(g);
                  return r && r.count > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                      {r.avg.toFixed(1)}
                      <span className="text-[10px] font-normal text-muted-foreground">({r.count})</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin reseñas</span>
                  );
                },
                winnerId: winners.rating,
              },
              {
                label: "Categoría",
                icon: LayoutGrid,
                value: (g: GroupDTO) => <span className="text-[13px]">{g.category?.name ?? "—"}</span>,
                winnerId: null,
              },
              {
                label: "País",
                icon: Globe2,
                value: (g: GroupDTO) => (
                  <span className="text-[13px]">
                    {g.country && <CountryFlag code={g.country.code} />} {g.country?.name ?? "—"}
                  </span>
                ),
                winnerId: null,
              },
              {
                label: "Antigüedad",
                icon: Calendar,
                value: (g: GroupDTO) => <span className="text-[13px]">{timeAgoShort(g.createdAt)}</span>,
                winnerId: null,
              },
              {
                label: "Enlace",
                icon: BadgeCheck,
                value: (g: GroupDTO) =>
                  g.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                      <BadgeCheck className="h-4 w-4" aria-hidden /> Verificado
                    </span>
                  ) : (
                    <span className="text-[13px] text-muted-foreground">Sin verificar</span>
                  ),
                winnerId: null,
              },
            ] as const
          ).map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: tableCols }}>
                <div className="flex items-center gap-1.5 p-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="leading-tight">{row.label}</span>
                </div>
                {shownGroups.map((g) => {
                  const isWinner = row.winnerId === g.id;
                  return (
                    <div
                      key={g.id}
                      className={`flex items-center justify-center border-l p-3 text-center text-sm ${
                        isWinner ? "bg-emerald-500/10" : ""
                      }`}
                    >
                      <span className="inline-flex flex-wrap items-center justify-center gap-1">
                        {isWinner && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            <Trophy className="h-2.5 w-2.5" aria-hidden /> Mejor
                          </span>
                        )}
                        {row.value(g)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* CTA row */}
          <div className="grid border-t bg-muted/20" style={{ gridTemplateColumns: tableCols }}>
            <div className="p-3" aria-hidden />
            {shownGroups.map((g) => (
              <div key={g.id} className="flex items-center justify-center border-l p-3">
                <Link
                  href={`/verificar/${g.slug}`}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 transition hover:brightness-110"
                >
                  Unirme
                </Link>
              </div>
            ))}
          </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && shownGroups.length === 0 && activeSlot === null && (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-14">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-500/15 to-emerald-500/10 ring-1 ring-teal-500/25">
            <Scale className="h-8 w-8 text-teal-600 dark:text-teal-300" aria-hidden />
          </div>
          <h2 className="text-lg font-bold">Elige dos o tres grupos para comparar</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Añade grupos con el buscador o toca una de las sugerencias populares. Verás
            miembros, vistas, clics y valoraciones lado a lado, con el mejor de cada métrica destacado.
          </p>
          <p className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/5 px-3.5 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300">
            <Scale className="h-3.5 w-3.5" aria-hidden />
            Consejo: el icono de balanza en cualquier tarjeta de grupo lo añade aquí al instante
          </p>
        </div>
      )}

      {/* Actions */}
      {shownGroups.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            El «mejor» de cada fila se calcula en vivo con los datos actuales del directorio.
          </p>
          <div className="flex gap-2">
            {firstEmptySlot !== -1 && (
              <button
                type="button"
                onClick={() => openPicker(firstEmptySlot)}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Añadir otro grupo
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Limpiar comparación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
