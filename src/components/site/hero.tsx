"use client";

import * as React from "react";
import { Search, ShieldCheck, Users, Globe2, Sparkles } from "lucide-react";
import { useGroupsFilter } from "@/lib/store";
import type { StatsDTO } from "@/lib/types";
import { RandomGroupButton } from "@/components/site/random-group-button";
import { AdultModeToggle } from "@/components/site/adult-toggle";

function Stat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/70 px-3.5 py-2.5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-md">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-base font-bold leading-tight tabular-nums">{value}</div>
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

const BUBBLES = [
  { text: "👋 ¡Hola!", rot: -8, cls: "left-[6%] top-[18%] hidden md:flex", delay: "0s" },
  { text: "☕ Amigos del café", rot: 6, cls: "right-[8%] top-[22%] hidden md:flex", delay: "0.6s" },
  { text: "⚽ Fútbol", rot: -4, cls: "left-[12%] bottom-[12%] hidden lg:flex", delay: "1.2s" },
  { text: "🎮 Gamers", rot: 8, cls: "right-[14%] bottom-[10%] hidden lg:flex", delay: "1.8s" },
];

export function Hero({ stats, totalCountries }: { stats: StatsDTO; totalCountries: number }) {
  const setSearch = useGroupsFilter((s) => s.setSearch);
  const search = useGroupsFilter((s) => s.search);
  const [local, setLocal] = React.useState(search);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(local), 250);
    return () => clearTimeout(t);
  }, [local, setSearch]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(local);
    document.getElementById("grupos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="inicio" className="cg-mesh relative overflow-hidden">
      <div className="cg-hero-grid absolute inset-0 opacity-60" aria-hidden />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden />

      {/* Floating chat bubbles */}
      {BUBBLES.map((b) => (
        <div
          key={b.text}
          aria-hidden
          className={`cg-bubble pointer-events-none absolute ${b.cls}`}
          style={{ ["--rot" as any]: `${b.rot}deg`, animationDelay: b.delay }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-card/80 px-3 py-2 text-xs font-medium text-foreground/80 shadow-md ring-1 ring-border/60 backdrop-blur"
            style={{ transform: `rotate(${b.rot}deg)` }}
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            {b.text}
          </span>
        </div>
      ))}

      <div className="container relative mx-auto px-4 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Directorio en español · 100% gratis
          </span>
          <h1 className="mt-5 text-balance text-[2rem] font-extrabold leading-[1.15] tracking-tight sm:mt-6 sm:text-5xl sm:leading-[1.1] lg:text-6xl">
            Encuentra los mejores{" "}
            <span className="cg-gradient-text">grupos de WhatsApp</span> en español
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Organizados por categoría, país e idioma. Descubre comunidades activas,
            comparte las tuyas y conéctate con personas que comparten tus intereses —
            de España a toda Hispanoamérica.
          </p>

          <form onSubmit={submit} className="mx-auto mt-7 flex w-full max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                type="search"
                inputMode="search"
                aria-label="Buscar grupos de WhatsApp"
                placeholder="Busca: fútbol, memes, inglés, emprendimiento…"
                className="h-12 w-full rounded-xl border border-border bg-background/90 pl-11 pr-4 text-sm shadow-sm outline-none ring-ring transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="hidden h-12 shrink-0 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] sm:inline-flex"
            >
              Buscar
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <AdultModeToggle variant="hero" />
            <span className="hidden text-[11px] text-muted-foreground/80 sm:inline">
              Contenido adulto separado · solo si lo activas
            </span>
          </div>

          <div className="mt-8 border-t border-border/40 pt-6 [mask-image:linear-gradient(to_bottom,transparent,black_18px)] sm:mt-9">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Stat value={`${stats.groups}+`} label="Grupos activos" icon={Users} />
              <Stat value={`${stats.categories}`} label="Categorías" icon={Sparkles} />
              <Stat value={`${totalCountries}`} label="Países hispanos" icon={Globe2} />
              <Stat value={stats.members > 1000 ? `${Math.round(stats.members / 1000)}k+` : `${stats.members}`} label="Miembros" icon={ShieldCheck} />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center">
            <RandomGroupButton />
          </div>
        </div>
      </div>
    </section>
  );
}
