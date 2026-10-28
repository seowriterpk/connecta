import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne, type Row } from "@/lib/db";
import { getToolStats } from "@/lib/admin-tools";
import { getFavListTotals, getReportStatusCounts } from "@/lib/admin-listings";
import { AdminAnalytics, type CategoryPoint, type GrowthPoint, type UgcPoint } from "./admin-analytics";
import { AdminSitemapCard } from "./admin-sitemap-card";
import {
  AdminGroupStatusBadge,
  AdminLinkStatusBadge,
  AdminReportStatusBadge,
  AdminUgcStatusBadge,
} from "@/components/admin/admin-badges";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Link2,
  Link2Off,
  MousePointerClick,
  FolderClock,
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
  ImageDown,
  Timer,
  ShieldQuestion,
  CheckCircle2,
  History,
  MessagesSquare,
  Sitemap,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Panel de administración — Grupos Hoy" },
  description: "Panel de gestión interna de Grupos Hoy.",
  robots: { index: false, follow: false },
};

// ---------------------------------------------------------------------------
// Quick links — static, render with the shell
// ---------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    href: "/admin/grupos",
    title: "Gestionar grupos",
    desc: "Filtra, ordena, publica o rechaza grupos.",
    icon: FolderTree,
  },
  {
    href: "/admin/bulk-upload",
    title: "Carga masiva",
    desc: "Importa grupos desde CSV o JSON a la cola.",
    icon: UploadCloud,
  },
  {
    href: "/admin/cola",
    title: "Cola de publicación",
    desc: "Programa, publica o elimina grupos en espera por lotes.",
    icon: Timer,
  },
  {
    href: "/admin/checker-enlaces",
    title: "Comprobador de enlaces",
    desc: "Verifica en masa qué invitaciones siguen activas.",
    icon: Link2,
  },
  {
    href: "/admin/imagenes",
    title: "Imágenes en masa",
    desc: "Descarga o refresca imágenes de grupos por lotes.",
    icon: ImageDown,
  },
  {
    href: "/admin/ugc",
    title: "Cola UGC",
    desc: "Aprueba, rechaza o edita aportaciones de la comunidad.",
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

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: Date | string | null): string {
  if (!iso) return "—";
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
    return "—";
  }
}

/** "hace 5 min / hace 3 h / hace 4 días" with full date in the title. */
function formatRelative(iso: Date | string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (!Number.isFinite(diff)) return "—";
    if (diff < 0) return "—";
    const min = Math.floor(diff / 60_000);
    if (min < 1) return "ahora";
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const days = Math.floor(h / 24);
    if (days < 30) return `hace ${days} ${days === 1 ? "día" : "días"}`;
    const months = Math.floor(days / 30);
    if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
    return formatDateTime(d);
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// Section 1 — metrics + work queues (streams in via Suspense)
// ---------------------------------------------------------------------------

async function CatalogQueuesSection() {
  // ONE source of truth for every group/link/queue/UGC number: getToolStats.
  const [stats, reportCounts, favTotals, extraRow] = await Promise.all([
    getToolStats(),
    getReportStatusCounts(),
    getFavListTotals(),
    queryOne<Row & Record<string, unknown>>(
      `SELECT
         (SELECT COALESCE(SUM(\`clicks\`), 0) FROM \`groups\`) AS \`clicks\`,
         (SELECT COUNT(*) FROM \`ugc_contributors\` WHERE \`isBlocked\` = 0) AS \`contributors\``
    ),
  ]);
  const clicks = Number(extraRow?.clicks ?? 0);
  const contributors = Number(extraRow?.contributors ?? 0);

  const metrics = [
    {
      href: "/admin/grupos?status=live",
      label: "Grupos publicados",
      value: stats.live,
      sub: `de ${stats.groupsTotal.toLocaleString("es-ES")} en total`,
      icon: Link2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      href: "/admin/grupos?sort=clicks&dir=desc",
      label: "Clics totales",
      value: clicks,
      sub: "en enlaces de invitación",
      icon: MousePointerClick,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      href: "/admin/contribuidores",
      label: "Colaboradores",
      value: contributors,
      sub: "activos en la comunidad",
      icon: Users,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
    },
    {
      href: "/admin/listas",
      label: "Listas compartidas",
      value: favTotals.total,
      sub: `${favTotals.views.toLocaleString("es-ES")} visitas acumuladas`,
      icon: Share2,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
    },
  ];

  // Each queue card points at the exact tool/page that drains it.
  const queues = [
    {
      href: "/admin/bulk-upload",
      label: "Cola de publicación",
      value: stats.queueDepth,
      desc: "grupos importados pendientes de publicarse",
      icon: Timer,
      severity: "amber" as const,
    },
    {
      href: "/admin/grupos?status=pending",
      label: "Grupos pendientes",
      value: stats.pending,
      desc: "creados pero sin publicar todavía",
      icon: FolderClock,
      severity: "amber" as const,
    },
    {
      href: "/admin/ugc",
      label: "Envíos UGC por revisar",
      value: stats.ugcPending,
      desc: "aportaciones de la comunidad",
      icon: Inbox,
      severity: "amber" as const,
    },
    {
      href: "/admin/grupos?linkStatus=revoked",
      label: "Enlaces revocados",
      value: stats.linkRevoked,
      desc: "invitaciones que ya no funcionan",
      icon: Link2Off,
      severity: "rose" as const,
    },
    {
      href: "/admin/checker-enlaces",
      label: "Enlaces sin comprobar",
      value: stats.neverChecked,
      desc: "nunca validados automáticamente",
      icon: ShieldQuestion,
      severity: "amber" as const,
    },
    {
      href: "/admin/reportes",
      label: "Reportes abiertos",
      value: reportCounts.OPEN,
      desc: "denuncias de usuarios sin resolver",
      icon: Flag,
      severity: "rose" as const,
    },
  ];

  const severityStyles: Record<"amber" | "rose", { color: string; bg: string }> = {
    amber: {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    rose: {
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
    },
  };

  return (
    <>
      {/* Catálogo */}
      <section aria-label="Métricas del catálogo" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              href={m.href}
              className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full gap-0 py-4 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="space-y-2.5">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${m.bg}`}>
                    <Icon className={`h-5 w-5 ${m.color}`} />
                  </div>
                  <div className="text-2xl font-bold tabular-nums tracking-tight">
                    {m.value.toLocaleString("es-ES")}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground">{m.sub}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      {/* Colas de trabajo */}
      <section aria-label="Colas de trabajo" className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <h2 className="text-base font-semibold tracking-tight">Colas de trabajo</h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            — pendientes que necesitan tu atención, con acceso directo a cada herramienta
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {queues.map((q) => {
            const Icon = q.icon;
            const alert = q.value > 0;
            const s = severityStyles[q.severity];
            return (
              <Link
                key={q.label}
                href={q.href}
                className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card
                  className={`h-full gap-0 py-4 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md ${
                    alert
                      ? "border-amber-200/70 dark:border-amber-900/50"
                      : "border-emerald-200/60 dark:border-emerald-900/40"
                  }`}
                >
                  <CardContent className="space-y-2">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-lg ${
                        alert ? `${s.bg} ${s.color}` : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                    >
                      {alert ? (
                        <Icon className="h-4.5 w-4.5" />
                      ) : (
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div
                      className={`text-xl font-bold tabular-nums tracking-tight ${
                        alert ? s.color : "text-foreground"
                      }`}
                    >
                      {q.value.toLocaleString("es-ES")}
                    </div>
                    <div>
                      <div className="text-xs font-medium leading-tight">{q.label}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {alert ? q.desc : "todo al día"}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-400">
                      Ir
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — recent activity (streams in via Suspense)
// ---------------------------------------------------------------------------

interface RecentGroupRow {
  id: string;
  groupName: string;
  slug: string;
  status: string;
  linkStatus: string;
  createdAt: Date | string;
}

interface RecentUgcRow {
  id: string;
  name: string;
  status: string;
  createdAt: Date | string;
}

interface RecentReportRow {
  id: string;
  reason: string | null;
  status: string;
  createdAt: Date | string;
  groupName: string | null;
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

function EmptyHint({ text }: { text: string }) {
  return (
    <li className="rounded-md border border-dashed bg-muted/30 px-3 py-5 text-center text-xs text-muted-foreground">
      {text}
    </li>
  );
}

async function RecentActivitySection() {
  const [recentGroups, recentUgc, recentReports, activityLog, recentFavLists] =
    await Promise.all([
      query<RecentGroupRow>(
        "SELECT `id`, `groupName`, `slug`, `status`, `linkStatus`, `createdAt` FROM `groups` ORDER BY `createdAt` DESC LIMIT 6"
      ),
      query<RecentUgcRow>(
        `SELECT \`id\`,
                COALESCE(NULLIF(\`editedGroupName\`, ''), \`fetchedGroupName\`) AS \`name\`,
                \`status\`, \`createdAt\`
         FROM \`ugc_submissions\` ORDER BY \`createdAt\` DESC LIMIT 6`
      ),
      query<RecentReportRow>(
        `SELECT r.\`id\`, r.\`reason\`, r.\`status\`, r.\`createdAt\`, g.\`groupName\`
         FROM \`group_reports\` r
         LEFT JOIN \`groups\` g ON g.\`id\` = r.\`groupId\`
         ORDER BY r.\`createdAt\` DESC LIMIT 6`
      ),
      query<ActivityLogRow>(
        "SELECT `id`, `adminUser`, `actionLabel`, `targetId`, `targetName`, `createdAt` FROM `admin_activity_log` ORDER BY `createdAt` DESC LIMIT 20"
      ),
      query<FavListRow>(
        "SELECT `id`, `shareCode`, `title`, `groupIdsJson`, `viewCount`, `createdAt`, `lastViewedAt` FROM `fav_lists` ORDER BY `createdAt` DESC LIMIT 8"
      ),
    ]);

  return (
    <section aria-label="Actividad reciente" className="mt-6 space-y-4">
      {/* Three live feeds */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FolderTree className="h-4 w-4 text-emerald-600" />
              Últimos grupos
            </CardTitle>
            <CardAction>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                <Link href="/admin/grupos">
                  Ver todo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="cg-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
              {recentGroups.length === 0 ? (
                <EmptyHint text="Todavía no hay grupos en el catálogo." />
              ) : (
                recentGroups.map((g) => (
                  <li key={g.id} className="rounded-lg border bg-card px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/grupos/${g.id}`}
                        title={`Editar ${g.groupName}`}
                        className="truncate text-xs font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
                      >
                        {g.groupName}
                      </Link>
                      <time
                        title={formatDateTime(g.createdAt)}
                        className="shrink-0 text-[10px] text-muted-foreground"
                      >
                        {formatRelative(g.createdAt)}
                      </time>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <AdminGroupStatusBadge status={g.status} />
                      <AdminLinkStatusBadge linkStatus={g.linkStatus} />
                    </div>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessagesSquare className="h-4 w-4 text-violet-600" />
              Últimos envíos UGC
            </CardTitle>
            <CardAction>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                <Link href="/admin/ugc">
                  Ver todo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="cg-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
              {recentUgc.length === 0 ? (
                <EmptyHint text="Aún no hay envíos de la comunidad." />
              ) : (
                recentUgc.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href="/admin/ugc"
                        title={`Revisar ${u.name}`}
                        className="block truncate text-xs font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
                      >
                        {u.name || "Sin nombre"}
                      </Link>
                      <div className="mt-1.5">
                        <AdminUgcStatusBadge status={u.status} />
                      </div>
                    </div>
                    <time
                      title={formatDateTime(u.createdAt)}
                      className="shrink-0 text-[10px] text-muted-foreground"
                    >
                      {formatRelative(u.createdAt)}
                    </time>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flag className="h-4 w-4 text-rose-600" />
              Últimos reportes
            </CardTitle>
            <CardAction>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                <Link href="/admin/reportes">
                  Ver todo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="cg-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
              {recentReports.length === 0 ? (
                <EmptyHint text="No hay reportes de usuarios todavía." />
              ) : (
                recentReports.map((r) => (
                  <li key={r.id} className="rounded-lg border bg-card px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href="/admin/reportes"
                        title={r.reason || "Sin motivo"}
                        className="truncate text-xs font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
                      >
                        {r.groupName ?? "Grupo eliminado"}
                      </Link>
                      <time
                        title={formatDateTime(r.createdAt)}
                        className="shrink-0 text-[10px] text-muted-foreground"
                      >
                        {formatRelative(r.createdAt)}
                      </time>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <AdminReportStatusBadge status={r.status} />
                      {r.reason && (
                        <span className="truncate text-[10px] text-muted-foreground" title={r.reason}>
                          {r.reason}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Admin audit trail + shared lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4 text-emerald-600" />
              Actividad del panel
            </CardTitle>
            <CardDescription>Últimas 20 acciones registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="cg-scroll max-h-96 space-y-2 overflow-y-auto pr-1">
              {activityLog.length === 0 ? (
                <EmptyHint text="Sin actividad registrada todavía." />
              ) : (
                activityLog.map((log) => (
                  <li key={log.id} className="rounded-md border bg-card px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        {log.actionLabel}
                      </Badge>
                      <time
                        title={formatDateTime(log.createdAt)}
                        className="shrink-0 text-[10px] text-muted-foreground"
                      >
                        {formatRelative(log.createdAt)}
                      </time>
                    </div>
                    <div className="mt-1.5 truncate text-muted-foreground">
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

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Share2 className="h-4 w-4 text-teal-600" />
                  Últimas listas compartidas
                </CardTitle>
                <CardDescription>
                  Enlaces públicos /lista/&lt;código&gt; creados por usuarios (más recientes, máx. 8).
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 shrink-0 text-xs">
                <Link href="/admin/listas">
                  <ListChecks className="h-3.5 w-3.5" />
                  Gestionar listas
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentFavLists.length === 0 ? (
              <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
                Todavía no se ha compartido ninguna lista de favoritos.
              </p>
            ) : (
              <div className="cg-scroll max-h-96 overflow-y-auto pr-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Código</th>
                      <th className="pb-2 pr-4 font-medium">Grupos</th>
                      <th className="pb-2 pr-4 font-medium">Visitas</th>
                      <th className="pb-2 font-medium">Creada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFavLists.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <Link
                            href={`/lista/${l.shareCode}`}
                            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                          >
                            {l.shareCode}
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </Link>
                        </td>
                        <td className="py-2 pr-4 text-xs tabular-nums">
                          {countListIds(l.groupIdsJson)}
                        </td>
                        <td className="py-2 pr-4 text-xs">
                          <Badge
                            variant="outline"
                            className="bg-teal-50 tabular-nums text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            {l.viewCount}
                          </Badge>
                        </td>
                        <td className="py-2 text-[10px] text-muted-foreground">
                          <time title={formatDateTime(l.createdAt)}>
                            {formatRelative(l.createdAt)}
                          </time>
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
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 3 — analytics charts (streams in via Suspense)
// ---------------------------------------------------------------------------

async function AnalyticsSection() {
  const [categoryRows, growthRows, ugcStatusRows] = await Promise.all([
    query<{ name: string; groups: number; color: string }>(
      `SELECT c.\`name\` AS \`name\`, COUNT(g.\`id\`) AS \`groups\`, COALESCE(c.\`color\`, 'emerald') AS \`color\`
       FROM \`categories\` c
       LEFT JOIN \`groups\` g ON g.\`categoryId\` = c.\`id\` AND g.\`status\` = 'live'
       GROUP BY c.\`id\`, c.\`name\`, c.\`color\`
       ORDER BY \`groups\` DESC, c.\`name\` ASC LIMIT 8`
    ),
    query<{ month: string; c: number }>(
      "SELECT DATE_FORMAT(`createdAt`, '%Y-%m') AS `month`, COUNT(*) AS `c` FROM `groups` WHERE `status` = 'live' GROUP BY `month` ORDER BY `month` ASC"
    ),
    query<{ status: string; c: number }>(
      "SELECT `status`, COUNT(*) AS `c` FROM `ugc_submissions` GROUP BY `status`"
    ),
  ]);

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

  const growth: GrowthPoint[] = growthRows.map((r, i) => ({
    month: r.month,
    total: growthRows.slice(0, i + 1).reduce((sum, row) => sum + Number(row.c ?? 0), 0),
  }));

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

  return <AdminAnalytics categories={categories} growth={growth} ugc={ugc} />;
}

// ---------------------------------------------------------------------------
// Suspense skeletons
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="mt-3 h-6 w-10" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div aria-hidden className="mt-6 space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <Skeleton className="h-4 w-28" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <Skeleton className="h-4 w-32" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div aria-hidden className="mt-6 grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="rounded-xl border p-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-4 h-[260px] w-full" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell — paints instantly, data streams in per section
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  const { adminUser, csrfToken } = await checkAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Top bar (instant) */}
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
                  Hola,{" "}
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    {adminUser}
                  </span>
                  . Este es el estado del sitio ahora mismo.
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

          {/* Metrics + work queues (streamed) */}
          <div className="mt-6">
            <Suspense fallback={<StatsSkeleton />}>
              <CatalogQueuesSection />
            </Suspense>
          </div>

          {/* Recent activity (streamed) */}
          <Suspense fallback={<ActivitySkeleton />}>
            <RecentActivitySection />
          </Suspense>

          {/* Sitemap status + instant regeneration */}
          <section aria-label="Sitemap XML" className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Sitemap className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-semibold tracking-tight">SEO · Sitemap</h2>
              <p className="hidden text-xs text-muted-foreground sm:block">
                — descubre grupos nuevos al instante, sin esperar al cron nocturno
              </p>
            </div>
            <AdminSitemapCard csrfToken={csrfToken} />
          </section>

          {/* Quick links (instant) */}
          <section aria-label="Accesos rápidos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutDashboard className="h-4 w-4 text-emerald-600" />
                  Acciones rápidas
                </CardTitle>
                <CardDescription>
                  Accesos directos a todas las secciones del panel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {QUICK_ACTIONS.map((a) => {
                    const Icon = a.icon;
                    return (
                      <Link
                        key={a.href}
                        href={a.href}
                        className="group flex items-start gap-3 rounded-xl border bg-card p-3 transition-all hover:border-emerald-400/60 hover:shadow-md hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            {a.title}
                            <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {a.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Analytics charts (streamed) */}
          <Suspense fallback={<AnalyticsSkeleton />}>
            <AnalyticsSection />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
