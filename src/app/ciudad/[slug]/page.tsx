import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { cache } from "react";
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
  Tag,
  Globe2,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { hreflangAlternates } from "@/lib/hreflang";
import type { CategoryDTO } from "@/lib/types";
import { CountryFlag } from "@/components/site/country-flag";
import {
  getCityBySlug,
  getCountryByCode,
  getAllCities,
  getGroupsByCityPaginated,
  PAGE_SIZE,
  type PaginatedGroups,
} from "@/lib/data";
import {
  getTaxonomyContent,
  buildTaxonomyMetaDescription,
} from "@/lib/taxonomy-intro";
import { GroupCard } from "@/components/site/group-card";
import { SiteHeader } from "@/components/site/header";
import { BackToTop } from "@/components/site/back-to-top";
import { SiteFooter } from "@/components/site/footer";
import { Reveal } from "@/components/site/reveal";
import { Pagination } from "@/components/site/pagination";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Strict page parsing: absent param or junk (?page=abc → NaN) falls back to
// page 1; 0/negative/non-integer values pass through and are rejected by the
// paginated data function (out of range → notFound).
function parsePageParam(sp: { [key: string]: string | string[] | undefined }): number {
  const raw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  if (raw === undefined) return 1;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 1;
}

// --- 18+ server-side gating (cookie bridge) --------------------------------
// The 18+ preference lives in localStorage (client zustand store), which the
// server cannot see. The client mirrors it into the `gh_adult` cookie
// (src/lib/adult-store.ts), so here we ONLY trust that cookie: adult groups
// enter the server-rendered HTML of this page exclusively when 18+ mode is
// confirmed server-side. Crawlers/default visitors always get the clean list.
const getAdultAllowed = cache(async (): Promise<boolean> => {
  const store = await cookies();
  return store.get("gh_adult")?.value === "1";
});

// React cache(): generateMetadata and the page body share ONE DB round-trip
// per request (same pattern as getTaxonomyContent).
const getCityGroups = cache(
  (city: string, page: number, adultAllowed: boolean): Promise<PaginatedGroups | null> =>
    getGroupsByCityPaginated(city, page, { adult: adultAllowed ? "include" : "exclude" })
);

/** True when the groups actually rendered on THIS page include 18+ groups. */
function hasRenderedAdultGroups(result: PaginatedGroups | null): boolean {
  return result?.groups.some((g) => g.isAdult) ?? false;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp);
  const city = await getCityBySlug(slug);
  if (!city) {
    return {
      title: "Ciudad no encontrada",
      robots: { index: false, follow: false },
    };
  }

  // 18+ cookie bridge — server-side confirmation only (never client state).
  // Same cached lookup the page body uses → one DB round-trip per request.
  const adultAllowed = await getAdultAllowed();
  const result = await getCityGroups(city.city, page, adultAllowed);
  // Invalid page (out of range) → the page body will notFound(); keep the
  // count-based meta sane with the clean city count in the meantime.
  const total = result?.total ?? city.groupCount;
  const adultRendered = adultAllowed && hasRenderedAdultGroups(result);

  const basePath = `/ciudad/${city.slug}`;
  const canonicalPath = page === 1 ? basePath : `${basePath}?page=${page}`;
  const canonical = `${SITE.url}${canonicalPath}`;

  // Count-first CTR title — honest for THIS visitor: the clean count by
  // default (crawlers, toggle OFF) and the mixed count only when 18+ mode is
  // confirmed server-side, matching the groups the page actually renders.
  const title = `${total > 0 ? `${total} ` : ""}Grupos de WhatsApp en ${city.city} | Grupos Hoy`;
  // D-4 thin-content rule: city pages with fewer than 3 groups are
  // template-swapped thin pages → keep them live for users but noindex.
  // A server-confirmed 18+ visitor ALSO gets noindex whenever the rendered
  // HTML mixes adult groups in (clean city pages stay indexable).
  const robots =
    city.groupCount >= 3 && !adultRendered
      ? { index: true, follow: true }
      : { index: false, follow: true };
  // Dynamic meta description: custom hero override wins, else keyword-derived
  // from the oldest groups of this city (one keyword per group).
  const taxContent = await getTaxonomyContent("city", city.city);
  const description = buildTaxonomyMetaDescription(
    "city",
    city.city,
    taxContent,
    total
  );

  return {
    title: { absolute: title },
    description,
    alternates: hreflangAlternates(canonicalPath),
    robots,
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "es_ES",
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
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
  const page = parsePageParam(sp);
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  // Out-of-range page (0, negative, beyond last) → 404, matching the strict
  // validation in getGroupsByCityPaginated. Adult groups only enter this
  // list with server-side 18+ confirmation (gh_adult cookie bridge).
  const adultAllowed = await getAdultAllowed();
  const result = await getCityGroups(city.city, page, adultAllowed);
  if (!result) notFound();
  const groups = result.groups;
  // Honest count for THIS visitor (clean-only by default, mixed when 18+ is
  // confirmed server-side): the header badge, the "Mostrando X–Y de Z"
  // range, the SEO copy and the JSON-LD all use this same number.
  const displayTotal = result.total;
  const basePath = `/ciudad/${slug}`;
  const rangeStart = (result.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = rangeStart + groups.length - 1;

  // Entity content (custom intros + keyword-derived pieces) — React-cache()d,
  // shares the lookup with generateMetadata.
  const content = await getTaxonomyContent("city", city.city);

  // --- Internal linking (SEO) ---------------------------------------------
  // Categorías únicas entre los grupos listados arriba (enlaces reales,
  // nunca inventados: slugs tal cual vienen de la base de datos).
  const cityCategories = Array.from(
    groups
      .map((g) => (g.category && g.category.slug ? g.category : null))
      .filter((c): c is CategoryDTO => c !== null)
      .reduce<Map<string, { slug: string; name: string; count: number }>>((m, c) => {
        const e = m.get(c.slug);
        if (e) e.count += 1;
        else m.set(c.slug, { slug: c.slug, name: c.name, count: 1 });
        return m;
      }, new Map())
      .values()
  ).sort((a, b) => b.count - a.count);

  // País de la ciudad + ciudades hermanas (mismo país, sin la actual).
  const [country, allCities] = await Promise.all([
    getCountryByCode(city.countryCode),
    getAllCities(),
  ]);
  const siblingCities = allCities.filter(
    (c) => c.countryCode === city.countryCode && c.slug !== city.slug
  );

  // JSON-LD: CollectionPage about a City (Place subtype)
  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Grupos de WhatsApp en ${city.city}`,
    description: `Directorio de grupos de WhatsApp en ${city.city} ${city.countryFlag}. ${displayTotal} comunidades hispanohablantes disponibles para unirte.`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 p-2 sm:h-20 sm:w-20"
                  aria-hidden
                >
                  <CountryFlag code={city.countryCode} className="h-10 w-15 rounded-[3px] sm:h-12 sm:w-18" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Ciudad</span>
                  </div>
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    {content.customTitle ?? `Grupos de WhatsApp en ${city.city}`}
                  </h1>
                  {content.customHeroDesc ? (
                    <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {content.customHeroDesc}
                    </p>
                  ) : (
                    <>
                      <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Directorio de comunidades hispanohablantes activas en {city.city}. Elige
                        una categoría, abre el enlace de invitación y únete en un toque: sin
                        registros, sin comisiones y desde cualquier dispositivo.
                      </p>
                      {content.keywordSentence && (
                        <p className="mt-1.5 max-w-2xl text-xs text-muted-foreground/80">
                          Temas: {content.keywordSentence}.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {displayTotal}{" "}
                  {displayTotal === 1 ? "grupo disponible" : "grupos disponibles"}
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
              <Link
                href="/agregar-grupo"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Enviar un grupo
              </Link>
            </div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-3xl">
                  {city.countryFlag}
                </div>
                <h3 className="text-lg font-semibold">
                  Aún no hay grupos publicados en {city.city}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Sé el primero en publicar una comunidad de WhatsApp de {city.city} y
                  ayuda a otros hispanohablantes a encontrar su sitio.
                </p>
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/agregar-grupo"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" /> Enviar mi grupo
                  </Link>
                </div>
              </div>
            ) : (
              <Reveal>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groups.map((g) => (
                    <GroupCard key={g.id} group={g} />
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

        {/* Internal linking — categorías presentes en esta ciudad */}
        {cityCategories.length > 0 && (
          <Reveal>
            <section
              className="border-t py-10 sm:py-12"
              aria-labelledby="city-cats-heading"
            >
              <div className="container mx-auto px-4">
                <h2
                  id="city-cats-heading"
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Grupos de {city.city} por categoría
                </h2>
                <p className="mt-2 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
                  Los grupos que ves arriba reúnen varios temas: charla local, trabajo,
                  deportes, estudios y más. Si buscas algo concreto en {city.city}, entra en
                  una categoría y revisa sus fichas: cada una trae descripción, tamaño
                  aproximado y el enlace para unirse.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {cityCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/categoria/${cat.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-xs font-medium shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      <Tag className="h-3.5 w-3.5 text-primary" aria-hidden />
                      Grupos de {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* Internal linking — país y ciudades hermanas */}
        {country && siblingCities.length > 0 && (
          <Reveal>
            <section
              className="border-t py-10 sm:py-12"
              aria-labelledby="city-country-heading"
            >
              <div className="container mx-auto px-4">
                <h2
                  id="city-country-heading"
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Más de {country.name}
                </h2>
                <p className="mt-2 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
                  Si quieres ver el panorama completo del país, echa un ojo a los{" "}
                  <Link
                    href={`/pais/${country.code}`}
                    className="font-medium text-primary hover:underline"
                  >
                    grupos de WhatsApp de {country.name}
                  </Link>
                  . Y si prefieres comunidades de otras zonas, aquí tienes más ciudades con
                  grupos activos en {country.name}:
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {siblingCities.map((sib) => (
                    <Link
                      key={sib.slug}
                      href={`/ciudad/${sib.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-2 text-xs font-medium shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      <Globe2 className="h-3.5 w-3.5 text-primary" aria-hidden />
                      Grupos de WhatsApp en {sib.city}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>
        )}

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
                {content.customIntro ? (
                  // Bulk-edited long description (admin SEO → intros JSON import).
                  // Paragraphs separated by blank lines in the custom text.
                  content.customIntro
                    .split(/\n\s*\n/)
                    .filter((p) => p.trim().length > 0)
                    .map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <>
                <p>
                  Los <strong className="font-semibold text-foreground">grupos de WhatsApp en{" "}
                  {city.city}</strong> reúnen a personas que viven, trabajan o pasan por la
                  ciudad y prefieren conversar en español sobre lo que ocurre a diario en sus
                  barrios: planes locales, compra-venta, estudios, trabajo, deportes o
                  simplemente charlar al final del día. En Grupos Hoy hemos recopilado{" "}
                  <strong>{displayTotal}</strong>{" "}
                  {displayTotal === 1 ? "comunidad activa" : "comunidades activas"} con
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
                  esta página, en la home de Grupos Hoy y será descubrible por
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
                  </>
                )}
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
                <MapPin className="h-3.5 w-3.5" /> {city.countryFlag} ¿Administras un grupo en{" "}
                {city.city}?
              </span>
              <h2 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
                Da visibilidad a tu comunidad de WhatsApp
              </h2>
              <p className="max-w-2xl text-pretty text-sm text-primary-foreground/90 sm:text-base">
                Publica tu grupo de {city.city} gratis y llega a quienes están buscando justo
                lo que tú ofreces. Lo revisamos en menos de 24 horas y lo
                publicamos en este directorio.
              </p>
              <Link
                href="/agregar-grupo"
                className="inline-flex items-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-background/90 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Enviar mi grupo ahora
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  );
}
