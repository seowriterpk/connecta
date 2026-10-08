import { Quote } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

const TESTIMONIALS = [
  {
    quote:
      "Llevaba semanas buscando un grupo de running en Santiago que no fuera un caos. Aquí lo encontré en dos clics y ya tengo con quién salir a correr los sábados.",
    name: "Javiera",
    role: "Running Chile",
    flag: "🇨🇱",
    initials: "J",
  },
  {
    quote:
      "Publiqué mi grupo de programadores y al día siguiente ya tenía 30 personas nuevas. Lo mejor: gente que de verdad aporta, no solo lurkers.",
    name: "Sebastián",
    role: "Programadores Latam",
    flag: "🇨🇴",
    initials: "S",
  },
  {
    quote:
      "Lo que más me gustó fue el filtro por país. Encontré un grupo de cocina venezolana con gente de mi zona horaria y se siente como estar en casa.",
    name: "María",
    role: "Cocina Casera Venezuela",
    flag: "🇻🇪",
    initials: "M",
  },
  {
    quote:
      "El directorio está ordenado, sin spam. Se nota que revisan los grupos antes de publicarlos. Eso hoy en día vale oro.",
    name: "Diego",
    role: "Mexico Lindo — CDMX",
    flag: "🇲🇽",
    initials: "D",
  },
  {
    quote:
      "Usé la búsqueda rápida con ⌘K y encontré justo el grupo de inglés que necesitaba. Práctica conversacional con nativos, justo lo que buscaba.",
    name: "Elena",
    role: "Practica Inglés",
    flag: "🇸🇻",
    initials: "E",
  },
  {
    quote:
      "Como administrador de un grupo grande, tener un sitio donde publicarlo sin complicaciones me ahorra un montón de tiempo. Y sin pagar nada.",
    name: "Patricia",
    role: "Compra-Venta CDMX",
    flag: "🇲🇽",
    initials: "P",
  },
];

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
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <figure className="relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md">
                <Quote className="h-7 w-7 shrink-0 text-primary/30" aria-hidden />
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
                      {t.flag} {t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Testimonios representativos de la comunidad ConectaGrupos. Compartidos con permiso.
        </p>
      </div>
    </section>
  );
}
