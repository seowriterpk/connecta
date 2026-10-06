"use client";

import * as React from "react";
import { useInView } from "framer-motion";
import { Users, Star, Globe2, CheckCircle2, BarChart3, MapPin } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

interface Metrics {
  groups: number;
  categories: number;
  countries: number;
  pending: number;
  reports: number;
  newsletter: number;
  featured: number;
  members: number;
  regions: { region: string; count: number }[];
  topCountries: { name: string; flag: string; count: number }[];
}

function useCountUp(target: number, inView: boolean, duration = 1200) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, inView, duration]);
  return val;
}

function fmt(n: number): string {
  return n.toLocaleString("es-ES");
}

function Metric({
  value,
  suffix = "",
  label,
  icon: Icon,
  color,
}: {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ElementType;
  color: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const v = useCountUp(value, inView);
  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-4 text-center shadow-sm"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="text-2xl font-extrabold tabular-nums sm:text-3xl">
        {fmt(v)}
        <span className="text-primary">{suffix}</span>
      </div>
      <div className="text-xs leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}

export function MetricsSection({ metrics }: { metrics: Metrics }) {
  const maxRegion = Math.max(1, ...metrics.regions.map((r) => r.count));
  const maxCountry = Math.max(1, ...metrics.topCountries.map((c) => c.count));

  return (
    <section className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <Reveal>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              ConectaGrupos en cifras
            </h2>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Transparencia total: esto es lo que hay dentro del directorio ahora mismo. Actualizado
            en tiempo real con cada envío y revisión.
          </p>
        </Reveal>

        {/* Top metrics grid */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric value={metrics.groups} suffix="+" label="Grupos activos" icon={Users} color="bg-primary/10 text-primary" />
          <Metric value={metrics.categories} label="Categorías" icon={Star} color="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
          <Metric value={metrics.countries} label="Países hispanos" icon={Globe2} color="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
          <Metric value={metrics.featured} label="Destacados" icon={Star} color="bg-rose-500/10 text-rose-600 dark:text-rose-400" />
          <Metric
            value={Math.round(metrics.members / 1000)}
            suffix="k+"
            label="Miembros totales"
            icon={Users}
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <Metric value={metrics.newsletter} label="Suscritos" icon={CheckCircle2} color="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
        </div>

        {/* Breakdowns */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Regions bar chart */}
          <Reveal>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Globe2 className="h-4 w-4 text-primary" /> Grupos por región
              </h3>
              <div className="mt-4 space-y-2.5">
                {metrics.regions.map((r) => (
                  <div key={r.region} className="flex items-center gap-3">
                    <div className="w-32 shrink-0 truncate text-xs text-muted-foreground sm:w-40">
                      {r.region}
                    </div>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-700"
                        style={{ width: `${(r.count / maxRegion) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums">
                      {r.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Top countries */}
          <Reveal delay={0.08}>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Top países por grupos
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {metrics.topCountries.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-lg">{c.flag}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.count} grupos</span>
                    </span>
                    <div className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(c.count / maxCountry) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
