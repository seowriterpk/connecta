import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { getPostById, type BlogPostDTO } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft, FilePlus2 } from "lucide-react";
import { BlogEditorForm } from "./blog-editor-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Editar entrada — Admin ConectaGrupos" },
  description: "Editor de entradas del blog.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogEditorPage({ params }: PageProps) {
  const { csrfToken } = await checkAdmin();
  const { id } = await params;

  const isCreate = id === "nuevo";
  let post: BlogPostDTO | null = null;
  if (!isCreate) {
    post = await getPostById(id);
    if (!post) notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/admin/blog">
                <ArrowLeft className="h-4 w-4" />
                Volver al blog
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                {isCreate ? (
                  <>
                    <FilePlus2 className="h-5 w-5 text-emerald-600" />
                    Nueva entrada del blog
                  </>
                ) : (
                  <>
                    <Pencil className="h-5 w-5 text-emerald-600" />
                    Editar entrada
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isCreate
                  ? "Redacta el artículo, guárdalo como borrador o publícalo directamente."
                  : post!.title}
              </p>
            </div>
          </div>

          <BlogEditorForm csrfToken={csrfToken} post={post} postId={isCreate ? null : id} />
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
