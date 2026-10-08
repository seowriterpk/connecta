import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Users, Eye, BadgeCheck, Star, CalendarDays, MessageCircle, Flag,
  MapPin, Tag, ChevronRight, Share2, Globe2,
  Flame, Clock, Scale,
} from "lucide-react";
import { SITE, OG_IMAGE } from "@/lib/constants";
import { query, queryOne } from "@/lib/db";
import {
  getGroupBySlug,
  getRatingsBatch,
  getGroupActivity,
  incrementViews,
  touchGroupActivity,
  citySlug,
} from "@/lib/data";
import { getRelatedGroups } from "@/lib/related-groups";
import { GroupActivityCard } from "@/components/site/group-activity";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { GroupImage } from "@/components/site/group-image";
import { StarRating } from "@/components/site/star-rating";
import { ReportDialog } from "@/components/site/report-dialog";
import { ShareMenu } from "@/components/site/share-menu";
import { JoinButton, ClickCount } from "@/components/site/join-button";
import { ComparePillButton } from "@/components/site/compare-button";
import { FavoritePillButton } from "@/components/site/favorite-pill-button";
import { BackToTop } from "@/components/site/back-to-top";
import { GroupCard } from "@/components/site/group-card";
import { RecentTracker } from "@/components/site/recent-tracker";
import { jsonLdScript } from "@/lib/jsonld";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ReviewEntryRow {
  id: string;
  rating: number;
  createdAt: Date;
}

interface UploaderRow {
  id: string;
  name: string;
  slug: string;
  jobTitle: string;
  description: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  createdAt: Date;
  lastActiveAt: Date;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) return { title: "Grupo no encontrado" };

  // SERP-safe title: group name (trimmed to 48) + compact suffix ≈ ≤65 chars.
  const shortTitle = group.title.length > 48 ? group.title.slice(0, 45).trimEnd() + "…" : group.title;
  const title = `${shortTitle} — Grupo de WhatsApp | ${SITE.name}`;
  const ogTitle = group.title.length > 60 ? shortTitle : group.title;
  const description = group.description.slice(0, 160);
  const robots = group.isAdult
    ? "noindex, nofollow"
    : group.linkStatus === "revoked"
    ? "noindex, follow"
    : "index, follow";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITE.url}/grupo/${group.slug}` },
    robots,
    // RTA label on adult groups (industry-standard "Restricted To Adults").
    ...(group.isAdult ? { other: { rating: "RTA-5042-1996-1400-1577-1" } } : {}),
    openGraph: {
      title: ogTitle, description,
      url: `${SITE.url}/grupo/${group.slug}`,
      type: "website",
      locale: "es_ES",
      siteName: SITE.name,
      // Adult directive: no image alt text on adult groups.
      images: group.imageUrl
        ? [{ url: group.imageUrl, width: 120, height: 120, alt: group.isAdult ? "" : group.title }]
        : [OG_IMAGE],
    },
    twitter: {
      card: "summary",
      title, description,
      images: group.imageUrl ? [group.imageUrl] : ["/og.svg"],
    },
  };
}

export default async function GroupPage({ params }: PageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  incrementViews(group.id).catch(() => {});
  touchGroupActivity(group.id).catch(() => {});

  const [related, ratingsBatch, ratingEntries, activity] = await Promise.all([
    // Siloed linking: adult groups only see adult related, clean only clean.
    getRelatedGroups(group.id, group.category?.name ?? "", group.country?.name ?? "", 10, {
      isAdult: group.isAdult,
    }),
    getRatingsBatch([group.id]),
    query<ReviewEntryRow>(
      "SELECT `id`, `rating`, `createdAt` FROM `group_reviews` WHERE `groupId` = ? ORDER BY `createdAt` DESC LIMIT 10",
      [group.id]
    ),
    getGroupActivity(group.id),
  ]);
  const rating = ratingsBatch[group.id] ?? { avg: 0, count: 0 };
  const uploader = group.uploaderId
    ? await queryOne<UploaderRow>(
        "SELECT `id`, `name`, `slug`, `jobTitle`, `description`, `facebookUrl`, `twitterUrl`, `linkedinUrl`, `websiteUrl`, `imageUrl`, `createdAt`, `lastActiveAt` FROM `uploaders` WHERE `id` = ? LIMIT 1",
        [group.uploaderId]
      )
    : null;

  const isHot = group.clicks >= 50;
  const isActiveRecently = group.lastActiveAt
    ? Date.now() - new Date(group.lastActiveAt).getTime() < 7 * 86400000
    : false;

  // JSON-LD @graph (like competitor)
  // ADULT DIRECTIVE: adult groups emit NO structured data of any type.
  const jsonLd = group.isAdult ? null : {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/grupo/${group.slug}`,
        url: `${SITE.url}/grupo/${group.slug}`,
        name: group.title,
        description: group.description.slice(0, 160),
        inLanguage: "es",
        datePublished: group.createdAt,
        dateModified: group.lastActiveAt ?? group.createdAt,
        author: uploader ? { "@id": `${SITE.url}/autor/${uploader.slug}#person` } : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Grupos", item: `${SITE.url}/` },
          ...(group.category ? [{ "@type": "ListItem", position: 3, name: group.category.name, item: `${SITE.url}/categoria/${group.category.slug}` }] : []),
          { "@type": "ListItem", position: group.category ? 4 : 3, name: group.title, item: `${SITE.url}/grupo/${group.slug}` },
        ],
      },
      ...(rating.count > 0 ? [{
        "@type": "AggregateRating",
        ratingValue: rating.avg,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      }] : []),
      ...(uploader ? [{
        "@type": "Person",
        "@id": `${SITE.url}/autor/${uploader.slug}#person`,
        name: uploader.name,
        url: `${SITE.url}/autor/${uploader.slug}`,
        jobTitle: uploader.jobTitle,
        description: uploader.description ?? "",
        image: uploader.imageUrl ?? undefined,
        sameAs: [
          uploader.facebookUrl, uploader.twitterUrl, uploader.linkedinUrl, uploader.websiteUrl,
        ].filter(Boolean),
      }] : []),
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      )}
      <RecentTracker group={group} />
      <SiteHeader />

      {/* Breadcrumb — single line, truncated on mobile */}
      <nav aria-label="Migas de pan" className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <ol className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden whitespace-nowrap">
            <li className="shrink-0"><Link href="/" className="hover:text-primary">Inicio</Link></li>
            <li className="shrink-0"><ChevronRight className="h-3 w-3" /></li>
            {group.category && (
              <li className="shrink-0"><Link href={`/categoria/${group.category.slug}`} className="hover:text-primary">{group.category.name}</Link></li>
            )}
            <li className="shrink-0"><ChevronRight className="h-3 w-3" /></li>
            <li className="truncate font-medium text-foreground">{group.title}</li>
          </ol>
        </div>
      </nav>

      <main className="flex-1">
        {/* === GROUP HEADER === */}
        <section className="border-b bg-background">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <GroupImage src={group.imageUrl} alt={group.isAdult ? "" : group.title} title={group.isAdult ? undefined : group.title} size={64} className="rounded-xl" fallbackEmoji={group.category?.icon} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  {group.isAdult && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      18+
                    </span>
                  )}
                  {group.isVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <BadgeCheck className="h-3 w-3" /> Verificado
                    </span>
                  )}
                  {isHot && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                      <Flame className="h-3 w-3" /> Popular
                    </span>
                  )}
                  {isActiveRecently && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-lg font-bold leading-tight sm:text-xl">{group.title}</h1>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {group.country && (<Link href={`/pais/${group.country.code}`} className="hover:text-primary">{group.country.flag} {group.country.name}</Link>)}
                  {group.city && (<span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {group.city}</span>)}
                  {group.category && (<span>· <Link href={`/categoria/${group.category.slug}`} className="hover:text-primary">{group.category.name}</Link></span>)}
                </div>
              </div>
            </div>
            {/* Quick stats — compact single row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3 text-primary" /> {group.members.toLocaleString("es-ES")}</span>
              <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3 text-primary" /> {group.views.toLocaleString("es-ES")}</span>
              {group.clicks > 0 && <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3 text-primary" /> {group.clicks}</span>}
              {rating.count > 0 && <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating.avg.toFixed(1)}</span>}
            </div>
          </div>
        </section>

        {/* === JOIN SECTION (sticky, compact) === */}
        <section className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex-1"><JoinButton group={group} /></div>
              <FavoritePillButton id={group.id} />
              <ComparePillButton slug={group.slug} title={group.title} />
              <ShareMenu group={group} />
            </div>
          </div>
        </section>

        {/* === MAIN CONTENT === */}
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <article className="min-w-0">
              {/* Description */}
              <section>
                <h2 className="mb-1.5 text-sm font-semibold text-muted-foreground">Sobre este grupo</h2>
                <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-foreground/90 sm:text-base">{group.description}</p>
              </section>

              {/* Tags */}
              {group.tags.length > 0 && (
                <section className="mt-5">
                  <h2 className="mb-1.5 text-sm font-semibold text-muted-foreground">Etiquetas</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.map((t) => (<span key={t} className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs"><Tag className="h-3 w-3" /> {t}</span>))}
                  </div>
                </section>
              )}

              {/* Rating */}
              <section className="mt-5 flex items-center gap-3">
                {rating.count > 0 ? (
                  <>
                    <span className="text-lg font-bold tabular-nums">{rating.avg.toFixed(1)}</span>
                    <StarRating groupId={group.id} />
                    <span className="text-xs text-muted-foreground">({rating.count})</span>
                  </>
                ) : (
                  <StarRating groupId={group.id} />
                )}
              </section>

              {/* Review history toggle */}
              {ratingEntries.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-primary">
                    Ver historial ({ratingEntries.length})
                  </summary>
                  <div className="mt-1.5 space-y-1">
                    {ratingEntries.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 text-xs">
                        <span className="flex">
                          {[1,2,3,4,5].map((i) => (<Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />))}
                        </span>
                        <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Report group — moved below rating */}
              <section className="mt-5 border-t pt-4">
                <ReportDialog group={group} trigger={
                  <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
                    <Flag className="h-3.5 w-3.5" /> Reportar grupo
                  </button>
                } />
              </section>

              {/* === RELATED GROUPS (BELOW join button) === */}
              {related.length > 0 && (
                <section className="mt-10 rounded-3xl border bg-gradient-to-b from-muted/40 to-transparent p-4 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-bold">
                        <Users className="h-5 w-5 text-primary" aria-hidden /> Grupos similares
                      </h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Otras comunidades que podrían interesarte ({related.length} {related.length === 1 ? "grupo" : "grupos"})
                      </p>
                    </div>
                    <Link
                      href="/comparar"
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                    >
                      <Scale className="h-3.5 w-3.5" aria-hidden /> Comparar grupos
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {related.map((r) => (<GroupCard key={r.id} group={r} rating={ratingsBatch[r.id]} />))}
                  </div>
                </section>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
              {/* 14-day activity trend (server sparkline) */}
              <GroupActivityCard activity={activity} slug={group.slug} />

              {/* Uploader / Author snippet (E-E-A-T) */}
              {uploader && (
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold">Publicado por</h3>
                  <Link href={`/autor/${uploader.slug}`} className="flex items-center gap-3">
                    {uploader.imageUrl && <img src={uploader.imageUrl} alt={uploader.name} className="h-12 w-12 rounded-full object-cover" loading="lazy" />}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{uploader.name}</div>
                      <div className="text-xs text-muted-foreground">{uploader.jobTitle}</div>
                    </div>
                  </Link>
                  {uploader.description && <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{uploader.description}</p>}
                  <Link href={`/autor/${uploader.slug}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Ver perfil <ChevronRight className="h-3 w-3" /></Link>
                </div>
              )}

              {/* Info card */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold">Información</h3>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-4 w-4" /> Publicado</dt>
                    <dd className="font-medium">{new Date(group.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</dd>
                  </div>
                  {group.city && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" /> Ciudad</dt>
                      <dd className="font-medium">{group.city}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" /> Miembros</dt>
                    <dd className="font-medium">{group.members.toLocaleString("es-ES")}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><Eye className="h-4 w-4" /> Visitas</dt>
                    <dd className="font-medium">{group.views.toLocaleString("es-ES")}</dd>
                  </div>
                  {group.lastActiveAt && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4" /> Última actividad</dt>
                      <dd className="font-medium">{new Date(group.lastActiveAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Internal linking — SILOED: adult groups only cross-link to
                  adult content (category); country/city links are clean-only. */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold">Explora más</h3>
                <div className="space-y-2">
                  {group.category && (
                    <Link href={`/categoria/${group.category.slug}`} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm transition hover:bg-accent">
                      <span className="flex items-center gap-2"><span className="text-lg">{group.category.icon}</span><span>{group.category.name}</span></span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )}
                  {!group.isAdult && group.country && (
                    <Link href={`/pais/${group.country.code}`} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm transition hover:bg-accent">
                      <span className="flex items-center gap-2"><Globe2 className="h-4 w-4" /><span>{group.country.flag} {group.country.name}</span></span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )}
                  {!group.isAdult && group.city && (
                    <Link href={`/ciudad/${citySlug(group.city)}`} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm transition hover:bg-accent">
                      <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{group.city}</span></span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )}
                  <Link href="/agregar-grupo" className="flex items-center justify-between rounded-lg border bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10">
                    <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /><span>Publica tu grupo</span></span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
