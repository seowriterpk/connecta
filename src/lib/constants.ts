// ConectaGrupos — configuración del sitio (SEO + marca)
export const SITE = {
  name: "ConectaGrupos",
  tagline: "Tu directorio de grupos de WhatsApp en español",
  description:
    "ConectaGrupos reúne los mejores grupos de WhatsApp en español: por categoría, país e idioma. Descubre, comparte y únete a comunidades activas de toda Hispanoamérica y España.",
  url: "https://conectagrupos.com",
  locale: "es_ES",
  themeColor: "#16a34a", // emerald-600 (WhatsApp-inspired)
  primaryColor: "#0c8b5b",
  author: "Equipo ConectaGrupos",
  contactEmail: "hola@conectagrupos.com",
  twitter: "@conectagrupos",
} as const;

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
  { href: "/agregar-grupo", label: "Enviar grupo" },
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
    title: "Revisamos cada grupo",
    text: "Ningún enlace se publica sin pasar por moderación. Los que incumplen las normas, fuera.",
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
