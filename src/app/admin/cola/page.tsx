import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, type Row } from "@/lib/db";
import {
  parseAdminQueueFilters,
  QUEUE_PAGE_SIZES,
  type AdminQueueFilters,
  type AdminQueueSource,
} from "@/lib/admin-listing-params";
import {
  fetchAdminPendingPage,
  fetchAdminQueuePage,
  getQueueStats,
} from "@/lib/admin-queue";
import { Button } from "@/components/ui/button";
import { Timer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { QueueManager } from "./queue-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Cola de publicación — Admin Grupos Hoy" },
  description: "Programa, publica, edita o elimina grupos en espera por lotes.",
  robots: { index: false, follow: false },
};

/**
 * Server shell for the queue/schedule manager (Task 30-b).
 *
 * Renders the FIRST page server-side from the URL (instant paint, shareable
 * deep links — ?source=pending links work too), then hands over to the client
 * QueueManager which re-fetches via GET /api/admin/queue on every change.
 */
export default async function AdminColaPage({
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
  const filters: AdminQueueFilters = parseAdminQueueFilters(getParam);
  const source: AdminQueueSource = getParam("source") === "pending" ? "pending" : "queue";

  const [page, stats, categoryRows, countryRows] = await Promise.all([
    source === "pending"
      ? fetchAdminPendingPage(filters)
      : fetchAdminQueuePage(filters),
    getQueueStats(),
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name` FROM `categories` ORDER BY `sortOrder` ASC, `name` ASC"
    ),
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name` FROM `countries` ORDER BY `name` ASC"
    ),
  ]);

  const categories = categoryRows.map((c) => ({
    id: String(c.id),
    name: String(c.name ?? ""),
  }));
  const countries = countryRows.map((c) => ({
    id: String(c.id),
    name: String(c.name ?? ""),
  }));

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
                  <Timer className="h-5 w-5 text-emerald-600" />
                  Cola de publicación
                </h1>
                <p className="text-sm text-muted-foreground">
                  Programa, publica, edita o elimina grupos en espera — por lotes
                  o de uno en uno. El drip-feed publica los más antiguos primero.
                </p>
              </div>
            </div>
          </div>

          {/* Manager (KPIs + chips + tabs + filters + table + bulk bar) */}
          <QueueManager
            initialData={{ page, stats }}
            initialFilters={filters}
            initialSource={source}
            categories={categories}
            countries={countries}
            csrfToken={csrfToken}
            pageSizes={QUEUE_PAGE_SIZES}
          />
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
