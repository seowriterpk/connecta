import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, type Row } from "@/lib/db";
import { getAdminSettings } from "@/lib/admin-settings";
import { getToolStats } from "@/lib/admin-tools";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link2 } from "lucide-react";
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
                  <Link2 className="h-5 w-5 text-emerald-600" />
                  Comprobador masivo de enlaces
                </h1>
                <p className="text-sm text-muted-foreground">
                  Verifica en lote qué invitaciones siguen activas — vía proxy
                  residencial, por lotes pequeños y con parada manual.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
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
