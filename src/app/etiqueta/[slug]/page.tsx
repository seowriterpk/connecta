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
  Tag,
} from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import {
  getTagBySlug,
  getGroupsByTagPaginated,
  getRelatedTags,
  getRatingsBatch,
  getCategories,
  getCountries,
  citySlug,
} from "@/lib/data";
import { GroupCard } from "@/components/site/group-card";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { SubmitDialog } from "@/components/site/submit-dialog";
import { Pagination } from "@/components/site/pagination";
import { jsonLdScript } from "@/lib/jsonld";

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
  const tag = await getTagBySlug(slug);
  if (!tag) {
    return {
      title: "Etiqueta no encontrada",
      robots: { index: false, follow: false },
    };
  }

  const basePath = `/etiqueta/${tag.slug}`;
  const canonicalPath = page === 1 ? basePath : `${basePath}?page=${page}`;
  const canonical = `${SITE.url}${canonicalPath}`;

  const indexable = tag.count >= 10;
  const title = `Grupos de WhatsApp con la etiqueta «${tag.name}» | ${SITE.name}`;
  const description =
    `Descubre ${tag.count} ${tag.count === 1 ? "grupo de WhatsApp" : "grupos de WhatsApp"} etiquetados con «${tag.name}» en español. ` +
    `Comunidades activas listas para unirte hoy, filtradas por esta etiqueta en ConectaGrupos.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
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
      `grupos de WhatsApp ${tag.name}`,
      `etiqueta ${tag.name}`,
      `${tag.name} en WhatsApp`,
      "grupos de WhatsApp por etiqueta",
      "grupos de WhatsApp en español",
      "unirse a grupo de WhatsApp",
      "comunidades hispanohablantes",
    ],
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const [result, relatedTags, categories, countries] = await Promise.all([
    getGroupsByTagPaginated(tag.name, page),
    getRelatedTags(tag.name, 16),
    getCategories(),
    getCountries(),
  ]);
  const groups = result.groups;
  const basePath = `/etiqueta/${tag.slug}`;

  // Out-of-range ?page= → redirect to the clamped canonical URL
  // (prevents duplicate-content URLs rendering page 1 with a self-canonical).
  if (page !== result.page) {
    redirect(result.page === 1 ? `/etiqueta/${tag.slug}` : `/etiqueta/${tag.slug}?page=${result.page}`);
  }
  const PAGE_SIZE = 48;
  const rangeStart = (result.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = rangeStart + groups.length - 1;

  const ratings = await getRatingsBatch(groups.map((g) => g.id));
  const indexable = result.total >= 10;

  // JSON-LD: ItemList of groups for this tag.
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Grupos de WhatsApp con la etiqueta «${tag.name}»`,
    description: `Directorio de ${result.total} comunidades hispanohablantes en WhatsApp etiquetadas con «${tag.name}».`,
    inLanguage: "es",
    url: `${SITE.url}/etiqueta/${tag.slug}`,
    numberOfItems: groups.length,
    itemListElement: groups.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: `${SITE.url}/${g.slug}`,
      ...(g.category ? { description: `${g.title} — ${g.category.name}` } : {}),
    })),
  };

  // JSON-LD: Breadcrumb
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Etiquetas",
        item: `${SITE.url}/buscar`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tag.name,
        item: `${SITE.url}/etiqueta/${tag.slug}`,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(itemListJsonLd) }}
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
                <Link href="/buscar" className="hover:text-primary">
                  Etiquetas
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="font-medium text-foreground">#{tag.name}</li>
            </ol>
          </div>
        </nav>

        {/* Tag header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-5">
              <div className="flex items-start gap-4">
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary sm:h-20 sm:w-20"
                  aria-hidden
                >
                  <Tag className="h-8 w-8 sm:h-10 sm:w-10" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>Etiqueta</span>
                  </div>
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    #{tag.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {result.total === 0
                      ? "Todavía no hay grupos con esta etiqueta. Si administras una comunidad que encaje, puedes publicarla y la etiquetaremos por ti."
                      : `${result.total} ${result.total === 1 ? "grupo de WhatsApp etiquetado" : "grupos de WhatsApp etiquetados"} con «${tag.name}». Comunidades hispanohablantes activas a las que puedes unirte hoy.`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {result.total} {result.total === 1 ? "grupo disponible" : "grupos disponibles"}
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
                {!indexable && result.total > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    Pocos grupos · noindexado
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
                  Grupos con la etiqueta #{tag.name}
                </h2>
                {result.total > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mostrando {rangeStart}–{rangeEnd} de {result.total}{" "}
                    {result.total === 1 ? "grupo" : "grupos"}
                  </p>
                )}
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
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-primary">
                  <Tag className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold">
                  Aún no hay grupos con la etiqueta #{tag.name}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Sé el primero en publicar una comunidad etiquetada con «{tag.name}»
                  y ayuda a otros hispanohablantes a encontrar tu grupo.
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

        {/* Related tags */}
        {relatedTags.length > 0 && (
          <section className="border-t bg-muted/20 py-10 sm:py-12" aria-labelledby="relacionadas-heading">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-4xl">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span id="relacionadas-heading">Etiquetas relacionadas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {relatedTags.map((rt) => (
                    <Link
                      key={rt.tag}
                      href={`/etiqueta/${citySlug(rt.tag)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {rt.tag}
                      <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                        {rt.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Long-form SEO content */}
        <section className="border-t bg-muted/20 py-10 sm:py-14" aria-labelledby="seo-heading">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl text-pretty">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Sobre los grupos con la etiqueta #{tag.name}</span>
              </div>
              <h2 id="seo-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Grupos de WhatsApp sobre «{tag.name}»: comunidades etiquetadas en español
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/85 sm:text-base">
                <p>
                  Esta página reúne <strong className="font-semibold text-foreground">{result.total}</strong>{" "}
                  {result.total === 1 ? "grupo de WhatsApp" : "grupos de WhatsApp"} en español
                  que han sido etiquetados con{" "}
                  <strong className="font-semibold text-foreground">#{tag.name}</strong>. La
                  etiqueta te permite afinar tu búsqueda más allá de la categoría: dos grupos
                  pueden pertenecer a la misma categoría y, sin embargo, tratar temas muy
                  distintos. Aquí tienes solo los que comparten el tema «{tag.name}».
                </p>
                <p>
                  Cada ficha muestra el nombre del grupo, una descripción breve, el país, la
                  categoría y el número aproximado de miembros, para que decidas si encaja
                  contigo antes de pulsar el enlace de invitación. Si pruebas un grupo y no te
                  convence, salir es tan sencillo como pulsar &laquo;Salir del grupo&raquo;
                  dentro de WhatsApp, sin avisos ni explicaciones al administrador.
                </p>
                <p>
                  Si administras o formas parte de un grupo de WhatsApp sobre{" "}
                  <strong className="font-semibold text-foreground">{tag.name}</strong> que no
                  aparece en este directorio, puedes publicarlo gratis con el botón{" "}
                  <span className="font-medium text-foreground">&laquo;Enviar un grupo&raquo;</span>.
                  Tras la revisión, lo etiquetaremos adecuadamente para que otros
                  hispanohablantes lo encuentren en segundos.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
                <Link
                  href="/buscar"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Buscar grupos
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/categorias"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Ver todas las categorías
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
                <Tag className="h-3.5 w-3.5" /> ¿Tienes un grupo sobre {tag.name}?
              </span>
              <h2 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
                Da visibilidad a tu comunidad de WhatsApp
              </h2>
              <p className="max-w-2xl text-pretty text-sm text-primary-foreground/90 sm:text-base">
                Publica tu grupo sobre «{tag.name}» gratis y llega a miles de hispanohablantes
                que están buscando justo lo que tú ofreces. Lo revisamos en menos de 24 horas y
                lo etiquetamos para que aparezca en esta página.
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
