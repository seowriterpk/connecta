import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne, type Row } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, UploadCloud, ListChecks, ShieldCheck } from "lucide-react";
import { BulkUploadForm } from "@/components/admin/bulk-upload-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Carga masiva — Admin ConectaGrupos" },
  description: "Importa grupos desde CSV o JSON al directorio.",
  robots: { index: false, follow: false },
};

export default async function AdminBulkUploadPage() {
  const { csrfToken } = await checkAdmin();

  // Load rich banks for the smart auto-suggests (ids, icons, flags, counts)
  // + a tag frequency bank for TagSuggest hints.
  const [categoryRows, countryRows, tagRows, queueCountRow, pendingCountRow] = await Promise.all([
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name`, `slug`, `icon`, `isAdult`, (SELECT COUNT(*) FROM `groups` g WHERE g.`categoryId` = `categories`.`id` AND g.`status` = 'live') AS `cnt` FROM `categories` WHERE `isActive` = 1 ORDER BY `sortOrder` ASC, `name` ASC"
    ),
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name`, `code`, `flag` FROM `countries` WHERE `isActive` = 1 ORDER BY `name` ASC"
    ),
    query<Row & Record<string, unknown>>(
      "SELECT `tags` FROM `groups` WHERE `tags` IS NOT NULL AND `tags` <> '[]' LIMIT 800"
    ),
    queryOne<Row & { cnt: number }>(
      "SELECT COUNT(*) AS `cnt` FROM `groups_queue`"
    ),
    queryOne<Row & { cnt: number }>(
      "SELECT COUNT(*) AS `cnt` FROM `groups` WHERE `status` = ?",
      ["pending"]
    ),
  ]);
  const categories = categoryRows.map((c) => ({
    id: String(c.id),
    name: String(c.name ?? ""),
    slug: String(c.slug ?? ""),
    icon: String(c.icon ?? ""),
    isAdult: !!c.isAdult,
    groupCount: Number(c.cnt ?? 0),
  }));
  const countries = countryRows.map((c) => ({
    id: String(c.id),
    name: String(c.name ?? ""),
    code: String(c.code ?? ""),
    flag: String(c.flag ?? ""),
  }));

  // Aggregate tag usage frequency (used by TagSuggest to rank suggestions).
  const tagFreq = new Map<string, number>();
  for (const r of tagRows) {
    try {
      const arr = JSON.parse(String(r.tags ?? "[]"));
      if (Array.isArray(arr)) {
        for (const t of arr) {
          const k = String(t).toLowerCase();
          if (k) tagFreq.set(k, (tagFreq.get(k) ?? 0) + 1);
        }
      }
    } catch {
      /* ignore malformed rows */
    }
  }
  const tagSuggestions = [...tagFreq.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);
  const queueCount = Number(queueCountRow?.cnt ?? 0);
  const pendingCount = Number(pendingCountRow?.cnt ?? 0);

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
                  <UploadCloud className="h-5 w-5 text-emerald-600" />
                  Carga masiva de grupos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Editor visual con autocompletado, actualización masiva, CSV o JSON — sin IDs manuales.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1">
                <ListChecks className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  Cola drip-feed:{" "}
                  <span className="font-semibold">
                    {queueCount.toLocaleString("es-ES")}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border bg-card px-2 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Grupos pendientes:{" "}
                  <span className="font-semibold">
                    {pendingCount.toLocaleString("es-ES")}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Intro card */}
          <Card className="mt-4 border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <CardContent className="py-4">
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-muted-foreground">
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">
                    Revisa antes de importar:
                  </span>{" "}
                  cada fila debe tener un enlace válido de WhatsApp
                  (<code>chat.whatsapp.com/...</code>), una categoría y país que
                  existan en los bancos, y una descripción de al menos 20
                  caracteres. Los enlaces duplicados se omiten automáticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Main form */}
          <div className="mt-4">
            <BulkUploadForm
              csrfToken={csrfToken}
              categories={categories}
              countries={countries}
              tagSuggestions={tagSuggestions}
            />
          </div>

          {/* Workflow hint */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">¿Cómo funciona?</CardTitle>
              <CardDescription>
                Pasos del flujo de importación masiva.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Step
                  n={1}
                  title="Descarga la plantilla"
                  desc="CSV con encabezados y 2 filas de ejemplo para guiarte."
                />
                <Step
                  n={2}
                  title="Rellena tus grupos"
                  desc="Una fila por grupo. Respeta los campos obligatorios."
                />
                <Step
                  n={3}
                  title="Sube o pega el JSON"
                  desc="Verás una vista previa con validación por fila."
                />
                <Step
                  n={4}
                  title="Importa"
                  desc="Elige destino: cola drip-feed o groups con status=pending."
                />
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}

function Step({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        {n}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}
