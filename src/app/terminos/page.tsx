import type { Metadata } from "next";
import Link from "next/link";
import {
  ScrollText,
  CheckCircle2,
  Flag,
  RefreshCw,
  Scale,
  ChevronRight,
} from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { jsonLdScript } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: { absolute: `Términos de Uso — ${SITE.name}` },
  description:
    "Términos de uso de ConectaGrupos: reglas para enviar grupos, normas de contenido, moderación, cómo reportar abusos y limitación de responsabilidad.",
  alternates: { canonical: `${SITE.url}/terminos` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Términos de Uso — ${SITE.name}`,
    description:
      "Reglas de uso del directorio ConectaGrupos: qué se puede publicar, qué no, y cómo moderamos el contenido.",
    url: `${SITE.url}/terminos`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  keywords: [
    "términos de uso",
    "condiciones ConectaGrupos",
    "normas de uso",
    "contenido prohibido",
    "moderación",
    "reportar grupo",
  ],
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Términos de Uso — ${SITE.name}`,
  description:
    "Términos de uso de ConectaGrupos: aceptable uso, normas de contenido, moderación y responsabilidad.",
  url: `${SITE.url}/terminos`,
  inLanguage: "es",
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Términos de Uso",
        item: `${SITE.url}/terminos`,
      },
    ],
  },
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(webPageJsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <nav aria-label="Migas de pan" className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary">
                  Inicio
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="font-medium text-foreground">Términos de Uso</li>
            </ol>
          </div>
        </nav>

        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <ScrollText className="h-3.5 w-3.5 text-primary" />
                Condiciones
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Términos de Uso
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Al usar ConectaGrupos, aceptas estas condiciones. Están pensadas para que el
                directorio siga siendo útil y seguro para toda la comunidad hispanohablante.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long" })}
              </p>
            </div>
          </div>
        </header>

        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl space-y-10 text-pretty">
              <Reveal>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">1. Uso aceptable</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      ConectaGrupos es un directorio abierto de enlaces de invitación a grupos
                      de WhatsApp en español. Te comprometes a usarlo de forma respetuosa y
                      legal: no intentar saturar el servicio, no extraer masivamente datos, no
                      publicar contenido que incumpla la ley de tu país o del país donde se aloja
                      el sitio.
                    </p>
                    <p>
                      Puedes navegar, buscar, abrir fichas y unirte a grupos sin registro. Para
                      enviar un grupo, valorar o reportar, basta con completar el formulario
                      correspondiente. No se requiere cuenta.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.05}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">2. Reglas para los grupos enviados</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      Cualquier persona puede enviar un grupo, pero nos reservamos el derecho de
                      no publicar o retirar aquellos que incumplan estas normas:
                    </p>
                    <ul className="ml-5 list-disc space-y-1.5">
                      <li>
                        <strong>No spam ni autopromoción agresiva.</strong> Grupos cuyo único
                        propósito sea vender, bombardear con enlaces o captar leads sin
                        conversación real.
                      </li>
                      <li>
                        <strong>Contenido adulto disfrazado.</strong> Cualquier grupo con
                        contenido para adultos debe declararse como tal. Los grupos con
                        contenido ilegal o que promuevan la explotación quedan totalmente
                        prohibidos.
                      </li>
                      <li>
                        <strong>Actividades ilegales.</strong> Estafas, pirámides, venta de
                        sustancias ilegales, apología del delito, material protegido por
                        derechos de autor distribuido sin permiso.
                      </li>
                      <li>
                        <strong>Suplantación.</strong> Grupos que se hacen pasar por personas,
                        marcas o instituciones sin autorización.
                      </li>
                      <li>
                        <strong>Enlaces rotos o caducados.</strong> Si el enlace de invitación
                        no funciona, el grupo se retira del directorio hasta que se actualice.
                      </li>
                      <li>
                        <strong>Categoría o país falso.</strong> Asignar una categoría o país
                        incorrecto para ganar visibilidad no está permitido.
                      </li>
                    </ul>
                    <p>
                      El equipo de moderación revisa cada envío antes de publicarlo y puede
                      editarlo ligeramente (descripción, etiquetas) para corregir errores
                      evidentes. El remitente será informado si su grupo se rechaza.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.1}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Flag className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">3. Moderación y denuncia de abusos</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      Mantenemos el directorio limpio gracias a la colaboración de la comunidad.
                      Si ves un grupo que incumple las normas, puedes{" "}
                      <Link href="/reportar-grupo" className="font-medium text-primary hover:underline">
                        reportarlo aquí
                      </Link>{" "}
                      indicando el motivo. También puedes usar el botón «Reportar» desde la ficha
                      del propio grupo.
                    </p>
                    <p>
                      Cada reporte se revisa manualmente. Si se confirma la infracción, el grupo
                      puede ser retirado, marcado como inactivo o, en casos graves, bloqueado.
                      Limitamos a un reporte por grupo e IP para evitar abusos del propio sistema.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.15}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">4. Limitación de responsabilidad</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      ConectaGrupos es un directorio: no aloja los grupos ni es responsable de
                      lo que en ellos se converse. La responsabilidad sobre el contenido
                      publicado dentro de cada grupo de WhatsApp recae en el administrador del
                      grupo y en sus participantes, conforme a los términos de servicio de
                      WhatsApp.
                    </p>
                    <p>
                      No garantizamos que el enlace de invitación de cada grupo funcione en todo
                      momento, ya que WhatsApp puede revocar enlaces sin previo aviso. Hacemos
                      nuestro mejor esfuerzo para verificar los enlaces periódicamente, pero no
                      podemos asegurar disponibilidad continua.
                    </p>
                    <p>
                      En ningún caso ConectaGrupos será responsable de daños indirectos, lucro
                      cesante o pérdida de datos derivados del uso del sitio o de la información
                      aquí publicada.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.2}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">5. Cambios en los términos</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      Podemos actualizar estos términos cuando sea necesario para reflejar
                      cambios legales, nuevos servicios o mejoras en la moderación. La fecha de
                      «última actualización» al inicio de la página indica cuándo se hizo el
                      último cambio. Te recomendamos repasar esta página de vez en cuando.
                    </p>
                    <p>
                      Seguir usando el sitio después de un cambio implica la aceptación de los
                      términos actualizados. Si no estás de acuerdo, debes dejar de usar el
                      servicio.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.25}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">6. Contacto</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">
                    Si tienes preguntas sobre estos términos, escríbenos a{" "}
                    <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-primary hover:underline">
                      {SITE.contactEmail}
                    </a>{" "}
                    o desde nuestro{" "}
                    <Link href="/contacto" className="font-medium text-primary hover:underline">
                      formulario de contacto
                    </Link>
                    .
                  </p>
                </section>
              </Reveal>

              <div className="flex flex-wrap items-center gap-3 border-t pt-6 text-sm">
                <Link href="/politica-de-privacidad" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                  Ver política de privacidad <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/politica-de-cookies" className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-primary">
                  Ver política de cookies <ChevronRight className="h-4 w-4" />
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
