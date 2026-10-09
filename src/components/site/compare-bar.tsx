"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Scale, X, ArrowRight } from "lucide-react";
import { useCompare, MAX_COMPARE } from "@/lib/compare";
import { GroupImage } from "@/components/site/group-image";
import type { GroupDTO } from "@/lib/types";

/**
 * Floating "comparando" bar — appears on every route (except /comparar itself)
 * when the user has 1+ groups selected for comparison.
 * Lets them keep browsing, remove groups, or jump straight to the tool.
 */
export function CompareBar() {
  const pathname = usePathname();
  const slugs = useCompare((s) => s.slugs);
  const remove = useCompare((s) => s.remove);
  const clearAll = useCompare((s) => s.clearAll);
  const hydrated = useCompare((s) => s.hydrated);

  const [groups, setGroups] = React.useState<GroupDTO[]>([]);

  // Fetch display data (titles/avatars) for the selected slugs.
  React.useEffect(() => {
    let cancelled = false;
    if (slugs.length === 0) {
      setGroups([]);
      return;
    }
    fetch(`/api/groups/compare?slugs=${encodeURIComponent(slugs.join(","))}&XTransformPort=3000`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.ok && Array.isArray(json.data?.groups)) {
          setGroups(json.data.groups as GroupDTO[]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slugs]);

  // Hidden on /comparar (the tool itself) and on all admin routes (admin
  // pages are a workspace — the public compare bar only obscures controls).
  const isAdmin = pathname.startsWith("/admin");
  const visible = hydrated && slugs.length > 0 && pathname !== "/comparar" && !isAdmin;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center pl-3 pr-[5rem] pb-[env(safe-area-inset-bottom)] sm:bottom-5 sm:pl-[15rem] sm:pr-[5.5rem] lg:pl-3 lg:pr-3"
          role="region"
          aria-label="Selección de comparación"
        >
          <div className="pointer-events-auto flex w-full max-w-[560px] items-center gap-2 overflow-hidden rounded-2xl border border-teal-500/30 bg-background/95 py-2 pl-3 pr-2 shadow-xl shadow-teal-500/10 backdrop-blur-md sm:gap-2.5 sm:pl-3.5">
            {/* Icon + counter */}
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/30">
              <Scale className="h-4 w-4" />
            </span>
            <span className="shrink-0 text-xs font-bold tabular-nums text-foreground">
              {slugs.length}/{MAX_COMPARE}
            </span>

            {/* Selected group chips */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(groups.length > 0 ? groups : slugs.map((s) => ({ slug: s }) as GroupDTO)).map((g) => {
                const idx = slugs.indexOf(g.slug);
                const known = groups.length > 0;
                return (
                  <span
                    key={g.slug}
                    className="group/chip inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-1 pr-2 text-xs font-medium text-foreground/90 transition hover:border-teal-500/40"
                  >
                    {known ? (
                      <GroupImage src={g.imageUrl} alt="" title={g.title} size={18} className="rounded-full" fallbackEmoji={g.category?.icon} />
                    ) : (
                      <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-muted text-[10px] text-muted-foreground">{idx + 1}</span>
                    )}
                    <span className="max-w-[9ch] truncate sm:max-w-[16ch]">{known ? g.title : g.slug}</span>
                    <button
                      aria-label={`Quitar ${known ? g.title : g.slug} de la comparación`}
                      onClick={() => remove(g.slug)}
                      className="grid h-4 w-4 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                );
              })}
              {slugs.length < MAX_COMPARE && (
                <Link
                  href="/comparar"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-teal-500/40 px-2.5 py-1 text-xs font-medium text-teal-700 transition hover:bg-teal-500/10 dark:text-teal-300"
                >
                  + Añadir
                </Link>
              )}
            </div>

            {/* Primary CTA */}
            <Link
              href="/comparar"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/30 transition-all hover:shadow-lg hover:shadow-teal-500/40 hover:brightness-110 sm:px-4"
            >
              Comparar
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {/* Dismiss / clear */}
            <button
              aria-label="Vaciar comparación"
              onClick={clearAll}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
