"use client";

/**
 * SearchPredictive — search input with instant type-ahead suggestions
 * (autocomplete / predictive search, industry-standard UX).
 *
 * - Typing ≥2 chars fetches /api/groups/suggest (debounced 160ms, aborted
 *   stale requests) and shows a dropdown of matching groups.
 * - Click / Enter on a suggestion navigates to that group's page.
 * - ArrowUp/ArrowDown move the highlight; Escape closes; plain Enter runs
 *   the normal full search (onSubmit).
 * - Used by the hero search and the directory filter bar.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CornerDownLeft, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  slug: string;
  title: string;
  members: number;
  city: string | null;
  country: string | null;
  flag: string | null;
  catIcon: string | null;
  isAdult: boolean;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Full search (Enter on the input itself, or the "search everything" row). */
  onSubmit: (q: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Adult query param for the current silo: "1" = include, "only" = adults only. */
  adultParam?: "1" | "only";
  ariaLabel?: string;
  /** Rendered before the Search icon (e.g. hero's icon). */
  icon?: React.ReactNode;
}

export function SearchPredictive({
  value,
  onChange,
  onSubmit,
  placeholder = "Buscar grupos…",
  className,
  inputClassName,
  adultParam,
  ariaLabel = "Buscar grupos",
  icon,
}: Props) {
  const router = useRouter();

  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [highlight, setHighlight] = React.useState(-1);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const q = value.trim();

  // Fetch suggestions (debounced + stale-abort)
  React.useEffect(() => {
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      const adultQ = adultParam ? `&adult=${adultParam}` : "";
      fetch(
        `/api/groups/suggest?q=${encodeURIComponent(q)}${adultQ}&XTransformPort=3000`,
        { signal: ctl.signal }
      )
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok && Array.isArray(j.data)) {
            setSuggestions(j.data);
            setOpen(true);
            setHighlight(j.data.length > 0 ? 0 : -1);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 160);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, adultParam]);

  // Close on outside click
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(slug: string) {
    setOpen(false);
    router.push(`/grupo/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit(q);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % (suggestions.length + 1)); // +1 = "search all" row
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length + 1) % (suggestions.length + 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && highlight < suggestions.length) {
        go(suggestions[highlight].slug);
      } else {
        onSubmit(q);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && q.length >= 2;
  const allIdx = suggestions.length; // index of the "search everything" row

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className="relative">
        {icon ?? (
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => q.length >= 2 && suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="cg-search-suggest"
          aria-autocomplete="list"
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-background/90 pl-10 pr-10 text-sm shadow-sm outline-none ring-ring transition placeholder:text-muted-foreground focus-visible:ring-2",
            inputClassName
          )}
        />
        {loading && q.length >= 2 && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <ul
          id="cg-search-suggest"
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-80 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {suggestions.length === 0 && !loading && (
            <li className="px-3 py-2.5 text-xs text-muted-foreground">
              Sin coincidencias directas — pulsa Enter para buscar en todo el directorio.
            </li>
          )}
          {suggestions.map((s, i) => (
            <li key={s.slug} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // fire before blur
                  go(s.slug);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  i === highlight ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-base">
                  {s.catIcon ?? "💬"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{s.title}</span>
                    {s.isAdult && (
                      <span className="shrink-0 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        18+
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {s.members.toLocaleString("es-ES")}
                    </span>
                    {(s.country || s.city) && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {s.flag ? `${s.flag} ` : ""}
                        {[s.city, s.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
          <li role="option" aria-selected={highlight === allIdx}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
                onSubmit(q);
              }}
              onMouseEnter={() => setHighlight(allIdx)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors",
                highlight === allIdx ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/60"
              )}
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
              Buscar «{q}» en todo el directorio
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
