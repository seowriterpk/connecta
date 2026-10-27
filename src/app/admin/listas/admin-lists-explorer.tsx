"use client";

import * as React from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  RotateCcw,
  Inbox,
  ListChecks,
  Eye,
  Sparkles,
  FilterX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTableFetch } from "@/components/admin/use-admin-table-fetch";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  adminListsSearchParams,
  adminListFilters,
  type AdminListFilter,
  type AdminListsPage,
} from "@/lib/admin-listing-params";
import { AdminListsTable } from "./admin-lists-table";

interface Props {
  initialData: AdminListsPage;
  initialFilter: AdminListFilter;
  initialQ: string;
  initialPage: number;
  initialPageSize: number;
  csrfToken: string;
  pageSizes?: readonly number[];
}

interface ListView {
  filter: AdminListFilter;
  q: string;
  page: number;
  pageSize: number;
}

/**
 * AdminListsExplorer — instant filter chips + debounced search for the
 * shared-lists table. Summary chips update live with every response.
 */
export function AdminListsExplorer({
  initialData,
  initialFilter,
  initialQ,
  initialPage,
  initialPageSize,
  csrfToken,
  pageSizes,
}: Props) {
  const initial: ListView = {
    filter: initialFilter,
    q: initialQ,
    page: initialPage,
    pageSize: initialPageSize,
  };

  const buildUrl = React.useCallback((v: ListView) => {
    const qs = adminListsSearchParams(v.filter, v.q, v.page, v.pageSize).toString();
    return `/api/admin/lists${qs ? `?${qs}` : ""}`;
  }, []);
  const buildPath = React.useCallback((v: ListView) => {
    const qs = adminListsSearchParams(v.filter, v.q, v.page, v.pageSize).toString();
    return `/admin/listas${qs ? `?${qs}` : ""}`;
  }, []);

  const { filters, setFilters, data, fetching, error, refetch } =
    useAdminTableFetch<ListView, AdminListsPage>({
      buildUrl,
      buildPath,
      initialFilters: initial,
      initialData,
      shouldDebounce: (prev, next) => prev.q !== next.q,
    });

  // If the current page fell out of range (GC removed rows), hop back.
  React.useEffect(() => {
    if (data.rows.length === 0 && data.total > 0 && data.page > data.totalPages) {
      setFilters((prev) => ({ ...prev, page: data.totalPages }));
    }
  }, [data, setFilters]);

  // Filter chips — built from the stale-days value shipped by the server
  // (same labels the params module defines for the whole app).
  const chips = React.useMemo(() => adminListFilters(data.staleDays), [data.staleDays]);

  const hasActiveFilters = filters.filter !== "todas" || filters.q !== "";

  return (
    <div className="flex flex-col">
      {/* Summary chips (live) */}
      <div className="grid grid-cols-2 gap-3 border-b p-4 sm:grid-cols-4">
        <SummaryChip
          icon={<ListChecks className="h-4 w-4" />}
          tone="teal"
          label="Listas totales"
          value={data.totals.total.toLocaleString("es-ES")}
        />
        <SummaryChip
          icon={<Eye className="h-4 w-4" />}
          tone="cyan"
          label="Visitas acumuladas"
          value={data.totals.views.toLocaleString("es-ES")}
        />
        <SummaryChip
          icon={<Sparkles className="h-4 w-4" />}
          tone="amber"
          label="Obsoletas"
          value={data.staleCount.toLocaleString("es-ES")}
        />
        <SummaryChip
          icon={<Inbox className="h-4 w-4" />}
          tone="emerald"
          label="Resultados"
          value={data.total.toLocaleString("es-ES")}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtros de listas">
          {chips.map((c) => {
            const active = c.value === filters.filter;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, filter: c.value, page: 1 }))}
                aria-pressed={active}
                className={`inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                  active
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
              placeholder="Buscar por código o título…"
              className="h-9 w-full pl-9 sm:w-64"
              maxLength={60}
              type="search"
              aria-label="Buscar listas"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setFilters((prev) => ({ ...prev, filter: "todas", q: "", page: 1 }))}
            >
              <FilterX className="h-3.5 w-3.5" />
              Quitar
            </Button>
          )}
          {error && (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
              </span>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 px-2 text-xs" onClick={refetch}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
            </>
          )}
          {fetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Cargando" />
          )}
        </div>
      </div>

      {/* Table / states */}
      <div
        className={fetching && data.rows.length > 0 ? "opacity-60 transition-opacity" : "transition-opacity"}
        aria-busy={fetching}
      >
        {data.rows.length > 0 ? (
          <AdminListsTable
            lists={data.rows}
            csrfToken={csrfToken}
            staleCount={data.staleCount}
            staleDays={data.staleDays}
            onChanged={refetch}
          />
        ) : fetching ? (
          <div className="space-y-2 p-4" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="ml-auto h-4 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium">
                No hay listas que coincidan con el filtro{filters.q ? " o la búsqueda" : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Los usuarios crean listas públicas compartiendo sus favoritos.
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => setFilters((prev) => ({ ...prev, filter: "todas", q: "", page: 1 }))}
              >
                <FilterX className="h-3.5 w-3.5" />
                Quitar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {(data.totalPages > 1 || data.total > 0) && (
        <div className="border-t px-4 py-3">
          <AdminPagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            pageSizeOptions={pageSizes}
            onPageChange={(n) => setFilters((prev) => ({ ...prev, page: n }))}
            onPageSizeChange={(n) => setFilters((prev) => ({ ...prev, pageSize: n, page: 1 }))}
            disabled={fetching}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const TONES: Record<string, string> = {
  teal: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40",
  cyan: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40",
  amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
};

function SummaryChip({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${TONES[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tabular-nums tracking-tight">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
