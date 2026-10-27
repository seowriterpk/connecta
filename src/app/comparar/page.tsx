import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Scale, Sparkles } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { getGroups } from "@/lib/data";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { RecentlyViewed } from "@/components/site/recently-viewed";
import { CompareTool } from "@/components/site/compare-tool";
import { toGroupCardDTO } from "@/lib/lite-dto";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

const description =
  "Compara hasta 3 grupos de WhatsApp lado a lado: vistas, clics y estado del enlace, con el mejor de cada métrica destacado.";

export const metadata: Metadata = {
  // Non-absolute: the layout template appends "| Grupos Hoy".
  title: "Comparar Grupos de WhatsApp",
  description,
  alternates: { canonical: `${SITE.url}/comparar` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Comparar Grupos de WhatsApp | Grupos Hoy",
    description,
    url: `${SITE.url}/comparar`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image",
      images: ["/og.svg"], title: "Comparar Grupos de WhatsApp | Grupos Hoy", description },
  keywords: [
    "comparar grupos de WhatsApp",
    "cual grupo de WhatsApp es mejor",
    "grupos de WhatsApp en español",
    "mejores grupos de WhatsApp",
  ],
};

export default async function CompararPage() {
  // Pre-fetch popular groups for one-tap suggestions (no client loading state).
  // Mapped to card-lite DTOs — no description crosses the boundary (SEO
  // directive: the group description is rendered ONLY on /grupo/[slug]).
  const suggestions = (await getGroups({ sort: "populares", limit: 10 })).map(toGroupCardDTO);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Comparador de grupos de WhatsApp",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        description,
        url: `${SITE.url}/comparar`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Comparar", item: `${SITE.url}/comparar` },
        ],
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <SiteHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Inicio</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="font-medium text-foreground">Comparar</li>
            </ol>
          </div>
        </nav>

        {/* Hero */}
        <header className="border-b bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/50 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                <Scale className="h-3.5 w-3.5" /> Herramienta gratuita
              </span>
              <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-4xl">
                Compara grupos de WhatsApp lado a lado
              </h1>
              <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
                ¿Dudando entre dos o tres comunidades? Elige hasta 3 grupos y verás sus
                vistas y clics en una sola tabla, junto al estado del enlace, con
                el mejor de cada métrica destacado para que decidas más rápido.
              </p>
            </div>
          </div>
        </header>

        {/* Recently viewed */}
        <RecentlyViewed />

        {/* Compare tool */}
        <section className="pt-2 sm:pt-4" aria-labelledby="comparar-heading">
          <div className="container mx-auto px-4">
            <h2 id="comparar-heading" className="sr-only">
              Comparador de grupos
            </h2>
            <CompareTool suggestions={suggestions} />
          </div>
        </section>

        {/* SEO long-form */}
        <section className="mt-12 border-t bg-muted/20 py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl text-pretty">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Scale className="h-3.5 w-3.5 text-teal-500" />
                <span>Cómo comparar</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Cómo elegir el mejor grupo de WhatsApp para ti
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/85 sm:text-base">
                <p>
                  No todos los grupos de WhatsApp son iguales: hay comunidades enormes y
                  ruidosas, y otras pequeñas y muy activas. Con este comparador puedes poner
                  hasta 3 grupos frente a frente y observar señales reales del directorio: las{" "}
                  <strong className="font-semibold text-foreground">vistas</strong> (cuánta gente los
                  descubre) y los <strong className="font-semibold text-foreground">clics de unión</strong> (intención
                  de entrar), además del estado del enlace comprobado. El «mejor» de cada
                  fila se recalcula en vivo con los datos actuales del directorio.
                </p>
                <p>
                  Un consejo práctico: no elijas solo por volumen de visitas. Un grupo con
                  más clics de unión suele ser una comunidad con más intención real de
                  participar. Si buscas comunidad (idiomas, fe, hobbies), prioriza la
                  antigüedad y el estado del enlace; y dentro de WhatsApp fíjate siempre
                  en su número de miembros y en su ritmo de conversación.
                </p>
                <p>
                  Cuando tengas tus finalistas, entra en la ficha de cada uno para leer la
                  descripción completa y los detalles de la comunidad, o explora el{" "}
                  <Link href="/populares" className="font-medium text-primary hover:underline">ranking de populares</Link>, el{" "}
                  <Link href="/buscar" className="font-medium text-primary hover:underline">buscador</Link> y las{" "}
                  <Link href="/categorias" className="font-medium text-primary hover:underline">categorías</Link> para
                  descubrir alternativas. Y si administras una comunidad,{" "}
                  <Link href="/agregar-grupo" className="font-medium text-primary hover:underline">envíala gratis</Link> para
                  que otros puedan compararla.
                </p>
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
