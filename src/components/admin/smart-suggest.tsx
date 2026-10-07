"use client";

/**
 * SmartSuggest — intelligent typeahead/auto-suggest combobox (2026 admin UX).
 *
 * Replaces every raw ID / clunky <select> across the admin panel:
 * - Type to filter (accent + case-insensitive, startsWith ranked first).
 * - Full keyboard navigation (↑/↓/Enter/Escape/Backspace).
 * - ARIA combobox semantics for screen readers.
 * - Optional leading emoji/flag, secondary hint line (e.g. "12 grupos").
 * - `TagSuggest` variant: multi-select chips with free-text creation —
 *   perfect for tags, with suggestions ranked by usage frequency.
 *
 * Zero manual IDs anywhere: the admin picks by NAME, the component
 * resolves the underlying id (value prop is the id).
 */

import * as React from "react";
import { Check, ChevronDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Normalization + scoring
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function score(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return 1;
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  if (h.includes(n)) return 50;
  const words = h.split(/[\s-]+/);
  if (words.some((w) => w.startsWith(n))) return 40;
  // subsequence match (loose)
  let i = 0;
  for (const ch of h) {
    if (ch === n[i]) i++;
    if (i >= n.length) return 20;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Single-select SmartSuggest
// ---------------------------------------------------------------------------

export interface SuggestOption {
  value: string;
  label: string;
  hint?: string;
  icon?: string;
  badge?: string;
}

interface SmartSuggestProps {
  options: SuggestOption[];
  /** Selected option value (the id). */
  value: string | null | undefined;
  onChange: (value: string, option: SuggestOption) => void;
  placeholder?: string;
  emptyText?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  /** Optional clear button (sets value to null). */
  allowClear?: boolean;
}

export function SmartSuggest({
  options,
  value,
  onChange,
  placeholder = "Escribe para buscar…",
  emptyText = "Sin resultados",
  id,
  className,
  disabled,
  allowClear,
}: SmartSuggestProps) {
  const byValue = React.useMemo(() => {
    const m = new Map<string, SuggestOption>();
    options.forEach((o) => m.set(o.value, o));
    return m;
  }, [options]);

  const selected = value ? byValue.get(value) : undefined;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return options.slice(0, 200);
    return options
      .map((o) => ({ o, s: Math.max(score(o.label, query), o.hint ? score(o.hint, query) * 0.3 : 0) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 200)
      .map((x) => x.o);
  }, [options, query]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Reset highlight when the list changes
  React.useEffect(() => setActive(0), [query, open]);

  function openAndFocus() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    inputRef.current?.focus();
  }

  function pick(option: SuggestOption) {
    onChange(option.value, option);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered[active]) {
        e.preventDefault();
        pick(filtered[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !query && allowClear && value) {
      e.preventDefault();
      // Caller handles null value
      onChange("", { value: "", label: "" });
    }
  }

  // Scroll active item into view
  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const listId = id ? `${id}-listbox` : undefined;
  const inputId = id ? `${id}-input` : undefined;

  return (
    <div ref={rootRef} className={cn("relative", className)} data-smartsuggest-root="">
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-owns={listId}
        aria-controls={listId}
        className={cn(
          "flex h-11 items-center gap-1.5 rounded-xl border bg-transparent px-3 text-sm shadow-xs transition",
          open ? "border-primary/60 ring-2 ring-primary/15" : "border-input",
          disabled && "opacity-60"
        )}
      >
        {selected?.icon && !open && <span className="text-base leading-none">{selected.icon}</span>}
        <input
          ref={inputRef}
          id={inputId}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={open && filtered[active] && listId ? `${listId}-opt-${active}` : undefined}
          disabled={disabled}
          value={open ? query : selected?.label ?? ""}
          placeholder={selected && !open ? "" : placeholder}
          onFocus={() => openAndFocus()}
          onClick={() => openAndFocus()}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
          spellCheck={false}
        />
        {selected?.badge && !open && (
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {selected.badge}
          </span>
        )}
        {allowClear && value && !open && (
          <button
            type="button"
            aria-label="Quitar selección"
            onClick={(e) => {
              e.stopPropagation();
              onChange("", { value: "", label: "" });
            }}
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => (open ? setOpen(false) : openAndFocus())}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Opciones"
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">{emptyText}</li>
          ) : (
            filtered.map((o, i) => {
              const isSel = o.value === value;
              const isAct = i === active;
              return (
                <li
                  key={o.value}
                  id={listId ? `${listId}-opt-${i}` : undefined}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep input focus
                    pick(o);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    isAct && "bg-accent",
                    isSel && "font-semibold"
                  )}
                >
                  {o.icon && <span className="text-base leading-none">{o.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.badge && (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {o.badge}
                    </span>
                  )}
                  {isSel && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TagSuggest — multi-select chips with free-text creation + frequency hints
// ---------------------------------------------------------------------------

export interface TagOption {
  label: string;
  count?: number;
}

interface TagSuggestProps {
  suggestions: TagOption[];
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  id?: string;
  className?: string;
}

export function TagSuggest({
  suggestions,
  value,
  onChange,
  placeholder = "Escribe y pulsa Enter…",
  max = 10,
  id,
  className,
}: TagSuggestProps) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const existingSet = new Set(value.map((t) => normalize(t)));
    const pool = suggestions
      .filter((s) => !existingSet.has(normalize(s.label)))
      .map((s) => ({ s, sc: score(s.label, query) }))
      .filter((x) => (query.trim() ? x.sc > 0 : true))
      .sort((a, b) => (b.s.count ?? 0) - (a.s.count ?? 0) || b.sc - a.sc)
      .slice(0, 8)
      .map((x) => x.s);
    const q = query.trim().replace(/^#/, "");
    if (q && !suggestions.some((s) => normalize(s.label) === normalize(q)) && !existingSet.has(normalize(q))) {
      pool.unshift({ label: q, count: 0 });
    }
    return pool;
  }, [suggestions, query, value]);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  React.useEffect(() => setActive(0), [query]);

  function addTag(tag: string) {
    const t = tag.trim().replace(/^#/, "").toLowerCase();
    if (!t || value.length >= max) return;
    if (value.some((v) => normalize(v) === normalize(t))) {
      setQuery("");
      return;
    }
    onChange([...value, t]);
    setQuery("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && filtered.length > 0) {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) addTag(filtered[active].label);
      else if (query.trim()) addTag(query);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const listId = id ? `${id}-tagbox` : undefined;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex max-w-[200px] items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            <span className="truncate">{t}</span>
            <button
              type="button"
              aria-label={`Quitar ${t}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(t);
              }}
              className="grid h-4 w-4 place-items-center rounded-full transition hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          aria-label="Añadir etiqueta"
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {value.length}/{max}
        </span>
      </div>

      {open && (query.trim() || suggestions.length > 0) && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugerencias de etiquetas"
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
        >
          {filtered.map((o, i) => {
            const isAct = i === active;
            const isNew = query.trim() && i === 0 && !suggestions.some((s) => normalize(s.label) === normalize(o.label));
            return (
              <li
                key={o.label}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(o.label);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  isAct && "bg-accent"
                )}
              >
                {isNew ? (
                  <>
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    <span>
                      Crear <strong>{o.label}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="truncate">#{o.label}</span>
                    {typeof o.count === "number" && o.count > 0 && (
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                        usado {o.count}×
                      </span>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
