import { SiteHeader } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { ReadingProgress } from "@/components/site/reading-progress";
import { GroupsDirectoryTable } from "@/components/site/groups-directory-table";
import { CategoriesSection } from "@/components/site/categories-section";
import { CountriesSection } from "@/components/site/countries-section";
import { CitiesSection } from "@/components/site/cities-section";
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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, countries, stats, initialGroups, popularTags, metrics, cities] = await Promise.all([
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

        {/* Groups directory table (bulk directory style) */}
        <GroupsDirectoryTable
          groups={initialGroups}
          categories={categories}
          countries={countries}
          popularTags={popularTags}
        />

        {/* Category authority pages */}
        <CategoriesSection categories={categories} />

        {/* Country authority pages */}
        <CountriesSection countries={countries} />

        {/* City pages */}
        {cities.length > 0 && <CitiesSection cities={cities} />}

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
