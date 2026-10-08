import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings2, ArrowLeft, Plus } from "lucide-react";
import { AdminSeoOverrideForm, AdminEntityIntroForm } from "./admin-seo-forms";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "SEO — Admin ConectaGrupos" },
  description: "Override de metadatos y textos intro.",
  robots: { index: false, follow: false },
};

interface OverrideRow {
  id: number;
  pageType: string;
  entityId: string;
  metaTitleOverride: string | null;
  metaDescriptionOverride: string | null;
  robotsOverride: string | null;
}

interface IntroRow {
  id: number;
  entityType: string;
  entityName: string;
  customTitle: string | null;
  customHeroDesc: string | null;
  customIntro: string | null;
}

export default async function AdminSeoPage() {
  const { csrfToken } = await checkAdmin();

  const [overrides, intros] = await Promise.all([
    query<OverrideRow>(
      "SELECT `id`, `pageType`, `entityId`, `metaTitleOverride`, `metaDescriptionOverride`, `robotsOverride` FROM `seo_overrides` ORDER BY `pageType` ASC, `entityId` ASC LIMIT 200"
    ),
    query<IntroRow>(
      "SELECT `id`, `entityType`, `entityName`, `customTitle`, `customHeroDesc`, `customIntro` FROM `entity_intros` ORDER BY `entityType` ASC, `entityName` ASC LIMIT 200"
    ),
  ]);

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
                <Settings2 className="h-5 w-5 text-emerald-600" />
                SEO e intros
              </h1>
              <p className="text-sm text-muted-foreground">
                Metadatos por página + textos intro de entidad.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* SEO overrides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>SEO Overrides ({overrides.length})</span>
                  <AdminSeoOverrideForm csrfToken={csrfToken} mode="create" />
                </CardTitle>
                <CardDescription>
                  Override de title, meta description y robots por entidad.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="max-h-[28rem] divide-y overflow-y-auto">
                  {overrides.length === 0 && (
                    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Sin overrides. Crea uno con el botón superior.
                    </div>
                  )}
                  {overrides.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="bg-emerald-50 px-1.5 py-0 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {o.pageType}
                          </Badge>
                          <Badge variant="outline" className="px-1.5 py-0 text-xs">
                            {o.entityId}
                          </Badge>
                        </div>
                        {o.metaTitleOverride && (
                          <div className="mt-1 truncate text-sm font-medium" title={o.metaTitleOverride}>
                            {o.metaTitleOverride}
                          </div>
                        )}
                        {o.metaDescriptionOverride && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {o.metaDescriptionOverride}
                          </p>
                        )}
                        {o.robotsOverride && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            robots: <span className="font-mono">{o.robotsOverride}</span>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        <AdminSeoOverrideForm
                          csrfToken={csrfToken}
                          mode="edit"
                          override={o}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Entity intros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Entity Intros ({intros.length})</span>
                  <AdminEntityIntroForm csrfToken={csrfToken} mode="create" />
                </CardTitle>
                <CardDescription>
                  Título y texto intro personalizado por categoría, país, ciudad o etiqueta.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="max-h-[28rem] divide-y overflow-y-auto">
                  {intros.length === 0 && (
                    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Sin intros. Crea una con el botón superior.
                    </div>
                  )}
                  {intros.map((i) => (
                    <div
                      key={i.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="bg-violet-50 px-1.5 py-0 text-xs text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                            {i.entityType}
                          </Badge>
                          <Badge variant="outline" className="px-1.5 py-0 text-xs">
                            {i.entityName}
                          </Badge>
                        </div>
                        {i.customTitle && (
                          <div className="mt-1 truncate text-sm font-medium" title={i.customTitle}>
                            {i.customTitle}
                          </div>
                        )}
                        {i.customIntro && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {i.customIntro}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <AdminEntityIntroForm
                          csrfToken={csrfToken}
                          mode="edit"
                          intro={i}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
