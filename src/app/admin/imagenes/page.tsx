import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, type Row } from "@/lib/db";
import { getAdminSettings } from "@/lib/admin-settings";
import { getToolStats } from "@/lib/admin-tools";
import { countImageScopes } from "@/lib/image-tools";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BadgeCheck, ImageDown, Users } from "lucide-react";
import { ImageUpdaterTool } from "@/components/admin/image-updater-tool";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Imágenes en masa — Admin Grupos Hoy" },
  description: "Descarga o refresca imágenes de grupos en lote, autohospedadas.",
  robots: { index: false, follow: false },
};

export default async function AdminImagesPage() {
  const { csrfToken } = await checkAdmin();

  const [categoryRows, countryRows, stats, settings, globalScopes] = await Promise.all([
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name` FROM `categories` WHERE `isActive` = 1 ORDER BY `sortOrder` ASC, `name` ASC"
    ),
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name` FROM `countries` WHERE `isActive` = 1 ORDER BY `name` ASC"
    ),
    getToolStats(),
    getAdminSettings(),
    // Global backlog (no filters) for the header chips — same conditional
    // aggregation the dashboard chips use, so numbers always agree.
    countImageScopes({
      scope: "all",
      status: "all",
      onlyActiveLinks: false,
      overwrite: false,
    }),
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
          {/* Cabecera */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/admin">Panel de administración</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Imágenes en masa</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <ImageDown className="h-5 w-5" />
                </span>
                Imágenes en masa
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Descarga a tu servidor las imágenes que faltan (una sola vez por grupo)
                o re-descarga las existentes — en lotes con parada manual y recuentos en
                vivo de la cola.
              </p>
            </div>

            {/* Chips de estado rápido */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 shadow-sm">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  Grupos:{" "}
                  <span className="font-semibold">
                    {stats.groupsTotal.toLocaleString("es-ES")}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50/60 px-2.5 py-1.5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <ImageDown className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Faltantes por localizar:{" "}
                  <span className="font-semibold">
                    {globalScopes.missing.toLocaleString("es-ES")}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 shadow-sm">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Publicados:{" "}
                  <span className="font-semibold">
                    {stats.live.toLocaleString("es-ES")}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ImageUpdaterTool
              csrfToken={csrfToken}
              categories={categories}
              countries={countries}
              stats={stats}
              defaultBatch={settings.imageBatchSize}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
