import Link from "next/link";
import { Rocket, TrendingUp, TrendingDown, ArrowRight, Activity } from "lucide-react";
import type { TrendingMover } from "@/lib/data";
import { GroupImage } from "@/components/site/group-image";
import { CompareIconButton } from "@/components/site/compare-button";
import { Sparkline } from "@/components/site/sparkline";
import { Reveal } from "@/components/site/reveal";

/**
 * "En ascenso" — groups with the strongest 7-day view growth vs the previous
 * week, backed by the group_daily_stats time-series. Server component; the
 * sparkline is a plain inline SVG (no client JS needed).
 */
export function MoversSection({ movers }: { movers: TrendingMover[] }) {
  if (movers.length === 0) return null;

  return (
    <section aria-labelledby="movers-heading" className="mt-12">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              <Rocket className="h-3.5 w-3.5" aria-hidden /> En ascenso
            </div>
            <h2
              id="movers-heading"
              className="mt-2.5 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Los grupos que más crecen esta semana
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              Ranking por aumento de vistas en los últimos 7 días frente a la semana
              anterior. Detección temprana de comunidades que están despegando.
            </p>
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span>Serie de 14 días · actualizado a diario</span>
          </div>
        </div>

        {/* Mover rows */}
        <div className="space-y-2.5">
          {movers.map((m, i) => (
            <Reveal key={m.group.id} delay={Math.min(i * 0.04, 0.24)}>
              <Link
                href={`/grupo/${m.group.slug}`}
                title={m.group.title}
                className="group relative block overflow-hidden rounded-2xl border bg-card p-3.5 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 sm:p-4"
              >
                {/* Emerald left accent (growth semantics) */}
                <span
                  className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500 opacity-70 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-[0.07] blur-2xl transition group-hover:opacity-20"
                  aria-hidden
                />

                <div className="flex items-center gap-3 pl-1.5 sm:gap-4 sm:pl-2">
                  {/* Rank */}
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-sm font-extrabold tabular-nums text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300"
                    aria-label={`Puesto ${i + 1} en crecimiento`}
                  >
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <GroupImage
                    src={m.group.imageUrl}
                    alt={m.group.title}
                    title={m.group.title}
                    size={48}
                    className="shrink-0 rounded-xl transition duration-300 group-hover:scale-105"
                    fallbackEmoji={m.group.category?.icon}
                  />

                  {/* Title + meta */}
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-emerald-700 sm:text-base dark:group-hover:text-emerald-300">
                      {m.group.title}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {m.group.country && (
                        <span className="inline-flex items-center gap-1">
                          {m.group.country.flag} {m.group.country.name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        {m.group.category?.icon} {m.group.category?.name}
                      </span>
                    </div>
                  </div>

                  {/* Sparkline (hidden on very small screens) */}
                  <div className="hidden shrink-0 sm:block" aria-hidden>
                    <Sparkline data={m.series} uid={m.group.slug} />
                  </div>

                  {/* Growth numbers */}
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {m.weekViews.toLocaleString("es-ES")}{" "}
                      <span className="font-normal text-muted-foreground">vistas · 7d</span>
                    </span>
                    <DeltaBadge delta={m.delta} deltaPct={m.deltaPct} />
                  </div>

                  {/* Compare shortcut + CTA */}
                  <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                    <CompareIconButton slug={m.group.slug} title={m.group.title} />
                    <span
                      className="hidden h-8 w-8 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors group-hover:border-emerald-500/40 group-hover:text-emerald-600 md:grid dark:group-hover:text-emerald-300"
                      aria-hidden
                    >
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          El crecimiento compara las vistas de los últimos 7 días con la semana
          anterior. Se recalcula a diario con la actividad real del directorio.
        </p>
      </div>
    </section>
  );
}

function DeltaBadge({ delta, deltaPct }: { delta: number; deltaPct: number | null }) {
  const rising = delta > 0;
  const flat = delta === 0;
  const Icon = rising ? TrendingUp : TrendingDown;
  const label = flat
    ? "sin cambios"
    : `${rising ? "+" : ""}${delta.toLocaleString("es-ES")}${deltaPct !== null ? ` · ${deltaPct > 0 ? "+" : ""}${deltaPct}%` : ""}`;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        flat
          ? "bg-muted text-muted-foreground"
          : rising
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      }`}
      title={flat ? "Mismo volumen que la semana pasada" : `Cambio frente a la semana anterior: ${label} vistas`}
    >
      {!flat && <Icon className="h-3 w-3" aria-hidden />}
      {label}
    </span>
  );
}
