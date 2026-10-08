"use client";

import * as React from "react";
import { useInView } from "framer-motion";
import { ShieldCheck, Globe2, Zap, Heart, Users, Sparkles, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { TRUST_POINTS } from "@/lib/constants";
import type { StatsDTO } from "@/lib/types";

function useCountUp(target: number, inView: boolean, duration = 1400) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, inView, duration]);
  return val;
}

function fmtCount(n: number): string {
  return n.toLocaleString("es-ES");
}

function AnimatedStat({
  value,
  suffix = "",
  label,
  icon: Icon,
}: {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ElementType;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const v = useCountUp(value, inView);
  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="text-2xl font-extrabold tabular-nums sm:text-3xl">
        {fmtCount(v)}
        <span className="text-primary">{suffix}</span>
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

const ICONS: Record<string, React.ElementType> = {
  ShieldCheck,
  Globe2,
  Zap,
  Heart,
};

export function AboutSection({ stats }: { stats: StatsDTO }) {
  return (
    <section id="acerca" className="border-t bg-background">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> ¿Por qué ConectaGrupos?
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Un directorio pensado para personas, no para algoritmos
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No recopilamos tus datos ni te vendemos nada. Solo juntamos, en un solo lugar
              ordenado, los mejores grupos de WhatsApp en español. Punto.
            </p>
          </Reveal>
        </div>

        {/* Animated stats band */}
        <Reveal delay={0.1}>
          <div className="mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-6 rounded-2xl border bg-gradient-to-br from-primary/5 to-background p-6 sm:grid-cols-4">
            <AnimatedStat value={stats.groups} suffix="+" label="Grupos activos" icon={Users} />
            <AnimatedStat value={stats.categories} label="Categorías" icon={Sparkles} />
            <AnimatedStat value={stats.countries} label="Países hispanos" icon={Globe2} />
            <AnimatedStat
              value={Math.round(stats.members / 1000)}
              suffix="k+"
              label="Miembros totales"
              icon={MessageCircle}
            />
          </div>
        </Reveal>

        {/* Trust points */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((p, i) => {
            const Icon = ICONS[p.icon] ?? ShieldCheck;
            return (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="flex h-full flex-col items-start gap-3 rounded-2xl border bg-card p-5 shadow-sm">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-semibold">{p.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{p.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
