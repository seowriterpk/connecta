"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Flag,
  Inbox,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTableFetch } from "@/components/admin/use-admin-table-fetch";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  adminReportsSearchParams,
  type AdminReportStatusFilter,
  type AdminReportsPage,
} from "@/lib/admin-listing-params";
import { AdminReportsTable } from "./admin-reports-table";

interface Props {
  initialData: AdminReportsPage;
  initialStatus: AdminReportStatusFilter;
  initialPage: number;
  initialPageSize: number;
  csrfToken: string;
  pageSizes?: readonly number[];
}

interface ReportView {
  status: AdminReportStatusFilter;
  page: number;
  pageSize: number;
}

const TABS: { value: AdminReportStatusFilter; label: string }[] = [
  { value: "OPEN", label: "Abiertos" },
  { value: "RESOLVED", label: "Resueltos" },
  { value: "DISMISSED", label: "Descartados" },
  { value: "all", label: "Todos" },
];

const TAB_ICONS: Record<AdminReportStatusFilter, React.ComponentType<{ className?: string }>> = {
  OPEN: Flag,
  RESOLVED: CheckCircle2,
  DISMISSED: XCircle,
  all: Inbox,
};

const EMPTY_COPY: Record<AdminReportStatusFilter, { title: string; hint: string }> = {
  OPEN: {
    title: "No hay reportes abiertos",
    hint: "Genial: la bandeja de denuncias está al día.",
  },
  RESOLVED: {
    title: "Aún no hay reportes resueltos",
    hint: "Los reportes que marques como resueltos aparecerán aquí.",
  },
  DISMISSED: {
    title: "Aún no hay reportes descartados",
    hint: "Los reportes descartados se archivan en esta pestaña.",
  },
  all: {
    title: "Todavía no hay reportes",
    hint: "Cuando los usuarios denuncien grupos, aparecerán aquí.",
  },
};

/**
 * AdminReportsExplorer — instant status-tab filtering for the reports table.
 */
export function AdminReportsExplorer({
  initialData,
  initialStatus,
  initialPage,
  initialPageSize,
  csrfToken,
  pageSizes,
}: Props) {
  const initial: ReportView = {
    status: initialStatus,
    page: initialPage,
    pageSize: initialPageSize,
  };

  const buildUrl = React.useCallback((v: ReportView) => {
    const qs = adminReportsSearchParams(v.status, v.page, v.pageSize).toString();
    return `/api/admin/reportes${qs ? `?${qs}` : ""}`;
  }, []);
  const buildPath = React.useCallback((v: ReportView) => {
    const qs = adminReportsSearchParams(v.status, v.page, v.pageSize).toString();
    return `/admin/reportes${qs ? `?${qs}` : ""}`;
  }, []);

  const { filters, setFilters, data, fetching, error, refetch } =
    useAdminTableFetch<ReportView, AdminReportsPage>({
      buildUrl,
      buildPath,
      initialFilters: initial,
      initialData,
    });

  // If the current page fell out of range after resolving/dismissing rows,
  // hop back to the last valid page.
  React.useEffect(() => {
    if (data.rows.length === 0 && data.total > 0 && data.page > data.totalPages) {
      setFilters((prev) => ({ ...prev, page: data.totalPages }));
    }
  }, [data, setFilters]);

  const countFor = (s: AdminReportStatusFilter): number => {
    const c = data.counts;
    if (s === "all") return c.all;
    return c[s];
  };

  const empty = EMPTY_COPY[filters.status];

  return (
    <div className="flex flex-col">
      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b p-3" role="tablist" aria-label="Estado de los reportes">
        {TABS.map((t) => {
          const Icon = TAB_ICONS[t.value];
          const active = filters.status === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilters((prev) => ({ ...prev, status: t.value, page: 1 }))}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                active
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {countFor(t.value).toLocaleString("es-ES")}
              </span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          {error && (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </span>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={refetch}>
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
          <AdminReportsTable reports={data.rows} csrfToken={csrfToken} onChanged={refetch} />
        ) : fetching ? (
          <div className="space-y-2 p-4" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium">{empty.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{empty.hint}</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-1 text-muted-foreground">
              <Link href="/admin/grupos">Ir a gestión de grupos</Link>
            </Button>
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
