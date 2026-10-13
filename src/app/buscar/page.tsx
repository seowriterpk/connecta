import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Search,
  Users,
  MessageCircle,
  Sparkles,
  Plus,
  Frown,
  TrendingUp,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { searchGroups, getCategories, getCountries } from "@/lib/data";
import { GroupCard } from "@/components/site/group-card";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { SearchBox } from "@/components/site/search-box";
import { RecentlyViewed } from "@/components/site/recently-viewed";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Cap the displayed query to keep the UI tidy.
function cleanQuery(q: unknown): string {
  if (Array.isArray(q)) q = q[0];
  if (typeof q !== "string") return "";
  return q.trim().slice(0, 100);
}

export async function generateMetadata(): Promise<Metadata> {
  // /buscar is a utility page and is NEVER indexed — not the landing and not
  // any ?q= view (the user's directive: search URLs completely hidden from
  // Google). Canonical is ALWAYS the clean /buscar URL and the title is
  // static, non-query-specific; no DB lookup needed here.
  const title = "Buscar Grupos de WhatsApp | Grupos Hoy";
  const description =
    "Busca grupos de WhatsApp en español por nombre, descripción, etiqueta o palabra clave. Encuentra tu comunidad ideal sin registro.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITE.url}/buscar` },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/buscar`,
      type: "website",
      locale: "es_ES",
      siteName: SITE.name,
    },
  };
}

export default async function BuscarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = cleanQuery(sp.q);

  // Empty query: show landing state (welcome + popular tags via SearchBox + categories).
  if (!q) {
    return <BuscarLanding />;
  }

  const result = await searchGroups(q, 48);
  const groups = result.groups;

  return (
    <div className="flex min-h-screen flex-col">
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
                  Buscar
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="truncate font-medium text-foreground">{q}</li>
            </ol>
          </div>
        </nav>

        {/* Search hero */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Search className="h-3.5 w-3.5" /> Buscador de grupos
              </span>
              <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
                {result.total > 0
                  ? `Resultados para «${q}»`
                  : `Sin resultados para «${q}»`}
              </h1>
              <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
                {result.total > 0
                  ? `Hemos encontrado ${result.total} ${result.total === 1 ? "grupo de WhatsApp" : "grupos de WhatsApp"} que coinciden con tu búsqueda. Sigue las palabras que quieras afinando: cuantas más añadas, más concreto será el resultado.`
                  : "Ningún grupo coincide con todas las palabras que escribiste. Prueba con términos más cortos o explora por categoría, país o etiqueta."}
              </p>

              <div className="mt-2 w-full">
                <SearchBox defaultValue={q} autoFocus={false} />
              </div>

              {result.total > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {result.total} {result.total === 1 ? "resultado" : "resultados"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                    <MessageCircle className="h-3.5 w-3.5 text-primary" /> Comunidades en español
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Recently viewed (client, localStorage — hidden when empty) */}
        <RecentlyViewed />

        {/* Results grid */}
        <section className="py-10 sm:py-12" aria-labelledby="resultados-heading">
          <div className="container mx-auto px-4">
            <h2 id="resultados-heading" className="sr-only">
              Resultados de búsqueda
            </h2>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center sm:p-16">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-muted">
                  <Frown className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No encontramos grupos para «{q}»</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Comprueba la ortografía, prueba con sinónimos o usa palabras más
                  cortas. También puedes explorar el directorio por categoría o país.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/categorias"
                    className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    <Sparkles className="h-4 w-4 text-primary" /> Ver categorías
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                  >
                    <TrendingUp className="h-4 w-4 text-primary" /> Explorar grupos
                  </Link>
                  <Link
                    href="/agregar-grupo"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" /> Enviar un grupo
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

            {result.total > 0 && (
              <p className="mt-8 text-center text-xs text-muted-foreground">
                Mostrando {groups.length} de {result.total}{" "}
                {result.total === 1 ? "resultado" : "resultados"} para «{q}».
              </p>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty-state landing: shown when the user visits /buscar without `?q=`.
// ---------------------------------------------------------------------------
async function BuscarLanding() {
  const [categories, countries] = await Promise.all([getCategories(), getCountries()]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-14 sm:py-20">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Search className="h-3.5 w-3.5" /> Buscador de grupos de WhatsApp
              </span>
              <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                Busca grupos de WhatsApp en español
              </h1>
              <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
                Escribe lo que buscas y te mostraremos los grupos que lo mencionan en
                el nombre, la descripción, las etiquetas o las palabras clave. Cuantas
                más palabras, más preciso.
              </p>
              <div className="mt-2 w-full">
                <SearchBox defaultValue="" autoFocus />
              </div>
            </div>
          </div>
        </header>

        <RecentlyViewed />

        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-pretty">
              <h2 className="text-xl font-bold sm:text-2xl">
                Sugerencias para tu búsqueda
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Prueba con términos como <em>fútbol</em>, <em>programación</em>,{" "}
                <em>Madrid</em>, <em>memes</em>, <em>inglés</em> o el nombre de un
                país hispanohablante.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/categorias"
                  className="group rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Explorar por categorías</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {categories.length} categorías de Tecnología, Amistad, Cine, Cocina y más.
                  </p>
                </Link>
                <Link
                  href="/paises"
                  className="group rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Explorar por país</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {countries.length} países hispanohablantes con comunidades activas.
                  </p>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <Link
                  href="/agregar-grupo"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" /> Enviar un grupo
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
                >
                  <TrendingUp className="h-4 w-4 text-primary" /> Ver grupos populares
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  );
}
