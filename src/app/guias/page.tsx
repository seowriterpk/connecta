import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight, ArrowRight, Clock } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal, StaggerGrid, StaggerItem } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { GUIDES } from "@/lib/guides";
import { jsonLdScript } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: { absolute: `Guías y Tutoriales — ${SITE.name}` },
  description:
    "Guías prácticas en español para crear, administrar y promocionar grupos de WhatsApp: enlaces de invitación, seguridad, normas para grupos grandes, cómo ganar miembros y más.",
  alternates: { canonical: `${SITE.url}/guias` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Guías y Tutoriales — ${SITE.name}`,
    description:
      "Tutoriales cortos y directos sobre grupos de WhatsApp en español. Creado por y para la comunidad hispanohablante.",
    url: `${SITE.url}/guias`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  keywords: [
    "guías grupos WhatsApp",
    "tutoriales WhatsApp español",
    "crear grupo WhatsApp",
    "enlaces invitación WhatsApp",
    "seguridad grupos WhatsApp",
    "administrar grupos WhatsApp",
    "ganar miembros grupo WhatsApp",
  ],
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Guías y Tutoriales — ${SITE.name}`,
  description:
    "Índice de guías prácticas sobre grupos de WhatsApp en español.",
  url: `${SITE.url}/guias`,
  inLanguage: "es",
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guías y Tutoriales",
        item: `${SITE.url}/guias`,
      },
    ],
  },
};

export default function GuiasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(webPageJsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
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

        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Aprende
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Guías y Tutoriales
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Artículos cortos y directos para sacarle el máximo a WhatsApp: crear grupos,
                administrarlos, detectar estafas y hacerlos crecer de verdad. Contenido original
                en español, escrito por y para la comunidad.
              </p>
            </div>
          </div>
        </header>

        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDES.map((g, i) => (
                <StaggerItem key={g.title}>
                  <Link
                    href="/blog"
                    className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-xl">
                        {g.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold leading-snug">
                          {g.title}
                        </h2>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {g.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="secondary" className="font-normal">{g.tag}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        Leer guía
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> ~3 min de lectura
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGrid>

            <Reveal delay={0.1}>
              <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  ¿Eres admin de un grupo y quieres darle visibilidad? Publícalo gratis en
                  ConectaGrupos y llega a miles de hispanohablantes.
                </p>
                <Link
                  href="/agregar-grupo"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Enviar tu grupo
                  <ArrowRight className="h-4 w-4" />
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
