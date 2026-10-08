import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin,
  Globe2,
  Users,
  Layers,
  CalendarDays,
  MessageCircle,
  Plus,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import {
  getUploaderBySlug,
  getGroupsByUploader,
  getUploaderCategories,
  getRatingsBatch,
  getCategories,
  getCountries,
  type UploaderDTO,
} from "@/lib/data";
import { GroupCard } from "@/components/site/group-card";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { SubmitDialog } from "@/components/site/submit-dialog";
import { GroupImage } from "@/components/site/group-image";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function fmtDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildSocialLinks(u: UploaderDTO) {
  return [
    u.facebookUrl
      ? { kind: "facebook", label: "Facebook", href: u.facebookUrl, icon: Facebook }
      : null,
    u.twitterUrl
      ? { kind: "twitter", label: "Twitter / X", href: u.twitterUrl, icon: Twitter }
      : null,
    u.linkedinUrl
      ? { kind: "linkedin", label: "LinkedIn", href: u.linkedinUrl, icon: Linkedin }
      : null,
    u.websiteUrl
      ? { kind: "website", label: "Sitio web", href: u.websiteUrl, icon: Globe2 }
      : null,
  ].filter((x): x is { kind: string; label: string; href: string; icon: typeof Facebook } => x !== null);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const uploader = await getUploaderBySlug(slug);
  if (!uploader) {
    return {
      title: "Autor no encontrado",
      robots: { index: false, follow: false },
    };
  }

  const title = `${uploader.name} — ${uploader.jobTitle} | ${SITE.name}`;
  const description =
    (uploader.description ?? `Perfil de ${uploader.name} en ${SITE.name}.`).slice(0, 160);
  const canonical = `${SITE.url}/autor/${uploader.slug}`;
  const socials = buildSocialLinks(uploader);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      locale: "es_ES",
      siteName: SITE.name,
      ...(uploader.imageUrl
        ? { images: [{ url: uploader.imageUrl, width: 300, height: 300, alt: uploader.name }] }
        : { images: [OG_IMAGE] }),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(uploader.imageUrl ? { images: [uploader.imageUrl] } : { images: ["/og.svg"] }),
    },
    keywords: [
      uploader.name,
      `${uploader.name} ${SITE.name}`,
      `${uploader.name} grupos de WhatsApp`,
      uploader.jobTitle,
      "curador de comunidades",
      "autor ConectaGrupos",
      "perfil de editor",
    ],
  };
}

export default async function AutorPage({ params }: PageProps) {
  const { slug } = await params;
  const uploader = await getUploaderBySlug(slug);
  if (!uploader) notFound();

  const [groups, categoriesCovered, categories, countries] = await Promise.all([
    getGroupsByUploader(uploader.id, 60),
    getUploaderCategories(uploader.id),
    getCategories(),
    getCountries(),
  ]);
  const ratings = await getRatingsBatch(groups.map((g) => g.id));
  const socials = buildSocialLinks(uploader);
  const totalMembers = groups.reduce((acc, g) => acc + (g.members || 0), 0);

  // JSON-LD: Person schema with sameAs array of social URLs
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE.url}/autor/${uploader.slug}#person`,
    name: uploader.name,
    url: `${SITE.url}/autor/${uploader.slug}`,
    jobTitle: uploader.jobTitle,
    description: uploader.description ?? "",
    image: uploader.imageUrl ?? undefined,
    worksFor: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    ...(socials.length > 0
      ? { sameAs: socials.map((s) => s.href) }
      : {}),
  };

  // JSON-LD: ProfilePage (so search engines see this as an author page)
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE.url}/autor/${uploader.slug}`,
    name: `Perfil de ${uploader.name}`,
    inLanguage: "es",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    about: { "@id": `${SITE.url}/autor/${uploader.slug}#person` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: groups.length,
      itemListElement: groups.slice(0, 12).map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        url: `${SITE.url}/${g.slug}`,
      })),
    },
  };

  // JSON-LD: Breadcrumb
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Autores", item: `${SITE.url}/autores` },
      {
        "@type": "ListItem",
        position: 3,
        name: uploader.name,
        item: `${SITE.url}/autor/${uploader.slug}`,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(profileJsonLd) }}
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
                <Link href="/autores" className="hover:text-primary">
                  Autores
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="truncate font-medium text-foreground">{uploader.name}</li>
            </ol>
          </div>
        </nav>

        {/* Author header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-6">
              <div className="flex w-full flex-col items-start gap-5 sm:flex-row sm:items-center">
                <GroupImage
                  src={uploader.imageUrl}
                  alt={uploader.name}
                  title={uploader.name}
                  size={120}
                  className="rounded-full sm:shrink-0"
                  fallbackEmoji="👤"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                    <span>{uploader.jobTitle}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    {uploader.name}
                  </h1>
                  {uploader.description && (
                    <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {uploader.description}
                    </p>
                  )}

                  {/* Social links */}
                  {socials.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {socials.map((s) => {
                        const Icon = s.icon;
                        return (
                          <a
                            key={s.kind}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer me"
                            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                            aria-label={`${s.label} de ${uploader.name}`}
                            title={s.label}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{s.label}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  {groups.length} {groups.length === 1 ? "grupo publicado" : "grupos publicados"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {categoriesCovered.length} {categoriesCovered.length === 1 ? "categoría cubierta" : "categorías cubiertas"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  En ConectaGrupos desde {fmtDate(uploader.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  {totalMembers.toLocaleString("es-ES")} miembros en sus comunidades
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
                  Grupos publicados por {uploader.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {groups.length === 0
                    ? "Todavía no ha publicado grupos visibles."
                    : `Mostrando ${groups.length} ${groups.length === 1 ? "grupo" : "grupos"} curado${groups.length === 1 ? "" : "s"} por este autor.`}
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
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-primary">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold">
                  {uploader.name.split(" ")[0]} todavía no tiene grupos publicados
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Cuando este autor publique grupos, aparecerán aquí. Mientras tanto,
                  puedes explorar otros grupos del directorio.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    Explorar grupos
                  </Link>
                  <Link
                    href="/categorias"
                    className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    Ver categorías
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

            {/* Categories covered */}
            {categoriesCovered.length > 0 && (
              <div className="mt-10 rounded-2xl border bg-card p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Categorías que cubre {uploader.name.split(" ")[0]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoriesCovered.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/categoria/${c.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 border-t pt-4">
                  <Link
                    href="/autores"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Ver todos los autores y contribuidores
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Long-form SEO content */}
        <section className="border-t bg-muted/20 py-10 sm:py-14" aria-labelledby="seo-heading">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl text-pretty">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Sobre {uploader.name}</span>
              </div>
              <h2 id="seo-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                {uploader.name}, {uploader.jobTitle.toLowerCase()} en {SITE.name}
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/85 sm:text-base">
                <p>
                  {uploader.description ??
                    `${uploader.name} forma parte del equipo de curaduría de ${SITE.name}, donde revisa y publica grupos de WhatsApp en español para garantizar que cada enlace está activo, la descripción es honesta y la categoría es la correcta.`}
                </p>
                <p>
                  Hasta ahora, {uploader.name.split(" ")[0]} ha publicado{" "}
                  <strong className="font-semibold text-foreground">{groups.length}</strong>{" "}
                  {groups.length === 1 ? "grupo" : "grupos"} en {SITE.name}, repartidos entre{" "}
                  <strong className="font-semibold text-foreground">{categoriesCovered.length}</strong>{" "}
                  {categoriesCovered.length === 1 ? "categoría" : "categorías"} distintas. Cada
                  uno de ellos pasa por una verificación humana: si un enlace deja de funcionar,
                  lo retiramos; si la comunidad deja de estar activa, lo marcamos como tal.
                </p>
                <p>
                  Si quieres seguir el trabajo de {uploader.name.split(" ")[0]} o contactarle,
                  encontrarás enlaces a sus perfiles sociales más arriba. Y si administras un
                  grupo de WhatsApp que encaje con su línea editorial, puedes publicarlo con el
                  botón <span className="font-medium text-foreground">«Enviar un grupo»</span>:
                  lo revisará el equipo de curaduría y, si encaja, se publicará en este directorio.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Ver todos los grupos
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/sobre-nosotros"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Sobre ConectaGrupos
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
