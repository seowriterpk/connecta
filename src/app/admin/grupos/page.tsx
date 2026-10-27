import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, type Row } from "@/lib/db";
import {
  parseAdminGroupsFilters,
  GROUP_PAGE_SIZES,
  type AdminGroupsFilters,
} from "@/lib/admin-listing-params";
import { fetchAdminGroupsPage } from "@/lib/admin-listings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderTree, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminGroupsExplorer } from "./admin-groups-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Gestión de grupos — Admin Grupos Hoy" },
  description: "Administra todos los grupos del directorio.",
  robots: { index: false, follow: false },
};

/**
 * Server shell for the groups data-table.
 *
 * Renders the FIRST page server-side from the URL (instant paint, shareable
 * deep links), then hands over to the client explorer which re-fetches via
 * GET /api/admin/grupos on every filter change — no full-page reloads.
 */
export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { csrfToken, adminUser } = await checkAdmin();

  const sp = await searchParams;
  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? (v[0] ?? undefined) : v;
  };
  const filters: AdminGroupsFilters = parseAdminGroupsFilters(getParam);

  const [initialData, categoryRows, countryRows] = await Promise.all([
    fetchAdminGroupsPage(filters),
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
                  <FolderTree className="h-5 w-5 text-emerald-600" />
                  Gestión de grupos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Filtra, ordena y edita los grupos del directorio. Los cambios de
                  filtro se aplican al instante.
                </p>
              </div>
            </div>
          </div>

          {/* Explorer (filters + table + pagination) */}
          <Card className="mt-4">
            <CardContent className="p-0">
              <AdminGroupsExplorer
                initialData={initialData}
                initialFilters={filters}
                categories={categories}
                countries={countries}
                csrfToken={csrfToken}
                adminUser={adminUser}
                pageSizes={GROUP_PAGE_SIZES}
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
