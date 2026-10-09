import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Users, Plus, MessageCircle, Sparkles, ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/constants";
import {
  getCategoryBySlug,
  getGroupsByCategorySlugPaginated,
  getRatingsBatch,
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
import { AdultCategoryFeed } from "@/components/site/adult-zone";

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
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return {
      title: "Categoría no encontrada",
      robots: { index: false, follow: false },
    };
  }

  // Adult categories: never indexed (strict separation directive).
  if (category.isAdult) {
    return {
      title: { absolute: `${category.name} — ${SITE.name}` },
      description: category.description,
      robots: { index: false, follow: false },
    };
  }

  const basePath = `/categoria/${category.slug}`;
  const canonicalPath = page === 1 ? basePath : `${basePath}?page=${page}`;
  const canonical = `${SITE.url}${canonicalPath}`;

  const title = `${category.name} — Grupos de WhatsApp | ConectaGrupos`;
  // Dynamic meta description: custom hero override wins, else keyword-derived
  // from the oldest groups of this category (one keyword per group).
  const taxContent = await getTaxonomyContent("category", category.name);
  const description = buildTaxonomyMetaDescription(
    "category",
    category.name,
    taxContent,
    category.groupCount
  );

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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords: [
      `grupos de WhatsApp de ${category.name}`,
      `${category.name} en WhatsApp`,
      "grupos de WhatsApp en español",
      "unirse a grupo de WhatsApp",
      "comunidades hispanohablantes",
      "enlaces de grupos de WhatsApp",
      category.slug,
    ],
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const result = await getGroupsByCategorySlugPaginated(slug, page);
  if (!result) notFound();
  const groups = result.groups;
  const basePath = `/categoria/${slug}`;
  const PAGE_SIZE = 120;
  const rangeStart = (result.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = rangeStart + groups.length - 1;

  const ratings = await getRatingsBatch(groups.map((g) => g.id));

  // Entity content (custom intros + keyword-derived pieces) — React-cache()d,
  // shares the lookup with generateMetadata.
  const content = await getTaxonomyContent("category", category.name);

  // JSON-LD: ItemList of groups in this category
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Grupos de WhatsApp de ${category.name}`,
    description: category.description,
    inLanguage: "es",
    numberOfItems: groups.length,
    itemListElement: groups.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: `${SITE.url}/grupo/${g.slug}`,
      ...(g.country ? { description: `${g.title} — ${g.country.name}` } : {}),
    })),
  };

  // JSON-LD: Breadcrumb
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Categorías", item: `${SITE.url}/categorias` },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${SITE.url}/categoria/${category.slug}`,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ADULT DIRECTIVE: adult categories emit no structured data. */}
      {!category.isAdult && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
          />
        </>
      )}

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
                <Link href="/categorias" className="hover:text-primary">
                  Categorías
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="font-medium text-foreground">{category.name}</li>
            </ol>
          </div>
        </nav>

        {/* Category header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-5">
              <div className="flex items-start gap-4">
                <span
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-4xl sm:h-20 sm:w-20 sm:text-5xl"
                  aria-hidden
                >
                  {category.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>Categoría</span>
                  </div>
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    {content.customTitle ?? category.name}
                  </h1>
                  {content.customHeroDesc ? (
                    <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {content.customHeroDesc}
                    </p>
                  ) : (
                    <>
                      <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {category.description}
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
                  {category.groupCount}{" "}
                  {category.groupCount === 1 ? "grupo disponible" : "grupos disponibles"}
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
                  Grupos de {category.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.isAdult ? (
                    <span>Contenido para adultos — visible solo con el modo 18+ activo.</span>
                  ) : (
                    <>
                      Mostrando {rangeStart}–{rangeEnd} de {result.total}{" "}
                      {result.total === 1 ? "grupo" : "grupos"}
                    </>
                  )}
                </p>
              </div>
              <Link
                href="/agregar-grupo"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> Enviar un grupo
              </Link>
            </div>

            {/* ADULT DIRECTIVE: adult category groups load client-side only,
                after the 18+ toggle. Never server-rendered. */}
            {category.isAdult ? (
              <AdultCategoryFeed categoryId={category.id} categoryName={category.name} />
            ) : groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-3xl">
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold">Aún no hay grupos en esta categoría</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Sé el primero en publicar un grupo de {category.name.toLowerCase()} y ayudar a
                  otros hispanohablantes a encontrar comunidad.
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
                    <GroupCard key={g.id} group={g} rating={ratings[g.id] ?? null} />
                  ))}
                </div>
              </Reveal>
            )}

            {!category.isAdult && (
              <Pagination
                basePath={basePath}
                page={result.page}
                totalPages={result.totalPages}
              />
            )}
          </div>
        </section>

        {/* Long-form SEO content */}
        <section className="border-t bg-muted/20 py-10 sm:py-14" aria-labelledby="seo-heading">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl text-pretty">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Sobre los grupos de {category.name}</span>
              </div>
              <h2 id="seo-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Grupos de WhatsApp de {category.name}: cómo elegir y sacarle provecho
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
                  Los grupos de WhatsApp de{" "}
                  <strong className="font-semibold text-foreground">{category.name}</strong> reúnen
                  a personas que comparten un mismo interés en español, sin importar si viven en el
                  mismo barrio o a miles de kilómetros. En ConectaGrupos hemos organizado{" "}
                  {category.groupCount}{" "}
                  {category.groupCount === 1 ? "comunidad" : "comunidades"} bajo esta categoría para
                  que encuentres en segundos un espacio donde participar: debates serios, planes
                  casuales, recomendaciones o simplemente gente con la que charlar al final del día.
                  Cada enlace pasa por una revisión humana antes de publicarse, así que te llevas
                  comunidades reales y no listas abandonadas llenas de spam.
                </p>

                <p>
                  Antes de unirte a un grupo de {category.name.toLowerCase()} conviene leer su
                  descripción y fijarte en la cantidad de miembros. Un grupo muy grande suele tener
                  más movimiento pero también más ruido, mientras que uno pequeño permite
                  conversaciones más cercanas. Revisa también el país: aunque todos hablan español,
                  los horarios y las referencias culturales cambian entre España, México, Argentina
                  o Colombia. Si después de un tiempo el grupo deja de interesarte, salir es tan
                  sencillo como pulsar &laquo;Salir del grupo&raquo; dentro de WhatsApp, sin
                  explicaciones ni avisos al administrador.
                </p>

                <p>
                  Si administras o formas parte de una comunidad de {category.name.toLowerCase()}{" "}
                  que no aparece aquí, puedes publicarla con el botón{" "}
                  <span className="font-medium text-foreground">&laquo;Enviar un grupo&raquo;</span>{" "}
                  que ves arriba. El envío es gratuito y queda en estado pendiente mientras
                  verificamos que el enlace funciona, que la descripción es clara y que respeta las
                  normas básicas de convivencia. Una vez aprobado, tu grupo aparecerá en esta
                  categoría, en la home de ConectaGrupos y será descubrible por hispanohablantes de
                  toda Latinoamérica y España. Así de simple: tú pones la comunidad, nosotros la
                  ponemos a la vista de quien la está buscando.
                </p>
                  </>
                )}
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
                <MessageCircle className="h-3.5 w-3.5" /> ¿Administras un grupo de{" "}
                {category.name.toLowerCase()}?
              </span>
              <h2 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
                Da visibilidad a tu comunidad de WhatsApp
              </h2>
              <p className="max-w-2xl text-pretty text-sm text-primary-foreground/90 sm:text-base">
                Publica tu grupo de {category.name.toLowerCase()} gratis y llega a miles de
                hispanohablantes que están buscando justo lo que tú ofreces. Lo revisamos en menos de
                24 horas.
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
