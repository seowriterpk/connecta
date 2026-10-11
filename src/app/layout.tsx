import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cache } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/site/theme-provider";
import { CommandPalette } from "@/components/site/command-palette";
import { CookieConsent } from "@/components/site/cookie-consent";
import { CompareBar } from "@/components/site/compare-bar";
import { TranslationFix } from "@/components/site/translation-fix";
import { getCategories, getCountries, getGroups } from "@/lib/data";
import { toCategoryLite, toCountryLite, toGroupCardDTO } from "@/lib/lite-dto";
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

// Nota: sin SearchAction a propósito — las URLs de búsqueda (/buscar?q=…) son
// noindex desde 3-c y la home no implementa ?q=; anunciar un objetivo de
// búsqueda invitaría a los crawlers a un espacio de query-strings que no existe.
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "es",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  email: SITE.contactEmail,
  founder: {
    "@type": "Person",
    name: "Antonio C.",
    jobTitle: "Freelancer",
    address: { "@type": "PostalAddress", addressCountry: "ES" },
    url: "https://www.linkedin.com/in/antonio-campello-372962b8",
  },
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
            categories={categories.map(toCategoryLite)}
            countries={countries.map(toCountryLite)}
            groups={paletteGroups.map(toGroupCardDTO)}
          />
          <CookieConsent />
          <CompareBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
