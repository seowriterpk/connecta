import { Activity, TrendingUp, TrendingDown, Eye } from "lucide-react";
import type { GroupActivity } from "@/lib/data";
import { Sparkline } from "@/components/site/sparkline";

/**
 * "Actividad reciente" card for the group detail sidebar — 14-day view
 * trend (server-rendered sparkline) + weekly comparison.
 *
 * ALWAYS renders (SEO-friendly, zero client JS — pure server component).
 * When the group has no meaningful history yet (brand-new or quiet groups),
 * the same card shows a zero-state: sparkline of zeros, "0" weekly numbers
 * and an honest note, instead of hiding the section.
 */

const ZERO_ACTIVITY: GroupActivity = {
  series: Array.from({ length: 14 }, () => 0),
  weekViews: 0,
  prevViews: 0,
  totalViews: 0,
};

export function GroupActivityCard({
  activity,
  slug,
}: {
  activity: GroupActivity | null;
  slug: string;
}) {
  const data = activity ?? ZERO_ACTIVITY;
  // Fewer than 2 non-zero days → no meaningful trend yet → zero-state copy.
  const hasHistory = data.series.filter((v) => v > 0).length >= 2;

  const delta = data.weekViews - data.prevViews;
  const rising = delta > 0;
  const deltaPct =
    data.prevViews > 0
      ? Math.round((delta / data.prevViews) * 100)
      : null;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
          Actividad reciente
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          14 días
        </span>
      </div>

      <Sparkline data={data.series} uid={`detail-${slug}`} width={228} height={44} />

      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-muted/50 px-2 py-2">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" aria-hidden /> Últimos 7 días
          </div>
          <div className="mt-0.5 text-lg font-bold tabular-nums leading-none">
            {data.weekViews.toLocaleString("es-ES")}
          </div>
        </div>
        <div className="rounded-xl bg-muted/50 px-2 py-2">
          <div className="text-xs text-muted-foreground">Semana anterior</div>
          <div className="mt-0.5 text-lg font-bold tabular-nums leading-none text-muted-foreground">
            {data.prevViews.toLocaleString("es-ES")}
          </div>
        </div>
      </div>

      {hasHistory ? (
        <>
          <div className="mt-3 flex items-center justify-center">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                delta === 0
                  ? "bg-muted text-muted-foreground"
                  : rising
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {delta !== 0 && (rising ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />)}
              {delta === 0
                ? "Vistas estables"
                : `${rising ? "+" : ""}${delta.toLocaleString("es-ES")} vistas${deltaPct !== null ? ` (${deltaPct > 0 ? "+" : ""}${deltaPct}%)` : ""}`}
            </span>
          </div>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            Cada visita a esta ficha suma una vista. La tendencia se recalcula a diario.
          </p>
        </>
      ) : (
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          Aún sin actividad registrada. Cada visita a esta ficha va dibujando esta gráfica.
        </p>
      )}
    </div>
  );
}
