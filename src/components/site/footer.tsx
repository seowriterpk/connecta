import Link from "next/link";
import {
  MessageCircle,
  Mail,
  ShieldCheck,
  Heart,
  Send,
  Flag,
  Compass,
  Building2,
  Search,
  Users,
  MapPin,
  BookOpen,
  Info,
  Lock,
  ScrollText,
  Cookie,
  UserRound,
  Flame,
  Scale,
  Rss,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { NewsletterSection } from "@/components/site/newsletter-section";

const EXPLORE_LINKS = [
  { href: "/populares", label: "Grupos populares", icon: Flame },
  { href: "/comparar", label: "Comparar grupos", icon: Scale },
  { href: "/categorias", label: "Categorías", icon: Compass },
  { href: "/paises", label: "Países", icon: MapPin },
  { href: "/ciudades", label: "Ciudades", icon: Building2 },
  { href: "/", label: "Grupos", icon: Users },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/favoritos", label: "Mis favoritos", icon: Heart },
] as const;

const COMPANY_LINKS = [
  { href: "/sobre-nosotros", label: "Sobre nosotros", icon: Info },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/autores", label: "Autores", icon: UserRound },
  { href: "/contacto", label: "Contacto", icon: Mail },
  { href: "/guias", label: "Guías", icon: BookOpen },
  { href: "/reportar-grupo", label: "Reportar un grupo", icon: Flag },
  { href: "/agregar-grupo", label: "Enviar grupo", icon: Send },
  { href: "/rss", label: "Feed RSS", icon: Rss },
] as const;

const LEGAL_LINKS = [
  { href: "/politica-de-privacidad", label: "Política de privacidad", icon: Lock },
  { href: "/terminos", label: "Términos de uso", icon: ScrollText },
  { href: "/politica-de-cookies", label: "Política de cookies", icon: Cookie },
] as const;

const SOCIALS = [
  {
    href: "https://wa.me/?text=Descubre%20grupos%20de%20WhatsApp%20en%20espa%C3%B1ol%3A%20https%3A%2F%2Fconectagrupos.com",
    label: "Compartir en WhatsApp",
    icon: MessageCircle,
    external: true,
  },
  {
    href: `mailto:${SITE.contactEmail}`,
    label: "Correo electrónico",
    icon: Mail,
    external: false,
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background">
      {/* Newsletter band */}
      <div className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <h2 className="text-base font-bold sm:text-lg">
                Recibe los mejores grupos en tu correo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Una vez por semana, una selección de grupos nuevos y destacados. Sin spam y
                cancelas cuando quieras.
              </p>
            </div>
            <div className="w-full max-w-md">
              <NewsletterSection source="footer" />
            </div>
          </div>
        </div>
      </div>

      {/* Main footer columns */}
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-bold" suppressHydrationWarning>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="text-lg text-primary" suppressHydrationWarning>{"ConectaGrupos"}</span>
            </Link>
            <p className="mt-3 max-w-xs text-pretty text-sm text-muted-foreground">
              {SITE.tagline}. Sin registros, sin coste: llegas, buscas y te unes.
            </p>

            {/* Social icons */}
            <div className="mt-4 flex items-center gap-2">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                if (s.external) {
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="grid h-9 w-9 place-items-center rounded-lg border bg-card text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                }
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    title={s.label}
                    className="grid h-9 w-9 place-items-center rounded-lg border bg-card text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Sin coste · Sin registro
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                🌎 20 países hispanos
              </span>
            </div>
          </div>

          {/* Column 2: Explora */}
          <div>
            <h3 className="text-sm font-semibold">Explora</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {EXPLORE_LINKS.map((l) => {
                const Icon = l.icon;
                return (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground/70 transition group-hover:text-primary" />
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: Empresa */}
          <div>
            <h3 className="text-sm font-semibold">Empresa</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {COMPANY_LINKS.map((l) => {
                const Icon = l.icon;
                return (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground/70 transition group-hover:text-primary" />
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {LEGAL_LINKS.map((l) => {
                const Icon = l.icon;
                return (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground/70 transition group-hover:text-primary" />
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Direct email line (for clarity / accessibility) */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6 text-sm">
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="inline-flex items-center gap-2 font-medium text-muted-foreground hover:text-primary"
          >
            <Mail className="h-4 w-4 text-primary" />
            {SITE.contactEmail}
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
            <p>
              © {year} {SITE.name}. Hecho con{" "}
              <Heart className="inline h-3 w-3 fill-current text-rose-500" /> para la comunidad
              hispanohablante.
            </p>
            <p className="max-w-md">
              Los enlaces redirigen a WhatsApp, que es marca de Meta. No estamos afiliados a
              WhatsApp Inc.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
