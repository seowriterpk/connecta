import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, ArrowLeft } from "lucide-react";
import { AdminReportsTable } from "./admin-reports-table";
import { AdminPagination } from "@/components/admin/admin-pagination";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Reportes — Admin ConectaGrupos" },
  description: "Gestión de reportes de grupos.",
  robots: { index: false, follow: false },
};

const PER_PAGE = 40;

interface ReportRow {
  id: string;
  groupId: string;
  reporterIp: string;
  reason: string | null;
  status: string;
  createdAt: Date;
  groupName: string | null;
  groupSlug: string | null;
  groupStatus: string | null;
  linkStatus: string | null;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { csrfToken } = await checkAdmin();
  const sp = await searchParams;
  const status = String(sp.status || "OPEN");
  const pageRaw = Number(sp.page || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const whereSql = status === "all" ? "" : "WHERE `status` = ?";
  const joinWhereSql = status === "all" ? "" : "WHERE r.`status` = ?";
  const statusParams: unknown[] = status === "all" ? [] : [status];

  const [totalRow, reports, openCountRow] = await Promise.all([
    queryOne<{ cnt: number }>(
      `SELECT COUNT(*) AS \`cnt\` FROM \`group_reports\` ${whereSql}`.trim(),
      statusParams
    ),
    query<ReportRow>(
      `SELECT r.\`id\`, r.\`groupId\`, r.\`reporterIp\`, r.\`reason\`, r.\`status\`, r.\`createdAt\`,
              g.\`groupName\`, g.\`slug\` AS \`groupSlug\`, g.\`status\` AS \`groupStatus\`, g.\`linkStatus\`
       FROM \`group_reports\` r
       LEFT JOIN \`groups\` g ON g.\`id\` = r.\`groupId\`
       ${joinWhereSql}
       ORDER BY r.\`createdAt\` DESC
       LIMIT ? OFFSET ?`,
      [...statusParams, PER_PAGE, (page - 1) * PER_PAGE]
    ),
    queryOne<{ cnt: number }>(
      "SELECT COUNT(*) AS `cnt` FROM `group_reports` WHERE `status` = 'OPEN'"
    ),
  ]);

  const total = Number(totalRow?.cnt ?? 0);
  const openCount = Number(openCountRow?.cnt ?? 0);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pageHref = (n: number) =>
    `/admin/reportes${n === 1 ? (status !== "OPEN" ? `?status=${status}` : "") : `?${status !== "OPEN" ? `status=${status}&` : ""}page=${n}`}`;

  const FILTERS = [
    { value: "OPEN", label: "Abiertos" },
    { value: "RESOLVED", label: "Resueltos" },
    { value: "DISMISSED", label: "Descartados" },
    { value: "all", label: "Todos" },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                <Flag className="h-5 w-5 text-emerald-600" />
                Reportes de grupos
              </h1>
              <p className="text-sm text-muted-foreground">
                {openCount.toLocaleString("es-ES")} reportes abiertos · {total.toLocaleString("es-ES")} en total
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5">
            {FILTERS.map((f) => {
              const active = f.value === status;
              return (
                <Link
                  key={f.value}
                  href={`/admin/reportes?status=${f.value}`}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Listado</CardTitle>
              <CardDescription>Marca como resuelto o descarta.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <AdminReportsTable
                reports={reports.map((r) => ({
                  id: r.id,
                  reason: r.reason || "",
                  reporterIp: r.reporterIp,
                  status: r.status,
                  createdAt: r.createdAt,
                  group: r.groupName != null
                    ? {
                        id: r.groupId,
                        groupName: r.groupName,
                        slug: r.groupSlug ?? "",
                        status: r.groupStatus ?? "",
                        linkStatus: r.linkStatus ?? "",
                      }
                    : null,
                }))}
                csrfToken={csrfToken}
              />
              {reports.length === 0 && (
                <div className="border-t px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay reportes en este estado.
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
