import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne, type Row } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft } from "lucide-react";
import { AdminContributorsTable } from "./admin-contributors-table";
import { AdminPagination } from "@/components/admin/admin-pagination";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Colaboradores — Admin ConectaGrupos" },
  description: "Gestión de colaboradores UGC.",
  robots: { index: false, follow: false },
};

const PER_PAGE = 50;

export default async function AdminContributorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { csrfToken } = await checkAdmin();
  const sp = await searchParams;
  const filter = String(sp.filter || "all");
  const pageRaw = Number(sp.page || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const whereClause =
    filter === "blocked"
      ? " WHERE `isBlocked` = 1"
      : filter === "active"
        ? " WHERE `isBlocked` = 0 AND `isRemoved` = 0"
        : filter === "removed"
          ? " WHERE `isRemoved` = 1"
          : "";

  const CONTRIBUTOR_SELECT = `
    \`id\`, \`contributorUid\`, \`displayName\`, \`displaySlug\`, \`avatarUrl\`,
    \`publishedCount\`, \`submittedCount\`, \`rejectedCount\`, \`reputationScore\`,
    \`isBlocked\`, \`isRemoved\`, \`blockedReason\`, \`lastSubmissionAt\`, \`createdAt\`
  `;

  const [totalRow, contributorRows] = await Promise.all([
    queryOne<Row>(
      `SELECT COUNT(*) AS \`c\` FROM \`ugc_contributors\`${whereClause}`
    ),
    query<Row>(
      `SELECT ${CONTRIBUTOR_SELECT} FROM \`ugc_contributors\`${whereClause} ORDER BY \`createdAt\` DESC LIMIT ? OFFSET ?`,
      [PER_PAGE, (page - 1) * PER_PAGE]
    ),
  ]);

  const total = Number((totalRow as { c?: number } | null)?.c ?? 0);
  const contributors = contributorRows.map((r) => {
    const c = r as Record<string, unknown>;
    return {
      id: String(c.id),
      contributorUid: String(c.contributorUid ?? ""),
      displayName: String(c.displayName ?? ""),
      displaySlug: String(c.displaySlug ?? ""),
      avatarUrl: String(c.avatarUrl ?? ""),
      publishedCount: Number(c.publishedCount ?? 0),
      submittedCount: Number(c.submittedCount ?? 0),
      rejectedCount: Number(c.rejectedCount ?? 0),
      reputationScore: Number(c.reputationScore ?? 0),
      isBlocked: !!c.isBlocked,
      isRemoved: !!c.isRemoved,
      blockedReason: String(c.blockedReason ?? ""),
      lastSubmissionAt: (c.lastSubmissionAt as Date | null) ?? null,
      createdAt: (c.createdAt as Date) ?? new Date(0),
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pageHref = (n: number) =>
    `/admin/contribuidores${n === 1 ? (filter !== "all" ? `?filter=${filter}` : "") : `?${filter !== "all" ? `filter=${filter}&` : ""}page=${n}`}`;

  const FILTERS = [
    { value: "all", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "blocked", label: "Bloqueados" },
    { value: "removed", label: "Eliminados" },
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
                <Users className="h-5 w-5 text-emerald-600" />
                Colaboradores UGC
              </h1>
              <p className="text-sm text-muted-foreground">
                {total.toLocaleString("es-ES")} colaboradores
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5">
            {FILTERS.map((f) => {
              const active = f.value === filter;
              return (
                <Link
                  key={f.value}
                  href={`/admin/contribuidores?filter=${f.value}`}
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
              <CardDescription>Reputación, actividad y estado de cuenta.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <AdminContributorsTable
                contributors={contributors}
                csrfToken={csrfToken}
              />
              {contributors.length === 0 && (
                <div className="border-t px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay colaboradores en este filtro.
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
