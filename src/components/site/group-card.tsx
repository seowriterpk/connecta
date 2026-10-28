"use client";

import * as React from "react";
import { BadgeCheck, Star, MapPin, ArrowRight, Link2Off } from "lucide-react";
import type { GroupCardDTO } from "@/lib/lite-dto";
import { CompareIconButton } from "@/components/site/compare-button";
import { FavoriteIconButton } from "@/components/site/favorite-pill-button";
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
//
// Card redesign (owner, 2026-10-28): competitor-style IMAGE-TOP cards — full
// 4:3 cover photo, country flag badge overlaid on the image, bold 2-line
// title, compact meta pills (location + category) and a bottom action row
// (favorite / compare / Unirme). Mobile renders 2 columns so users scan
// more groups per scroll; desktop keeps the 4-column grid.

export function GroupCard({
  group,
  imageAlt = true,
  expiredHint = false,
  showCompare = false,
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
  /**
   * Compare visibility (owner, 2026-11-05): the compare icon is REMOVED from
   * the big listing surfaces (home, category, country, city, search, tag,
   * author, popular…). It stays only where comparing is a natural action:
   * the group detail page (related grid) and /favoritos. Defaults to false —
   * new surfaces must opt in deliberately.
   */
  showCompare?: boolean;
}) {
  const searchQuery = useGroupsFilter((s) => s.search);
  // Adult directive: blank image title/alt on adult groups (SEO safety);
  // with imageAlt=false (adult category grids) both attributes are omitted
  // entirely — the <img> renders with no alt and no title.
  const imgAlt = imageAlt === false ? undefined : group.isAdult ? "" : group.title;
  const imgTitle = imageAlt === false || group.isAdult ? undefined : group.title;

  // Link-checker verdict. Only used to render the single red icon when
  // expiredHint is on (category page). No green "active" signal is ever
  // fabricated on the card surface (honesty directive above).
  const isExpired = group.linkStatus === "revoked";

  // Meta pills (competitor style): location + category, one compact pill
  // each. City wins the location pill (it is the page context on /ciudad);
  // the flag badge on the cover already signals the country visually.
  const locationText = group.city ?? group.country?.name ?? null;
  const locationTitle =
    group.city && group.country ? `${group.city}, ${group.country.name}` : locationText;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Stretched link: the whole card stays clickable. Sits ABOVE static
          content (z-[1]) but BELOW interactive controls (action row z-[2])
          and the informational cover badges (z-[2], tiny hover targets). */}
      <Link
        href={`/grupo/${group.slug}`}
        title={imgTitle}
        aria-label={group.isAdult ? "Ver grupo 18+" : `Ver grupo ${group.title}`}
        className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />

      {/* === COVER (4:3 image block, rounded by the card's overflow) === */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
        <GroupImage
          cover
          src={group.imageUrl}
          alt={imgAlt}
          title={imgTitle}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.07]"
          fallbackEmoji={group.category?.icon}
        />
        {/* Subtle bottom gradient for depth (keeps badges legible) */}
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent"
          aria-hidden
        />
        {/* Country flag badge — competitor style, top-right of the cover */}
        {group.country && (
          <span
            className="absolute right-1.5 top-1.5 z-[2] inline-flex items-center rounded-full bg-black/60 p-[3px] shadow-sm backdrop-blur-sm"
            title={`País: ${group.country.name}`}
          >
            <CountryFlag code={group.country.code} name={group.country.name} className="h-3 w-[18px]" />
          </span>
        )}
        {/* 18+ badge — top-left of the cover */}
        {group.isAdult && (
          <span
            className="absolute left-1.5 top-1.5 z-[2] inline-flex items-center rounded-full bg-rose-600/90 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white shadow-sm backdrop-blur-sm"
            title="Contenido para adultos"
          >
            18+
          </span>
        )}
      </div>

      {/* === CONTENT: title · meta pills · action row === */}
      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-3">
        {/* Title — bold, two lines, full card width */}
        <h3 className="line-clamp-2 min-h-[2.75em] text-[13px] font-bold leading-snug transition-colors group-hover:text-primary sm:text-sm">
          <Highlight text={group.title} query={searchQuery} />
          {group.isVerified && (
            <BadgeCheck
              className="ml-1 inline h-3.5 w-3.5 shrink-0 align-[-3px] text-emerald-500"
              aria-label="Enlace comprobado"
            />
          )}
          {group.isFeatured && (
            <Star
              className="ml-0.5 inline h-3.5 w-3.5 shrink-0 align-[-3px] fill-amber-500 text-amber-500"
              aria-label="Destacado"
            />
          )}
          {expiredHint && isExpired && (
            <Link2Off
              className="ml-1 inline h-3.5 w-3.5 shrink-0 align-[-3px] text-rose-500"
              aria-label="Enlace caducado (expirado)"
            />
          )}
        </h3>

        {/* Meta pills — location + category (compact, single line each) */}
        {(locationText || group.category) && (
          <div className="flex flex-wrap items-center gap-1 text-[10px] sm:text-[11px]">
            {locationText && (
              <span
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium text-muted-foreground"
                title={locationTitle ?? undefined}
              >
                <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
                <span className="truncate">{locationText}</span>
              </span>
            )}
            {group.category && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-1 font-medium text-muted-foreground">
                <span className="shrink-0 text-[10px] leading-none" aria-hidden>
                  {group.category.icon}
                </span>
                <span className="truncate">{group.category.name}</span>
              </span>
            )}
          </div>
        )}

        {/* Action row — favorite / compare icon toggles + Unirme CTA.
            z-[2] keeps the controls above the stretched link. */}
        <div className="relative z-[2] mt-auto flex items-center justify-between gap-1.5 pt-1">
          <div className="flex items-center gap-0.5">
            <FavoriteIconButton id={group.id} />
            {showCompare && <CompareIconButton slug={group.slug} title={group.title} />}
          </div>
          {/* Join directive (owner, 2026-11-04): the Unirme pill was oversized,
              especially in the 2-col mobile grid — now compact on mobile AND
              desktop (the whole cover+title area is clickable via the stretched
              link, so the pill can be small without hurting usability).
              active:scale-95 gives instant one-tap feedback on touch. */}
          <Link
            href={`/grupo/${group.slug}`}
            aria-hidden
            tabIndex={-1}
            className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm shadow-emerald-500/20 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/30 hover:brightness-110 active:scale-95 active:brightness-95 sm:gap-1 sm:px-3 sm:py-1.5 sm:text-[11px]"
          >
            Unirme
            <ArrowRight className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-3 sm:w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function SkeletonCard() {
  return (
    <div className="relative flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-[4/3] w-full shrink-0 bg-muted" />
      <div className="flex flex-1 flex-col gap-2.5 p-2.5 sm:p-3">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="flex items-center gap-1">
          <div className="h-5 w-[68px] rounded-full bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-0.5">
            <div className="h-7 w-7 rounded-full bg-muted sm:h-8 sm:w-8" />
            <div className="h-7 w-7 rounded-full bg-muted sm:h-8 sm:w-8" />
          </div>
          <div className="h-6 w-[62px] rounded-full bg-gradient-to-r from-emerald-500/40 to-teal-600/40 sm:h-7 sm:w-[70px]" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent [animation:cg-shimmer_1.6s_infinite]" />
    </div>
  );
}
