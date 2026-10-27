"use client";

import * as React from "react";
import { BadgeCheck, Star, MapPin, ArrowRight, ChevronDown, Link2Off } from "lucide-react";
import type { GroupCardDTO } from "@/lib/lite-dto";
import { Badge } from "@/components/ui/badge";
import { CompareToggleAction } from "@/components/site/compare-button";
import { FavoriteToggleAction } from "@/components/site/favorite-pill-button";
import { Highlight } from "@/components/site/highlight";
import { GroupImage } from "@/components/site/group-image";
import { CountryFlag } from "@/components/site/country-flag";
import { useGroupsFilter } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";

// Honesty directive (owner, 2026-10-21): no fabricated engagement signals on
// cards — member counts, popularity bars, "Hot"/"Tendencia" badges and the
// pulsing "active" dot were driven by seeded demo clicks/views and read as
// fake claims. Real counters stay on the group detail page; badges only show
// what the system can prove (verificado = enlace comprobado, destacado =
// curation flag set by the admin).

const AVATAR_GRADIENTS: Record<string, string> = {
  emerald: "from-emerald-500 to-teal-600",
  rose: "from-rose-500 to-pink-600",
  fuchsia: "from-fuchsia-500 to-purple-600",
  sky: "from-sky-500 to-blue-600",
  slate: "from-slate-500 to-gray-700",
  teal: "from-teal-500 to-cyan-600",
  lime: "from-lime-500 to-green-600",
  violet: "from-violet-500 to-purple-600",
  amber: "from-amber-500 to-orange-600",
  yellow: "from-yellow-400 to-amber-500",
  stone: "from-stone-500 to-zinc-700",
  orange: "from-orange-500 to-red-600",
  red: "from-red-500 to-rose-700",
  cyan: "from-cyan-500 to-sky-600",
  indigo: "from-indigo-500 to-blue-600",
  blue: "from-blue-500 to-indigo-600",
  pink: "from-pink-500 to-rose-600",
  green: "from-green-500 to-emerald-600",
  purple: "from-purple-500 to-violet-600",
};

/**
 * Labeled favorite + compare toggles for the card dropdown live in
 * favorite-pill-button.tsx / compare-button.tsx (shared with the homepage
 * directory rows). They replace the old absolute top-right heart and the
 * CTA-row compare icon — those surface icons reserved space over the title
 * and cut long group names off on small screens.
 */

export function GroupCard({
  group,
  imageAlt = true,
  expiredHint = false,
}: {
  group: GroupCardDTO;
  /**
   * Adult-grid directive: pass false to render the group image with NO alt
   * and NO title attributes at all (adult category pages — SEO safety:
   * descriptive alt text would leak adult titles into image search).
   * Default true keeps the normal behavior (full alt text on clean groups,
   * blank alt on adult groups elsewhere).
   */
  imageAlt?: boolean;
  /**
   * Premium-vibe directive (owner, 2026-10-21): listing cards stay CLEAN —
   * no red "expired" icons/words anywhere. The ONE exception is the category
   * page, which passes expiredHint to show the single red Link2Off icon next
   * to the title. Everywhere else (home, search, city, country, popular,
   * verify, related…) the link-checker verdict is deliberately invisible on
   * cards; the group detail + verify pages still tell the user honestly.
   */
  expiredHint?: boolean;
}) {
  const searchQuery = useGroupsFilter((s) => s.search);
  const gradient = AVATAR_GRADIENTS[group.category?.color ?? "emerald"] ?? AVATAR_GRADIENTS.emerald;
  // Adult directive: blank image title/alt on adult groups (SEO safety);
  // with imageAlt=false (adult category grids) both attributes are omitted
  // entirely — the <img> renders with no alt and no title.
  const imgAlt = imageAlt === false ? undefined : group.isAdult ? "" : group.title;
  const imgTitle = imageAlt === false || group.isAdult ? undefined : group.title;

  // Link-checker verdict. Only used to (a) suppress the green "active"
  // signals on this card (no dishonest "Activo" badge over a dead link) and
  // (b) render the single red icon when expiredHint is on (category page).
  const isExpired = group.linkStatus === "revoked";

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl border bg-card p-3 pt-4 text-left shadow-sm ring-1 ring-transparent transition-[box-shadow,border-color,ring-color] duration-300 hover:border-transparent hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/25 sm:gap-2.5 sm:p-4 sm:pt-5"
    >
      {/* Category color top accent */}
      <span
        className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${gradient} transition-transform duration-500 ease-out group-hover:scale-x-100`}
        aria-hidden
      />
      <span
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-50`}
        aria-hidden
      />

      {/* Decorative gradient wash */}
      <span
        className={`pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transition duration-500 group-hover:opacity-25`}
        aria-hidden
      />

      {/* Stretched link: whole card remains clickable. Sits ABOVE static
          content (z-[1]) but BELOW interactive controls (details summary and
          its action buttons, z-[2]; footer badges z-[2]). */}
      <Link
        href={`/grupo/${group.slug}`}
        title={imgTitle}
        aria-label={group.isAdult ? "Ver grupo 18+" : `Ver grupo ${group.title}`}
        className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />

      {/* === ALWAYS VISIBLE: image · name · verify · 18+ ===
          No more absolute heart overlay → the title row owns the full card
          width (long names stay readable on small screens). */}
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="relative shrink-0">
          <span className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br opacity-0 blur-md transition duration-300 group-hover:opacity-40" aria-hidden />
          <GroupImage
            src={group.imageUrl}
            alt={imgAlt}
            title={imgTitle}
            size={48}
            className="rounded-xl transition duration-300 group-hover:scale-105 max-sm:h-11! max-sm:w-11!"
            fallbackEmoji={group.category?.icon}
          />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary sm:text-[15px]">
            <Highlight text={group.title} query={searchQuery} />
            {group.isVerified && (
              <BadgeCheck
                className="ml-1 inline h-4 w-4 shrink-0 align-[-2px] text-emerald-500"
                aria-label="Enlace comprobado"
              />
            )}
            {expiredHint && isExpired && (
              <Link2Off
                className="ml-1 inline h-4 w-4 shrink-0 align-[-2px] text-rose-500"
                aria-label="Enlace caducado (expirado)"
              />
            )}
          </h3>
          {group.isAdult && (
            <span className="mt-1 inline-flex items-center rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400" title="Contenido para adultos">
              18+
            </span>
          )}
        </div>
      </div>

      {/* === COLLAPSIBLE META (native <details>): país · ciudad · categoría +
          quick actions (me gusta / comparar).
          SEO directive (owner): the group description is rendered ONLY on
          /grupo/[slug] — listing cards must NEVER duplicate it (duplicate
          content across hundreds of programmatic pages). Only compact
          taxonomy metadata (country/city/category) lives here, and it is
          unique per card context. No JS needed to toggle. === */}
      <details className="group/details relative z-[2]">
        <summary
          className="flex min-h-8 cursor-pointer select-none list-none items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden sm:min-h-9 sm:px-1.5 sm:py-1.5 sm:text-xs"
          aria-label={`Mostrar país, ciudad, categoría y acciones de ${group.isAdult ? "este grupo 18+" : group.title}`}
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border bg-background/70 transition-colors group-hover/details:border-primary/40 group-hover/details:text-primary">
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-open/details:rotate-180" />
          </span>
          <span className="truncate">País, ciudad y categoría</span>
        </summary>

        <div className="space-y-2 px-1 pb-1 pt-2 text-[11px] sm:text-xs">
          {/* Meta: country · city · category */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-muted-foreground">
            {group.country && (
              <span className="inline-flex items-center gap-1.5">
                <CountryFlag code={group.country.code} name={group.country.name} />
                <span className="truncate font-medium">{group.country.name}</span>
              </span>
            )}
            {group.city && (
              <span className="inline-flex items-center gap-0.5 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{group.city}</span>
              </span>
            )}
            {group.category && (
              <Badge variant="outline" className="gap-1 font-normal">
                {group.category.icon} {group.category.name}
              </Badge>
            )}
            {group.isFeatured && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                <Star className="h-3 w-3 fill-current" /> Destacado
              </span>
            )}
          </div>

          {/* Quick actions: me gusta + comparar (owner directive: these live
              INSIDE the dropdown so the card surface stays clean and group
              titles keep the full width on small screens). NOTE: no
              description here — see the SEO directive above. */}
          <div className="flex items-center gap-2 pt-1">
            <FavoriteToggleAction id={group.id} />
            <CompareToggleAction slug={group.slug} title={group.title} />
          </div>
        </div>
      </details>

      {/* === ALWAYS VISIBLE: CTA row (badges + join) — clean, no red === */}
      <div className="mt-auto flex items-end justify-between gap-2 pt-1 sm:gap-3">
        {/* z-[2] keeps these informational badges above the stretched link
            so their title tooltip is actually reachable on hover. */}
        <div className="relative z-[2] flex min-w-0 items-center gap-1.5">
          {group.isVerified && (
            <Badge
              variant="secondary"
              className="gap-1 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 sm:px-2.5 sm:text-xs"
              title="Enlace comprobado automáticamente y activo en la última revisión"
            >
              <BadgeCheck className="h-3 w-3" aria-hidden /> Verificado
            </Badge>
          )}
        </div>
        <div className="relative z-[2] flex shrink-0 items-center gap-1">
          <Link
            href={`/grupo/${group.slug}`}
            aria-hidden
            tabIndex={-1}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md shadow-emerald-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/40 hover:brightness-110 sm:px-4 sm:py-2 sm:text-xs"
          >
            Unirme
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function SkeletonCard() {
  return (
    <div className="relative flex animate-pulse flex-col gap-2 overflow-hidden rounded-2xl border bg-card p-3 pt-4 sm:gap-2.5 sm:p-4 sm:pt-5">
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-muted" />
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent [animation:cg-shimmer_1.6s_infinite]" />
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="h-11 w-11 rounded-xl bg-muted sm:h-12 sm:w-12" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="flex min-h-8 items-center gap-1.5">
        <div className="h-5 w-5 rounded-full bg-muted" />
        <div className="h-3 w-40 rounded bg-muted" />
      </div>
      <div className="mt-auto flex items-center justify-between">
        <div className="h-5 w-24 rounded-full bg-muted" />
        <div className="h-7 w-20 rounded-full bg-muted sm:h-8" />
      </div>
    </div>
  );
}
