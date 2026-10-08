import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne, type Row } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, ArrowLeft } from "lucide-react";
import { AdminUgcTable } from "./admin-ugc-table";
import { AdminPagination } from "@/components/admin/admin-pagination";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Cola UGC — Admin ConectaGrupos" },
  description: "Envíos de usuarios pendientes de revisión.",
  robots: { index: false, follow: false },
};

const PER_PAGE = 30;

const TABS = [
  { value: "submitted", label: "Enviados" },
  { value: "needs_review", label: "Necesita revisión" },
  { value: "approved", label: "Aprobados" },
  { value: "rejected", label: "Rechazados" },
  { value: "spam", label: "Spam" },
  { value: "all", label: "Todos" },
] as const;

export default async function AdminUgcPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { csrfToken } = await checkAdmin();
  const sp = await searchParams;
  const tab = String(sp.tab || "submitted");
  const pageRaw = Number(sp.page || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const whereClause = tab === "all" ? "" : " WHERE `status` = ?";
  const whereParams: unknown[] = tab === "all" ? [] : [tab];

  const SUBMISSION_SELECT = `
    \`id\`, \`submissionUid\`, \`fetchedGroupName\`, \`editedGroupName\`,
    \`contributorDisplayNameSnap\`, \`categoryNameSnapshot\`, \`country\`, \`city\`,
    \`status\`, \`score\`, \`createdAt\`, \`submittedAt\`, \`isAdult\`
  `;

  const [totalRow, submissionRows, countRows] = await Promise.all([
    queryOne<Row>(
      `SELECT COUNT(*) AS \`c\` FROM \`ugc_submissions\`${whereClause}`,
      whereParams
    ),
    query<Row>(
      `SELECT ${SUBMISSION_SELECT} FROM \`ugc_submissions\`${whereClause} ORDER BY \`createdAt\` DESC LIMIT ? OFFSET ?`,
      [...whereParams, PER_PAGE, (page - 1) * PER_PAGE]
    ),
    query<Row>(
      "SELECT `status`, COUNT(*) AS `c` FROM `ugc_submissions` GROUP BY `status`"
    ),
  ]);

  const total = Number((totalRow as { c?: number } | null)?.c ?? 0);
  const submissions = submissionRows.map((r) => {
    const s = r as Record<string, unknown>;
    return {
      id: String(s.id),
      submissionUid: String(s.submissionUid ?? ""),
      fetchedGroupName: String(s.fetchedGroupName ?? ""),
      editedGroupName: String(s.editedGroupName ?? ""),
      contributorDisplayNameSnap: String(s.contributorDisplayNameSnap ?? ""),
      categoryNameSnapshot: String(s.categoryNameSnapshot ?? ""),
      country: String(s.country ?? ""),
      city: String(s.city ?? ""),
      status: String(s.status ?? ""),
      score: Number(s.score ?? 0),
      createdAt: (s.createdAt as Date) ?? new Date(0),
      submittedAt: (s.submittedAt as Date | null) ?? null,
      isAdult: !!s.isAdult,
    };
  });
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const countByStatus = (s: string) =>
    Number(
      (countRows.find((c) => String((c as { status: string }).status) === s) as { c?: number })
        ?.c ?? 0
    );

  const pageHref = (n: number) =>
    `/admin/ugc${n === 1 ? `?tab=${tab}` : `?tab=${tab}&page=${n}`}`;

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
                <Inbox className="h-5 w-5 text-emerald-600" />
                Cola de envíos UGC
              </h1>
              <p className="text-sm text-muted-foreground">
                Revisa grupos enviados por la comunidad.
              </p>
            </div>
          </div>

          {/* Status tabs */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5">
            {TABS.map((t) => {
              const active = t.value === tab;
              const count = countByStatus(t.value === "all" ? "" : t.value);
              const totalForTab = t.value === "all" ? total : count;
              return (
                <Link
                  key={t.value}
                  href={`/admin/ugc?tab=${t.value}`}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      active ? "bg-white/20" : "bg-muted"
                    }`}
                  >
                    {totalForTab}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Table */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Envíos — estado: {tab === "all" ? "todos" : tab}
              </CardTitle>
              <CardDescription>
                {total.toLocaleString("es-ES")} envíos en esta vista.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <AdminUgcTable
                submissions={submissions}
                csrfToken={csrfToken}
              />
              {submissions.length === 0 && (
                <div className="border-t px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay envíos en este estado.
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
