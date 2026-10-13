import { BookOpen, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";

/** Compact post DTO for the home Guías section (only the fields rendered). */
export interface GuideCardDTO {
  slug: string;
  title: string;
  excerpt: string;
  coverEmoji: string;
  readingMinutes: number;
}

/**
 * Guías section on the home — feeds internal links to the merged /guias
 * hub (blog + guías consolidated, Spanish term "Guías").
 * Server component: posts are passed from the page's data fetch.
 */
export function GuidesSection({ posts, total }: { posts: GuideCardDTO[]; total: number }) {
  if (posts.length === 0) return null;

  return (
    <section id="guias" className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <Reveal>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Guías de grupos de WhatsApp
                </h2>
                <p className="text-sm text-muted-foreground">
                  Aprende a unirte, crear y administrar grupos con seguridad. {total} guías en
                  español.
                </p>
              </div>
            </div>
            <Link
              href="/guias"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.05}>
              <Link
                href={`/guias/${p.slug}`}
                className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl"
                    aria-hidden
                  >
                    {p.coverEmoji}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-snug">{p.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {p.readingMinutes} min de lectura
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {p.excerpt}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-primary transition group-hover:translate-x-0.5">
                  Leer la guía <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-4 text-center sm:hidden">
            <Link
              href="/guias"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver las {total} guías
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
