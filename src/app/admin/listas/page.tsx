import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne } from "@/lib/db";
import { countStaleFavLists, STALE_DAYS } from "@/lib/fav-lists";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Share2, ArrowLeft, Search, Eye, ListChecks, Sparkles, Link2 } from "lucide-react";
import { AdminListsTable } from "./admin-lists-table";
import { AdminPagination } from "@/components/admin/admin-pagination";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Listas compartidas — Admin ConectaGrupos" },
  description: "Gestión de listas de favoritos compartidas.",
  robots: { index: false, follow: false },
};

const PER_PAGE = 25;

type Filter = "todas" | "populares" | "sin-visitas" | "obsoletas";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "populares", label: "Con visitas" },
  { value: "sin-visitas", label: "Sin visitas" },
  { value: "obsoletas", label: `Obsoletas (${STALE_DAYS}d)` },
];

function buildWhere(filter: Filter, q: string): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filter === "populares") conds.push("`viewCount` > 0");
  if (filter === "sin-visitas") conds.push("`viewCount` = 0");
  if (filter === "obsoletas") {
    conds.push("`viewCount` = 0 AND `createdAt` < (NOW() - INTERVAL ? DAY)");
    params.push(STALE_DAYS);
  }
  const term = q.trim().toLowerCase();
  if (term) {
    // shareCode is lowercase; search title case-insensitively
    conds.push("(`shareCode` LIKE ? OR LOWER(`title`) LIKE ?)");
    params.push(`%${term}%`, `%${term}%`);
  }
  return conds.length ? { sql: `WHERE ${conds.join(" AND ")}`, params } : { sql: "", params: [] };
}

export default async function AdminListsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { csrfToken } = await checkAdmin();
  const sp = await searchParams;
  const filterRaw = String(sp.filtro || "todas");
  const filter = (FILTERS.some((f) => f.value === filterRaw) ? filterRaw : "todas") as Filter;
  const q = String(sp.q || "").slice(0, 60);
  const pageRaw = Number(sp.page || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const { sql: whereSql, params: whereParams } = buildWhere(filter, q);

  const [totalRow, rows, totalsRow, staleCount] = await Promise.all([
    queryOne<{ cnt: number }>(
      `SELECT COUNT(*) AS \`cnt\` FROM \`fav_lists\` ${whereSql}`.trim(),
      whereParams
    ),
    query<{
      id: string;
      shareCode: string;
      title: string | null;
      groupIdsJson: string;
      viewCount: number;
      createdAt: Date;
      lastViewedAt: Date | null;
    }>(
      `SELECT \`id\`, \`shareCode\`, \`title\`, \`groupIdsJson\`, \`viewCount\`, \`createdAt\`, \`lastViewedAt\`
       FROM \`fav_lists\` ${whereSql}
       ORDER BY \`createdAt\` DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, PER_PAGE, (page - 1) * PER_PAGE]
    ),
    queryOne<{ total: number; views: number }>(
      "SELECT COUNT(*) AS `total`, COALESCE(SUM(`viewCount`), 0) AS `views` FROM `fav_lists`"
    ),
    countStaleFavLists(),
  ]);

  const total = Number(totalRow?.cnt ?? 0);
  const totalLists = Number(totalsRow?.total ?? 0);
  const totalViews = Number(totalsRow?.views ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (filter !== "todas") params.set("filtro", filter);
    if (q) params.set("q", q);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return `/admin/listas${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                <Share2 className="h-5 w-5 text-teal-600" />
                Listas compartidas
              </h1>
              <p className="text-sm text-muted-foreground">
                Enlaces públicos /lista/&lt;código&gt; creados desde favoritos ·{" "}
                {totalLists.toLocaleString("es-ES")} listas ·{" "}
                {totalViews.toLocaleString("es-ES")} visitas totales
              </p>
            </div>
          </div>

          {/* Summary chips */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="gap-0 py-4">
              <CardContent className="space-y-1.5">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <ListChecks className="h-4 w-4" />
                  <span className="text-xs font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {totalLists.toLocaleString("es-ES")}
                </p>
              </CardContent>
            </Card>
            <Card className="gap-0 py-4">
              <CardContent className="space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-medium">Visitas</span>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {totalViews.toLocaleString("es-ES")}
                </p>
              </CardContent>
            </Card>
            <Card className="gap-0 py-4">
              <CardContent className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-medium">Obsoletas</span>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {staleCount.toLocaleString("es-ES")}
                </p>
              </CardContent>
            </Card>
            <Card className="gap-0 py-4">
              <CardContent className="space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Link2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Resultado</span>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {total.toLocaleString("es-ES")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters + search */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5">
              {FILTERS.map((f) => {
                const active = f.value === filter;
                const href = `/admin/listas${f.value !== "todas" ? `?filtro=${f.value}` : ""}`;
                return (
                  <Link
                    key={f.value}
                    href={href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>
            <form action="/admin/listas" method="get" className="flex items-center gap-2">
              {filter !== "todas" && <input type="hidden" name="filtro" value={filter} />}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por código o título…"
                  className="h-9 w-full pl-9 sm:w-64"
                  maxLength={60}
                />
              </div>
              <Button type="submit" size="sm" className="h-9">
                Buscar
              </Button>
            </form>
          </div>

          {/* Table */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Listado</CardTitle>
              <CardDescription>
                Abre, copia el enlace o elimina listas compartidas.
                {q && (
                  <>
                    {" "}
                    Búsqueda: <Badge variant="outline" className="font-mono">{q}</Badge>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <AdminListsTable
                lists={rows.map((r) => ({
                  id: r.id,
                  shareCode: r.shareCode,
                  title: r.title,
                  groupCount: (() => {
                    try {
                      const v = JSON.parse(r.groupIdsJson);
                      return Array.isArray(v) ? v.length : 0;
                    } catch {
                      return 0;
                    }
                  })(),
                  viewCount: r.viewCount,
                  createdAt: r.createdAt,
                  lastViewedAt: r.lastViewedAt,
                  stale:
                    r.viewCount === 0 &&
                    Date.now() - new Date(r.createdAt).getTime() > STALE_DAYS * 86400000,
                }))}
                csrfToken={csrfToken}
                staleCount={staleCount}
                staleDays={STALE_DAYS}
              />
              {rows.length === 0 && (
                <div className="border-t px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay listas que coincidan con el filtro{q ? " o la búsqueda" : ""}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <AdminPagination page={page} totalPages={totalPages} hrefFn={pageHref} />
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
