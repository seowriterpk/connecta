import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Building2, MapPin } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { getAllCities } from "@/lib/data";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Ciudades — Grupos de WhatsApp por Ciudad | ${SITE.name}` },
  description: "Encuentra grupos de WhatsApp organizizados por ciudad. Madrid, Ciudad de México, Buenos Aires, Bogotá, Lima, Santiago y más ciudades hispanohablantes.",
  alternates: { canonical: `${SITE.url}/ciudades` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Ciudades — Grupos de WhatsApp por Ciudad | ${SITE.name}`,
    description: "Encuentra grupos de WhatsApp por ciudad hispanohablante.",
    url: `${SITE.url}/ciudades`,
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
};

export default async function CiudadesPage() {
  const cities = await getAllCities();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Ciudades", item: `${SITE.url}/ciudades` },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <nav aria-label="Migas de pan" className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Inicio</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="font-medium text-foreground">Ciudades</li>
            </ol>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-12 sm:py-16">
          <Reveal>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Grupos de WhatsApp por ciudad
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Encuentra comunidades activas en tu ciudad. {cities.length} ciudades hispanohablantes disponibles.
            </p>
          </Reveal>

          <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cities.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.02}>
                <Link
                  href={`/ciudad/${c.slug}`}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-2xl leading-none">{c.countryFlag}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{c.city}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {c.groupCount} {c.groupCount === 1 ? "grupo" : "grupos"}
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
