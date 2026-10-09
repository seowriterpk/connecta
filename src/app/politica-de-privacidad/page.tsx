import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Cookie,
  Database,
  Mail,
  UserCheck,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { jsonLdScript } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: { absolute: `Política de Privacidad — ${SITE.name}` },
  description:
    "Política de privacidad de ConectaGrupos: qué datos recopilamos, cómo usamos cookies esenciales, qué servicios de terceros intervienen y cuáles son tus derechos como usuario.",
  alternates: { canonical: `${SITE.url}/politica-de-privacidad` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Política de Privacidad — ${SITE.name}`,
    description:
      "Cómo tratamos tus datos en ConectaGrupos: sin registros, sin venta de datos, solo cookies esenciales.",
    url: `${SITE.url}/politica-de-privacidad`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  keywords: [
    "política de privacidad",
    "privacidad ConectaGrupos",
    "datos personales",
    "cookies",
    "RGPD",
    "protección de datos",
  ],
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Política de Privacidad — ${SITE.name}`,
  description:
    "Política de privacidad de ConectaGrupos: datos recopilados, cookies, servicios de terceros y derechos del usuario.",
  url: `${SITE.url}/politica-de-privacidad`,
  inLanguage: "es",
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Política de Privacidad",
        item: `${SITE.url}/politica-de-privacidad`,
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(webPageJsonLd) }}
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
              <li aria-hidden>
                <ChevronRight className="h-3 w-3" />
              </li>
              <li className="font-medium text-foreground">Política de Privacidad</li>
            </ol>
          </div>
        </nav>

        {/* Header */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Privacidad
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Política de Privacidad
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Tu privacidad importa. Esta página explica, en lenguaje claro, qué datos
                tratamos, para qué los usamos y qué control tienes sobre ellos. Sin
                letra pequeña escondida.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long" })}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <article className="mx-auto max-w-3xl space-y-10 text-pretty">
              <Reveal>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">1. Datos que recopilamos</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      ConectaGrupos funciona sin registro: no necesitas crear una cuenta para
                      buscar grupos, abrir fichas o unirte a una comunidad. Aun así, cierta
                      información técnica se trata de forma automática para que el sitio
                      funcione:
                    </p>
                    <ul className="ml-5 list-disc space-y-1.5">
                      <li>
                        <strong>Datos de envío de grupos.</strong> Cuando un usuario publica un
                        grupo, almacenamos los datos que rellena (nombre, descripción, enlace,
                        categoría, país, etiquetas) y la fecha del envío. El contacto del
                        remitente es opcional.
                      </li>
                      <li>
                        <strong>Dirección IP anonimizada.</strong> Hasheamos la IP con SHA-256
                        antes de guardarla, solo para prevenir abusos (límite de envíos por IP,
                        un voto por IP al día, un reporte por grupo e IP). No podemos recuperar
                        la IP original a partir del hash.
                      </li>
                      <li>
                        <strong>Reportes y valoraciones.</strong> Se guarda el motivo del
                        reporte, una puntuación (1 a 5 estrellas) y el hash de IP correspondiente,
                        nunca tu identidad.
                      </li>
                      <li>
                        <strong>Datos de newsletter.</strong> Si te suscribes, guardamos tu
                        correo electrónico y el estado de la suscripción. Puedes darte de baja
                        en cualquier momento.
                      </li>
                    </ul>
                    <p className="mt-2">
                      No recopilamos datos de navegación con fines publicitarios, ni vendemos
                      información a terceros. No hay píxeles de Facebook ni de Google Analytics
                      en este sitio.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.05}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Cookie className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">2. Cómo usamos las cookies</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      Usamos <strong>solo cookies y almacenamiento local esenciales</strong>.
                      No hay cookies de publicidad, ni de seguimiento cruzado, ni de terceros.
                      Concretamente:
                    </p>
                    <ul className="ml-5 list-disc space-y-1.5">
                      <li>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">cg-theme</code>{" "}
                        — recuerda tu preferencia de modo claro u oscuro.
                      </li>
                      <li>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">cg-favorites</code>{" "}
                        — guarda los grupos que has marcado como favoritos en este dispositivo.
                      </li>
                      <li>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">cg-recent</code>{" "}
                        — lista de los últimos grupos que has abierto, para mostrarlos en la
                        sección «Vistos recientemente».
                      </li>
                      <li>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">cg-sid</code>{" "}
                        — identificador anónimo que permite limitar a una valoración por
                        dispositivo y por día. No se asocia a tu identidad.
                      </li>
                      <li>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">cg-cookie-consent</code>{" "}
                        — recuerda que has aceptado el uso de cookies esenciales.
                      </li>
                    </ul>
                    <p>
                      Puedes borrarlas en cualquier momento desde la configuración de tu
                      navegador. Más detalles en nuestra{" "}
                      <Link href="/politica-de-cookies" className="font-medium text-primary hover:underline">
                        política de cookies
                      </Link>
                      .
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.1}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">3. Servicios de terceros</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      Cuando pulsas «Unirme al grupo», te redirigimos a WhatsApp mediante el
                      enlace de invitación que el administrador del grupo facilitó. Esa acción
                      ocurre fuera de ConectaGrupos: a partir de ahí, se aplican las políticas de
                      privacidad de WhatsApp y de Meta, no la nuestra.
                    </p>
                    <p>
                      No incrustamos widgets de terceros que carguen seguimiento. Las imágenes
                      de los grupos se sirven, en la medida de lo posible, desde nuestros
                      propios servidores para evitar filtrar tu IP a CDNs externos.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.15}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">4. Tus derechos</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      Aunque no guardamos datos personales directos, sigues teniendo
                      control sobre cualquier dato que nos hayas proporcionado (por ejemplo, tu
                      correo en la newsletter o el contacto opcional en un reporte). Puedes
                      ejercer en cualquier momento los siguientes derechos:
                    </p>
                    <ul className="ml-5 list-disc space-y-1.5">
                      <li><strong>Acceso:</strong> saber qué datos tuyos tenemos.</li>
                      <li><strong>Rectificación:</strong> corregir datos incorrectos o desactualizados.</li>
                      <li><strong>Supresión:</strong> solicitar el borrado de tus datos.</li>
                      <li><strong>Oposición:</strong> dejar de recibir comunicaciones.</li>
                      <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
                    </ul>
                    <p>
                      Para ejercerlos, escríbenos a{" "}
                      <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-primary hover:underline">
                        {SITE.contactEmail}
                      </a>{" "}
                      indicando qué derecho quieres ejercer. Responderemos en un plazo máximo de
                      30 días hábiles.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.2}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">5. Contacto</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">
                    Si tienes cualquier duda sobre cómo tratamos tus datos, escríbenos a{" "}
                    <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-primary hover:underline">
                      {SITE.contactEmail}
                    </a>
                    . Estaremos encantados de ayudarte y de explicarte cualquier punto de esta
                    política con más detalle.
                  </p>
                </section>
              </Reveal>

              <div className="flex flex-wrap items-center gap-3 border-t pt-6 text-sm">
                <Link href="/politica-de-cookies" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                  Ver política de cookies <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/terminos" className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-primary">
                  Ver términos de uso <ChevronRight className="h-4 w-4" />
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
