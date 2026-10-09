import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck, ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import { SITE } from "@/lib/constants";
import { getGroupBySlug, getRatingsBatch } from "@/lib/data";
import { getRecentRelatedGroups } from "@/lib/related-groups";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { GroupImage } from "@/components/site/group-image";
import { CountryFlag } from "@/components/site/country-flag";
import { GroupCard } from "@/components/site/group-card";
import { BackToTop } from "@/components/site/back-to-top";
import { VerifyClient } from "@/components/site/verify-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) return { title: "Grupo no encontrado" };
  return {
    title: { absolute: `Verificar — ${group.title} | ${SITE.name}` },
    description: "Verificación del enlace de invitación antes de unirte al grupo de WhatsApp.",
    robots: "noindex, follow",
    alternates: { canonical: `${SITE.url}/verificar/${group.slug}` },
  };
}

export default async function VerifyPage({ params }: PageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  const [related, ratingsBatch] = await Promise.all([
    // Most recent groups in the same category (siloed by adult flag).
    getRecentRelatedGroups(group.id, group.category?.id, group.isAdult, 9),
    getRatingsBatch([group.id]),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Inicio</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li><Link href={`/grupo/${group.slug}`} className="hover:text-primary">{group.title}</Link></li>
              <li><ChevronRight className="h-3 w-3" /></li>
              <li className="font-medium text-foreground">Verificar</li>
            </ol>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-lg">
            {/* Verification card */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-col items-center text-center">
                <GroupImage src={group.imageUrl} alt={group.title} title={group.title} size={80} className="rounded-2xl" fallbackEmoji={group.category?.icon} />
                <h1 className="mt-4 text-xl font-bold sm:text-2xl">{group.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.country && (<><CountryFlag code={group.country.code} name={group.country.name} /> {group.country.name}</>)}{group.city ? ` · ${group.city}` : ""}
                </p>
              </div>

              {/* Progress + checks (client component) */}
              <VerifyClient group={group} />

              {/* Info box */}
              <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" /> ¿Qué hace esta página?
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Antes de redirigirte a WhatsApp, verificamos que el enlace del grupo siga activo.
                  Esta comprobación protege a los usuarios de enlaces caducados o revocados.
                  El botón de unión se habilita cuando se completa la verificación.
                </p>
              </div>
            </div>
          </div>

          {/* Related groups — newest in the same category */}
          {related.length > 0 && (
            <section className="mx-auto mt-12 max-w-5xl">
              <h2 className="mb-4 text-lg font-bold">Grupos nuevos de la misma categoría</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <GroupCard key={r.id} group={r} rating={ratingsBatch[r.id]} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
