import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cache } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/site/theme-provider";
import { CommandPalette } from "@/components/site/command-palette";
import { CookieConsent } from "@/components/site/cookie-consent";
import { TranslationFix } from "@/components/site/translation-fix";
import { getCategories, getCountries, getGroups } from "@/lib/data";
import { SITE } from "@/lib/constants";
import { jsonLdScript } from "@/lib/jsonld";

// Per-request dedupe: the homepage fetches the same lists for its own sections.
const getCategoriesCached = cache(getCategories);
const getCountriesCached = cache(getCountries);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "grupos de WhatsApp",
    "grupos de WhatsApp en español",
    "grupos WhatsApp España",
    "grupos WhatsApp México",
    "grupos WhatsApp Argentina",
    "grupos WhatsApp Colombia",
    "grupos WhatsApp Perú",
    "unirse a grupo de WhatsApp",
    "enlaces de grupos de WhatsApp",
    "directorios de grupos",
    "comunidades hispanohablantes",
    "grupos por país",
    "grupos por categoría",
  ],
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  publisher: SITE.author,
  category: "Comunidades y redes sociales",
  alternates: {
    canonical: SITE.url,
    languages: { "es-ES": SITE.url, "es-419": SITE.url },
    // RSS autodiscovery — browsers/readers/crawlers find the feed from any page.
    types: {
      "application/rss+xml": [{ url: "/rss", title: `${SITE.name} — RSS` }],
    },
  },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    creator: SITE.twitter,
    images: ["/og.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué es ConectaGrupos y para qué sirve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ConectaGrupos es un directorio en español que reúne enlaces de invitación a grupos de WhatsApp, organizizados por categoría y país. Permite encontrar comunidades activas según tus intereses y publicar tu propio grupo.",
      },
    },
    {
      "@type": "Question",
      name: "¿Unirse a un grupo de WhatsApp es gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. WhatsApp no cobra por unirse a grupos y ConectaGrupos tampoco. Si algún administrador exige dinero a cambio de acceso, debe reportarse.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo publico mi propio grupo de WhatsApp?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pulsa «Enviar un grupo», rellena el formulario con nombre, descripción, enlace de invitación, categoría y país. El envío queda pendiente de revisión y se publica si cumple las normas.",
      },
    },
    {
      "@type": "Question",
      name: "¿En qué países están disponibles los grupos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cubrimos 20 países de habla hispana: España, México, Argentina, Colombia, Perú, Chile, Venezuela, Ecuador, Guatemala, Cuba, Bolivia, República Dominicana, Honduras, Paraguay, El Salvador, Nicaragua, Costa Rica, Panamá, Uruguay y Puerto Rico.",
      },
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "es",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  email: SITE.contactEmail,
  sameAs: [],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Command palette data — mounted globally so ⌘K works on every public route.
  const [categories, countries, paletteGroups] = await Promise.all([
    getCategoriesCached(),
    getCountriesCached(),
    getGroups({ sort: "populares", limit: 8 }),
  ]);

  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* No-flash theme script: applies stored/system theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cg-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Google-Translate crash guard — must mount before any interactive tree */}
        <TranslationFix />
        <ThemeProvider>
          {children}
          <Toaster />
          <CommandPalette
            categories={categories}
            countries={countries}
            groups={paletteGroups}
          />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
