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
  ArrowRight,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { hreflangAlternates } from "@/lib/hreflang";
import {
  getUploaderBySlug,
  getGroupsByUploader,
  getUploaderCategories,
  type UploaderDTO,
} from "@/lib/data";
import { getPublishedPostCards } from "@/lib/blog";
import { GroupCard } from "@/components/site/group-card";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { GroupImage } from "@/components/site/group-image";

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

  // Non-absolute: the layout template appends "| Grupos Hoy".
  const title = `${uploader.name} · Equipo Editorial`;
  const ogTitle = `${uploader.name} · Equipo Editorial | Grupos Hoy`;
  const description =
    (uploader.description ?? `Perfil de ${uploader.name} en ${SITE.name}.`).slice(0, 160);
  const canonical = `${SITE.url}/autor/${uploader.slug}`;
  const socials = buildSocialLinks(uploader);

  return {
    title,
    description,
    alternates: hreflangAlternates(`/autor/${uploader.slug}`),
    robots: { index: true, follow: true },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: "profile",
      locale: "es_ES",
      siteName: SITE.name,
      ...(uploader.imageUrl
        ? { images: [{ url: uploader.imageUrl, width: 300, height: 300, alt: uploader.name }] }
        : {}),
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description,
      ...(uploader.imageUrl ? { images: [uploader.imageUrl] } : {}),
    },
    keywords: [
      uploader.name,
      `${uploader.name} ${SITE.name}`,
      `${uploader.name} grupos de WhatsApp`,
      uploader.jobTitle,
      "equipo editorial",
      "quién publica los grupos",
      "autor Grupos Hoy",
    ],
  };
}

export default async function AutorPage({ params }: PageProps) {
  const { slug } = await params;
  const uploader = await getUploaderBySlug(slug);
  if (!uploader) notFound();

  const [groups, categoriesCovered] = await Promise.all([
    getGroupsByUploader(uploader.id, 60),
    getUploaderCategories(uploader.id),
  ]);
  // Team page asset: the Equipo Grupos Hoy author page also surfaces the
  // editorial methodology + the guías it publishes (E-E-A-T: who is behind
  // the content, how it is produced, and where to read more).
  const isTeam = uploader.slug === "equipo-gruposhoy";
  const teamGuides = isTeam ? await getPublishedPostCards(3) : [];
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
        url: `${SITE.url}/grupo/${g.slug}`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
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
                  En Grupos Hoy desde {fmtDate(uploader.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  {totalMembers.toLocaleString("es-ES")} miembros estimados en sus grupos
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

        {/* Team-only: how we work (E-E-A-T methodology) */}
        {isTeam && (
          <section className="border-b bg-muted/20 py-10 sm:py-12" aria-labelledby="metodo-heading">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-4xl">
                <h2
                  id="metodo-heading"
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Cómo trabajamos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  El proceso que sigue cada grupo antes de aparecer en el directorio.
                </p>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                  <li className="rounded-2xl border bg-card p-5 shadow-sm">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      1
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">Revisión editorial</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Cada grupo llega por el formulario de envío. Revisamos nombre, descripción,
                      categoría y país antes de publicarlo. Nada entra sin pasar por aquí.
                    </p>
                  </li>
                  <li className="rounded-2xl border bg-card p-5 shadow-sm">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      2
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">Comprobación del enlace</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      El enlace de invitación pasa una comprobación automática de formato y
                      estructura. Cada comprobación queda registrada en el historial del grupo y
                      puedes verla en su página de verificación.
                    </p>
                  </li>
                  <li className="rounded-2xl border bg-card p-5 shadow-sm">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      3
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">Publicación con contexto</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Publicamos el grupo con su categoría, país y ciudad, para que quien busca
                      lo encuentre en contexto. Las categorías para mayores de edad van siempre
                      separadas del resto del directorio.
                    </p>
                  </li>
                  <li className="rounded-2xl border bg-card p-5 shadow-sm">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      4
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">Revisión continua</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Los usuarios pueden reportar un grupo o avisar de un enlace caído. Cuando
                      pasa, volvemos a comprobar y actualizamos o retiramos el grupo.
                    </p>
                  </li>
                </ol>

                {/* Guías the team publishes */}
                {teamGuides.length > 0 && (
                  <div className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold tracking-tight">
                          Las guías de Grupos Hoy
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Artículos en español, paso a paso, firmados por Antonio C. — editor
                          responsable del proyecto.
                        </p>
                      </div>
                      <Link
                        href="/guias"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Ver todas las guías
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {teamGuides.map((g) => (
                        <Link
                          key={g.slug}
                          href={`/guias/${g.slug}`}
                          className="group flex flex-col rounded-xl border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                        >
                          <span className="text-xl" aria-hidden>
                            {g.coverEmoji}
                          </span>
                          <span className="mt-2 line-clamp-2 text-xs font-semibold leading-snug">
                            {g.title}
                          </span>
                          <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {g.excerpt}
                          </span>
                          <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-medium text-primary">
                            Leer <ArrowRight className="h-3 w-3" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

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
                    ? "Todavía no hay grupos publicados por el equipo editorial."
                    : `Mostrando ${groups.length} ${groups.length === 1 ? "grupo" : "grupos"} publicado${groups.length === 1 ? "" : "s"} por el equipo editorial.`}
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
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-primary">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold">
                  {uploader.name} todavía no tiene grupos publicados
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Cuando el equipo editorial publique grupos, aparecerán aquí. Mientras
                  tanto, puedes explorar otros grupos del directorio.
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
                    <GroupCard key={g.id} group={g} />
                  ))}
                </div>
              </Reveal>
            )}

            {/* Categories covered */}
            {categoriesCovered.length > 0 && (
              <div className="mt-10 rounded-2xl border bg-card p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Categorías que cubre el equipo editorial</span>
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
                    Ver todos los autores
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
                    `${uploader.name} revisa y publica los grupos de WhatsApp en español del directorio: cada enlace pasa por las manos del equipo antes de aparecer.`}
                </p>
                <p>
                  Hasta ahora, el equipo ha publicado{" "}
                  <strong className="font-semibold text-foreground">{groups.length}</strong>{" "}
                  {groups.length === 1 ? "grupo" : "grupos"} en {SITE.name}, repartidos entre{" "}
                  <strong className="font-semibold text-foreground">{categoriesCovered.length}</strong>{" "}
                  {categoriesCovered.length === 1 ? "categoría" : "categorías"} distintas. Cada
                  uno de ellos pasa por una verificación humana: si un enlace deja de funcionar,
                  lo marcamos como caducado; si la comunidad deja de estar activa, lo marcamos
                  como tal.
                </p>
                <p>
                  Si quieres saber más sobre cómo revisamos los grupos, en la página de sobre
                  nosotros contamos qué significa el sello «Verificado». Y si administras un
                  grupo de WhatsApp, puedes publicarlo con el botón{" "}
                  <span className="font-medium text-foreground">«Enviar un grupo»</span>:
                  lo revisará el equipo editorial y, si encaja, se publicará en este directorio.
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
                  Sobre Grupos Hoy
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
