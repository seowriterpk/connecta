import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Users,
  BadgeCheck,
  Crown,
  Layers,
  Sparkles,
  UserRound,
  ArrowRight,
  Send,
  MapPin,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { getAllAuthors, type AuthorIndexDTO } from "@/lib/data";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { GroupImage } from "@/components/site/group-image";
import { CountryFlag } from "@/components/site/country-flag";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Equipo Editorial",
  description:
    "Quién publica y mantiene Grupos Hoy: el Equipo Grupos Hoy, el equipo editorial del directorio de grupos de WhatsApp en español.",
  alternates: { canonical: `${SITE.url}/autores` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Equipo Editorial | Grupos Hoy",
    description:
      "El equipo editorial que revisa, verifica y publica los grupos del directorio.",
    url: `${SITE.url}/autores`,
    locale: "es_ES",
    siteName: SITE.name,
  },
};

function AuthorCard({ author, index }: { author: AuthorIndexDTO; index: number }) {
  return (
    <Reveal delay={Math.min(index, 8) * 0.04}>
      <Link
        href={`/autor/${author.slug}`}
        title={author.name}
        className="group relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 text-left shadow-sm ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/25"
      >
        {/* Top accent */}
        <span
          className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-teal-600 transition-transform duration-500 ease-out group-hover:scale-x-100"
          aria-hidden
        />
        <span
          className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-teal-600 opacity-50"
          aria-hidden
        />

        <div className="flex items-start gap-4">
          <GroupImage
            src={author.imageUrl}
            alt={author.name}
            title={author.name}
            size={56}
            className="rounded-2xl transition duration-300 group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold leading-snug transition-colors group-hover:text-primary">
              {author.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-muted-foreground">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              {author.jobTitle}
            </p>
          </div>
        </div>

        {author.description && (
          <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground/90">
            {author.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Layers className="h-3 w-3 text-primary/70" />
              <span className="tabular-nums">{author.publishedCount}</span>
              {author.publishedCount === 1 ? "grupo" : "grupos"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Users className="h-3 w-3 text-primary/70" />
              <span className="tabular-nums">
                {author.totalMembers >= 1000
                  ? `${Math.round(author.totalMembers / 1000)}k`
                  : author.totalMembers.toLocaleString("es-ES")}
              </span>
              miembros estimados
            </span>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-500/25 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/40 group-hover:brightness-110"
            aria-hidden
          >
            Ver perfil
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

export default async function AutoresPage() {
  const authors = await getAllAuthors();

  const totalPublished = authors.reduce((acc, a) => acc + a.publishedCount, 0);
  const totalMembers = authors.reduce((acc, a) => acc + a.totalMembers, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Autores — ${SITE.name}`,
    url: `${SITE.url}/autores`,
    inLanguage: "es",
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    description:
      "Quién publica los grupos del directorio: el Equipo Grupos Hoy, equipo editorial de Grupos Hoy.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: authors.length,
      itemListElement: authors.slice(0, 30).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.name,
        url: `${SITE.url}/autor/${a.slug}`,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Autores", item: `${SITE.url}/autores` },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
              <li className="font-medium text-foreground">Autores</li>
            </ol>
          </div>
        </nav>

        {/* Header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <UserRound className="h-3.5 w-3.5" />
                El equipo editorial
              </span>
              <h1 className="mt-5 text-balance text-2xl font-extrabold tracking-tight sm:text-4xl">
                Quién publica los{" "}
                <span className="cg-gradient-text">grupos del directorio</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
                Todos los grupos de {SITE.name} los publica y mantiene el Equipo
                Grupos Hoy: el equipo editorial que revisa los envíos de la comunidad y
                comprueba los enlaces con el verificador automático antes de publicarlos.
                Conoce aquí al equipo y al propietario del proyecto.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3.5 py-2.5 shadow-sm backdrop-blur">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold tabular-nums">
                    {totalPublished.toLocaleString("es-ES")}
                  </span>
                  <span className="text-xs text-muted-foreground">grupos publicados</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3.5 py-2.5 shadow-sm backdrop-blur">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold tabular-nums">
                    {totalMembers >= 1000
                      ? `${Math.round(totalMembers / 1000)}k+`
                      : totalMembers.toLocaleString("es-ES")}
                  </span>
                  <span className="text-xs text-muted-foreground">miembros estimados</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Author cards + owner block */}
        <div className="container mx-auto px-4 py-10 sm:py-12">
          <section aria-labelledby="equipo-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="equipo-heading"
                  className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl"
                >
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  Equipo editorial
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                    {authors.length}
                  </span>
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  El equipo que publica y mantiene todos los grupos: revisa los envíos
                  de la comunidad y comprueba los enlaces con el verificador automático.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {authors.map((a, i) => (
                <AuthorCard key={a.id} author={a} index={i} />
              ))}
            </div>

            {authors.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-primary">
                  <UserRound className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold">Todavía no hay autores públicos</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  En cuanto el equipo editorial publique grupos, su perfil aparecerá aquí.
                </p>
              </div>
            )}
          </section>

          {/* Owner block — visually distinct, NOT an author (no /autor/ link) */}
          <section className="mt-10 sm:mt-12" aria-labelledby="propietario-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="propietario-heading"
                  className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl"
                >
                  <Crown className="h-5 w-5 text-amber-500" />
                  El propietario
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  El fundador y propietario del proyecto. No es editor: los grupos los
                  publica el equipo editorial de arriba.
                </p>
              </div>
            </div>
            <Reveal>
              <div className="rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-500/5 via-card to-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col items-start gap-5 sm:flex-row">
                  <img
                    src="/fundador-antonio.jpg"
                    alt="Retrato de Antonio C., fundador y propietario de Grupos Hoy"
                    width={112}
                    height={112}
                    loading="lazy"
                    decoding="async"
                    className="h-28 w-28 shrink-0 rounded-2xl border-2 border-amber-300/40 object-cover shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold tracking-tight">Antonio C.</h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        <Crown className="h-3 w-3" aria-hidden />
                        Fundador y propietario
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-amber-500/80" aria-hidden />
                      Freelancer · España
                      <CountryFlag code="es" name="España" />
                    </p>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground/90">
                      Freelancer español que construyó Grupos Hoy al no encontrar grupos
                      de WhatsApp útiles para su trabajo en español. Él no publica los
                      grupos: el día a día del directorio lo lleva el Equipo Grupos Hoy.
                    </p>
                    <Link
                      href="/sobre-nosotros"
                      className="mt-3.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Conocer su historia
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* CTA: send a group (publishes groups — never author profiles) */}
          <Reveal>
            <div className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
                    <Send className="h-5 w-5 text-primary" />
                    Envía un grupo
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    ¿Tienes o conoces un buen grupo de WhatsApp? Mándanos el enlace: el
                    Equipo Grupos Hoy lo revisará y, si pasa la comprobación, se
                    publicará en el directorio con tu crédito en la propia página del
                    grupo.
                  </p>
                </div>
                <Link
                  href="/agregar-grupo"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" /> Enviar un grupo
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Long-form SEO content */}
        <section className="border-t bg-muted/20 py-10 sm:py-14" aria-labelledby="seo-heading">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl text-pretty">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Sobre el equipo</span>
              </div>
              <h2 id="seo-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Quién publica y quién aporta
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/85 sm:text-base">
                <p>
                  Todos los grupos que ves en {SITE.name} los publica el{" "}
                  <strong className="font-semibold text-foreground">
                    Equipo Grupos Hoy
                  </strong>
                  , el equipo editorial del directorio. Su trabajo: revisar los envíos
                  de la comunidad (nombre, descripción, categoría), asignar cada grupo a
                  su sitio en el directorio y mantener los enlaces al día con el
                  comprobador automático.
                </p>
                <p>
                  Las comunidades las aportan personas reales. Si tú envías un grupo y pasa
                  la revisión, se publica con tu nombre como crédito en la propia página
                  del grupo — no con un perfil de autor. Los perfiles de autor existen solo
                  para el equipo editorial, para que quede claro quién cura el directorio y
                  quién aporta cada comunidad.
                </p>
                <p>
                  Detrás del proyecto está su fundador y propietario,{" "}
                  <strong className="font-semibold text-foreground">Antonio C.</strong>, un
                  freelancer de España que creó Grupos Hoy al no encontrar grupos útiles
                  en español para su trabajo. Puedes leer su historia completa en la página
                  de sobre nosotros.
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
