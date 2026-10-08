import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Users,
  Plus,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  MapPin,
  Building2,
} from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import {
  getCityBySlug,
  getGroupsByCityPaginated,
  getRatingsBatch,
  getCategories,
  getCountries,
} from "@/lib/data";
import { GroupCard } from "@/components/site/group-card";
import { SiteHeader } from "@/components/site/header";
import { BackToTop } from "@/components/site/back-to-top";
import { SiteFooter } from "@/components/site/footer";
import { Reveal } from "@/components/site/reveal";
import { SubmitDialog } from "@/components/site/submit-dialog";
import { Pagination } from "@/components/site/pagination";
import { jsonLdScript } from "@/lib/jsonld";
import { CountryFlag } from "@/components/site/country-flag";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const city = await getCityBySlug(slug);
  if (!city) {
    return {
      title: "Ciudad no encontrada",
      robots: { index: false, follow: false },
    };
  }

  const basePath = `/ciudad/${city.slug}`;
  const canonicalPath = page === 1 ? basePath : `${basePath}?page=${page}`;
  const canonical = `${SITE.url}${canonicalPath}`;

  const title = `Grupos de WhatsApp en ${city.city} | ConectaGrupos`;
  const description =
    `Grupos de WhatsApp en ${city.city} ${city.countryFlag}: ${city.groupCount} ` +
    `${city.groupCount === 1 ? "comunidad activa" : "comunidades activas"}. ` +
    `Únete gratis y sin registros con ConectaGrupos.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "es_ES",
      siteName: SITE.name,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og.svg"],
      title,
      description,
    },
    keywords: [
      `grupos de WhatsApp en ${city.city}`,
      `grupos de WhatsApp ${city.city}`,
      `${city.city} WhatsApp`,
      `grupos WhatsApp ${city.countryCode.toUpperCase()}`,
      "grupos de WhatsApp en español",
      "unirse a grupo de WhatsApp",
      "comunidades hispanohablantes",
      `enlaces de grupos de WhatsApp ${city.city}`,
    ],
  };
}

export default async function CityPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const [result, categories, countries] = await Promise.all([
    getGroupsByCityPaginated(city.city, page),
    getCategories(),
    getCountries(),
  ]);
  if (!result) notFound();

  // Out-of-range ?page= → redirect to the clamped canonical URL
  // (prevents duplicate-content URLs rendering page 1 with a self-canonical).
  if (page !== result.page) {
    redirect(result.page === 1 ? `/ciudad/${slug}` : `/ciudad/${slug}?page=${result.page}`);
  }
  const groups = result.groups;
  const basePath = `/ciudad/${slug}`;
  const PAGE_SIZE = 120;
  const rangeStart = (result.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = rangeStart + groups.length - 1;

  const ratings = await getRatingsBatch(groups.map((g) => g.id));

  // JSON-LD: CollectionPage about a City (Place subtype)
  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Grupos de WhatsApp en ${city.city}`,
    description: `Directorio de grupos de WhatsApp en ${city.city} ${city.countryFlag}. ${city.groupCount} comunidades hispanohablantes disponibles para unirte.`,
    inLanguage: "es",
    url: `${SITE.url}/ciudad/${city.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
    },
    about: {
      "@type": "City",
      name: city.city,
      description: `Ciudad con comunidades de WhatsApp en español listadas en ${SITE.name}.`,
      containedInPlace: {
        "@type": "Country",
        name: city.countryCode.toUpperCase(),
      },
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: groups.length,
      itemListElement: groups.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        url: `${SITE.url}/grupo/${g.slug}`,
        ...(g.category ? { description: `${g.title} — ${g.category.name}` } : {}),
      })),
    },
  };

  // JSON-LD: Breadcrumb
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Ciudades", item: `${SITE.url}/paises` },
      {
        "@type": "ListItem",
        position: 3,
        name: city.city,
        item: `${SITE.url}/ciudad/${city.slug}`,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionPageJsonLd) }}
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
              <li>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li>
                <Link href="/paises" className="hover:text-primary">
                  Ciudades
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="font-medium text-foreground">{city.city}</li>
            </ol>
          </div>
        </nav>

        {/* City header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-5">
              <div className="flex items-start gap-4">
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 sm:h-20 sm:w-20"
                  aria-hidden
                >
                  <CountryFlag code={city.countryCode} className="h-8 w-12 rounded-[3px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Ciudad</span>
                  </div>
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    Grupos de WhatsApp en {city.city}
                  </h1>
                  <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Directorio de comunidades hispanohablantes activas en {city.city}. Elige
                    una categoría, abre el enlace de invitación y únete en un toque: sin
                    registros, sin comisiones y desde cualquier dispositivo.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {city.groupCount}{" "}
                  {city.groupCount === 1 ? "grupo disponible" : "grupos disponibles"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <CountryFlag code={city.countryCode} /> {city.countryCode.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  Comunidades en español
                </span>
                {groups.some((g) => g.isVerified) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" /> Grupos verificados
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Groups grid */}
        <section className="py-10 sm:py-12" aria-labelledby="grupos-heading">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="grupos-heading"
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Comunidades en {city.city}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mostrando {rangeStart}–{rangeEnd} de {result.total}{" "}
                  {result.total === 1 ? "grupo" : "grupos"}
                </p>
              </div>
              <SubmitDialog
                categories={categories}
                countries={countries}
                trigger={
                  <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]">
                    <Plus className="h-4 w-4" /> Enviar un grupo
                  </button>
                }
              />
            </div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
                  <CountryFlag code={city.countryCode} className="h-8 w-12 rounded-[3px]" />
                </div>
                <h3 className="text-lg font-semibold">
                  Aún no hay grupos publicados en {city.city}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Sé el primero en publicar una comunidad de WhatsApp de {city.city} y
                  ayuda a otros hispanohablantes a encontrar su sitio.
                </p>
                <div className="mt-6 flex justify-center">
                  <SubmitDialog
                    categories={categories}
                    countries={countries}
                    trigger={
                      <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]">
                        <Plus className="h-4 w-4" /> Enviar mi grupo
                      </button>
                    }
                  />
                </div>
              </div>
            ) : (
              <Reveal>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groups.map((g) => (
                    <GroupCard key={g.id} group={g} rating={ratings[g.id] ?? null} />
                  ))}
                </div>
              </Reveal>
            )}

            <Pagination
              basePath={basePath}
              page={result.page}
              totalPages={result.totalPages}
            />
          </div>
        </section>

        {/* Long-form SEO content */}
        <section className="border-t bg-muted/20 py-10 sm:py-14" aria-labelledby="seo-heading">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl text-pretty">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Sobre los grupos de WhatsApp en {city.city}</span>
              </div>
              <h2 id="seo-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Grupos de WhatsApp en {city.city}: comunidades locales listas para unirte
              </h2>

              <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/85 sm:text-base">
                <p>
                  Los <strong className="font-semibold text-foreground">grupos de WhatsApp en{" "}
                  {city.city}</strong> reúnen a personas que viven, trabajan o pasan por la
                  ciudad y prefieren conversar en español sobre lo que ocurre a diario en sus
                  barrios: planes locales, compra-venta, estudios, trabajo, deportes o
                  simplemente charlar al final del día. En ConectaGrupos hemos recopilado{" "}
                  <strong>{city.groupCount}</strong>{" "}
                  {city.groupCount === 1 ? "comunidad activa" : "comunidades activas"} con
                  enlaces revisados, descripciones claras y el número aproximado de miembros,
                  para que encuentres en segundos el espacio que mejor encaje contigo. Cada
                  enlace pasa por una revisión humana antes de publicarse, así que te llevas
                  grupos reales y no listas abandonadas llenas de spam.
                </p>

                <p>
                  Elegir un grupo de WhatsApp de {city.city} depende de lo que busques. Si te
                  interesa el debate y los planes presenciales, los grupos grandes con cientos
                  de miembros suelen tener más movimiento, aunque también más ruido; si
                  prefieres conversaciones cercanas, los grupos pequeños permiten conocer gente
                  de verdad de tu misma zona. Como todos los grupos que listamos son
                  hispanohablantes, no tendrás barrera idiomática, pero sí te recomendamos
                  fijarte en el horario: en {city.city} los picos de actividad suelen coincidir
                  con la tarde-noche local. Y si pruebas un grupo y no encaja, salir es tan
                  sencillo como pulsar &laquo;Salir del grupo&raquo; dentro de WhatsApp, sin
                  explicaciones ni avisos al administrador.
                </p>

                <p>
                  Si administras o formas parte de un grupo de WhatsApp en {city.city} que no
                  aparece en este directorio, puedes publicarlo con el botón{" "}
                  <span className="font-medium text-foreground">&laquo;Enviar un grupo&raquo;</span>{" "}
                  que ves arriba. El envío es gratuito y queda en estado pendiente mientras
                  verificamos que el enlace funciona, que la descripción es clara y que respeta
                  las normas básicas de convivencia. Una vez aprobado, tu grupo aparecerá en
                  esta página, en la home de ConectaGrupos y será descubrible por
                  hispanohablantes de toda Latinoamérica y España. Así de simple: tú pones la
                  comunidad, nosotros la ponemos a la vista de quien la está buscando.
                </p>

                <p>
                  ¿Quieres afinar aún más tu búsqueda? Combina la ciudad con una categoría —por
                  ejemplo tecnología, fútbol, música, estudios o amistad— para encontrar grupos
                  de WhatsApp en {city.city} que hablen exactamente de lo que te interesa.
                  También puedes ordenar los resultados por número de miembros o por popularidad
                  si buscas comunidades más grandes. Y si estás fuera de {city.city} pero
                  quieres seguir conectado con tu gente, este directorio te sirve igual: los
                  enlaces de invitación de WhatsApp funcionan desde cualquier país, así que
                  llevas tu comunidad hispana allá donde vayas.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
                <Link
                  href="/paises"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Ver todos los países
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/categorias"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Explorar por categorías
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Explorar todos los grupos
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
          <div className="container mx-auto px-4 py-12 sm:py-14">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                <MapPin className="h-3.5 w-3.5" /> <CountryFlag code={city.countryCode} /> ¿Administras un grupo en{" "}
                {city.city}?
              </span>
              <h2 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
                Da visibilidad a tu comunidad de WhatsApp
              </h2>
              <p className="max-w-2xl text-pretty text-sm text-primary-foreground/90 sm:text-base">
                Publica tu grupo de {city.city} gratis y llega a miles de hispanohablantes que
                están buscando justo lo que tú ofreces. Lo revisamos en menos de 24 horas y lo
                publicamos en este directorio.
              </p>
              <SubmitDialog
                categories={categories}
                countries={countries}
                trigger={
                  <button className="inline-flex items-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-background/90 active:scale-[0.98]">
                    <Plus className="h-4 w-4" /> Enviar mi grupo ahora
                  </button>
                }
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  );
}
