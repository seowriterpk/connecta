import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  hrefFn: (n: number) => string;
  maxPagesShown?: number;
}

/**
 * Server-rendered pagination for admin pages.
 * Renders /pagina/N-style URLs via the hrefFn callback.
 */
export function AdminPagination({ page, totalPages, hrefFn, maxPagesShown = 7 }: Props) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);
  const pages: (number | "...")[] = [];

  if (totalPages <= maxPagesShown) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const start = Math.max(2, current - 2);
    const end = Math.min(totalPages - 1, current + 2);
    pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  const baseBtn =
    "grid h-9 min-w-9 place-items-center rounded-md border text-sm transition-colors";
  const activeBtn = "border-emerald-600 bg-emerald-600 text-white";
  const idleBtn = "bg-background hover:bg-accent hover:text-accent-foreground";

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-center gap-1.5"
    >
      {current > 1 ? (
        <Link
          href={hrefFn(current - 1)}
          rel="prev"
          aria-label="Página anterior"
          className={cn(baseBtn, idleBtn, "px-2")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span
          aria-disabled
          className={cn(baseBtn, "pointer-events-none px-2 opacity-40")}
        >
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className={cn(baseBtn, "border-transparent")}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </span>
        ) : p === current ? (
          <span
            key={p}
            aria-current="page"
            className={cn(baseBtn, activeBtn)}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFn(p)}
            className={cn(baseBtn, idleBtn)}
            aria-label={`Página ${p}`}
          >
            {p}
          </Link>
        )
      )}

      {current < totalPages ? (
        <Link
          href={hrefFn(current + 1)}
          rel="next"
          aria-label="Página siguiente"
          className={cn(baseBtn, idleBtn, "px-2")}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          aria-disabled
          className={cn(baseBtn, "pointer-events-none px-2 opacity-40")}
        >
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
