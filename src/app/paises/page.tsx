import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Globe2 } from "lucide-react";
import { SITE, REGIONS } from "@/lib/constants";
import { getCountries } from "@/lib/data";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { CountryFlag } from "@/components/site/country-flag";

export const dynamic = "force-dynamic";

/**
 * Agrupación por región derivada de los DATOS (no de una constante fija).
 *
 * Antes: REGIONS.map(region => countries.filter(c => c.region === region))
 * descartaba silenciosamente cualquier país cuya región en BD no coincidiera
 * EXACTAMENTE con una de REGIONS (p. ej. "Sudamérica" vs "América del Sur",
 * "Norteamérica" vs "América del Norte") — 16 de 20 países desaparecían.
 *
 * Ahora: se toman las regiones ÚNICAS presentes en los países devueltos por
 * la BD, se ordenan con REGIONS como preferencia (las desconocidas van al
 * final, ordenadas alfabéticamente) y cada país cae siempre en un grupo.
 * Ningún país puede quedarse fuera por un desajuste de texto.
 */
function groupCountriesByRegion<T extends { region: string }>(countries: T[]) {
  const preferred = REGIONS as readonly string[];

  const present = Array.from(new Set(countries.map((c) => c.region)));
  const known = preferred.filter((r) => present.includes(r));
  const extra = present
    .filter((r) => !preferred.includes(r))
    .sort((a, b) => a.localeCompare(b, "es"));

  return [...known, ...extra].map((region) => ({
    region,
    countries: countries.filter((c) => c.region === region),
  }));
}

export const metadata: Metadata = {
  title: { absolute: `Países — Grupos de WhatsApp en Español | ${SITE.name}` },
  description: "Explora grupos de WhatsApp por país. México, España, Argentina, Colombia, Perú, Chile, Venezuela y todos los países hispanohablantes.",
  alternates: { canonical: `${SITE.url}/paises` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Países — Grupos de WhatsApp en Español | ${SITE.name}`,
    description: "Explora grupos de WhatsApp por país hispanohablante.",
    url: `${SITE.url}/paises`,
    locale: "es_ES",
    siteName: SITE.name,
  },
};

export default async function PaisesPage() {
  const [countries] = await Promise.all([getCountries()]);

  // Regiones derivadas de los datos: ningún país se descarta por texto.
  const byRegion = groupCountriesByRegion(countries);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Países", item: `${SITE.url}/paises` },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Inicio</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="font-medium text-foreground">Países</li>
            </ol>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-12 sm:py-16">
          <Reveal>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Grupos de WhatsApp por país
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Encuentra comunidades activas en tu país. Desde España hasta toda Hispanoamérica:
              {countries.length} países hispanohablantes disponibles.
            </p>
          </Reveal>

          {byRegion.map((group, gi) => (
            <Reveal key={group.region} delay={gi * 0.05}>
              <section className="mt-10">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
                  <Globe2 className="h-5 w-5 text-primary" />
                  {group.region}
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {group.countries.map((c, i) => (
                    <Reveal key={c.id} delay={i * 0.02}>
                      <Link
                        href={`/pais/${c.code}`}
                        className="group flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <CountryFlag code={c.code} name={c.name} className="h-8 w-12 rounded-[3px]" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{c.name}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe2 className="h-3 w-3" />
                            {c.groupCount} {c.groupCount === 1 ? "grupo" : "grupos"}
                          </span>
                        </span>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
