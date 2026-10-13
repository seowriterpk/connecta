import { SiteHeader } from "@/components/site/header";
import type { Metadata } from "next";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { Hero } from "@/components/site/hero";
import { ReadingProgress } from "@/components/site/reading-progress";
import { GroupsDirectoryTable } from "@/components/site/groups-directory-table";
import { CategoriesSection } from "@/components/site/categories-section";
import { CountriesSection } from "@/components/site/countries-section";
import { CitiesSection } from "@/components/site/cities-section";
import { GuidesSection } from "@/components/site/guides-section";
import { AboutSection } from "@/components/site/about-section";
import { MetricsSection } from "@/components/site/metrics-section";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { CtaBanner } from "@/components/site/cta-banner";
import { LongFormSection } from "@/components/site/long-form-section";
import { FaqSection } from "@/components/site/faq-section";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { ShortcutsHelp } from "@/components/site/shortcuts-help";
import { GPrefixShortcuts } from "@/components/site/g-prefix-shortcuts";
import { RecentlyViewed } from "@/components/site/recently-viewed";
import {
  getCategories,
  getCountries,
  getGroups,
  getStats,
  getPopularTags,
  getMetrics,
  getAllCities,
} from "@/lib/data";
import { getPublishedPostCards, getPublishedPostCount } from "@/lib/blog";
import { hreflangAlternates } from "@/lib/hreflang";
import { toCategoryLite, toCountryLite, toGroupCardDTO } from "@/lib/lite-dto";

export const dynamic = "force-dynamic";

// Metadata only (page body untouched). Count-first CTR title with the same
// honest getStats() numbers the hero renders — never inflated, never "+".
export async function generateMetadata(): Promise<Metadata> {
  const stats = await getStats();
  const title = `${stats.groups} Enlaces de Grupos de WhatsApp | Grupos Hoy`;
  const description = `Directorio en español con ${stats.groups} enlaces de grupos de WhatsApp: ${stats.categories} categorías y ${stats.countries} países. Filtra, compara y únete gratis. Sin registro.`;
  return {
    title: { absolute: title },
    description,
    // hreflang: self-referencing es + x-default (single-locale Spanish site).
    alternates: hreflangAlternates("/"),
    openGraph: {
      title,
      description,
      url: SITE.url,
      siteName: SITE.name,
      locale: "es_ES",
      type: "website",
      images: [OG_IMAGE],
    },
  };
}

export default async function HomePage() {
  const [categories, countries, stats, initialGroups, popularTags, metrics, cities, guidePosts, guideCount] = await Promise.all([
    getCategories(),
    getCountries(),
    getStats(),
    // "recientes" = the client store's default sort → the SSR list matches the
    // default filter view exactly, so the directory skips its initial re-fetch
    // (one fewer API round-trip + one fewer DB query per homepage view).
    getGroups({ sort: "recientes", limit: 30 }),
    getPopularTags(14),
    getMetrics(),
    getAllCities(),
    getPublishedPostCards(3),
    getPublishedPostCount(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <ReadingProgress />
      <SiteHeader />
      <main className="flex-1">
        {/* Hero section */}
        <Hero stats={stats} totalCountries={countries.length} />

        {/* Recently viewed strip (client, localStorage — hidden for first-time visitors) */}
        <RecentlyViewed />

        {/* Groups directory table (bulk directory style) — lite DTOs cross the
            client boundary: the flight payload ships only the fields the table
            renders, not the full group rows (≈40% less hydration data). */}
        <GroupsDirectoryTable
          groups={initialGroups.map(toGroupCardDTO)}
          categories={categories.map(toCategoryLite)}
          countries={countries.map(toCountryLite)}
          popularTags={popularTags}
        />

        {/* Category authority pages */}
        <CategoriesSection categories={categories.map(toCategoryLite)} />

        {/* Country authority pages */}
        <CountriesSection countries={countries.map(toCountryLite)} />

        {/* City pages */}
        {cities.length > 0 && <CitiesSection cities={cities} />}

        {/* Guías (merged blog + guías hub) — featured posts + link juice to /guias */}
        <GuidesSection posts={guidePosts} total={guideCount} />

        <AboutSection stats={stats} />
        <MetricsSection metrics={metrics} />
        <TestimonialsSection />
        <CtaBanner />
        <LongFormSection />
        <FaqSection />
      </main>
      <SiteFooter />
      <BackToTop />
      <ShortcutsHelp />
      <GPrefixShortcuts />
    </div>
  );
}
