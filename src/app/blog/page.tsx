import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight, Clock, Eye, CalendarDays, ArrowRight, PenLine } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { getPublishedPosts } from "@/lib/blog";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Blog — Consejos y novedades de grupos de WhatsApp | ${SITE.name}` },
  description:
    "Artículos en español sobre grupos de WhatsApp: cómo encontrarlos, unirte con seguridad, administrar comunidades y promocionarlas. Guías prácticas del equipo de ConectaGrupos.",
  alternates: { canonical: `${SITE.url}/blog` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Blog — Consejos y novedades de grupos de WhatsApp | ${SITE.name}`,
    description:
      "Guías prácticas en español sobre encontrar, unirte y administrar grupos de WhatsApp.",
    url: `${SITE.url}/blog`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  keywords: [
    "blog grupos de WhatsApp",
    "consejos WhatsApp",
    "guías grupos WhatsApp español",
    "administrar grupos WhatsApp",
  ],
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: `Blog de ${SITE.name}`,
  description: "Consejos y novedades sobre grupos de WhatsApp en español.",
  url: `${SITE.url}/blog`,
  inLanguage: "es",
  publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts(50);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd) }}
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
              <li className="font-medium text-foreground">Blog</li>
            </ol>
          </div>
        </nav>

        {/* Header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Blog
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Consejos y novedades de grupos de WhatsApp
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Artículos originales en español para encontrar, unirte y administrar comunidades de
                WhatsApp con seguridad. Escritos por el equipo de {SITE.name}.
              </p>
            </div>
          </div>
        </header>

        {/* Posts grid */}
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-3xl">
                  <PenLine className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">Muy pronto: nuevos artículos</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Estamos redactando las primeras guías. Mientras tanto, explora el directorio y
                  encuentra tu comunidad.
                </p>
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                  >
                    Explorar grupos <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <StaggerItem key={p.id}>
                    <article className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl"
                          aria-hidden
                        >
                          {p.coverEmoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-sm font-semibold leading-snug">
                            <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0">
                              {p.title}
                            </Link>
                          </h2>
                          <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            <time dateTime={p.publishedAt ?? undefined}>{fmtDate(p.publishedAt)}</time>
                            <span aria-hidden>·</span>
                            <Clock className="h-3 w-3" />
                            {p.readingMinutes} min
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {p.excerpt}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {p.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="font-normal">
                              #{t}
                            </Badge>
                          ))}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary transition group-hover:translate-x-0.5">
                          Leer <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>

                      <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Eye className="h-3 w-3" /> {p.views.toLocaleString("es-ES")} lecturas ·{" "}
                        {p.authorName}
                      </p>
                    </article>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            )}

            <Reveal delay={0.1}>
              <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  ¿Administras un grupo y quieres darle visibilidad? Publícalo gratis y llega a
                  miles de hispanohablantes.
                </p>
                <Link
                  href="/agregar-grupo"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Enviar tu grupo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
