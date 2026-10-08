import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, Settings, Trash2, ChevronRight, ShieldCheck } from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { jsonLdScript } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: { absolute: `Política de Cookies — ${SITE.name}` },
  description:
    "Política de cookies de ConectaGrupos: solo cookies esenciales (tema, favoritos, recientes y consentimiento). Sin cookies publicitarias ni de seguimiento.",
  alternates: { canonical: `${SITE.url}/politica-de-cookies` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Política de Cookies — ${SITE.name}`,
    description:
      "Cookies que usa ConectaGrupos: cg-theme, cg-favorites, cg-recent, cg-sid, cg-cookie-consent. Todas esenciales, ninguna de publicidad.",
    url: `${SITE.url}/politica-de-cookies`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  keywords: [
    "política de cookies",
    "cookies ConectaGrupos",
    "cg-theme",
    "cg-favorites",
    "consentimiento cookies",
    "LSSI-CE",
  ],
};

const COOKIES = [
  {
    name: "cg-theme",
    type: "Esencial",
    duration: "Persistente (1 año)",
    purpose: "Recuerda si has elegido el modo claro u oscuro para evitar el parpadeo al cargar.",
  },
  {
    name: "cg-favorites",
    type: "Esencial",
    duration: "Persistente (1 año)",
    purpose:
      "Guarda en este dispositivo los grupos que has marcado como favoritos para mostrarlos en la sección «Mis favoritos».",
  },
  {
    name: "cg-recent",
    type: "Esencial",
    duration: "Persistente (30 días)",
    purpose:
      "Lista de los últimos grupos que has abierto para mostrarlos en «Vistos recientemente».",
  },
  {
    name: "cg-sid",
    type: "Esencial",
    duration: "Persistente (1 año)",
    purpose:
      "Identificador anónimo que permite limitar a una valoración por dispositivo y día. No se asocia a tu identidad ni a tu correo.",
  },
  {
    name: "cg-cookie-consent",
    type: "Esencial",
    duration: "Persistente (6 meses)",
    purpose: "Recuerda que has aceptado el uso de cookies esenciales para no volver a preguntarte.",
  },
];

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Política de Cookies — ${SITE.name}`,
  description:
    "Política de cookies de ConectaGrupos: cookies esenciales usadas, duración, propósito y cómo eliminarlas.",
  url: `${SITE.url}/politica-de-cookies`,
  inLanguage: "es",
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Política de Cookies",
        item: `${SITE.url}/politica-de-cookies`,
      },
    ],
  },
};

export default function CookiePolicyPage() {
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
              <li className="font-medium text-foreground">Política de Cookies</li>
            </ol>
          </div>
        </nav>

        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <Cookie className="h-3.5 w-3.5 text-primary" />
                Cookies
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Política de Cookies
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Esta página explica qué cookies y datos de almacenamiento local usamos, para qué
                sirven y cómo puedes eliminarlos. Spoiler: solo usamos lo esencial.
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
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">1. Solo cookies esenciales</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      En ConectaGrupos <strong>no usamos cookies de publicidad, ni de
                      seguimiento, ni de terceros</strong>. Tampoco cargamos píxeles de redes
                      sociales ni Google Analytics. Solo utilizamos cookies y almacenamiento
                      local estrictamente necesarios para que el sitio funcione y recuerde tus
                      preferencias.
                    </p>
                    <p>
                      Al pulsar «Aceptar» en el banner de cookies, consientes el uso de estas
                      cookies esenciales. Si no aceptas, no se guardará la preferencia de
                      consentimiento y el banner seguirá apareciendo, pero el sitio seguirá
                      funcionando con normalidad.
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.05}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Cookie className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">2. Cookies que usamos</h2>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-hidden rounded-xl border sm:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Nombre</th>
                          <th className="px-4 py-2.5 font-medium">Tipo</th>
                          <th className="px-4 py-2.5 font-medium">Duración</th>
                          <th className="px-4 py-2.5 font-medium">Propósito</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {COOKIES.map((c) => (
                          <tr key={c.name}>
                            <td className="px-4 py-3 align-top">
                              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.name}</code>
                            </td>
                            <td className="px-4 py-3 align-top text-muted-foreground">{c.type}</td>
                            <td className="px-4 py-3 align-top text-muted-foreground">{c.duration}</td>
                            <td className="px-4 py-3 align-top">{c.purpose}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 sm:hidden">
                    {COOKIES.map((c) => (
                      <div key={c.name} className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between gap-2">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.name}</code>
                          <span className="text-xs text-muted-foreground">{c.duration}</span>
                        </div>
                        <p className="mt-2 text-sm text-foreground/85">{c.purpose}</p>
                        <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {c.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.1}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">3. Gestión del consentimiento</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">
                    La primera vez que entras en ConectaGrupos, te mostramos un banner pidiendo
                    consentimiento para usar cookies esenciales. Una vez aceptado, guardamos la
                    preferencia en <code className="rounded bg-muted px-1.5 py-0.5 text-xs">cg-cookie-consent</code> y
                    no volvemos a preguntar. Como solo usamos cookies esenciales, no ofrecemos
                    selección granular por categoría: no hay nada que desactivar sin romper el
                    funcionamiento básico del sitio.
                  </p>
                </section>
              </Reveal>

              <Reveal delay={0.15}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">4. Cómo borrar las cookies</h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                    <p>
                      Puedes eliminar todas las cookies y el almacenamiento local de
                      ConectaGrupos en cualquier momento desde tu navegador:
                    </p>
                    <ul className="ml-5 list-disc space-y-1.5">
                      <li>
                        <strong>Chrome / Edge:</strong> Configuración → Privacidad y seguridad →
                        Eliminar datos de navegación → Cookies y otros datos del sitio.
                      </li>
                      <li>
                        <strong>Firefox:</strong> Ajustes → Privacidad y seguridad → Eliminar
                        datos → Cookies y datos del sitio.
                      </li>
                      <li>
                        <strong>Safari:</strong> Preferencias → Privacidad → Administrar datos
                        del sitio web → selecciona conectagrupos.com y elimina.
                      </li>
                      <li>
                        <strong>Móvil (iOS/Android):</strong> desde los ajustes del navegador,
                        borra los datos del sitio o el historial completo.
                      </li>
                    </ul>
                    <p>
                      Si solo quieres borrar tus favoritos o tu historial reciente sin afectar al
                      resto del sitio, puedes hacerlo desde la sección «Mis favoritos» (botón
                      «Limpiar») o «Vistos recientemente».
                    </p>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.2}>
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Cookie className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold sm:text-2xl">5. Cambios en esta política</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">
                    Si en el futuro añadimos alguna cookie nueva, actualizaremos esta página
                    antes de que entre en vigor y reflejaremos el cambio en la fecha de «última
                    actualización». Te avisaremos en el banner de cookies si es necesario volver
                    a pedir tu consentimiento.
                  </p>
                </section>
              </Reveal>

              <div className="flex flex-wrap items-center gap-3 border-t pt-6 text-sm">
                <Link href="/politica-de-privacidad" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                  Ver política de privacidad <ChevronRight className="h-4 w-4" />
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
