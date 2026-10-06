"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Area,
  AreaChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, GitBranch } from "lucide-react";

export interface CategoryPoint {
  name: string;
  groups: number;
  color: string;
}

export interface GrowthPoint {
  month: string;
  total: number;
}

export interface UgcPoint {
  stage: string;
  count: number;
  fill: string;
}

interface Props {
  categories: CategoryPoint[];
  growth: GrowthPoint[];
  ugc: UgcPoint[];
}

const categoriesConfig = {
  groups: { label: "Grupos", color: "var(--chart-1)" },
} satisfies ChartConfig;

const growthConfig = {
  total: { label: "Grupos publicados", color: "var(--chart-2)" },
} satisfies ChartConfig;

const ugcConfig = {
  count: { label: "Contribuciones" },
} satisfies ChartConfig;

const monthLabel = (m: string): string => {
  const [y, mm] = m.split("-");
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${names[Number(mm) - 1] ?? mm} ${y.slice(2)}`;
};

/**
 * AdminAnalytics — data-viz section for the admin dashboard.
 * Pure presentational (data aggregated server-side in /admin/page.tsx).
 */
export function AdminAnalytics({ categories, growth, ugc }: Props) {
  const hasGrowth = growth.length > 1;

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      {/* Groups by category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            Grupos por categoría
          </CardTitle>
          <CardDescription>
            Distribución del catálogo publicado (top {categories.length}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={categoriesConfig} className="h-[260px] w-full aspect-auto">
            <BarChart data={categories} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={150}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => (v.length > 21 ? `${v.slice(0, 20)}…` : v)}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="groups" radius={[0, 4, 4, 0]} barSize={16}>
                {categories.map((c) => (
                  <Cell key={c.name} fill={c.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <p className="mt-2 text-xs text-muted-foreground">
            Categoría más activa:{" "}
            <span className="font-medium text-foreground">
              {categories[0]?.name ?? "—"} ({categories[0]?.groups ?? 0} grupos)
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Catalog growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-cyan-600" />
            Crecimiento del catálogo
          </CardTitle>
          <CardDescription>
            Grupos publicados acumulados por mes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasGrowth ? (
            <ChartContainer config={growthConfig} className="h-[260px] w-full aspect-auto">
              <AreaChart data={growth.map((g) => ({ ...g, label: monthLabel(g.month) }))} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-total)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-total)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area
                  dataKey="total"
                  type="monotone"
                  stroke="var(--color-total)"
                  strokeWidth={2.5}
                  fill="url(#growthFill)"
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[260px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
              <p className="max-w-[240px] text-xs text-muted-foreground">
                El gráfico de crecimiento aparecerá cuando haya al menos dos meses de
                datos de publicación.
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {growth.at(-1)?.total ?? 0} grupos publicados hasta hoy.
          </p>
        </CardContent>
      </Card>

      {/* UGC pipeline */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4 text-violet-600" />
            Embudo de contribuciones UGC
          </CardTitle>
          <CardDescription>
            Recorrido de los grupos enviados por la comunidad: desde envío hasta publicación o rechazo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={ugcConfig} className="h-[180px] w-full aspect-auto">
            <BarChart data={ugc} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap="24%">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                dataKey="stage"
                type="category"
                tickLine={false}
                axisLine={false}
                width={185}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                {ugc.map((u) => (
                  <Cell key={u.stage} fill={u.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {ugc.map((u) => (
              <span key={u.stage} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: u.fill }} aria-hidden />
                {u.stage}: <span className="font-medium tabular-nums text-foreground">{u.count}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
