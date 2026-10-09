import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { getAllPostsForAdmin, type BlogPostDTO } from "@/lib/blog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ArrowLeft, Plus, Pencil, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import { AdminBlogList } from "./admin-blog-list";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Blog — Admin ConectaGrupos" },
  description: "Gestiona las entradas del blog: crear, editar, publicar.",
  robots: { index: false, follow: false },
};

export default async function AdminBlogPage() {
  const { csrfToken } = await checkAdmin();
  const posts: BlogPostDTO[] = await getAllPostsForAdmin();

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.length - published;
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                <Newspaper className="h-5 w-5 text-emerald-600" />
                Blog del sitio
              </h1>
              <p className="text-sm text-muted-foreground">
                {posts.length} entradas · {published} publicadas · {drafts} borradores
              </p>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1.5">
              <Link href="/admin/blog/nuevo">
                <Plus className="h-4 w-4" />
                Nueva entrada
              </Link>
            </Button>
          </div>

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Newspaper className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-bold leading-none tabular-nums">{published}</p>
                  <p className="text-xs text-muted-foreground">Publicadas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Pencil className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-bold leading-none tabular-nums">{drafts}</p>
                  <p className="text-xs text-muted-foreground">Borradores</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500/10 text-teal-600">
                  <Eye className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-bold leading-none tabular-nums">
                    {totalViews.toLocaleString("es-ES")}
                  </p>
                  <p className="text-xs text-muted-foreground">Lecturas totales</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts list */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Entradas</CardTitle>
              <CardDescription>
                Edita, publica o elimina artículos. El contenido se muestra tal cual en /blog.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed py-10 text-center">
                  <p className="font-semibold">Todavía no hay entradas</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crea la primera entrada del blog y publícala en un clic.
                  </p>
                  <Button asChild size="sm" className="mt-4 gap-1.5">
                    <Link href="/admin/blog/nuevo">
                      <Plus className="h-4 w-4" /> Crear entrada
                    </Link>
                  </Button>
                </div>
              ) : (
                <AdminBlogList posts={posts} csrfToken={csrfToken} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
