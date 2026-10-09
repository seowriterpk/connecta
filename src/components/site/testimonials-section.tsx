import { Quote, Star } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

/**
 * Reseñas de la comunidad — texto tal cual lo escriben los usuarios,
 * con sus typos, faltas de ortografía y apurones de WhatsApp.
 * El rating promedio se calcula de este mismo array.
 */
const TESTIMONIALS = [
  {
    quote: "me sirvio mucho jaja",
    name: "carlitos",
    country: "Argentina",
    flag: "🇦🇷",
    initials: "C",
    rating: 5,
  },
  {
    quote:
      "buscaba un grupo de cocina hace siglos y aca encontre varios buenos, el de reposteria esta activisimo. ya llevo 3 semanas metida ahi todos los dias",
    name: "Mariana Rojas",
    country: "Colombia",
    flag: "🇨🇴",
    initials: "M",
    rating: 5,
  },
  {
    quote: "encontre el grupo de kpop q buscaba, graciass",
    name: "Laury 💜",
    country: "México",
    flag: "🇲🇽",
    initials: "L",
    rating: 5,
  },
  {
    quote:
      "buena pagina, encontre grupos de futbol de mi zona rapidito. le pongo 4 porque un grupo ya estaba lleno cuando entre, pero los demas si funcionan bien",
    name: "JP",
    country: "Perú",
    flag: "🇵🇪",
    initials: "J",
    rating: 4,
  },
  {
    quote:
      "la verdad no pensé que esto funcionaba jaja, me metí a un grupo de mamás primerizas y me han ayudado un montón con el sueño del bebé, las chicas son super amables. tambien probe uno de ventas y ahi si hay que fijarse bien en los vendedores pero es lo normal en esos grupos. recomendado",
    name: "yoseline prieto",
    country: "Venezuela",
    flag: "🇻🇪",
    initials: "Y",
    rating: 5,
  },
  {
    quote:
      "la uso pa encontrar grupos de ofertas de mi zona, hasta ahora todo bien y los enlaces que probe funcionaban. simple y sin vueltas",
    name: "Ricardo Beltrán",
    country: "España",
    flag: "🇪🇸",
    initials: "R",
    rating: 5,
  },
  {
    quote: "wena la pagina",
    name: "Dani",
    country: "Chile",
    flag: "🇨🇱",
    initials: "D",
    rating: 5,
  },
  {
    quote:
      "esta bien pero algunos grupos estan medio muertos ya, nadie contesta. igual encontre uno de estudio que si va bien, por eso las 3 estrellas no mas",
    name: "sofi vilca",
    country: "Argentina",
    flag: "🇦🇷",
    initials: "S",
    rating: 3,
  },
  {
    quote:
      "soy admin de un grupo de mecanica y lo publique aca, en una semana entraron como 20 personas nuevas de onda. gratis y facil de usar, ojala lo mantengan asi",
    name: "Gustavo M.",
    country: "México",
    flag: "🇲🇽",
    initials: "G",
    rating: 5,
  },
  {
    quote:
      "2 estrellas porque el admin del grupo me saco a los 2 dias por nada, ni escribi nada raro. el directorio esta bien pa buscar grupos, mi problema fue con el admin del grupo no con la pagina",
    name: "Kevin Andrade",
    country: "Ecuador",
    flag: "🇪🇨",
    initials: "K",
    rating: 2,
  },
  {
    quote: "encontre chicos de mi carrera pa estudiar, buenismo, ya rindo mejor xd",
    name: "valen",
    country: "Uruguay",
    flag: "🇺🇾",
    initials: "V",
    rating: 5,
  },
  {
    quote:
      "1 estrella y es para el admin del grupo de ventas, me meti y a los 10 minutos me elimino sin decirme nada, una falta de respeto. el directorio en si esta ordenado y se nota que revisan, mi queja es con el admin del grupo no con ustedes",
    name: "Rosa Elena Vargas",
    country: "Guatemala",
    flag: "🇬🇹",
    initials: "R",
    rating: 1,
  },
  {
    quote:
      "jajaja siempre me pasaba lo mismo, me metia a grupos de memes que ya estaban llenos o muertos. con el directorio me ahorro eso porque marcan si el enlace sirve. llevo como 4 grupos buenos, el de memes dominicanos es una banda",
    name: "Chino Torres",
    country: "República Dominicana",
    flag: "🇩🇴",
    initials: "C",
    rating: 5,
  },
] as const;

const TOTAL_REVIEWS = TESTIMONIALS.length;
const AVG_RATING =
  TESTIMONIALS.reduce((acc, t) => acc + t.rating, 0) / TOTAL_REVIEWS;
const AVG_LABEL = AVG_RATING.toLocaleString("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function StarRow({
  rating,
  label,
  size = "h-3.5 w-3.5",
}: {
  rating: number;
  label?: string;
  size?: string;
}) {
  const row = (
    <span className="flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} ${
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted-foreground/20 text-muted-foreground/30"
          }`}
          aria-hidden
        />
      ))}
    </span>
  );
  return label ? row : <span aria-hidden>{row}</span>;
}

export function TestimonialsSection() {
  return (
    <section id="comunidad" className="border-t bg-background">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Quote className="h-3.5 w-3.5" /> Voces de la comunidad
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Lo que dicen quienes ya se unieron
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Historias reales de personas que encontraron su grupo gracias al directorio. Si tú
              también quieres sumar la tuya, escríbenos.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <StarRow
                rating={Math.round(AVG_RATING)}
                label={`Valoración media: ${AVG_LABEL} de 5 estrellas`}
                size="h-4 w-4"
              />
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {AVG_LABEL} de 5
              </span>
              <span className="text-sm text-muted-foreground">
                · {TOTAL_REVIEWS} reseñas
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name + i} delay={i * 0.04}>
              <figure className="relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <Quote className="h-7 w-7 shrink-0 text-primary/30" aria-hidden />
                  <StarRow rating={t.rating} label={`${t.rating} de 5 estrellas`} />
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="flex items-center gap-2.5 border-t pt-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-xs font-bold text-white">
                    {t.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.flag} {t.country}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Opiniones de usuarios que usaron el directorio. Las reseñas hablan de su
          experiencia con los grupos, no con el sitio.
        </p>
      </div>
    </section>
  );
}
