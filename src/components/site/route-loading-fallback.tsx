import { Loader2 } from "lucide-react";

/**
 * Shared navigation loading fallback (task 13-b).
 * Used by the root loading.tsx AND by per-segment loading.tsx files
 * (grupo/[slug], categoria/[slug], pais/[code], guias, guias/[slug],
 * populares, buscar). Segment-level boundaries are what make the fallback
 * appear INSTANTLY on client-side navigation (a root-only boundary stays
 * committed during transitions and never flashes).
 */
export default function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center container mx-auto px-4 py-16">
      <span className="sr-only">Cargando…</span>
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      <div className="mt-8 w-full max-w-3xl space-y-3" aria-hidden>
        <div className="cg-skeleton h-4 w-2/3 rounded-full" />
        <div className="cg-skeleton h-3 w-full rounded-full" />
        <div className="cg-skeleton h-3 w-5/6 rounded-full" />
      </div>
    </div>
  );
}
