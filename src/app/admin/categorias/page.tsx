import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderTree, ArrowLeft, Plus } from "lucide-react";
import { AdminCategoryForm } from "./admin-category-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Categorías — Admin ConectaGrupos" },
  description: "CRUD de categorías del directorio.",
  robots: { index: false, follow: false },
};

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  isAdult: number;
  isActive: number;
  sortOrder: number;
  source: string;
  createdAt: Date;
}

interface GroupCountRow {
  categoryId: string;
  cnt: number;
}

export default async function AdminCategoriesPage() {
  const { csrfToken } = await checkAdmin();

  const [categoryRows, groupCounts] = await Promise.all([
    query<CategoryRow>(
      "SELECT `id`, `name`, `slug`, `icon`, `color`, `description`, `isAdult`, `isActive`, `sortOrder`, `source`, `createdAt` FROM `categories` ORDER BY `sortOrder` ASC, `name` ASC"
    ),
    query<GroupCountRow>(
      "SELECT `categoryId`, COUNT(*) AS `cnt` FROM `groups` GROUP BY `categoryId`"
    ),
  ]);

  const categories = categoryRows.map((c) => ({
    ...c,
    isAdult: !!c.isAdult,
    isActive: !!c.isActive,
  }));

  const countByCat = (id: string) =>
    Number(groupCounts.find((g) => g.categoryId === id)?.cnt ?? 0);

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
                <FolderTree className="h-5 w-5 text-emerald-600" />
                Gestión de categorías
              </h1>
              <p className="text-sm text-muted-foreground">
                {categories.length} categorías en el banco.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {/* Create form */}
            <Card className="lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-emerald-600" />
                  Nueva categoría
                </CardTitle>
                <CardDescription>Crea una nueva categoría en el banco.</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminCategoryForm csrfToken={csrfToken} mode="create" />
              </CardContent>
            </Card>

            {/* List */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Listado</CardTitle>
                <CardDescription>Edita, activa/desactiva o elimina categorías.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-lg dark:bg-emerald-950/30">
                          {c.icon || "💬"}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium">{c.name}</span>
                            {c.isAdult && (
                              <Badge variant="outline" className="bg-rose-50 px-1 py-0 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                +18
                              </Badge>
                            )}
                            {!c.isActive && (
                              <Badge variant="outline" className="px-1 py-0 text-xs">
                                Inactiva
                              </Badge>
                            )}
                            <Badge variant="outline" className="px-1 py-0 text-xs">
                              {countByCat(c.id)} grupos
                            </Badge>
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            /categoria/{c.slug} · orden {c.sortOrder} · {c.source}
                          </div>
                          {c.description && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <AdminCategoryForm
                          csrfToken={csrfToken}
                          mode="edit"
                          category={c}
                        />
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                      No hay categorías todavía.
                    </div>
                  )}
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
