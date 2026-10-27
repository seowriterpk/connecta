import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, type Row } from "@/lib/db";
import { getAdminSettings } from "@/lib/admin-settings";
import { getToolStats } from "@/lib/admin-tools";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BadgeCheck, Link2, Users, ShieldQuestion } from "lucide-react";
import { LinkCheckerTool } from "@/components/admin/link-checker-tool";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Comprobador de enlaces — Admin Grupos Hoy" },
  description: "Verifica en masa qué enlaces de invitación siguen activos.",
  robots: { index: false, follow: false },
};

export default async function AdminLinkCheckerPage() {
  const { csrfToken } = await checkAdmin();

  const [categoryRows, countryRows, stats, settings] = await Promise.all([
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name` FROM `categories` WHERE `isActive` = 1 ORDER BY `sortOrder` ASC, `name` ASC"
    ),
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name` FROM `countries` WHERE `isActive` = 1 ORDER BY `name` ASC"
    ),
    getToolStats(),
    getAdminSettings(),
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
                    <BreadcrumbPage>Comprobador de enlaces</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Link2 className="h-5 w-5" />
                </span>
                Comprobador masivo de enlaces
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Verifica en lote qué invitaciones siguen activas — vía proxy
                residencial, por lotes pequeños y con parada manual. Lo ya
                comprobado queda guardado aunque detengas la ejecución.
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
              <div className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 shadow-sm">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Publicados:{" "}
                  <span className="font-semibold">
                    {stats.live.toLocaleString("es-ES")}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-amber-200/80 bg-amber-50/60 px-2.5 py-1.5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
                <ShieldQuestion className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  Sin comprobar:{" "}
                  <span className="font-semibold">
                    {stats.neverChecked.toLocaleString("es-ES")}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <LinkCheckerTool
              csrfToken={csrfToken}
              categories={categories}
              countries={countries}
              stats={stats}
              defaultBatch={settings.linkCheckBatchSize}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
