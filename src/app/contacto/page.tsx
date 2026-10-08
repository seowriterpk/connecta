import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Clock,
  MessageCircle,
  Flag,
  ChevronRight,
  Send,
  LifeBuoy,
} from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { Reveal } from "@/components/site/reveal";
import { ContactForm } from "@/components/site/contact-form";
import { jsonLdScript } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: { absolute: `Contacto — ${SITE.name}` },
  description:
    "Contacta con el equipo de ConectaGrupos: dudas, sugerencias o colaboraciones. Respondemos en menos de 48 horas laborables. También puedes reportar un grupo o enviar el tuyo.",
  alternates: { canonical: `${SITE.url}/contacto` },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Contacto — ${SITE.name}`,
    description:
      "¿Hablamos? Escríbenos a través del formulario o por correo. Respondemos en menos de 48 horas laborables.",
    url: `${SITE.url}/contacto`,
    type: "website",
    locale: "es_ES",
    siteName: SITE.name,
      images: [OG_IMAGE],
  },
  keywords: [
    "contacto ConectaGrupos",
    "hablar con ConectaGrupos",
    "soporte grupos WhatsApp",
    "reportar grupo",
    "enviar grupo WhatsApp",
  ],
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Contacto — ${SITE.name}`,
  description:
    "Formulario de contacto y vías de comunicación con el equipo de ConectaGrupos.",
  url: `${SITE.url}/contacto`,
  inLanguage: "es",
  isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Contacto",
        item: `${SITE.url}/contacto`,
      },
    ],
  },
};

export default function ContactoPage() {
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
              <li className="font-medium text-foreground">Contacto</li>
            </ol>
          </div>
        </nav>

        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-sm">
                <LifeBuoy className="h-3.5 w-3.5 text-primary" />
                Estamos para ayudarte
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Contacta con ConectaGrupos
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                ¿Tienes una duda, una sugerencia o quieres colaborar con nosotros? Escríbenos.
                Leemos cada mensaje y respondemos en persona, no con copias pegadas.
              </p>
            </div>
          </div>
        </header>

        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr]">
              {/* Contact info */}
              <Reveal>
                <aside className="space-y-4">
                  <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Mail className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold">Correo directo</h2>
                        <a
                          href={`mailto:${SITE.contactEmail}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {SITE.contactEmail}
                        </a>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      Para dudas generales, propuestas de colaboración, prensa o soporte. Si tu
                      consulta es sobre un grupo concreto, incluye su nombre o enlace.
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Clock className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold">Tiempo de respuesta</h2>
                        <p className="text-sm text-muted-foreground">Menos de 48 horas laborables</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      Atendemos de lunes a viernes. Mensajes enviados en fin de semana o festivos
                      se responden el siguiente día laborable.
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-card p-5 shadow-sm">
                    <h2 className="text-sm font-semibold">Atajos útiles</h2>
                    <ul className="mt-3 space-y-2">
                      <li>
                        <Link
                          href="/reportar-grupo"
                          className="group flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <span className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-primary" />
                            Reportar un grupo
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/agregar-grupo"
                          className="group flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <span className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-primary" />
                            Enviar tu grupo
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/guias"
                          className="group flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            Guías y tutoriales
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                </aside>
              </Reveal>

              {/* Form */}
              <Reveal delay={0.1}>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
