"use client";

import * as React from "react";
import { Heart, Users, Eye, BadgeCheck, Star, MapPin, Flame, TrendingUp, ArrowRight, ChevronDown } from "lucide-react";
import type { GroupDTO } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/lib/favorites";
import { CompareIconButton } from "@/components/site/compare-button";
import { Highlight } from "@/components/site/highlight";
import { GroupImage } from "@/components/site/group-image";
import { CountryFlag } from "@/components/site/country-flag";
import { useGroupsFilter } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${n}`;
}

// Capacidad estimada para barra de "popularidad" (miembros)
const MEMBER_CAP = 2000;

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

function HeartButton({ id }: { id: string }) {
  const toggle = useFavorites((s) => s.toggle);
  const has = useFavorites((s) => s.ids.includes(id));
  return (
    <motion.button
      aria-label={has ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={has}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(id);
      }}
      whileTap={{ scale: 0.8 }}
      className={`absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition ${
        has
          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
          : "bg-background/70 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 md:opacity-0"
      } ${has ? "opacity-100" : ""}`}
    >
      <Heart className={`h-4 w-4 ${has ? "fill-current" : ""}`} />
    </motion.button>
  );
}

export function GroupCard({ group, rating }: { group: GroupDTO; rating?: { avg: number; count: number } | null }) {
  const searchQuery = useGroupsFilter((s) => s.search);
  const gradient = AVATAR_GRADIENTS[group.category?.color ?? "emerald"] ?? AVATAR_GRADIENTS.emerald;
  const memberPct = Math.min(100, Math.round((group.members / MEMBER_CAP) * 100));
  const isTrending = group.views >= 50 || group.members >= 700;
  const isHot = group.members >= 1000;
  const hasRating = rating && rating.count > 0;
  // Adult directive: blank image title/alt on adult groups (SEO safety).
  const imgAlt = group.isAdult ? "" : group.title;
  const imgTitle = group.isAdult ? undefined : group.title;

  // "Active recently" = lastActiveAt within 7 days
  const isActiveRecently = (() => {
    if (!group.lastActiveAt) return false;
    const diff = Date.now() - new Date(group.lastActiveAt).getTime();
    return diff < 7 * 86400000;
  })();

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative flex h-full w-full flex-col gap-2.5 overflow-hidden rounded-2xl border bg-card p-4 pt-5 text-left shadow-sm ring-1 ring-transparent transition-[box-shadow,border-color,ring-color] duration-300 hover:border-transparent hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/25"
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

      <HeartButton id={group.id} />

      {/* Stretched link: whole card remains clickable. Sits ABOVE static
          content (z-[1]) but BELOW interactive controls (heart z-10,
          details summary z-[2], footer buttons z-[2]). */}
      <Link
        href={`/grupo/${group.slug}`}
        title={imgTitle}
        aria-label={group.isAdult ? "Ver grupo 18+" : `Ver grupo ${group.title}`}
        className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />

      {/* === ALWAYS VISIBLE: image · name · verify · 18+ === */}
      <div className="flex items-start gap-3 pr-9">
        <span className="relative shrink-0">
          <span className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br opacity-0 blur-md transition duration-300 group-hover:opacity-40" aria-hidden />
          <GroupImage
            src={group.imageUrl}
            alt={imgAlt}
            title={imgTitle}
            size={48}
            className="rounded-xl transition duration-300 group-hover:scale-105"
            fallbackEmoji={group.category?.icon}
          />
          {isActiveRecently && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover:text-primary">
            <Highlight text={group.title} query={searchQuery} />
            {group.isVerified && (
              <BadgeCheck
                className="ml-1 inline h-4 w-4 shrink-0 align-[-2px] text-emerald-500"
                aria-label="Grupo verificado"
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

      {/* === ALWAYS VISIBLE: rating · members (one compact line) === */}
      <div className="flex min-h-[1.25rem] items-center gap-2 text-xs text-muted-foreground">
        {hasRating ? (
          <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" /> {rating!.avg.toFixed(1)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
            <Users className="h-3.5 w-3.5 text-primary/70" /> {fmt(group.members)} miembros
          </span>
        )}
        {hasRating && (
          <span className="inline-flex items-center gap-1 tabular-nums">
            · <Users className="h-3 w-3 text-primary/70" /> {fmt(group.members)}
          </span>
        )}
      </div>

      {/* === COLLAPSIBLE META (native <details>): país · ciudad · categoría ·
          descripción + estadísticas.
          Content stays in the server-rendered HTML — Googlebot sees it
          exactly as before; we only minimize it visually until the user
          clicks the dropdown. No JS needed to toggle. === */}
      <details className="group/details relative z-[2]">
        <summary
          className="flex min-h-9 cursor-pointer select-none list-none items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden"
          aria-label={`Mostrar país, ciudad, categoría y descripción de ${group.isAdult ? "este grupo 18+" : group.title}`}
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border bg-background/70 transition-colors group-hover/details:border-primary/40 group-hover/details:text-primary">
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-open/details:rotate-180" />
          </span>
          <span className="truncate">País, ciudad, categoría y descripción</span>
        </summary>

        <div className="space-y-2 px-1 pb-1 pt-2 text-xs">
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
            {isHot && (
              <span className="inline-flex items-center gap-0.5 text-orange-600 dark:text-orange-400">
                <Flame className="h-3 w-3 fill-current" /> Hot
              </span>
            )}
            {isTrending && (
              <span className="inline-flex items-center gap-0.5 text-orange-600 dark:text-orange-400">
                <TrendingUp className="h-3 w-3" /> Tendencia
              </span>
            )}
          </div>

          {/* Description (full text — visible to Googlebot in the HTML) */}
          <p className="whitespace-pre-line break-words text-[13px] leading-relaxed text-muted-foreground/90">
            <Highlight text={group.description} query={searchQuery} />
          </p>

          {/* Member popularity bar + views */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                <Users className="h-3.5 w-3.5 text-primary/70" /> {fmt(group.members)} miembros
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Eye className="h-3 w-3" /> {fmt(group.views)}
                <span className="font-medium text-primary/80">{memberPct}%</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradient} shadow-sm transition-all duration-500 group-hover:brightness-110`}
                style={{ width: `${memberPct}%` }}
              />
            </div>
          </div>
        </div>
      </details>

      {/* === ALWAYS VISIBLE: CTA row (compare + join) === */}
      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {group.isVerified && (
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <BadgeCheck className="h-3 w-3" /> Verificado
            </Badge>
          )}
          {isActiveRecently && (
            <Badge variant="outline" className="gap-1 border-emerald-300/50 font-normal text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo
            </Badge>
          )}
        </div>
        <div className="relative z-[2] flex shrink-0 items-center gap-1">
          <CompareIconButton slug={group.slug} title={group.title} />
          <Link
            href={`/grupo/${group.slug}`}
            aria-hidden
            tabIndex={-1}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/40 hover:brightness-110"
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
    <div className="relative flex animate-pulse flex-col gap-2.5 overflow-hidden rounded-2xl border bg-card p-4 pt-5">
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-muted" />
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent [animation:cg-shimmer_1.6s_infinite]" />
      <div className="flex items-start gap-3 pr-9">
        <div className="h-12 w-12 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="flex min-h-9 items-center gap-1.5">
        <div className="h-5 w-5 rounded-full bg-muted" />
        <div className="h-3 w-40 rounded bg-muted" />
      </div>
      <div className="mt-auto flex items-center justify-between">
        <div className="h-5 w-24 rounded-full bg-muted" />
        <div className="h-8 w-20 rounded-full bg-muted" />
      </div>
    </div>
  );
}
