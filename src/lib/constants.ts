// Grupos Hoy — configuración del sitio (SEO + marca)
export const SITE = {
  name: "Grupos Hoy",
  tagline: "Tu directorio de grupos de WhatsApp en español",
  description:
    "Grupos Hoy reúne los mejores grupos de WhatsApp en español: por categoría, país e idioma. Descubre y únete a comunidades activas de Hispanoamérica y España.",
  url: "https://gruposhoy.com",
  locale: "es_ES",
  themeColor: "#16a34a", // emerald-600 (WhatsApp-inspired)
  primaryColor: "#0c8b5b",
  author: "Equipo Grupos Hoy",
  contactEmail: "hola@gruposhoy.com",
  twitter: "@gruposhoy",
} as const;

/**
 * GLOBAL URL POLICY (owner, 2026-10): the site is https://gruposhoy.com —
 * NON-WWW, HTTPS only. The www host 301s to the apex (next.config.mjs) and
 * every generated URL (sitemaps, RSS, canonicals, JSON-LD) must be apex.
 * This normalizer is the defense-in-depth layer: even if BASE_URL is
 * accidentally set to "https://www.gruposhoy.com" (or http://, or with a
 * trailing slash) in some environment, every URL built through it still
 * comes out as the clean apex origin.
 */
export function canonicalBaseUrl(raw: string | undefined | null): string {
  if (!raw) return SITE.url;
  let url = raw.trim();
  // Force HTTPS (the apex serves HSTS-grade URLs everywhere).
  url = url.replace(/^http:\/\//i, "https://");
  // Strip a leading www. host — apex is the canonical host, always.
  url = url.replace(/^(https:\/\/)www\./i, "$1");
  // No trailing slash — callers always append "/path".
  url = url.replace(/\/+$/, "");
  return url || SITE.url;
}

/**
 * Default OpenGraph/Twitter social card (1200×630). Every page that overrides
 * `openGraph` must include this — Next.js replaces the whole object (no
 * deep-merge with the root layout), otherwise social shares lose the image.
 */
export const OG_IMAGE = {
  url: "/og.svg",
  width: 1200,
  height: 630,
  alt: `${SITE.name} — ${SITE.tagline}`,
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/populares", label: "Populares" },
  { href: "/categorias", label: "Categorías" },
  { href: "/paises", label: "Países" },
  { href: "/buscar", label: "Buscar" },
  { href: "/sobre-nosotros", label: "Acerca" },
  { href: "/guias", label: "Guías" },
] as const;

export const REGIONS = [
  "América del Sur",
  "América Central",
  "América del Norte",
  "Caribe",
  "Europa",
] as const;

export const SORT_OPTIONS = [
  { value: "recientes", label: "Más recientes" },
  { value: "populares", label: "Más populares" },
  { value: "miembros", label: "Más miembros" },
  { value: "destacados", label: "Destacados" },
] as const;

export const REPORT_REASONS = [
  { value: "spam", label: "Es spam o publicidad" },
  { value: "enlace_roto", label: "El enlace no funciona" },
  { value: "contenido_inapropiado", label: "Contenido inapropiado u ofensivo" },
  { value: "estafa", label: "Parece una estafa" },
  { value: "suplantacion", label: "Suplantación de identidad" },
  { value: "otro", label: "Otro motivo" },
] as const;

export const TRUST_POINTS = [
  {
    icon: "ShieldCheck",
    title: "Publicación con revisión",
    text: "Los grupos que envía la comunidad pasan por revisión antes de publicarse, y un comprobador automático marca los enlaces caducados para que lo veas.",
  },
  {
    icon: "Globe2",
    title: "20 países hispanos",
    text: "Filtramos por región y país para que encuentres gente que comparte tu hora y tu cultura.",
  },
  {
    icon: "Zap",
    title: "Sin registros, sin coste",
    text: "No te pedimos cuenta ni tarjeta. Llegas, buscas y te unes. Así de simple.",
  },
  {
    icon: "Heart",
    title: "Hecho por la comunidad",
    text: "Los grupos los aportan personas reales. Tú también puedes publicar el tuyo en dos minutos.",
  },
] as const;
