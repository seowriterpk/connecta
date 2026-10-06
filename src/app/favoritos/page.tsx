import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { FavoritesClient } from "./favorites-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Mis favoritos — ${SITE.name}` },
  description:
    "Tu lista personal de grupos de WhatsApp guardados en ConectaGrupos. Consulta, comparte y únete a tus comunidades favoritas cuando quieras.",
  alternates: { canonical: `${SITE.url}/favoritos` },
  // Personal, localStorage-based page → keep out of search engines.
  robots: { index: false, follow: true },
};

export default function FavoritosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <FavoritesClient />
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  );
}
