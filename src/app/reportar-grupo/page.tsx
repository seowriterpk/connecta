import type { Metadata } from "next";
import Link from "next/link";
import { Flag, ChevronRight, ShieldAlert } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { ReportGroupClient } from "@/components/site/report-group-client";
import { jsonLdScript } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Reportar un Grupo",
  description:
    "Reporta un grupo de WhatsApp que incumpla las normas: enlace roto, contenido inapropiado, spam o estafa. Tu reporte es anónimo y lo revisamos con prioridad.",
  alternates: { canonical: `${SITE.url}/reportar-grupo` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Reportar un Grupo | Grupos Hoy",
    description:
      "Ayúdanos a mantener el directorio limpio: reporta grupos con enlaces rotos, spam, estafas o contenido inapropiado.",
    url: `${SITE.url}/reportar-grupo`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  keywords: [
    "reportar grupo WhatsApp",
    "denunciar grupo WhatsApp",
    "grupo spam WhatsApp",
    "enlace roto WhatsApp",
    "estafa grupo WhatsApp",
  ],
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Reportar un Grupo — ${SITE.name}`,
  description:
    "Formulario para reportar grupos de WhatsApp que incumplan las normas de Grupos Hoy.",
  url: `${SITE.url}/reportar-grupo`,
  inLanguage: "es",
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Reportar un grupo",
        item: `${SITE.url}/reportar-grupo`,
      },
    ],
  },
};

export default function ReportarGrupoPage() {
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
              <li className="font-medium text-foreground">Reportar un grupo</li>
            </ol>
          </div>
        </nav>

        <header className="border-b bg-gradient-to-br from-destructive/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                Reporta y ayuda a la comunidad
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Reportar un grupo de WhatsApp
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Si un grupo incumple las normas (enlace roto, contenido inapropiado, spam o
                estafa), repórtalo. Tu ayuda es anónima y revisamos cada caso con prioridad.
              </p>
            </div>
          </div>
        </header>

        <section className="py-10 sm:py-14">
          <div className="container mx-auto">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 flex items-start gap-3 rounded-2xl border bg-muted/30 p-4 text-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <Flag className="h-4 w-4" />
                </span>
                <p className="text-muted-foreground">
                  Antes de reportar, comprueba que el grupo realmente incumple las normas.
                  Los reportes falsos repetidos pueden llevar a limitar tu capacidad de reportar.
                </p>
              </div>
              <ReportGroupClient />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
