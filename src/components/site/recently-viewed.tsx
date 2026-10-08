"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronLeft, ChevronRight, Users, ArrowUpRight, Trash2 } from "lucide-react";
import { useRecent } from "@/lib/recent";
import { GroupImage } from "@/components/site/group-image";

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${n}`;
}

/**
 * RecentlyViewed — homepage strip of the last groups the visitor opened.
 * Pure client (localStorage `cg-recent`); renders nothing until hydrated
 * and only when there is history — first-time visitors never see it.
 */
export function RecentlyViewed() {
  const items = useRecent((s) => s.items);
  const hydrated = useRecent((s) => s.hydrated);
  const clear = useRecent((s) => s.clear);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Hide from first-time visitors and during SSR/hydration
  const visible = hydrated && items.length > 0;

  const updateArrows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [visible, items.length, updateArrows]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(480, el.clientWidth * 0.85), behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <section aria-label="Grupos vistos recientemente" className="relative">
      <div className="container mx-auto px-4 pt-10 sm:pt-12">
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {/* Section header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <History className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
                  </span>
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight sm:text-2xl">
                    Vistos recientemente
                  </h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Continúa donde lo dejaste · guardado en tu dispositivo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Desktop scroll controls */}
                <div className="hidden items-center gap-1 sm:flex">
                  <button
                    onClick={() => scrollBy(-1)}
                    disabled={!canScrollLeft}
                    aria-label="Desplazar a la izquierda"
                    className="grid h-8 w-8 place-items-center rounded-full border bg-card text-muted-foreground shadow-sm transition hover:border-teal-400/50 hover:text-teal-600 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-teal-400"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollBy(1)}
                    disabled={!canScrollRight}
                    aria-label="Desplazar a la derecha"
                    className="grid h-8 w-8 place-items-center rounded-full border bg-card text-muted-foreground shadow-sm transition hover:border-teal-400/50 hover:text-teal-600 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-teal-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={clear}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Vaciar</span>
                </button>
              </div>
            </div>

            {/* Horizontal strip */}
            <div
              ref={scrollerRef}
              className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
            >
              {items.map((g, i) => (
                <motion.div
                  key={g.id}
                  role="listitem"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.25 }}
                  className="w-[240px] shrink-0 snap-start sm:w-[264px]"
                >
                  <Link
                    href={`/grupo/${g.slug}`}
                    className="group relative flex h-full flex-col gap-2.5 rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/50 hover:shadow-lg hover:shadow-teal-500/10"
                  >
                    {/* Corner glow */}
                    <span
                      className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-teal-500/10 blur-2xl opacity-0 transition duration-500 group-hover:opacity-100"
                      aria-hidden
                    />
                    <div className="flex items-center gap-3">
                      <GroupImage
                        src={g.imageUrl}
                        alt={g.title}
                        title={g.title}
                        size={44}
                        className="rounded-xl transition-transform duration-300 group-hover:scale-105"
                        fallbackEmoji={g.category?.icon}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          {g.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {g.country?.flag && <span>{g.country.flag}</span>}
                          {g.country?.name && (
                            <span className="truncate">{g.country.name}</span>
                          )}
                          <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                            <Users className="h-3 w-3" />
                            {fmt(g.members)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="line-clamp-1 text-xs text-muted-foreground/90">
                      {g.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        {g.category?.icon} {g.category?.name ?? "Grupo"}
                      </span>
                      <span className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition-all duration-300 group-hover:bg-teal-600 group-hover:text-white">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
