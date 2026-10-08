import { FileText } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { SITE } from "@/lib/constants";
import { jsonLdScript } from "@/lib/jsonld";

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Sobre los grupos de WhatsApp",
  description:
    "Una guía honesta, sin tecnicismos, para entender cómo funcionan los grupos de WhatsApp y qué considerar antes de unirte o crear uno.",
  inLanguage: "es",
  author: { "@type": "Organization", name: SITE.name, url: SITE.url },
  publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  datePublished: "2025-01-15",
  dateModified: new Date().toISOString().slice(0, 10),
  mainEntityOfPage: `${SITE.url}/#sobre-whatsapp`,
};

export function LongFormSection() {
  return (
    <section id="sobre-whatsapp" className="border-t bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd) }}
      />
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Sobre los grupos de WhatsApp
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Una guía honesta, sin tecnicismos, para entender cómo funcionan los grupos de
              WhatsApp y qué considerar antes de unirte o crear uno.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <article className="prose prose-sm mt-6 max-w-none sm:prose-base">
              <h3 className="text-base font-semibold sm:text-lg">¿Qué es un grupo de WhatsApp?</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Un grupo de WhatsApp es una conversación compartida donde varias personas pueden
                enviarse mensajes, fotos, vídeos y documentos al mismo tiempo. A diferencia de una
                lista de difusión —donde solo el creador escribe—, en un grupo todos los miembros
                pueden participar. El límite actual es de 1024 integrantes por grupo, una cifra que
                WhatsApp amplió para dar cabida a comunidades más grandes.
              </p>

              <h3 className="mt-5 text-base font-semibold sm:text-lg">Por qué seguimos usándolos</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Aunque existen redes sociales y apps de mensajería más modernas, los grupos de
                WhatsApp siguen siendo la opción preferida de millones de hispanohablantes. La razón
                es simple: todo el mundo tiene WhatsApp. No hace falta instalar nada nuevo ni crear
                una cuenta en una plataforma desconocida. Entras, escribes, y listo.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Además, los grupos ofrecen algo que las redes sociales perdieron: intimidad. Lo que
                se comparte en un grupo se queda entre sus miembros. No hay algoritmo decidiendo qué
                se ve, ni anuncios midiendo tu atención. Es una conversación, ni más ni menos.
              </p>

              <h3 className="mt-5 text-base font-semibold sm:text-lg">Antes de unirte a un grupo</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span><strong className="text-foreground">Revisa la descripción.</strong> Un grupo bien gestionado explica de qué va antes de que entres. Si no hay descripción o es vaga, desconfía.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span><strong className="text-foreground">Mira el número de miembros.</strong> Más no es siempre mejor. Un grupo de 50 personas activas suele conversar mejor que uno de 500 donde nadie escribe.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span><strong className="text-foreground">Comprueba la categoría.</strong> Conecta con tus intereses reales. Unirte a un grupo que no te interesa solo genera ruido y notificaciones inútiles.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span><strong className="text-foreground">Silencia si hace falta.</strong> No pasa nada por poner un grupo en silencio y revisarlo cuando tengas tiempo. Tu tranquilidad vale más que la FOMO.</span>
                </li>
              </ul>

              <h3 className="mt-5 text-base font-semibold sm:text-lg">Señales de un buen grupo</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Un grupo de calidad suele tener: un mensaje de bienvenida con las normas, al menos un
                administrador activo, conversación que se mantiene en tema, y un ambiente respetuoso
                donde los nuevos son bienvenidos en lugar de ignorados. Si entras a un grupo y ves
                spam, peleas o contenido inapropiado, salir es tan fácil como pulsar «Salir del grupo».
                No le debes nada a nadie.
              </p>

              <h3 className="mt-5 text-base font-semibold sm:text-lg">Y si quieres crear el tuyo…</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Empieza pequeño. Invita a 5-10 personas que de verdad se interesen por el tema.
                Antes de ampliar, fija las normas en un mensaje fijado. Y cuando sientas que el grupo
                aporta valor, publícalo aquí, en ConectaGrupos, para que otras personas lo encuentren.
                El mejor directorio del mundo no sirve de nada sin grupos buenos —y los grupos buenos
                los crean personas como tú.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
