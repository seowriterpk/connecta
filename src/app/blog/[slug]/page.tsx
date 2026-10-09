import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { BookOpen, ChevronRight, Clock, Eye, CalendarDays, ArrowRight, UserRound } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { getPublishedPostBySlug, getPublishedPosts, incrementPostViews } from "@/lib/blog";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { GroupCard } from "@/components/site/group-card";
import { getGroups } from "@/lib/data";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return { title: "Artículo no encontrado", robots: { index: false, follow: false } };
  }
  const canonical = `${SITE.url}/blog/${post.slug}`;
  const title = post.metaTitle?.trim() || `${post.title} | ${SITE.name}`;
  const description =
    post.metaDescription?.trim() || post.excerpt.slice(0, 180) || `Artículo de ${SITE.name}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      locale: "es_ES",
      siteName: SITE.name,
      images: [OG_IMAGE],
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og.svg"] },
    keywords: [...post.tags, "grupos de WhatsApp", "blog WhatsApp español"],
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  // View counter (server-side, fire-and-forget — simple for crawlers/manager).
  incrementPostViews(post.id).catch(() => {});

  const [related, latest] = await Promise.all([
    getGroups({ sort: "populares", limit: 3 }),
    getPublishedPosts(4),
  ]);
  const others = latest.filter((p) => p.id !== post.id).slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article" as const,
    headline: post.title,
    description: post.excerpt,
    inLanguage: "es",
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE.url}/blog/${post.slug}` },
    articleSection: "Guías",
    keywords: post.tags.join(", "),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE.url}/blog/${post.slug}` },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />

      <SiteHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary">
                  Inicio
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary">
                  Blog
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="line-clamp-1 max-w-[50vw] font-medium text-foreground sm:max-w-xs">
                {post.title}
              </li>
            </ol>
          </div>
        </nav>

        {/* Article header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-3xl" aria-hidden>
                  {post.coverEmoji}
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3 w-3" /> {post.authorName}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <time dateTime={post.publishedAt ?? undefined}>{fmtDate(post.publishedAt)}</time>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readingMinutes} min de lectura
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {post.views.toLocaleString("es-ES")}
                  </span>
                </div>
              </div>
              <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                {post.excerpt}
              </p>
              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="font-normal">
                      #{t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Article body — server-rendered markdown (crawlable, no client JS needed) */}
        <article className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="prose-cg text-pretty text-sm leading-relaxed text-foreground/90 sm:text-base">
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => (
                      <Link href={href ?? "#"} className="font-medium text-primary hover:underline">
                        {children}
                      </Link>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>

              {/* Related groups — internal linking (SEO) */}
              <Reveal delay={0.05}>
                <aside className="mt-12 rounded-3xl border bg-muted/20 p-5 sm:p-6" aria-labelledby="related-groups-heading">
                  <h2 id="related-groups-heading" className="flex items-center gap-2 text-base font-bold tracking-tight">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Grupos recomendados
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Comunidades populares del directorio, verificadas por nuestro equipo.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((g) => (
                      <GroupCard key={g.id} group={g} />
                    ))}
                  </div>
                </aside>
              </Reveal>

              {/* Other posts */}
              {others.length > 0 && (
                <Reveal delay={0.1}>
                  <aside className="mt-8" aria-labelledby="other-posts-heading">
                    <h2 id="other-posts-heading" className="text-base font-bold tracking-tight">
                      Seguir leyendo
                    </h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {others.map((p) => (
                        <Link
                          key={p.id}
                          href={`/blog/${p.slug}`}
                          className="group flex flex-col rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                        >
                          <span className="text-xl" aria-hidden>
                            {p.coverEmoji}
                          </span>
                          <span className="mt-2 line-clamp-2 text-xs font-semibold leading-snug">
                            {p.title}
                          </span>
                          <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-medium text-primary">
                            Leer <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </aside>
                </Reveal>
              )}
            </div>
          </div>
        </article>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  );
}
