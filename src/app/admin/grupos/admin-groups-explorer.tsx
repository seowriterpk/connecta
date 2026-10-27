"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  FilterX,
  AlertCircle,
  RotateCcw,
  Inbox,
  UploadCloud,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTableFetch } from "@/components/admin/use-admin-table-fetch";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  adminGroupsSearchParams,
  GROUP_PAGE_SIZES,
  type AdminGroupsFilters,
  type AdminGroupsPage,
  type AdminGroupSort,
  type SortDir,
} from "@/lib/admin-listing-params";
import { AdminGroupsTable } from "./admin-groups-table";

interface Props {
  initialData: AdminGroupsPage;
  initialFilters: AdminGroupsFilters;
  categories: { id: string; name: string }[];
  countries: { id: string; name: string }[];
  csrfToken: string;
  adminUser: string;
  pageSizes?: readonly number[];
}

const DEFAULT_FILTERS: AdminGroupsFilters = {
  q: "",
  status: "all",
  linkStatus: "all",
  category: "all",
  country: "all",
  adult: "all",
  sort: "created",
  dir: "desc",
  page: 1,
  pageSize: 25,
};

/** Combined "orden" select value: sort + direction in one user-facing choice. */
const ORDER_OPTIONS: { value: string; label: string }[] = [
  { value: "created-desc", label: "Más recientes primero" },
  { value: "created-asc", label: "Más antiguos primero" },
  { value: "name-asc", label: "Nombre (A–Z)" },
  { value: "name-desc", label: "Nombre (Z–A)" },
  { value: "clicks-desc", label: "Más clics primero" },
  { value: "clicks-asc", label: "Menos clics primero" },
  { value: "views-desc", label: "Más visitas primero" },
  { value: "views-asc", label: "Menos visitas primero" },
  { value: "status-asc", label: "Estado (A–Z)" },
  { value: "status-desc", label: "Estado (Z–A)" },
];

/**
 * AdminGroupsExplorer — instant client-side filtering for the groups table.
 * The first page arrives server-rendered; every change afterwards is an
 * aborted-safe background fetch (shareable URL kept in sync, zero full
 * page reloads).
 */
export function AdminGroupsExplorer({
  initialData,
  initialFilters,
  categories,
  countries,
  csrfToken,
  adminUser,
  pageSizes = GROUP_PAGE_SIZES,
}: Props) {
  const buildUrl = React.useCallback((f: AdminGroupsFilters) => {
    const qs = adminGroupsSearchParams(f).toString();
    return `/api/admin/grupos${qs ? `?${qs}` : ""}`;
  }, []);
  const buildPath = React.useCallback((f: AdminGroupsFilters) => {
    const qs = adminGroupsSearchParams(f).toString();
    return `/admin/grupos${qs ? `?${qs}` : ""}`;
  }, []);

  const { filters, setFilters, data, fetching, error, refetch } = useAdminTableFetch<
    AdminGroupsFilters,
    AdminGroupsPage
  >({
    buildUrl,
    buildPath,
    initialFilters,
    initialData,
    // Only free-text search debounces; selects/pages apply instantly.
    shouldDebounce: (prev, next) => prev.q !== next.q,
  });

  const patch = React.useCallback((p: Partial<AdminGroupsFilters>) => {
    setFilters((prev) => ({ ...prev, ...p, page: p.page ?? 1 }));
  }, [setFilters]);

  const hasActiveFilters =
    filters.q !== "" ||
    filters.status !== "all" ||
    filters.linkStatus !== "all" ||
    filters.category !== "all" ||
    filters.country !== "all" ||
    filters.adult !== "all";

  const activeFilterCount = [
    filters.q !== "",
    filters.status !== "all",
    filters.linkStatus !== "all",
    filters.category !== "all",
    filters.country !== "all",
    filters.adult !== "all",
  ].filter(Boolean).length;

  // If the current page fell out of range (rows deleted / filters shrank),
  // hop back to the last valid page.
  React.useEffect(() => {
    if (data.rows.length === 0 && data.total > 0 && data.page > data.totalPages) {
      setFilters((prev) => ({ ...prev, page: data.totalPages }));
    }
  }, [data, setFilters]);

  const onSort = React.useCallback(
    (sort: AdminGroupSort) => {
      setFilters((prev) => ({
        ...prev,
        sort,
        dir: prev.sort === sort ? (prev.dir === "asc" ? "desc" : "asc") : sort === "name" || sort === "status" ? "asc" : "desc",
        page: 1,
      }));
    },
    [setFilters]
  );

  const orderValue = `${filters.sort}-${filters.dir}`;

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------ Filter toolbar */}
      <div className="border-b p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => patch({ q: e.target.value })}
              placeholder="Buscar por nombre, slug o enlace…"
              className="h-9 pl-9"
              maxLength={120}
              aria-label="Buscar grupos"
              inputMode="search"
              type="search"
            />
          </div>

          <SelectField label="Estado del grupo" value={filters.status} onValueChange={(v) => patch({ status: v as AdminGroupsFilters["status"] })}>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="live">Publicados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
            <SelectItem value="flagged">Marcados</SelectItem>
            <SelectItem value="pruned">Purgados</SelectItem>
          </SelectField>

          <SelectField label="Estado del enlace" value={filters.linkStatus} onValueChange={(v) => patch({ linkStatus: v as AdminGroupsFilters["linkStatus"] })}>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="revoked">Revocados</SelectItem>
            <SelectItem value="unknown">Desconocidos</SelectItem>
          </SelectField>

          <SelectField label="Categoría" value={filters.category} onValueChange={(v) => patch({ category: v })}>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectField>

          <SelectField label="País" value={filters.country} onValueChange={(v) => patch({ country: v })}>
            <SelectItem value="all">Todos</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectField>

          <SelectField label="Contenido" value={filters.adult} onValueChange={(v) => patch({ adult: v as AdminGroupsFilters["adult"] })}>
            <SelectItem value="all">General y 18+</SelectItem>
            <SelectItem value="exclude">Solo general</SelectItem>
            <SelectItem value="only">Solo 18+</SelectItem>
          </SelectField>

          <SelectField label="Ordenar por" value={orderValue} onValueChange={(v) => {
            const [sort, dir] = v.split("-") as [AdminGroupSort, SortDir];
            patch({ sort, dir });
          }}>
            {ORDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectField>
        </div>

        {/* Active filters + result summary */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums">
            {hasActiveFilters ? (
              <>
                {data.total.toLocaleString("es-ES")} de{" "}
                {data.unfilteredTotal.toLocaleString("es-ES")} grupos
              </>
            ) : (
              <>{data.total.toLocaleString("es-ES")} grupos</>
            )}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setFilters({ ...DEFAULT_FILTERS, pageSize: filters.pageSize })}
            >
              <FilterX className="h-3.5 w-3.5" />
              Quitar {activeFilterCount} filtro{activeFilterCount === 1 ? "" : "s"}
            </Button>
          )}
          <span className="sr-only" aria-live="polite">
            {fetching ? "Actualizando resultados" : `${data.total} resultados`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {error && (
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </span>
            )}
            {error && (
              <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={refetch}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
            )}
            {fetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Cargando" />
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Table / states */}
      <div
        className={fetching && data.rows.length > 0 ? "opacity-60 transition-opacity" : "transition-opacity"}
        aria-busy={fetching}
      >
        {data.rows.length > 0 ? (
          <AdminGroupsTable
            groups={data.rows}
            csrfToken={csrfToken}
            adminUser={adminUser}
            sort={filters.sort}
            dir={filters.dir}
            onSort={onSort}
            onChanged={refetch}
            fetching={fetching}
          />
        ) : fetching ? (
          <SkeletonTableRows pageSize={data.pageSize} />
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium">No hay grupos con estos filtros</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prueba a quitar algún filtro o amplía la búsqueda.
              </p>
            </div>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => setFilters({ ...DEFAULT_FILTERS, pageSize: filters.pageSize })}
              >
                <FilterX className="h-3.5 w-3.5" />
                Quitar filtros
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="mt-1">
                <Link href="/admin/bulk-upload">
                  <UploadCloud className="h-3.5 w-3.5" />
                  Importar grupos
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------ Pagination */}
      {(data.totalPages > 1 || data.total > 0) && (
        <div className="border-t px-4 py-3">
          <AdminPagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            pageSizeOptions={pageSizes}
            onPageChange={(n) => patch({ page: n })}
            onPageSizeChange={(n) => patch({ pageSize: n, page: 1 })}
            disabled={fetching}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function SelectField({
  label,
  value,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function SkeletonTableRows({ pageSize }: { pageSize: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden>
      {Array.from({ length: Math.min(pageSize, 8) }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}
