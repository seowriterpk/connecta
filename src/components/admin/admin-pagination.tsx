import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowDownWideNarrow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Page-number window with ellipses (pure, shared by both render modes)
// ---------------------------------------------------------------------------

/** Compact window around `current` with leading/trailing ellipses. */
export function buildPageWindow(
  current: number,
  totalPages: number,
  windowSize = 1
): (number | "ellipsis-start" | "ellipsis-end")[] {
  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];
  const start = Math.max(2, current - windowSize);
  const end = Math.min(totalPages - 1, current + windowSize);

  pages.push(1);
  if (start > 2) pages.push("ellipsis-start");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("ellipsis-end");
  if (totalPages > 1) pages.push(totalPages);
  return pages;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  page: number;
  totalPages: number;
  /** Link mode (server pages): href builder for page N. */
  hrefFn?: (n: number) => string;
  /** Callback mode (client tables): called on page change. */
  onPageChange?: (n: number) => void;
  /** Total rows — enables the "Mostrando X–Y de Z" summary. */
  total?: number;
  pageSize?: number;
  /** Page-size selector (callback mode only). */
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (n: number) => void;
  /** Disable every control while a fetch is in flight. */
  disabled?: boolean;
  className?: string;
}

/**
 * AdminPagination — shared paginator for every admin table.
 *
 * Two mutually compatible modes:
 *  - Link mode (`hrefFn`): server-rendered <Link>s (legacy server pages).
 *  - Callback mode (`onPageChange`): instant client-side fetch tables.
 *
 * Hook-free on purpose so the same module can render inside server
 * components (ugc, contribuidores) and inside client explorers without a
 * 'use client' boundary breaking function props.
 */
export function AdminPagination({
  page,
  totalPages,
  hrefFn,
  onPageChange,
  total,
  pageSize,
  pageSizeOptions = [25, 50, 100],
  onPageSizeChange,
  disabled = false,
  className,
}: Props) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const window = buildPageWindow(current, totalPages);
  const first = pageSize ? (current - 1) * pageSize + 1 : 0;
  const last = pageSize ? Math.min(current * pageSize, total ?? 0) : 0;
  const hasSummary = typeof total === "number" && typeof pageSize === "number";

  const navBtn =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border px-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40";
  const idleBtn = "bg-background hover:bg-accent hover:text-accent-foreground";
  const activeBtn = "border-emerald-600 bg-emerald-600 text-white shadow-sm";

  const prevDisabled = current <= 1 || disabled;
  const nextDisabled = current >= totalPages || disabled;
  const hasSideContent = hasSummary || Boolean(onPageSizeChange && pageSize);

  return (
    <nav
      aria-label="Paginación"
      className={cn(
        "flex flex-col items-center gap-3 sm:flex-row sm:items-center",
        hasSideContent ? "sm:justify-between" : "sm:justify-center",
        className
      )}
    >
      {/* Summary: "Mostrando X–Y de Z" */}
      {hasSummary && (
        <p
          className="text-xs tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {total === 0
            ? "Sin resultados"
            : `Mostrando ${first.toLocaleString("es-ES")}–${last.toLocaleString("es-ES")} de ${total.toLocaleString("es-ES")}`}
        </p>
      )}

      {/* Numbers */}
      <div className="flex items-center gap-1" role="group" aria-label="Páginas">
        {prevDisabled ? (
          <span className={cn(navBtn, "pointer-events-none opacity-40")}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </span>
        ) : hrefFn && !onPageChange ? (
          <Link
            href={hrefFn(current - 1)}
            rel="prev"
            aria-label="Página anterior"
            className={cn(navBtn, idleBtn)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onPageChange?.(current - 1)}
            aria-label="Página anterior"
            className={cn(navBtn, idleBtn)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {window.map((p, i) => {
          if (p === "ellipsis-start" || p === "ellipsis-end") {
            return (
              <span
                key={`ellipsis-${i}`}
                className="grid h-9 min-w-9 place-items-center px-1"
                aria-hidden
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </span>
            );
          }
          if (p === current) {
            return (
              <span
                key={p}
                aria-current="page"
                className={cn(navBtn, activeBtn)}
              >
                {p}
              </span>
            );
          }
          return hrefFn && !onPageChange ? (
            <Link
              key={p}
              href={hrefFn(p)}
              aria-label={`Página ${p}`}
              className={cn(navBtn, idleBtn)}
            >
              {p}
            </Link>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange?.(p)}
              aria-label={`Página ${p}`}
              className={cn(navBtn, idleBtn)}
            >
              {p}
            </button>
          );
        })}

        {nextDisabled ? (
          <span className={cn(navBtn, "pointer-events-none opacity-40")}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Página siguiente</span>
          </span>
        ) : hrefFn && !onPageChange ? (
          <Link
            href={hrefFn(current + 1)}
            rel="next"
            aria-label="Página siguiente"
            className={cn(navBtn, idleBtn)}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onPageChange?.(current + 1)}
            aria-label="Página siguiente"
            className={cn(navBtn, idleBtn)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Page size selector (client mode only) */}
      {onPageSizeChange && pageSize ? (
        <div className="flex items-center gap-2">
          <label
            htmlFor="admin-page-size"
            className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
          >
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
            Filas
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger
              id="admin-page-size"
              size="sm"
              className="h-8 w-[76px]"
              aria-label="Filas por página"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / pág.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </nav>
  );
}
