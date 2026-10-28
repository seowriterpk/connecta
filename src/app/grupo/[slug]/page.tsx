import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Users, Eye, BadgeCheck, CalendarDays, MessageCircle, Flag,
  MapPin, Tag, ChevronRight, Globe2, MousePointerClick,
  Scale, Link2Off,
} from "lucide-react";
import { SITE } from "@/lib/constants";
import { queryOne, getGroupFeedbackCounts, type Row } from "@/lib/db";
import {
  getGroupBySlug,
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
import { ReportDialog } from "@/components/site/report-dialog";
import { ShareMenu } from "@/components/site/share-menu";
import { JoinButton, ClickCount } from "@/components/site/join-button";
import { ComparePillButton } from "@/components/site/compare-button";
import { FavoritePillButton } from "@/components/site/favorite-pill-button";
import { BackToTop } from "@/components/site/back-to-top";
import { GroupCard } from "@/components/site/group-card";
import { toGroupCardDTO } from "@/lib/lite-dto";
import { GroupFeedback } from "@/components/site/group-feedback";
import { RecentTracker } from "@/components/site/recent-tracker";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
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

  const title = `${group.title} — Grupo de WhatsApp | Grupos Hoy`;
  const description = group.description.slice(0, 160);
  // NEVER-NOINDEX DIRECTIVE (owner, 2026-10-28): no group page is ever
  // noindexed — not adult, not expired/revoked links. Every group URL stays
  // in the index (index, follow); expired links only sink in ranking.
  const robots = "index, follow";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITE.url}/grupo/${group.slug}` },
    robots,
    openGraph: {
      title, description,
      url: `${SITE.url}/grupo/${group.slug}`,
      type: "website",
      locale: "es_ES",
      siteName: SITE.name,
      // Adult directive: no image alt text on adult groups.
      images: group.imageUrl ? [{ url: group.imageUrl, width: 120, height: 120, alt: group.isAdult ? "" : group.title }] : undefined,
    },
    twitter: {
      card: "summary",
      title, description,
      images: group.imageUrl ? [group.imageUrl] : undefined,
    },
  };
}

export default async function GroupPage({ params }: PageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  // Honest fallback — some groups never wrote a description.
  const description =
    group.description && group.description.trim().length > 0
      ? group.description
      : "Este grupo todavía no ha añadido una descripción. Entra, échale un vistazo y decide si te queda.";

  incrementViews(group.id).catch(() => {});
  touchGroupActivity(group.id).catch(() => {});

  const [related, activity, feedback] = await Promise.all([
    // STRICT same-category related groups (owner directive: never mix
    // categories — no more "friendship" groups under an education group).
    // Single indexed query, active links sorted first.
    getRelatedGroups(group.id, group.category?.id ?? "", 8, {
      isAdult: group.isAdult,
    }),
    getGroupActivity(group.id),
    // Like/dislike initial counts — one honest recount query (zeros at start).
    getGroupFeedbackCounts(group.id),
  ]);
  const uploader = group.uploaderId
    ? await queryOne<UploaderRow>(
        "SELECT `id`, `name`, `slug`, `jobTitle`, `description`, `facebookUrl`, `twitterUrl`, `linkedinUrl`, `websiteUrl`, `imageUrl`, `createdAt`, `lastActiveAt` FROM `uploaders` WHERE `id` = ? LIMIT 1",
        [group.uploaderId]
      )
    : null;

  // Honesty directive (owner, 2026-10-21): no fabricated status chips —
  // "Popular" (seeded clicks) and "Activo" (seeded lastActiveAt) read as
  // fake claims while demo data sits in the directory. Only proven states
  // render: Verificado (real link check), Enlace caducado (real checker
  // verdict) and 18+.

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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <RecentTracker group={group} />
      <SiteHeader />

      {/* Breadcrumb — single line, truncated on mobile */}
      <nav aria-label="Migas de pan" className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-1.5 sm:py-2">
          <ol className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-[11px] text-muted-foreground sm:text-xs">
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
        {/* === GROUP HEADER — title first, clean chip system === */}
        <section className="border-b bg-background">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <GroupImage src={group.imageUrl} alt={group.isAdult ? "" : group.title} title={group.isAdult ? undefined : group.title} size={64} className="shrink-0 rounded-2xl" fallbackEmoji={group.category?.icon} />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold leading-snug tracking-tight sm:text-xl">{group.title}</h1>

                {/* Trust/status row — colored pills, right under the title */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {group.isVerified && (
                    <Link
                      href="/sobre-nosotros#verificado"
                      title="Enlace comprobado automáticamente y activo en la última revisión"
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/25 dark:text-emerald-300"
                    >
                      <BadgeCheck className="h-3 w-3" aria-hidden /> Verificado
                    </Link>
                  )}
                  {group.linkStatus === "revoked" && (
                    <span
                      title="El enlace de invitación parece caducado — verifícalo antes de unirte"
                      aria-label="El enlace de invitación parece caducado — verifícalo antes de unirte"
                      className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
                    >
                      <Link2Off className="h-3 w-3" aria-hidden /> Enlace caducado
                    </span>
                  )}
                  {group.isAdult && (
                    <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      18+
                    </span>
                  )}
                </div>

                {/* Classification chips — country / category / city,
                    one consistent pill system (the old «· Amistad» plain-text
                    line wrapped awkwardly and looked accidental). */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {group.country && (
                    <Link href={`/pais/${group.country.code}`} className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                      <span aria-hidden className="text-xs leading-none">{group.country.flag}</span>
                      {group.country.name}
                    </Link>
                  )}
                  {group.category && (
                    <Link href={`/categoria/${group.category.slug}`} className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                      {group.category.icon && <span aria-hidden className="text-xs leading-none">{group.category.icon}</span>}
                      {group.category.name}
                    </Link>
                  )}
                  {group.city && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden /> {group.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Quick stats — honest counters; zero values stay hidden.
                "Miembros" removed (owner directive): it was an estimate built
                from clicks and demo seeds made it look fabricated. */}
            {(group.views > 0 || group.clicks > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
                {group.views > 0 && (
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3 text-primary" aria-hidden /> {group.views.toLocaleString("es-ES")} visitas</span>
                )}
                {group.clicks > 0 && (
                  <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3 w-3 text-primary" aria-hidden /> {group.clicks.toLocaleString("es-ES")} clics</span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* === JOIN SECTION (sticky, compact) — Join leads the row,
            side actions are 44px icon pills, share opens a dropdown === */}
        <section className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1"><JoinButton group={group} /></div>
              <FavoritePillButton id={group.id} />
              <ComparePillButton slug={group.slug} title={group.title} />
              <ShareMenu group={group} iconOnly />
            </div>
          </div>
        </section>

        {/* === MAIN CONTENT === */}
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <article className="min-w-0">
              {/* Description */}
              <section>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">Sobre este grupo</h2>
                <p className="mt-2 whitespace-pre-line text-pretty text-[15px] leading-relaxed text-foreground/90 sm:text-base">{description}</p>
              </section>

              {/* Tags */}
              {group.tags.length > 0 && (
                <section className="mt-5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">Etiquetas</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.tags.map((t) => (<span key={t} className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"><Tag className="h-3 w-3" aria-hidden /> {t}</span>))}
                  </div>
                </section>
              )}

              {/* Like / dislike — clean semantic HTML (Google-readable),
                  honest server-rendered counts, NO structured data. */}
              <GroupFeedback
                groupId={group.id}
                slug={group.slug}
                initialLikes={feedback.likes}
                initialDislikes={feedback.dislikes}
                initialMyAction={null}
              />

              {/* Report group */}
              <section className="mt-5 border-t pt-4">
                <ReportDialog group={group} trigger={
                  <button className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive sm:text-xs">
                    <Flag className="h-3.5 w-3.5" aria-hidden /> Reportar grupo
                  </button>
                } />
              </section>

              {/* === RELATED GROUPS (BELOW join button) === */}
              {related.length > 0 && (
                <section className="mt-8 rounded-2xl border bg-gradient-to-b from-muted/40 to-transparent p-4 sm:mt-10 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg">
                        <Users className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" aria-hidden /> Grupos similares
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                        Otras comunidades que podrían interesarte ({related.length} {related.length === 1 ? "grupo" : "grupos"})
                      </p>
                    </div>
                    <Link
                      href="/comparar"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary sm:px-3.5 sm:py-2 sm:text-xs"
                    >
                      <Scale className="h-3.5 w-3.5" aria-hidden /> Comparar grupos
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {related.map((r) => (<GroupCard key={r.id} group={toGroupCardDTO(r)} />))}
                  </div>
                </section>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
              {/* 14-day activity trend (server sparkline) — always renders:
                  zero-state (flat sparkline + honest note) for quiet groups. */}
              <GroupActivityCard
                activity={
                  activity ?? {
                    series: Array<number>(14).fill(0),
                    weekViews: 0,
                    prevViews: 0,
                    totalViews: 0,
                  }
                }
                slug={group.slug}
              />

              {/* Uploader / Author snippet (E-E-A-T) */}
              {uploader && (
                <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                  <h3 className="mb-3 text-[13px] font-semibold sm:text-sm">Publicado por</h3>
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
              <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <h3 className="mb-3 text-[13px] font-semibold sm:text-sm">Información</h3>
                <dl className="space-y-2 text-[13px] sm:space-y-2.5 sm:text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden /> Publicado</dt>
                    <dd className="font-medium">{new Date(group.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</dd>
                  </div>
                  {group.city && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden /> Ciudad</dt>
                      <dd className="font-medium">{group.city}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden /> Visitas</dt>
                    <dd className="font-medium">{group.views.toLocaleString("es-ES")}</dd>
                  </div>
                  {group.linkStatus === "revoked" && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5 text-muted-foreground"><Link2Off className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden /> Enlace</dt>
                      <dd className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
                        caducado (pendiente de verificación)
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Internal linking — SILOED: adult groups only cross-link to
                  adult content (category); country/city links are clean-only. */}
              <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <h3 className="mb-3 text-[13px] font-semibold sm:text-sm">Explora más</h3>
                <div className="space-y-2">
                  {group.category && (
                    <Link href={`/categoria/${group.category.slug}`} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-[13px] transition hover:bg-accent sm:text-sm">
                      <span className="flex items-center gap-2"><span className="text-base sm:text-lg">{group.category.icon}</span><span>{group.category.name}</span></span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  )}
                  {!group.isAdult && group.country && (
                    <Link href={`/pais/${group.country.code}`} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-[13px] transition hover:bg-accent sm:text-sm">
                      <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 shrink-0" aria-hidden /><span>{group.country.flag} {group.country.name}</span></span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  )}
                  {!group.isAdult && group.city && (
                    <Link href={`/ciudad/${citySlug(group.city)}`} className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-[13px] transition hover:bg-accent sm:text-sm">
                      <span className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden /><span>{group.city}</span></span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  )}
                  <Link href="/agregar-grupo" className="flex items-center justify-between rounded-lg border bg-primary/5 px-3 py-2 text-[13px] font-medium text-primary transition hover:bg-primary/10 sm:text-sm">
                    <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 shrink-0" aria-hidden /><span>Publica tu grupo</span></span>
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
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
