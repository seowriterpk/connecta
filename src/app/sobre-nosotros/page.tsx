import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Linkedin, Quote, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { CountryFlag } from "@/components/site/country-flag";
import { SITE } from "@/lib/constants";

const FUNDADOR_LINKEDIN = "https://www.linkedin.com/in/antonio-campello-372962b8";

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description:
    "Conoce Grupos Hoy: quiénes somos, quién lo fundó, cómo revisamos los grupos y qué significa el sello Verificado.",
  alternates: { canonical: `${SITE.url}/sobre-nosotros` },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Sobre Grupos Hoy
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                El directorio de grupos de WhatsApp en español
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Grupos Hoy nació de una idea simple: reunir en un solo lugar los mejores
                grupos de WhatsApp en español, organizados por categoría, país e idioma. Sin
                spam, sin enlaces muertos, sin complicaciones.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <section className="mt-10" aria-labelledby="mision-heading">
                <h2 id="mision-heading" className="text-xl font-bold sm:text-2xl">
                  Nuestra misión
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Conectar a las personas hispanohablantes con comunidades de WhatsApp
                  organizadas y honestas. Creemos que un buen directorio no es solo una
                  lista de enlaces: es una puerta a conversaciones reales, a gente que
                  comparte tus intereses y a comunidades que de verdad funcionan.
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Por eso cada grupo pasa por un proceso de revisión: comprobamos que el
                  enlace funcione, que la descripción sea honesta y que la categoría sea la
                  correcta (
                  <a
                    href="#verificado"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    más abajo te contamos qué significa «Verificado»
                  </a>
                  ). Si un enlace deja de funcionar, marcamos el grupo como «Enlace
                  caducado» hasta que alguien lo comprueba de nuevo. Así de simple.
                </p>
              </section>
            </Reveal>

            <Reveal delay={0.15}>
              <section className="mt-10" aria-labelledby="como-heading">
                <h2 id="como-heading" className="text-xl font-bold sm:text-2xl">
                  Cómo trabajamos
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">1. Verificación de enlaces</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Antes de publicar, un editor abre el enlace de invitación y comprueba
                      que funciona. Después los revisamos periódicamente; si WhatsApp revoca
                      una invitación, el grupo queda marcado como «Enlace caducado» hasta
                      que se vuelve a verificar.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">2. Categorización honesta</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Cada grupo se clasifica en la categoría que le corresponde de verdad.
                      Sin engaños, sin trampas para ganar visitas.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">3. Contenido de la comunidad</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Los grupos los aportan personas reales. Tú también puedes publicar el
                      tuyo de forma gratuita.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">4. Sin datos falsos</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      No inflamos números: las valoraciones salen de usuarios reales y no
                      publicamos cifras que no podamos respaldar. Si una estimación
                      aparece, va siempre marcada como tal.
                    </p>
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal delay={0.2}>
              <section className="mt-10" aria-labelledby="fundador-heading">
                <h2 id="fundador-heading" className="text-xl font-bold sm:text-2xl">
                  El fundador
                </h2>
                <div className="mt-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    <img
                      src="/fundador-antonio.jpg"
                      alt="Retrato de Antonio C., fundador y propietario de Grupos Hoy"
                      width={112}
                      height={112}
                      loading="lazy"
                      decoding="async"
                      className="h-28 w-28 shrink-0 rounded-full border-2 border-primary/20 object-cover shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold tracking-tight">Antonio C.</p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Fundador y propietario · Freelancer · España
                        <CountryFlag code="es" name="España" />
                      </p>
                      <a
                        href={FUNDADOR_LINKEDIN}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        aria-label="Perfil de LinkedIn del fundador de Grupos Hoy"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        Perfil de LinkedIn
                      </a>
                    </div>
                  </div>

                  <figure className="mt-6">
                    <Quote className="h-5 w-5 text-primary/60" aria-hidden />
                    <blockquote className="mt-2 space-y-3 text-pretty text-sm leading-relaxed text-foreground/90 sm:text-base">
                      <p>
                        Soy freelance y trabajo, como mucha gente, en español. Durante años
                        me costó muchísimo encontrar grupos de WhatsApp activos y útiles
                        para mi trabajo: lo que valía la pena estaba en inglés, y lo que
                        había en español quedaba disperso, medio muerto o no tenía nada que
                        ver con lo que yo necesitaba.
                      </p>
                      <p>
                        Un día caí en la cuenta de que este problema no podía ser solo mío:
                        miles de hispanohablantes estarían pasando por lo mismo. Que no
                        hablemos inglés no significa que no merezcamos acceder a
                        comunidades útiles.
                      </p>
                      <p>
                        Así que construí este sitio web: un único lugar donde toda la
                        diversidad de grupos —todas las categorías, en español, para todos
                        los países hispanohablantes: España, México, Argentina, Colombia,
                        Perú, Chile, Venezuela, Ecuador, Bolivia, Paraguay, Uruguay, Cuba,
                        República Dominicana, Puerto Rico, Guatemala, Honduras, El Salvador,
                        Nicaragua, Costa Rica y Panamá— sea fácil de encontrar.
                      </p>
                    </blockquote>
                  </figure>

                  <div className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>
                        Antonio no publica los grupos él mismo: el día a día del directorio
                        —revisar, verificar y publicar cada grupo— lo lleva el{" "}
                        <Link
                          href="/autores"
                          className="font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          Equipo Grupos Hoy
                        </Link>
                        , el equipo editorial que publica todos los grupos del directorio.
                      </span>
                    </p>
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal delay={0.25}>
              <section
                id="verificado"
                className="mt-10 scroll-mt-24"
                aria-labelledby="verificado-heading"
              >
                <h2
                  id="verificado-heading"
                  className="flex items-center gap-2 text-xl font-bold sm:text-2xl"
                >
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                  Qué significa «Verificado»
                </h2>
                <div className="mt-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                  <p className="text-base leading-relaxed text-muted-foreground">
                    Cuando un grupo lleva el sello «Verificado», significa exactamente esto:
                    su enlace de invitación pasó nuestra comprobación automática más
                    reciente y estaba activo. La comprobación se repite de forma
                    periódica con el verificador de enlaces del directorio.
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    Si una invitación caduca en una revisión posterior, el grupo se marca
                    como «Enlace caducado» y el sello desaparece hasta que el enlace
                    vuelve a pasar una comprobación.
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    Y no prometemos nada más allá de eso. El sello habla del estado del
                    enlace, no del contenido que comparte la comunidad dentro del grupo
                    ni del criterio de sus administradores: eso ya depende de cada
                    comunidad.
                  </p>
                </div>
              </section>
            </Reveal>

            <Reveal delay={0.3}>
              <section className="mt-10" aria-labelledby="para-quien-heading">
                <h2 id="para-quien-heading" className="text-xl font-bold sm:text-2xl">
                  Para quién es Grupos Hoy
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Para cualquiera que hable español y busque gente con la que conversar. Da
                  igual si estás en Madrid, Ciudad de México, Buenos Aires o Santiago: aquí
                  hay un grupo para ti. Amistad, estudios, deportes, tecnología, cocina… la
                  variedad es enorme y crece cada día.
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Y si administras un grupo de WhatsApp, Grupos Hoy es la forma más
                  sencilla de darle visibilidad. Publicar es gratis, rápido y queda a la
                  vista de todo el que busque justo lo que tú ofreces.
                </p>
              </section>
            </Reveal>
          </div>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
