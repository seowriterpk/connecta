import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Send, ShieldCheck, Sparkles, Clock, Globe2, MessageCircle } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { getCategories, getCountries } from "@/lib/data";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { AddGroupForm } from "@/components/site/add-group-form";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute:
      "Agregar Grupo de WhatsApp — ConectaGrupos | Publica tu comunidad",
  },
  description:
    "Agrega gratis tu grupo de WhatsApp al directorio ConectaGrupos. Verificamos el enlace al instante, calculamos una puntuación de calidad y lo publicamos si cumple las normas.",
  alternates: {
    canonical: `${SITE.url}/agregar-grupo`,
  },
  openGraph: {
    title: "Agregar Grupo de WhatsApp — ConectaGrupos | Publica tu comunidad",
    description:
      "Comparte tu comunidad de WhatsApp con miles de hispanohablantes. Verificación instantánea del enlace, puntuación de calidad en vivo y publicación gratuita.",
    url: `${SITE.url}/agregar-grupo`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
      images: ["/og.svg"],
    title: "Agregar Grupo de WhatsApp — ConectaGrupos",
    description:
      "Agrega tu grupo de WhatsApp gratis. Verificación instantánea, puntuación de calidad y revisión humana.",
  },
  keywords: [
    "agregar grupo de WhatsApp",
    "añadir grupo de WhatsApp",
    "publicar grupo de WhatsApp",
    "compartir grupo de WhatsApp",
    "registrar grupo WhatsApp",
    "directorio de grupos de WhatsApp",
    "grupos de WhatsApp en español",
    "promocionar grupo de WhatsApp",
    "enviar grupo WhatsApp",
  ],
  robots: { index: true, follow: true },
};

export default async function AgregarGrupoPage() {
  const [categories, countries] = await Promise.all([
    getCategories(),
    getCountries(),
  ]);

  // JSON-LD: WebPage describing the public submission page.
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Agregar Grupo de WhatsApp — ConectaGrupos",
    description:
      "Formulario público para agregar un grupo de WhatsApp al directorio ConectaGrupos. Verificación instantánea del enlace, puntuación de calidad y publicación gratuita.",
    url: `${SITE.url}/agregar-grupo`,
    inLanguage: "es",
    isPartOf: {
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
    },
    about: {
      "@type": "Thing",
      name: "Publicar un grupo de WhatsApp en español",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "Agregar grupo",
          item: `${SITE.url}/agregar-grupo`,
        },
      ],
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(webPageJsonLd) }}
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
              <li className="font-medium text-foreground">Agregar grupo</li>
            </ol>
          </div>
        </nav>

        {/* Page header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-3xl flex-col items-start gap-5">
              <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <Send className="h-3.5 w-3.5 text-primary" />
                <span>Asistente de publicación · 7 pasos</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Agrega tu grupo de WhatsApp al directorio
              </h1>
              <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Sigue el asistente en 7 pasos para publicar tu comunidad. Verificamos
                el enlace al instante, calculamos una puntuación de calidad en vivo y
                publicamos automáticamente los grupos que cumplan las normas. El envío
                es <strong className="font-semibold text-foreground">gratis</strong> y
                no requiere registro.
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Verificación instantánea
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Puntuación de calidad
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Auto-publicación ≥ 70 puntos
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Globe2 className="h-3.5 w-3.5 text-primary" />
                  {countries.length} países hispanos
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Form section */}
        <section className="py-10 sm:py-14" aria-labelledby="form-heading">
          <div className="container mx-auto px-4">
            <h2 id="form-heading" className="sr-only">
              Formulario para agregar un grupo de WhatsApp
            </h2>
            <AddGroupForm categories={categories} countries={countries} />
          </div>
        </section>

        {/* Long-form SEO content */}
        <section
          className="border-t bg-muted/20 py-10 sm:py-14"
          aria-labelledby="seo-heading"
        >
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl text-pretty">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                <span>Cómo funciona la publicación</span>
              </div>
              <h2 id="seo-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Publica tu grupo en minutos con verificación automática
              </h2>

              <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/85 sm:text-base">
                <p>
                  El asistente de <strong className="font-semibold text-foreground">ConectaGrupos</strong>{" "}
                  está diseñado para que publicar un grupo de WhatsApp sea rápido y
                  seguro. En el primer paso pegas el enlace de invitación y nuestro
                  sistema lo verifica al instante descargando los metadatos de WhatsApp
                  (og:title y og:image) con un agente móvil real. Si el enlace está
                  revocado o caducado, te avisamos en español antes de seguir. Si está
                  activo, traemos el nombre y la imagen del grupo automáticamente para
                  que no tengas que escribirlos a mano.
                </p>

                <p>
                  A medida que avanzas por los pasos, calculamos en vivo tu{" "}
                  <strong className="font-semibold text-foreground">puntuación de calidad</strong>{" "}
                  (0-100): sumas puntos por tener enlace válido, nombre claro, categoría,
                  país, ciudad, etiquetas y palabras clave; y pierdes puntos si se
                  detectan palabras sospechosas o si el grupo ya está en el directorio.
                  Los grupos con 70 puntos o más se publican automáticamente; los que
                  tienen entre 40 y 69 entran en cola de revisión humana; y los que no
                  superan las normas se rechazan con un mensaje claro. Todo el proceso
                  incluye protección anti-spam: limitamos a 10 envíos por dispositivo al
                  día y 30 por IP, un campo honeypot para detectar bots y un control de
                  tiempo mínimo de rellenado.
                </p>

                <p>
                  Para que tu grupo se publique cuanto antes, asegúrate de completar
                  todos los campos obligatorios: una descripción de al menos 20
                  caracteres, un mínimo de 3 etiquetas y 3 palabras clave. Si quieres
                  ganar reputación como colaborador, en el paso 6 puedes crear un perfil
                  público con un nombre y una clave privada (cifrada con bcrypt). Así
                  acumularás puntos cada vez que publiques un grupo y tu nombre aparecerá
                  como autor. ¿Listo para empezar? Vuelve al formulario, pega tu enlace
                  y en menos de cinco minutos tu comunidad estará en el directorio.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
                <Link
                  href="/categorias"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Ver todas las categorías
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Explorar grupos publicados
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  );
}
