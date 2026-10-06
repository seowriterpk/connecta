"use client";

import * as React from "react";
import { Heart, Users, Eye, BadgeCheck, Star, MapPin, Flame, TrendingUp } from "lucide-react";
import type { GroupDTO } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/lib/favorites";
import { Highlight } from "@/components/site/highlight";
import { GroupImage } from "@/components/site/group-image";
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
        toggle(id);
      }}
      whileTap={{ scale: 0.8 }}
      className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition ${
        has
          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
          : "bg-background/70 text-muted-foreground hover:text-rose-500"
      }`}
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

  // "Active recently" = lastActiveAt within 7 days
  const isActiveRecently = (() => {
    if (!group.lastActiveAt) return false;
    const diff = Date.now() - new Date(group.lastActiveAt).getTime();
    return diff < 7 * 86400000;
  })();

  return (
    <Link href={`/grupo/${group.slug}`} className="block">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="group relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-sm ring-1 ring-transparent transition hover:shadow-lg hover:ring-primary/20"
      >
      {/* Decorative gradient wash */}
      <span
        className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transition group-hover:opacity-20`}
        aria-hidden
      />

      <HeartButton id={group.id} />

      <div className="flex items-start gap-3 pr-9">
        <span className="relative shrink-0">
          <GroupImage
            src={group.imageUrl}
            alt={group.title}
            title={group.title}
            size={44}
            className="rounded-xl"
            fallbackEmoji={group.category?.icon}
          />
          {isActiveRecently && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            <Highlight text={group.title} query={searchQuery} />
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {group.country && (
              <span className="inline-flex items-center gap-1">
                <span>{group.country.flag}</span>
                <span className="truncate">{group.country.name}</span>
              </span>
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
          </div>
        </div>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        <Highlight text={group.description} query={searchQuery} />
      </p>

      {/* Member popularity bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {fmt(group.members)} miembros
          </span>
          <span className="tabular-nums">{memberPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
            style={{ width: `${memberPct}%` }}
          />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {group.isVerified && (
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <BadgeCheck className="h-3 w-3" /> Verificado
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 font-normal">
            <MapPin className="h-3 w-3" /> {group.category?.name ?? "Sin categoría"}
          </Badge>
          {isTrending && (
            <Badge variant="outline" className="gap-1 border-orange-300/50 font-normal text-orange-600 dark:text-orange-400">
              <TrendingUp className="h-3 w-3" /> Tendencia
            </Badge>
          )}
          {isActiveRecently && (
            <Badge variant="outline" className="gap-1 border-emerald-300/50 font-normal text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo
            </Badge>
          )}
          {hasRating && (
            <Badge variant="outline" className="gap-1 border-amber-300/50 font-normal text-amber-600 dark:text-amber-400">
              <Star className="h-3 w-3 fill-current" /> {rating!.avg.toFixed(1)}
            </Badge>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" /> {fmt(group.views)}
        </span>
      </div>
      </motion.div>
    </Link>
  );
}

export function SkeletonCard() {
  return (
    <div className="relative flex animate-pulse flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4">
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent [animation:cg-shimmer_1.6s_infinite]" />
      <div className="flex items-start gap-3 pr-9">
        <div className="h-11 w-11 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="h-1.5 w-full rounded-full bg-muted" />
    </div>
  );
}
