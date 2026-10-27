import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { fetchAdminListsPage } from "@/lib/admin-listings";
import {
  parseAdminListsFilters,
  LIST_PAGE_SIZES,
} from "@/lib/admin-listing-params";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, ArrowLeft } from "lucide-react";
import { AdminListsExplorer } from "./admin-lists-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Listas compartidas — Admin Grupos Hoy" },
  description: "Gestión de listas de favoritos compartidas.",
  robots: { index: false, follow: false },
};

/**
 * Server shell for the shared-lists table. First page renders server-side
 * from the URL; the client explorer re-fetches via GET /api/admin/lists on
 * every filter/search/page change (no full-page reloads).
 */
export default async function AdminListsPage({
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
  const { filter, q, page, pageSize } = parseAdminListsFilters(getParam);
  const initialData = await fetchAdminListsPage(filter, q, page, pageSize);

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
                  <Share2 className="h-5 w-5 text-teal-600" />
                  Listas compartidas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enlaces públicos /lista/&lt;código&gt; creados por los usuarios
                  desde sus favoritos.
                </p>
              </div>
            </div>
          </div>

          {/* Explorer (summary + filters + table + pagination) */}
          <Card className="mt-4">
            <CardContent className="p-0">
              <AdminListsExplorer
                initialData={initialData}
                initialFilter={filter}
                initialQ={q}
                initialPage={page}
                initialPageSize={pageSize}
                csrfToken={csrfToken}
                pageSizes={LIST_PAGE_SIZES}
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
