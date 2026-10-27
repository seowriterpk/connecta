"use client";

import * as React from "react";

/**
 * useAdminTableFetch — shared data-fetch engine for the instant admin
 * data-tables (grupos / reportes / listas — Task 29-b).
 *
 * Pattern:
 *  - The server page renders the FIRST page (fast paint, shareable URL).
 *  - This hook takes over: every filter/page change re-fetches from the
 *    matching admin GET endpoint in the background (no full-page reload).
 *  - The shareable URL is kept in sync with window.history.replaceState
 *    (no navigation, no server round-trip).
 *  - Debounce support for free-text search; instant for select/page changes.
 *  - AbortController cancels stale requests; rows from the last render stay
 *    visible (dimmed) while fetching so the layout never shifts.
 */

export interface UseAdminTableFetchOptions<TFilters, TData> {
  /** Absolute in-app API URL (with query string) for a filter state. */
  buildUrl: (filters: TFilters) => string;
  /** Shareable in-app path for a filter state (used by history.replaceState). */
  buildPath: (filters: TFilters) => string;
  /** Filter state parsed from the server searchParams. */
  initialFilters: TFilters;
  /** Server-rendered first page. */
  initialData: TData;
  /** Return true when the change should debounce (e.g. free-text search). */
  shouldDebounce?: (prev: TFilters, next: TFilters) => boolean;
  /** Debounce window in ms (default 300). */
  debounceMs?: number;
}

export function useAdminTableFetch<TFilters extends object, TData>(
  opts: UseAdminTableFetchOptions<TFilters, TData>
): {
  filters: TFilters;
  setFilters: React.Dispatch<React.SetStateAction<TFilters>>;
  data: TData;
  fetching: boolean;
  error: string | null;
  /** Re-run the last request (e.g. after a bulk action or a retry click). */
  refetch: () => void;
} {
  const { buildUrl, buildPath, initialFilters, initialData } = opts;
  const debounceMs = opts.debounceMs ?? 300;

  const [filters, setFilters] = React.useState<TFilters>(initialFilters);
  const [data, setData] = React.useState<TData>(initialData);
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [nonce, setNonce] = React.useState(0);

  const skipFirst = React.useRef(true);
  const prevFilters = React.useRef<TFilters>(initialFilters);
  const abortRef = React.useRef<AbortController | null>(null);

  const load = React.useCallback(
    async (f: TFilters) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setFetching(true);
      try {
        const res = await fetch(buildUrl(f), {
          signal: ac.signal,
          headers: { Accept: "application/json" },
        });
        const json = (await res.json().catch(() => null)) as
          | { ok: boolean; data?: TData; error?: string }
          | null;
        if (!res.ok || !json?.ok || json.data == null) {
          throw new Error(json?.error ?? "Error del servidor.");
        }
        setData(json.data);
        setError(null);
        try {
          window.history.replaceState(null, "", buildPath(f));
        } catch {
          /* history API unavailable — ignore */
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("No se pudo actualizar la tabla. Revisa tu conexión e inténtalo de nuevo.");
      } finally {
        if (!ac.signal.aborted) setFetching(false);
      }
    },
    [buildUrl, buildPath]
  );

  React.useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      prevFilters.current = filters;
      return;
    }
    const debounceIt = opts.shouldDebounce
      ? opts.shouldDebounce(prevFilters.current, filters)
      : false;
    prevFilters.current = filters;
    const t = setTimeout(() => {
      void load(filters);
    }, debounceIt ? debounceMs : 0);
    return () => clearTimeout(t);
  }, [filters, load, nonce]);

  const refetch = React.useCallback(() => setNonce((n) => n + 1), []);

  return { filters, setFilters, data, fetching, error, refetch };
}
