import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { getCategories } from "@/lib/data";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Categorías de Grupos de WhatsApp — ${SITE.name}` },
  description: "Explora todas las categorías de grupos de WhatsApp en español: amistad, tecnología, deportes, música, cine, cocina, viajes y más. Encuentra la comunidad perfecta para ti.",
  alternates: { canonical: `${SITE.url}/categorias` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Categorías de Grupos de WhatsApp — ${SITE.name}`,
    description: "Explora todas las categorías de grupos de WhatsApp en español.",
    url: `${SITE.url}/categorias`,
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
};

const COLOR_STYLES: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  lime: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  yellow: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  stone: "bg-stone-500/10 text-stone-700 dark:text-stone-300",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  red: "bg-red-500/10 text-red-700 dark:text-red-300",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  pink: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  green: "bg-green-500/10 text-green-700 dark:text-green-300",
  purple: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
};

export default async function CategoriasPage() {
  const categories = await getCategories();
  const totalGroups = categories.reduce((sum, c) => sum + c.groupCount, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Categorías", item: `${SITE.url}/categorias` },
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
              <li className="font-medium text-foreground">Categorías</li>
            </ol>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-12 sm:py-16">
          <Reveal>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Categorías de grupos de WhatsApp
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Explora {categories.length} categorías con un total de {totalGroups.toLocaleString("es-ES")} grupos activos.
              Filtra por tu interés y encuentra la comunidad perfecta para ti.
            </p>
          </Reveal>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((c, i) => {
              const colorClass = COLOR_STYLES[c.color] ?? COLOR_STYLES.emerald;
              return (
                <Reveal key={c.id} delay={i * 0.03}>
                  <Link
                    href={`/categoria/${c.slug}`}
                    className="group flex h-full flex-col items-start gap-2 rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${colorClass}`}>
                      {c.icon}
                    </span>
                    <span className="line-clamp-2 text-sm font-semibold leading-tight">{c.name}</span>
                    <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {c.groupCount} {c.groupCount === 1 ? "grupo" : "grupos"}
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
