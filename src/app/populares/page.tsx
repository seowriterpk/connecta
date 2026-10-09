import type { Metadata } from "next";
import Link from "next/link";
import {
  Flame,
  TrendingUp,
  MousePointerClick,
  Eye,
  Users,
  Star,
  Trophy,
  Medal,
  Award,
  ChevronRight,
  Sparkles,
  Clock,
} from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import {
  getGroups,
  getTopRatedGroups,
  getRatingsBatch,
  getStats,
  getCategories,
  getCountries,
  getTrendingMovers,
} from "@/lib/data";
import type { GroupDTO } from "@/lib/types";
import { GroupCard } from "@/components/site/group-card";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { RecentlyViewed } from "@/components/site/recently-viewed";
import { PopularesFilters } from "@/components/site/populares-filters";
import { MoversSection } from "@/components/site/movers-section";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

type Orden = "vistos" | "clics" | "valorados" | "recientes";

const ORDENES: { value: Orden; label: string; icon: typeof Eye; desc: string }[] = [
  { value: "vistos", label: "Más vistos", icon: Eye, desc: "Grupos que más gente está explorando ahora mismo." },
  { value: "clics", label: "Más clics", icon: MousePointerClick, desc: "Los grupos que más gente está intentando compartir y visitar." },
  { value: "valorados", label: "Mejor valorados", icon: Star, desc: "Comunidades con las mejores notas de la comunidad." },
  { value: "recientes", label: "Recién llegados", icon: Clock, desc: "Lo último publicado en el directorio." },
];

const PER_PAGE = 24;

function cleanOrden(v: string | string[] | undefined): Orden {
  const s = Array.isArray(v) ? v[0] : v;
  return ORDENES.some((o) => o.value === s) ? (s as Orden) : "vistos";
}

function cleanParam(v: string | string[] | undefined): string | null {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" && s.trim() ? s.trim().toLowerCase().slice(0, 60) : null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const orden = cleanOrden(sp.orden);
  const pais = cleanParam(sp.pais);
  const cat = cleanParam(sp.cat);

  // Resolve filter labels for a contextual title (falls back silently if unknown).
  let contextLabel = "";
  if (pais || cat) {
    const [countryRow, catRow] = await Promise.all([
      pais
        ? getCountries().then((cs) => cs.find((c) => c.code === pais) ?? null)
        : Promise.resolve(null),
      cat
        ? getCategories().then((cs) => cs.find((c) => c.slug === cat) ?? null)
        : Promise.resolve(null),
    ]);
    contextLabel = [countryRow?.name, catRow?.name].filter(Boolean).join(" · ");
  }

  const title = contextLabel
    ? `Grupos de WhatsApp más populares ${contextLabel.includes(" · ") ? "— " : "en "}${contextLabel} — ${SITE.name}`
    : `Grupos de WhatsApp más populares — ${SITE.name}`;
  const description = contextLabel
    ? `Los grupos de WhatsApp más populares de ${contextLabel}: ranking en vivo por vistas, clics y valoraciones de la comunidad.`
    : "Descubre los grupos de WhatsApp en español más populares del momento: los más vistos, los que más gente se une y los mejor valorados por la comunidad.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITE.url}/populares` },
    // Filtered combinations are thin near-duplicates of /populares — keep them out of the index.
    robots: pais || cat ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/populares`,
      type: "website",
      locale: "es_ES",
      siteName: SITE.name,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image",
      images: ["/og.svg"], title, description },
    keywords: [
      "grupos de WhatsApp populares",
      "grupos de WhatsApp más activos",
      "mejores grupos de WhatsApp",
      "grupos de WhatsApp en español",
      "top grupos WhatsApp",
    ],
  };
}

export default async function PopularesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const orden = cleanOrden(sp.orden);
  const pais = cleanParam(sp.pais);
  const cat = cleanParam(sp.cat);

  // Resolve active filters into ids (unknown codes/slugs are ignored).
  const [allCountries, allCategories] = await Promise.all([getCountries(), getCategories()]);
  const activeCountry = pais ? allCountries.find((c) => c.code === pais) ?? null : null;
  const activeCategory = cat ? allCategories.find((c) => c.slug === cat) ?? null : null;
  const filters = {
    ...(activeCountry ? { countryId: activeCountry.id } : {}),
    ...(activeCategory ? { categoryId: activeCategory.id } : {}),
  };

  // Fetch the ranking for the active tab + filters.
  let groups: GroupDTO[];
  if (orden === "valorados") {
    // Top-rated has no filter support — fetch a wide set and filter locally.
    let rated = await getTopRatedGroups(60);
    if (activeCountry) rated = rated.filter((g) => g.country?.code === activeCountry.code);
    if (activeCategory) rated = rated.filter((g) => g.category?.slug === activeCategory.slug);
    groups = rated.slice(0, PER_PAGE);
    // Top-rated groups may be few — pad with filtered popular ones to keep the grid lively.
    if (groups.length < 8) {
      const extra = (await getGroups({ ...filters, sort: "populares", limit: PER_PAGE })).filter(
        (g) => !groups.some((x) => x.id === g.id)
      );
      groups = [...groups, ...extra].slice(0, PER_PAGE);
    }
  } else {
    const sortMap: Record<Exclude<Orden, "valorados">, "populares" | "destacados" | "recientes"> = {
      vistos: "populares",
      clics: "destacados",
      recientes: "recientes",
    };
    groups = await getGroups({ ...filters, sort: sortMap[orden], limit: PER_PAGE });
  }

  const [stats, ratings, movers] = await Promise.all([
    getStats(),
    getRatingsBatch(groups.map((g) => g.id)),
    // Movers are a global signal — only fetched/rendered on the unfiltered view.
    pais || cat ? Promise.resolve([]) : getTrendingMovers(6),
  ]);

  const totalViews = groups.reduce((a, g) => a + (g.views || 0), 0);
  const totalClicks = groups.reduce((a, g) => a + (g.clicks || 0), 0);
  const totalMembers = groups.reduce((a, g) => a + (g.members || 0), 0);
  const active = ORDENES.find((o) => o.value === orden)!;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "Grupos de WhatsApp más populares",
        description: active.desc,
        numberOfItems: groups.length,
        itemListElement: groups.slice(0, 20).map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: g.title,
          url: `${SITE.url}/grupo/${g.slug}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Populares", item: `${SITE.url}/populares` },
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
              <li className="font-medium text-foreground">Populares</li>
            </ol>
          </div>
        </nav>

        {/* Hero */}
        <header className="border-b bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/50 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                <Flame className="h-3.5 w-3.5" /> Lo más caliente del directorio
              </span>
              <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-4xl">
                Los grupos de WhatsApp más populares
              </h1>
              <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
                {active.desc} El ranking se recalcula en cada visita con las métricas reales
                del directorio: vistas, clics y valoraciones de la comunidad.
              </p>

              {/* Stats chips */}
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 font-medium shadow-sm">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span className="tabular-nums">{totalViews.toLocaleString("es-ES")}</span> vistas
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 font-medium shadow-sm">
                  <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                  <span className="tabular-nums">{totalClicks.toLocaleString("es-ES")}</span> clics
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 font-medium shadow-sm">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="tabular-nums">{totalMembers.toLocaleString("es-ES")}</span> miembros
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 font-medium shadow-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  {stats.groups} {stats.groups === 1 ? "grupo publicado" : "grupos publicados"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Recently viewed */}
        <RecentlyViewed />

        {/* Filter tabs + ranked grid */}
        <section className="pt-2 sm:pt-4" aria-labelledby="ranking-heading">
          <div className="container mx-auto px-4">
            {/* Orden tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5 shadow-sm">
              {ORDENES.map((o) => {
                const Icon = o.icon;
                const isActive = o.value === orden;
                const params = new URLSearchParams();
                if (o.value !== "vistos") params.set("orden", o.value);
                if (pais) params.set("pais", pais);
                if (cat) params.set("cat", cat);
                const qs = params.toString();
                return (
                  <Link
                    key={o.value}
                    href={`/populares${qs ? `?${qs}` : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {o.label}
                  </Link>
                );
              })}
            </div>

            {/* Country + category filter chips */}
            <PopularesFilters
              countries={allCountries.map((c) => ({ code: c.code, name: c.name, flag: c.flag, groupCount: c.groupCount }))}
              categories={allCategories.map((c) => ({ slug: c.slug, name: c.name, color: c.color, groupCount: c.groupCount }))}
              orden={orden}
              pais={pais}
              cat={cat}
            />

            <h2 id="ranking-heading" className="sr-only">
              Ranking de grupos
            </h2>

            {groups.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-muted">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">
                  {pais || cat ? "Sin resultados con estos filtros" : "Todavía no hay datos para este ranking"}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {pais || cat ? (
                    <>
                      No hay grupos suficientes para esta combinación todavía. Prueba a quitar un filtro o
                      cambia de pestaña para ver el ranking completo.
                    </>
                  ) : (
                    <>Vuelve pronto: las métricas se actualizan con cada visita y clic de la comunidad.</>
                  )}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {pais || cat ? (
                    <Link
                      href={`/populares${orden !== "vistos" ? `?orden=${orden}` : ""}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                      <Sparkles className="h-4 w-4" /> Ver el ranking completo
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                      <Sparkles className="h-4 w-4" /> Explorar el directorio
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groups.map((g, i) => {
                  const rating = ratings[g.id] ?? null;
                  return (
                    <Reveal key={g.id} delay={Math.min(i * 0.03, 0.3)}>
                      <div className="relative">
                        <RankBadge rank={i + 1} />
                        <GroupCard group={g} rating={rating} />
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            )}

            {groups.length > 0 && (
              <p className="mt-8 text-center text-xs text-muted-foreground">
                Mostrando el top {groups.length} según {active.label.toLowerCase()}
                {[activeCountry?.name, activeCategory?.name].filter(Boolean).length > 0 && (
                  <> de {([activeCountry?.name, activeCategory?.name].filter(Boolean) as string[]).join(" · ")}</>
                )}
                . El ranking se recalcula en tiempo real con la actividad del directorio.
              </p>
            )}
          </div>
        </section>

        {/* Trending movers — 7-day view growth (global, unfiltered view only) */}
        <MoversSection movers={movers} />

        {/* SEO long-form */}
        <section className="mt-12 border-t bg-muted/20 py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl text-pretty">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span>Sobre los rankings</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Cómo medimos la popularidad de un grupo de WhatsApp
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/85 sm:text-base">
                <p>
                  En {SITE.name} la popularidad no se inventa: se mide. Cada vez que alguien
                  abre la ficha de un grupo contamos una <strong className="font-semibold text-foreground">vista</strong>,
                  y cuando pulsa el botón para unirse, un <strong className="font-semibold text-foreground">clic</strong>.
                  Sumamos también las <strong className="font-semibold text-foreground">valoraciones</strong> de
                  1 a 5 estrellas que dejan quienes ya forman parte de la comunidad. Con esas tres
                  señales construimos los rankings de esta página.
                </p>
                <p>
                  El ranking <em>Más vistos</em> refleja la curiosidad: grupos que mucha gente está
                  descubriendo. El de <em>Más clics</em> refleja la intención real de unirse. Y el de{" "}
                  <em>Mejor valorados</em> recoge la experiencia de quienes ya están dentro, por lo que
                  suele ser el más fiable si buscas calidad. Si acabas de llegar, también tienes la
                  pestaña de <em>Recién llegados</em> para no perderte nada nuevo.
                </p>
                <p>
                  La sección <strong className="font-semibold text-foreground">En ascenso</strong> va un paso
                  más allá: comparamos las vistas de los <strong className="font-semibold text-foreground">últimos
                  7 días</strong> con las de la semana anterior para detectar las comunidades que están
                  despegando justo ahora. Un grupo puede llevar poco tiempo en el directorio y aparecer
                  ahí por delante de veteranos mucho más grandes: es la señal más temprana de impulso
                  que publicamos, y se recalcula a diario con la actividad real.
                </p>
                <p>
                  ¿Dudas entre varios? Ponlos frente a frente en el{" "}
                  <Link href="/comparar" className="font-medium text-primary hover:underline">comparador de grupos</Link>{" "}
                  para ver miembros, clics y valoraciones lado a lado. También puedes afinar con el{" "}
                  <Link href="/buscar" className="font-medium text-primary hover:underline">buscador</Link>, las{" "}
                  <Link href="/categorias" className="font-medium text-primary hover:underline">categorías</Link> y
                  los <Link href="/paises" className="font-medium text-primary hover:underline">países</Link> para
                  encontrar comunidades populares exactamente donde te interesan. Y si administras un grupo
                  que merece estar aquí, puedes{" "}
                  <Link href="/agregar-grupo" className="font-medium text-primary hover:underline">enviarlo gratis</Link> para
                  que empiece a acumular métricas.
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

/** Absolute rank badge over the group card (gold / silver / bronze for the podium). */
function RankBadge({ rank }: { rank: number }) {
  const podium =
    rank === 1
      ? { icon: Trophy, className: "from-amber-400 to-yellow-500 text-amber-950 shadow-amber-500/40" }
      : rank === 2
        ? { icon: Medal, className: "from-slate-300 to-gray-400 text-slate-800 shadow-gray-400/40" }
        : rank === 3
          ? { icon: Award, className: "from-orange-400 to-amber-600 text-orange-950 shadow-orange-500/40" }
          : null;

  if (podium) {
    const Icon = podium.icon;
    return (
      <span
        aria-label={`Puesto ${rank} del ranking`}
        className={`absolute left-2.5 top-2.5 z-20 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${podium.className} px-2.5 py-1 text-xs font-extrabold shadow-md`}
      >
        <Icon className="h-3.5 w-3.5" />
        {rank}
      </span>
    );
  }

  return (
    <span
      aria-label={`Puesto ${rank} del ranking`}
      className="absolute left-2.5 top-2.5 z-20 inline-flex items-center rounded-full border bg-background/90 px-2 py-0.5 text-[10px] font-bold text-muted-foreground shadow-sm backdrop-blur"
    >
      #{rank}
    </span>
  );
}
