import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: { absolute: `Sobre Nosotros — ${SITE.name} | Directorio de grupos de WhatsApp` },
  description: "Conoce ConectaGrupos: el directorio en español de grupos de WhatsApp más completo. Nuestra misión, cómo trabajamos y por qué confían en nosotros miles de hispanohablantes.",
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
                Sobre ConectaGrupos
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                El directorio de grupos de WhatsApp en español
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                ConectaGrupos nació de una idea simple: reunir en un solo lugar los mejores grupos de
                WhatsApp en español, organizizados por categoría, país e idioma. Sin spam, sin
                enlaces rotos, sin complicaciones.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <section className="mt-10">
                <h2 className="text-xl font-bold sm:text-2xl">Nuestra misión</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Conectar a las personas hispanohablantes con comunidades activas y verificadas en
                  WhatsApp. Creemos que un buen directorio no es solo una lista de enlaces: es una
                  puerta a conversaciones reales, a gente que comparte tus intereses y a comunidades
                  que de verdad funcionan.
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Por eso cada grupo pasa por un proceso de revisión. Verificamos que el enlace
                  funcione, que la descripción sea honesta y que la categoría sea la correcta. Si un
                  grupo deja de funcionar, lo retiramos. Así de simple.
                </p>
              </section>
            </Reveal>

            <Reveal delay={0.15}>
              <section className="mt-10">
                <h2 className="text-xl font-bold sm:text-2xl">Cómo trabajamos</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">1. Verificación de enlaces</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Comprobamos cada enlace periódicamente. Si WhatsApp revoca el enlace, lo
                      marcamos y lo retiramos del directorio.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">2. Categorización honesta</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Cada grupo se clasifica en la categoría que le corresponde de verdad. Sin
                      engaños, sin trampas para ganar visitas.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">3. Contenido de la comunidad</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Los grupos los aportan personas reales. Tú también puedes publicar el tuyo de
                      forma gratuita.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">4. Sin datos falsos</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      No inflamos números. Mostramos clics y valoraciones reales, no inventados.
                    </p>
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal delay={0.2}>
              <section className="mt-10">
                <h2 className="text-xl font-bold sm:text-2xl">Para quién es ConectaGrupos</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Para cualquiera que hable español y busque gente con la que conversar. Da igual si
                  estás en Madrid, Ciudad de México, Buenos Aires o Santiago: aquí hay un grupo para
                  ti. Amistad, estudios, deportes, tecnología, cocina… la variedad es enorme y crece
                  cada día.
                </p>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Y si administras un grupo de WhatsApp, ConectaGrupos es la forma más sencilla de
                  darle visibilidad. Publicar es gratis, rápido y llega a miles de personas que
                  buscan justo lo que tú ofreces.
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
