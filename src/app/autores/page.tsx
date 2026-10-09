import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Users,
  BadgeCheck,
  Heart,
  Layers,
  Sparkles,
  UserRound,
  ArrowRight,
  Send,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { getAllAuthors, type AuthorIndexDTO } from "@/lib/data";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { GroupImage } from "@/components/site/group-image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Autores — Curadores de grupos | ${SITE.name}` },
  description:
    "Conoce al equipo detrás del directorio: personas que revisan, verifican y publican los grupos de WhatsApp en español.",
  alternates: { canonical: `${SITE.url}/autores` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Autores — Curadores de grupos | ${SITE.name}`,
    description:
      "El equipo detrás del directorio: curadores que publican grupos verificados.",
    url: `${SITE.url}/autores`,
    locale: "es_ES",
    siteName: SITE.name,
  },
};

function AuthorCard({ author, index }: { author: AuthorIndexDTO; index: number }) {
  const isStaff = author.kind === "staff";
  return (
    <Reveal delay={Math.min(index, 8) * 0.04}>
      <Link
        href={`/autor/${author.slug}`}
        title={author.name}
        className="group relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 text-left shadow-sm ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/25"
      >
        {/* Top accent */}
        <span
          className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 rounded-t-2xl bg-gradient-to-r transition-transform duration-500 ease-out group-hover:scale-x-100 ${
            isStaff ? "from-emerald-500 to-teal-600" : "from-amber-400 to-orange-500"
          }`}
          aria-hidden
        />
        <span
          className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r opacity-50 ${
            isStaff ? "from-emerald-500 to-teal-600" : "from-amber-400 to-orange-500"
          }`}
          aria-hidden
        />

        <div className="flex items-start gap-4">
          <GroupImage
            src={author.imageUrl}
            alt={author.name}
            title={author.name}
            size={56}
            className="rounded-2xl transition duration-300 group-hover:scale-105"
            fallbackEmoji="👤"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold leading-snug transition-colors group-hover:text-primary">
              {author.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-muted-foreground">
              {isStaff ? (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : (
                <Heart className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              )}
              {author.jobTitle}
            </p>
          </div>
        </div>

        {author.description && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/90">
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
              miembros
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

function AuthorSection({
  id,
  title,
  description,
  icon: Icon,
  authors,
}: {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  authors: AuthorIndexDTO[];
}) {
  if (authors.length === 0) return null;
  return (
    <section className="mt-10 sm:mt-12" aria-labelledby={`${id}-heading`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${id}-heading`} className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <Icon className="h-5 w-5 text-primary" />
            {title}
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {authors.length}
            </span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {authors.map((a, i) => (
          <AuthorCard key={a.id} author={a} index={i} />
        ))}
      </div>
    </section>
  );
}

export default async function AutoresPage() {
  const authors = await getAllAuthors();

  const staff = authors.filter((a) => a.kind === "staff");
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
      "Directorio de autores: el equipo que revisa y publica los grupos de WhatsApp en español.",
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
                {authors.length} {authors.length === 1 ? "autor" : "autores"} en el directorio
              </span>
              <h1 className="mt-5 text-balance text-2xl font-extrabold tracking-tight sm:text-4xl">
                Quién cura y publica los{" "}
                <span className="cg-gradient-text">grupos del directorio</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
                Cada grupo de {SITE.name} pasa por las manos de una persona real: gente
                normal, fanática de los grupos de WhatsApp, que revisa cada envío y
                verifica que los enlaces funcionen. Conoce al equipo.
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
                  <span className="text-xs text-muted-foreground">miembros en total</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Author grids */}
        <div className="container mx-auto px-4 py-10 sm:py-12">
          <AuthorSection
            id="equipo"
            title="Equipo de curación"
            description="Gente como tú, metida en montones de grupos, que revisa cada envío y verifica que los enlaces funcionen antes de publicar."
            icon={BadgeCheck}
            authors={staff}
          />

          {authors.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-primary">
                <UserRound className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold">Todavía no hay autores públicos</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                En cuanto el equipo publique grupos, sus perfiles aparecerán aquí.
              </p>
            </div>
          )}

          {/* CTA: become a contributor */}
          <Reveal>
            <div className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    ¿Quieres aparecer aquí?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Envía tu grupo de WhatsApp: si pasa la revisión de calidad, se publicará con
                    tu nombre como crédito en la propia página del grupo.
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
                Curaduría humana, grupo a grupo
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/85 sm:text-base">
                <p>
                  {SITE.name} no es un robot que recolecta enlaces: detrás de cada grupo publicado
                  hay un proceso de curaduría humana. El{" "}
                  <strong className="font-semibold text-foreground">equipo de curación</strong>{" "}
                  revisa cada envío — comprueba que el enlace funciona, que la descripción es
                  honesta, que la categoría encaja y que el grupo cumple las normas de convivencia.
                </p>
                <p>
                  Los{" "}
                  <strong className="font-semibold text-foreground">
                    contribuidores de la comunidad
                  </strong>{" "}
                  son usuarios que envían sus propios grupos o comunidades que conocen. Cuando su
                  envío se aprueba, el grupo se publica con su nombre como crédito en la página
                  del grupo — sin perfiles de autor, para que quede claro quién cura el
                  directorio y quién aporta cada grupo.
                </p>
                <p>
                  Si administras una comunidad activa — de fútbol, memes, idiomas, emprendimiento o
                  lo que sea — puedes unirte: envía tu grupo con el botón de arriba y, si pasa la
                  revisión, quedará publicado en el directorio con tu crédito.
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
