import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { fetchAdminReportsPage } from "@/lib/admin-listings";
import {
  parseAdminReportsFilters,
  REPORT_PAGE_SIZES,
} from "@/lib/admin-listing-params";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, ArrowLeft } from "lucide-react";
import { AdminReportsExplorer } from "./admin-reports-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Reportes — Admin Grupos Hoy" },
  description: "Gestión de reportes de grupos.",
  robots: { index: false, follow: false },
};

/**
 * Server shell for the reports table. First page renders server-side from
 * the URL; the client explorer re-fetches via GET /api/admin/reportes on
 * every status-tab / page change (no full-page reloads).
 */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { csrfToken } = await checkAdmin();

  const sp = await searchParams;
  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? (v[0] ?? undefined) : v;
  };
  const { status, page, pageSize } = parseAdminReportsFilters(getParam);
  const initialData = await fetchAdminReportsPage(status, page, pageSize);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  Denuncias de usuarios sobre grupos del directorio. Resuelve o
                  descarta según corresponda.
                </p>
              </div>
            </div>
          </div>

          {/* Explorer (status tabs + table + pagination) */}
          <Card className="mt-4">
            <CardContent className="p-0">
              <AdminReportsExplorer
                initialData={initialData}
                initialStatus={status}
                initialPage={page}
                initialPageSize={pageSize}
                csrfToken={csrfToken}
                pageSizes={REPORT_PAGE_SIZES}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
