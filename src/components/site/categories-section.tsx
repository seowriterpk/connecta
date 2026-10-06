"use client";

import * as React from "react";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useGroupsFilter } from "@/lib/store";
import type { CategoryDTO } from "@/lib/types";
import { StaggerGrid, StaggerItem } from "@/components/site/reveal";

const COLOR_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", ring: "hover:ring-emerald-400/50" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-300", ring: "hover:ring-rose-400/50" },
  fuchsia: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-700 dark:text-fuchsia-300", ring: "hover:ring-fuchsia-400/50" },
  sky: { bg: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-300", ring: "hover:ring-sky-400/50" },
  slate: { bg: "bg-slate-500/10", text: "text-slate-700 dark:text-slate-300", ring: "hover:ring-slate-400/50" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-700 dark:text-teal-300", ring: "hover:ring-teal-400/50" },
  lime: { bg: "bg-lime-500/10", text: "text-lime-700 dark:text-lime-300", ring: "hover:ring-lime-400/50" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-300", ring: "hover:ring-violet-400/50" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", ring: "hover:ring-amber-400/50" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-300", ring: "hover:ring-yellow-400/50" },
  stone: { bg: "bg-stone-500/10", text: "text-stone-700 dark:text-stone-300", ring: "hover:ring-stone-400/50" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", ring: "hover:ring-orange-400/50" },
  red: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-300", ring: "hover:ring-red-400/50" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-300", ring: "hover:ring-cyan-400/50" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-300", ring: "hover:ring-indigo-400/50" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-300", ring: "hover:ring-blue-400/50" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-700 dark:text-pink-300", ring: "hover:ring-pink-400/50" },
  green: { bg: "bg-green-500/10", text: "text-green-700 dark:text-green-300", ring: "hover:ring-green-400/50" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-300", ring: "hover:ring-purple-400/50" },
};

export function CategoriesSection({ categories }: { categories: CategoryDTO[] }) {
  const setCategory = useGroupsFilter((s) => s.setCategory);

  function pick(id: string) {
    setCategory(id);
    document.getElementById("grupos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="categorias" className="border-t bg-background/50">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Explora por categorías
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {categories.length} temáticas organizizadas para que encuentres justo la comunidad que buscas —
              desde amistad y estudios hasta deportes, cocina y tecnología.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos los grupos <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <StaggerGrid className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((c) => {
            const st = COLOR_STYLES[c.color] ?? COLOR_STYLES.emerald;
            return (
              <StaggerItem key={c.id}>
                <Link
                  href={`/categoria/${c.slug}`}
                  className="group relative flex h-full w-full flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left shadow-sm ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${st.bg} ${st.text}`}>
                    {c.icon}
                  </span>
                  <span className="line-clamp-2 text-sm font-semibold leading-tight">{c.name}</span>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {c.groupCount} grupos
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      </div>
    </section>
  );
}
