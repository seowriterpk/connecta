"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Globe2, LayoutGrid, SlidersHorizontal, X } from "lucide-react";

export interface FilterCountry {
  code: string;
  name: string;
  flag: string;
  groupCount: number;
}

export interface FilterCategory {
  slug: string;
  name: string;
  color: string;
  groupCount: number;
}

// Solid dot colors per category color name (reuses the site-wide palette).
const DOT_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  fuchsia: "bg-fuchsia-500",
  sky: "bg-sky-500",
  slate: "bg-slate-500",
  teal: "bg-teal-500",
  lime: "bg-lime-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-400",
  stone: "bg-stone-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

interface PopularesFiltersProps {
  countries: FilterCountry[];
  categories: FilterCategory[];
  orden: string;
  pais: string | null;
  cat: string | null;
}

const COLLAPSED_COUNT = 10;

/** Chip row used for both country and category filters on /populares. */
function Chip({
  href,
  active,
  children,
  srLabel,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  srLabel: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      aria-label={srLabel}
      className={`inline-flex max-w-[200px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        active
          ? "border-transparent bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
          : "border-border/70 bg-background text-muted-foreground hover:border-orange-300/60 hover:bg-orange-500/5 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export function PopularesFilters({ countries, categories, orden, pais, cat }: PopularesFiltersProps) {
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Only countries/categories that actually have live groups.
  const liveCountries = useMemo(
    () => countries.filter((c) => c.groupCount > 0).sort((a, b) => b.groupCount - a.groupCount),
    [countries]
  );
  const liveCategories = useMemo(
    () => categories.filter((c) => c.groupCount > 0).sort((a, b) => b.groupCount - a.groupCount),
    [categories]
  );

  const activeCountry = liveCountries.find((c) => c.code === pais) ?? null;
  const activeCategory = liveCategories.find((c) => c.slug === cat) ?? null;
  const hasFilters = !!(pais || cat);

  // Build a filtered URL preserving the active orden tab (and the other filter).
  const buildHref = (nextPais: string | null, nextCat: string | null) => {
    const params = new URLSearchParams();
    if (orden !== "vistos") params.set("orden", orden);
    if (nextPais) params.set("pais", nextPais);
    if (nextCat) params.set("cat", nextCat);
    const qs = params.toString();
    return `/populares${qs ? `?${qs}` : ""}`;
  };

  // The active country/category must stay visible even beyond the collapsed cut.
  const visibleCountries = useMemo(() => {
    const base = showAllCountries
      ? liveCountries
      : liveCountries.slice(0, COLLAPSED_COUNT);
    if (pais && !base.some((c) => c.code === pais)) {
      const active = liveCountries.find((c) => c.code === pais);
      if (active) return [...base, active];
    }
    return base;
  }, [liveCountries, showAllCountries, pais]);

  const visibleCategories = useMemo(() => {
    const base = showAllCategories
      ? liveCategories
      : liveCategories.slice(0, COLLAPSED_COUNT);
    if (cat && !base.some((c) => c.slug === cat)) {
      const active = liveCategories.find((c) => c.slug === cat);
      if (active) return [...base, active];
    }
    return base;
  }, [liveCategories, showAllCategories, cat]);

  return (
    <div className="mt-3 rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5 text-orange-500" aria-hidden />
          Filtrar el ranking
        </div>
        {hasFilters && (
          <Link
            href={buildHref(null, null)}
            className="inline-flex items-center gap-1 rounded-full border border-orange-300/60 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-500/20 dark:text-orange-400"
          >
            <X className="h-3 w-3" aria-hidden /> Quitar filtros
          </Link>
        )}
      </div>

      {/* Active filter summary */}
      {hasFilters && (
        <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
          Mostrando{" "}
          <span className="font-semibold text-foreground">
            {[activeCountry?.name, activeCategory?.name].filter(Boolean).join(" · ")}
          </span>{" "}
          — quita un filtro para ampliar los resultados.
        </p>
      )}

      {/* Country chips */}
      <div className="flex items-start gap-2">
        <span className="mt-1.5 hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground sm:inline-flex" style={{ minWidth: 48 }}>
          <Globe2 className="h-3.5 w-3.5" aria-hidden /> País
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {visibleCountries.map((c) => (
            <Chip
              key={c.code}
              href={buildHref(c.code === pais ? null : c.code, cat)}
              active={c.code === pais}
              srLabel={`${c.name}: ${c.groupCount} grupos`}
            >
              <span aria-hidden>{c.flag}</span>
              <span className="truncate">{c.name}</span>
              <span className={`text-[10px] tabular-nums ${c.code === pais ? "text-white/80" : "text-muted-foreground/70"}`}>
                {c.groupCount}
              </span>
            </Chip>
          ))}
          {liveCountries.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllCountries((v) => !v)}
              aria-expanded={showAllCountries}
              className="inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              {showAllCountries
                ? "Ver menos"
                : `+${liveCountries.length - COLLAPSED_COUNT} países`}
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="mt-3 flex items-start gap-2 border-t pt-3">
        <span className="mt-1.5 hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground sm:inline-flex" style={{ minWidth: 48 }}>
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden /> Tema
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {visibleCategories.map((c) => (
            <Chip
              key={c.slug}
              href={buildHref(pais, c.slug === cat ? null : c.slug)}
              active={c.slug === cat}
              srLabel={`${c.name}: ${c.groupCount} grupos`}
            >
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[c.color] ?? DOT_COLORS.emerald} ${c.slug === cat ? "ring-2 ring-white/70" : ""}`}
              />
              <span className="truncate">{c.name}</span>
              <span className={`text-[10px] tabular-nums ${c.slug === cat ? "text-white/80" : "text-muted-foreground/70"}`}>
                {c.groupCount}
              </span>
            </Chip>
          ))}
          {liveCategories.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllCategories((v) => !v)}
              aria-expanded={showAllCategories}
              className="inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              {showAllCategories
                ? "Ver menos"
                : `+${liveCategories.length - COLLAPSED_COUNT} temas`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
