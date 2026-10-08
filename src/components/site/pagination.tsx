"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  basePath: string; // e.g. "/categoria/tecnologia"
  page: number;
  totalPages: number;
}

function getPageRange(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (page > 3) pages.push("...");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export function Pagination({ basePath, page, totalPages }: PaginationProps) {
  const router = useRouter();
  if (totalPages <= 1) return null;

  const pages = getPageRange(page, totalPages);

  function go(p: number) {
    if (p < 1 || p > totalPages || p === page) return;
    const url = p === 1 ? basePath : `${basePath}?page=${p}`;
    router.push(url);
  }

  return (
    <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-1.5">
      {/* Prev */}
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-10 items-center gap-1 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-accent disabled:opacity-40 disabled:hover:bg-background"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="grid h-10 w-10 place-items-center text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              key={p}
              onClick={() => go(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-medium transition ${
                p === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-accent"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-10 items-center gap-1 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-accent disabled:opacity-40 disabled:hover:bg-background"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
