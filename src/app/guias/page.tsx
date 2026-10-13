import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight, Clock, Eye, CalendarDays, ArrowRight, PenLine, Compass } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { getPublishedPosts } from "@/lib/blog";
import { hreflangAlternates } from "@/lib/hreflang";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

// Quick-start themes: the six questions almost everyone arrives with,
// each linking straight to the full guide that answers it.
const QUICK_STARTS = [
  {
    icon: "🔗",
    label: "Unirme a un grupo",
    hint: "Enlace, QR, comunidad o admin: los 4 caminos.",
    href: "/guias/como-unirse-a-un-grupo-de-whatsapp-guia-completa",
  },
  {
    icon: "🛡️",
    label: "Detectar estafas",
    hint: "9 señales de alerta antes de pagar o dar datos.",
    href: "/guias/estafas-en-grupos-de-whatsapp-9-senales",
  },
  {
    icon: "🛠️",
    label: "Crear mi grupo",
    hint: "De cero a la primera conversación de verdad.",
    href: "/guias/como-crear-un-grupo-de-whatsapp-guia-completa",
  },
  {
    icon: "📋",
    label: "Reglas listas",
    hint: "7 plantillas para copiar y pegar hoy mismo.",
    href: "/guias/reglas-para-grupos-de-whatsapp-copiar-y-pegar",
  },
  {
    icon: "🏘️",
    label: "Comunidades",
    hint: "Qué son y cuándo convienen vs grupo o canal.",
    href: "/guias/comunidad-de-whatsapp-que-es-y-para-que-sirve",
  },
  {
    icon: "📢",
    label: "Vender sin spam",
    hint: "Grupos de clientes que compran y no se van.",
    href: "/guias/como-usar-grupos-de-whatsapp-para-vender-sin-spam",
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getPublishedPosts(60);
  const count = posts.length;
  // Count-first CTR title — honest, dynamic, same pattern as the home.
  const title = `${count} Guías de Grupos de WhatsApp | Grupos Hoy`;
  const description = `${count} guías en español para unirte, crear y administrar grupos de WhatsApp con seguridad: enlaces de invitación, reglas, comunidades, canales y más.`;
  return {
    title: { absolute: title },
    description,
    alternates: hreflangAlternates("/guias"),
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/guias`,
      type: "website",
      locale: "es_ES",
      siteName: SITE.name,
      images: [OG_IMAGE],
    },
    keywords: [
      "guías grupos de WhatsApp",
      "tutoriales WhatsApp español",
      "crear grupo WhatsApp",
      "enlaces de invitación WhatsApp",
      "seguridad grupos WhatsApp",
      "administrar grupos WhatsApp",
      "comunidades de WhatsApp",
    ],
  };
}

const blogJsonLd = (posts: { slug: string; title: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "Blog",
  name: `Guías de ${SITE.name}`,
  description: `Guías prácticas en español sobre grupos de WhatsApp: unirse, crear, administrar y promocionar.`,
  url: `${SITE.url}/guias`,
  inLanguage: "es",
  publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  blogPost: posts.slice(0, 10).map((p) => ({
    "@type": "BlogPosting",
    headline: p.title,
    url: `${SITE.url}/guias/${p.slug}`,
  })),
});

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default async function GuiasPage() {
  const posts = await getPublishedPosts(60);
  const count = posts.length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Guías", item: `${SITE.url}/guias` },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd(posts)) }}
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
              <li className="font-medium text-foreground">Guías</li>
            </ol>
          </div>
        </nav>

        {/* Header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                {count} guías en español
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Guías de grupos de WhatsApp
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Todo sobre grupos de WhatsApp, explicado paso a paso y sin vueltas: cómo unirte con
                seguridad, crear tu grupo, poner reglas que sí funcionan y aprovechar comunidades y
                canales. Escritas por Antonio C. y el equipo de {SITE.name}.
              </p>
            </div>
          </div>
        </header>

        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            {/* Quick starts — the 6 questions everyone arrives with */}
            <Reveal>
              <div className="mb-8">
                <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
                  <Compass className="h-4 w-4 text-primary" />
                  Empieza por aquí
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Las seis dudas más comunes, resueltas en una guía cada una.
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {QUICK_STARTS.map((q) => (
                    <li key={q.href}>
                      <Link
                        href={q.href}
                        className="group flex h-full items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                      >
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xl"
                          aria-hidden
                        >
                          {q.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-snug">
                            {q.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {q.hint}
                          </span>
                        </span>
                        <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Full post grid */}
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-3xl">
                  <PenLine className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">Muy pronto: nuevas guías</h2>
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
                            <Link href={`/guias/${p.slug}`} className="after:absolute after:inset-0">
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
                  quienes buscan grupos como el tuyo.
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
