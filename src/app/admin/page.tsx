import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne, type Row } from "@/lib/db";
import { AdminAnalytics, type CategoryPoint, type GrowthPoint, type UgcPoint } from "./admin-analytics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Link2,
  LinkIcon,
  MousePointerClick,
  Flag,
  LayoutDashboard,
  FolderTree,
  Inbox,
  Shield,
  Settings2,
  LogOut,
  Activity,
  ArrowRight,
  UploadCloud,
  FileCode,
  Share2,
  Eye,
  ListChecks,
  ExternalLink,
  Newspaper,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Panel de administración — ConectaGrupos" },
  description: "Panel de gestión interna de ConectaGrupos.",
  robots: { index: false, follow: false },
};

const STATS = [
  {
    key: "live",
    label: "Grupos publicados",
    icon: Link2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    key: "pending",
    label: "Envíos UGC pendientes",
    icon: Inbox,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    key: "revoked",
    label: "Enlaces revocados",
    icon: LinkIcon,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
  {
    key: "clicks",
    label: "Clicks totales",
    icon: MousePointerClick,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
  {
    key: "contributors",
    label: "Colaboradores",
    icon: Users,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    key: "favLists",
    label: "Listas compartidas",
    icon: Share2,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
  },
  {
    key: "favListViews",
    label: "Visitas a listas",
    icon: Eye,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
  },
  {
    key: "reports",
    label: "Reportes abiertos",
    icon: Flag,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
  },
] as const;

const QUICK_ACTIONS = [
  {
    href: "/admin/grupos",
    title: "Gestionar grupos",
    desc: "Lista, edita, publica o rechaza grupos.",
    icon: FolderTree,
  },
  {
    href: "/admin/bulk-upload",
    title: "Carga masiva",
    desc: "Importa grupos desde CSV o JSON.",
    icon: UploadCloud,
  },
  {
    href: "/admin/ugc",
    title: "Cola UGC",
    desc: "Revisa envíos de usuarios y apruébalos.",
    icon: Inbox,
  },
  {
    href: "/admin/blog",
    title: "Blog",
    desc: "Redacta, edita y publica entradas del blog.",
    icon: Newspaper,
  },
  {
    href: "/admin/json-builder",
    title: "Generar JSON",
    desc: "Crea archivos JSON estáticos para caché.",
    icon: FileCode,
  },
  {
    href: "/admin/reportes",
    title: "Reportes",
    desc: "Resuelve o descarta reportes de grupos.",
    icon: Flag,
  },
  {
    href: "/admin/categorias",
    title: "Categorías",
    desc: "Crea, edita y ordena categorías.",
    icon: Shield,
  },
  {
    href: "/admin/contribuidores",
    title: "Colaboradores",
    desc: "Bloquea o desbloquea colaboradores.",
    icon: Users,
  },
  {
    href: "/admin/seo",
    title: "SEO e intros",
    desc: "Override de metadatos y textos intro.",
    icon: Settings2,
  },
  {
    href: "/admin/listas",
    title: "Listas compartidas",
    desc: "Gestiona enlaces /lista y limpia obsoletas.",
    icon: Share2,
  },
] as const;

function formatDateTime(iso: Date | string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

interface ActivityLogRow {
  id: number;
  adminUser: string;
  actionLabel: string;
  targetId: string | null;
  targetName: string | null;
  createdAt: Date;
}

interface FavListRow {
  id: string;
  shareCode: string;
  title: string | null;
  groupIdsJson: string;
  viewCount: number;
  createdAt: Date;
  lastViewedAt: Date | null;
}

function countListIds(json: string): number {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.length : 0;
  } catch {
    return 0;
  }
}

export default async function AdminDashboardPage() {
  const { adminUser, csrfToken } = await checkAdmin();

  // Parallel stat queries + analytics aggregation
  const [statRow, recentActivity, recentFavLists, categoryRows, growthRows, ugcStatusRows] = await Promise.all([
    queryOne<Row & Record<string, unknown>>(
      `SELECT
         (SELECT COUNT(*) FROM \`groups\` WHERE \`status\` = 'live') AS \`live\`,
         (SELECT COUNT(*) FROM \`ugc_submissions\` WHERE \`status\` IN ('submitted', 'needs_review')) AS \`pending\`,
         (SELECT COUNT(*) FROM \`groups\` WHERE \`linkStatus\` = 'revoked') AS \`revoked\`,
         (SELECT COALESCE(SUM(\`clicks\`), 0) FROM \`groups\`) AS \`clicks\`,
         (SELECT COUNT(*) FROM \`ugc_contributors\` WHERE \`isBlocked\` = 0) AS \`contributors\`,
         (SELECT COUNT(*) FROM \`fav_lists\`) AS \`favLists\`,
         (SELECT COALESCE(SUM(\`viewCount\`), 0) FROM \`fav_lists\`) AS \`favListViews\`,
         (SELECT COUNT(*) FROM \`group_reports\` WHERE \`status\` = 'OPEN') AS \`reports\``
    ),
    query<ActivityLogRow>(
      "SELECT `id`, `adminUser`, `actionLabel`, `targetId`, `targetName`, `createdAt` FROM `admin_activity_log` ORDER BY `createdAt` DESC LIMIT 20"
    ),
    query<FavListRow>(
      "SELECT `id`, `shareCode`, `title`, `groupIdsJson`, `viewCount`, `createdAt`, `lastViewedAt` FROM `fav_lists` ORDER BY `createdAt` DESC LIMIT 8"
    ),
    // Analytics: top categories with live group counts
    query<{ name: string; groups: number; color: string }>(
      `SELECT c.\`name\` AS \`name\`, COUNT(g.\`id\`) AS \`groups\`, COALESCE(c.\`color\`, 'emerald') AS \`color\`
       FROM \`categories\` c
       LEFT JOIN \`groups\` g ON g.\`categoryId\` = c.\`id\` AND g.\`status\` = 'live'
       GROUP BY c.\`id\`, c.\`name\`, c.\`color\`
       ORDER BY \`groups\` DESC, c.\`name\` ASC LIMIT 8`
    ),
    // Analytics: live groups per month (catalog growth)
    query<{ month: string; c: number }>(
      "SELECT DATE_FORMAT(`createdAt`, '%Y-%m') AS `month`, COUNT(*) AS `c` FROM `groups` WHERE `status` = 'live' GROUP BY `month` ORDER BY `month` ASC"
    ),
    // Analytics: UGC pipeline status counts
    query<{ status: string; c: number }>(
      "SELECT `status`, COUNT(*) AS `c` FROM `ugc_submissions` GROUP BY `status`"
    ),
  ]);

  const statValues: Record<string, number | string> = {
    live: Number(statRow?.live ?? 0),
    pending: Number(statRow?.pending ?? 0),
    revoked: Number(statRow?.revoked ?? 0),
    clicks: Number(statRow?.clicks ?? 0),
    contributors: Number(statRow?.contributors ?? 0),
    favLists: Number(statRow?.favLists ?? 0),
    favListViews: Number(statRow?.favListViews ?? 0),
    reports: Number(statRow?.reports ?? 0),
  };

  // ---- Analytics prop shaping ----
  // Category color names (DB) → chart palette hexes.
  const CAT_CHART_COLORS: Record<string, string> = {
    emerald: "#10b981", teal: "#14b8a6", rose: "#f43f5e", amber: "#f59e0b",
    violet: "#8b5cf6", cyan: "#06b6d4", orange: "#f97316", lime: "#84cc16",
    fuchsia: "#d946ef", slate: "#64748b", yellow: "#eab308", stone: "#78716c",
    red: "#ef4444", green: "#22c55e", pink: "#ec4899", purple: "#a855f7",
    blue: "#3b82f6", indigo: "#6366f1", sky: "#0ea5e9",
  };
  const categories: CategoryPoint[] = categoryRows.map((r) => ({
    name: r.name,
    groups: Number(r.groups ?? 0),
    color: CAT_CHART_COLORS[r.color] ?? CAT_CHART_COLORS.emerald,
  }));

  // Cumulative growth per month (prefix sums — mutation-free, react-compiler safe).
  const growth: GrowthPoint[] = growthRows.map((r, i) => ({
    month: r.month,
    total: growthRows
      .slice(0, i + 1)
      .reduce((sum, row) => sum + Number(row.c ?? 0), 0),
  }));

  // UGC funnel: total → pending → approved → rejected (+ needs_review merged into pending).
  const statusCount = (s: string) =>
    Number(ugcStatusRows.find((r) => r.status === s)?.c ?? 0);
  const ugcTotal = ugcStatusRows.reduce((acc, r) => acc + Number(r.c ?? 0), 0);
  const ugc: UgcPoint[] = [
    { stage: "Enviados", count: ugcTotal, fill: "#14b8a6" },
    {
      stage: "Pendientes de revisión",
      count: statusCount("submitted") + statusCount("needs_review"),
      fill: "#f59e0b",
    },
    { stage: "Aprobados y publicados", count: statusCount("approved"), fill: "#10b981" },
    { stage: "Rechazados", count: statusCount("rejected"), fill: "#f43f5e" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Top bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow">
                <LayoutDashboard className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Panel de administración
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hola, <span className="font-medium text-emerald-700 dark:text-emerald-400">{adminUser}</span>.
                  Bienvenido al panel interno de ConectaGrupos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/">
                  Ver sitio
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <form action="/api/admin/logout" method="post">
                <input type="hidden" name="csrf" value={csrfToken} />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>

          {/* Stats grid */}
          <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.key} className="gap-0 py-4">
                  <CardContent className="space-y-2">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg ${s.bg}`}>
                      <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                    </div>
                    <div className="text-2xl font-bold tracking-tight">
                      {statValues[s.key]?.toLocaleString("es-ES") ?? "0"}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          {/* Analytics charts */}
          <AdminAnalytics categories={categories} growth={growth} ugc={ugc} />

          {/* Two-column main */}
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Quick actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Acciones rápidas
                </CardTitle>
                <CardDescription>Accesos directos a las secciones del panel.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {QUICK_ACTIONS.map((a) => {
                    const Icon = a.icon;
                    return (
                      <Link
                        key={a.href}
                        href={a.href}
                        className="group flex items-start gap-3 rounded-xl border bg-card p-3 transition-all hover:border-emerald-400/60 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            {a.title}
                            <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Activity log */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actividad reciente</CardTitle>
                <CardDescription>Últimas 20 acciones del panel.</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                  {recentActivity.length === 0 ? (
                    <li className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                      Sin actividad registrada todavía.
                    </li>
                  ) : (
                    recentActivity.map((log) => (
                      <li
                        key={log.id}
                        className="rounded-md border bg-card px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            {log.actionLabel}
                          </Badge>
                          <time className="text-muted-foreground">
                            {formatDateTime(log.createdAt)}
                          </time>
                        </div>
                        <div className="mt-1.5 text-muted-foreground">
                          {log.adminUser}
                          {log.targetName ? (
                            <span className="text-foreground"> · {log.targetName}</span>
                          ) : null}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>
          </section>
          {/* Share lists overview */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Share2 className="h-4 w-4 text-teal-600" />
                    Listas de favoritos compartidas
                  </CardTitle>
                  <CardDescription>
                    Enlaces públicos /lista/&lt;código&gt; creados por usuarios (más recientes, máx. 8).
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <Link href="/admin/listas">
                    <ListChecks className="h-3.5 w-3.5" />
                    Gestionar listas
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentFavLists.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                  Todavía no se ha compartido ninguna lista de favoritos.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Código</th>
                        <th className="pb-2 pr-4 font-medium">Grupos</th>
                        <th className="pb-2 pr-4 font-medium">Visitas</th>
                        <th className="pb-2 pr-4 font-medium">Creada</th>
                        <th className="pb-2 pr-4 font-medium">Última visita</th>
                        <th className="pb-2 font-medium sr-only">Abrir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentFavLists.map((l) => (
                        <tr key={l.id} className="border-b last:border-0">
                          <td className="py-2.5 pr-4">
                            <Link
                              href={`/lista/${l.shareCode}`}
                              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                            >
                              <ListChecks className="h-3.5 w-3.5" />
                              {l.shareCode}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                          </td>
                          <td className="py-2.5 pr-4 tabular-nums">
                            {countListIds(l.groupIdsJson)}
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge
                              variant="outline"
                              className="bg-teal-50 tabular-nums text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                            >
                              {l.viewCount}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                            {formatDateTime(l.createdAt)}
                          </td>
                          <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                            {l.lastViewedAt ? formatDateTime(l.lastViewedAt) : "—"}
                          </td>
                          <td className="py-2.5 text-right">
                            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              <Link href={`/lista/${l.shareCode}`}>Ver</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
