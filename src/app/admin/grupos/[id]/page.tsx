import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne, type Row } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Pencil, Eye, ExternalLink } from "lucide-react";
import { AdminGroupEditForm } from "./admin-group-edit-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Editar grupo — Admin ConectaGrupos" },
  description: "Editar un grupo individual.",
  robots: { index: false, follow: false },
};

export default async function AdminGroupEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { csrfToken, adminUser } = await checkAdmin();
  const { id } = await params;

  const group = await queryOne<Row & Record<string, unknown>>(
    `SELECT \`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`description\`, \`category\`, \`categoryId\`,
            \`country\`, \`countryId\`, \`city\`, \`keywords\`, \`tags\`, \`profileImage\`, \`language\`,
            \`status\`, \`linkStatus\`, \`isAdult\`, \`clicks\`, \`createdAt\`, \`updatedAt\`
     FROM \`groups\` WHERE \`id\` = ? LIMIT 1`,
    [id]
  );

  if (!group) notFound();

  const groupData = {
    id: String(group.id),
    groupName: String(group.groupName ?? ""),
    slug: String(group.slug ?? ""),
    joinLink: String(group.joinLink ?? ""),
    description: String(group.description ?? ""),
    category: String(group.category ?? ""),
    categoryId: String(group.categoryId ?? ""),
    country: String(group.country ?? ""),
    countryId: String(group.countryId ?? ""),
    city: (group.city as string | null) ?? null,
    keywords: String(group.keywords ?? ""),
    tags: String(group.tags ?? ""),
    profileImage: (group.profileImage as string | null) ?? null,
    language: String(group.language ?? "Espanol"),
    status: String(group.status ?? "pending"),
    linkStatus: String(group.linkStatus ?? "active"),
    isAdult: !!group.isAdult,
    clicks: Number(group.clicks ?? 0),
    createdAt: (group.createdAt as Date | string) ?? new Date(0),
    updatedAt: (group.updatedAt as Date | string) ?? new Date(0),
  };

  const [categories, countries, tagRows] = await Promise.all([
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name`, `icon`, `isAdult`, (SELECT COUNT(*) FROM `groups` g WHERE g.`categoryId` = `categories`.`id` AND g.`status` = 'live') AS `cnt` FROM `categories` ORDER BY `sortOrder` ASC"
    ),
    query<Row & Record<string, unknown>>(
      "SELECT `id`, `name`, `flag`, `code` FROM `countries` ORDER BY `name` ASC"
    ),
    query<Row & Record<string, unknown>>(
      "SELECT `tags` FROM `groups` WHERE `status` = 'live' AND `tags` IS NOT NULL AND `tags` <> '[]' LIMIT 500"
    ),
  ]);
  const categoryOptions = categories.map((c) => ({
    id: String(c.id),
    name: String(c.name ?? ""),
    icon: String(c.icon ?? ""),
    isAdult: !!c.isAdult,
    groupCount: Number(c.cnt ?? 0),
  }));
  const countryOptions = countries.map((c) => ({
    id: String(c.id),
    name: String(c.name ?? ""),
    flag: String(c.flag ?? ""),
    code: String(c.code ?? ""),
  }));

  // Aggregate tag usage frequency for the TagSuggest hints.
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
    .slice(0, 80);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Top bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href="/admin/grupos">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a grupos
                </Link>
              </Button>
              <div>
                <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                  <Pencil className="h-5 w-5 text-emerald-600" />
                  Editar grupo
                </h1>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono text-xs">{groupData.id}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/grupo/${groupData.slug}`} target="_blank">
                  <Eye className="h-3.5 w-3.5" />
                  Ver en sitio
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Group header card */}
          <Card className="mt-4 border-emerald-200/60">
            <CardHeader>
              <CardTitle className="text-lg">{groupData.groupName}</CardTitle>
              <CardDescription>
                <span className="font-mono text-xs text-muted-foreground">/grupo/{groupData.slug}</span>
                {" · "}
                Creado {new Date(groupData.createdAt).toLocaleDateString("es-ES")}
                {" · "}
                {groupData.clicks.toLocaleString("es-ES")} clicks
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Edit form */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Campos editables</CardTitle>
              <CardDescription>
                Todos los cambios quedan registrados en la auditoría como {adminUser}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminGroupEditForm
                group={groupData}
                categories={categoryOptions}
                countries={countryOptions}
                tagSuggestions={tagSuggestions}
                csrfToken={csrfToken}
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
