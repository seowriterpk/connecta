"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, MousePointerClick } from "lucide-react";
import type { GroupDTO } from "@/lib/types";

/**
 * JoinButton — links to /verificar/:slug (never direct WhatsApp).
 * Compact on mobile AND desktop (owner directive, 2026-11-04): it used to be a
 * 44px pill on mobile / ~50px on desktop inside the sticky bar, dwarfing the
 * 36px side pills. Now a uniform min-h-9 so the whole sticky action row is slim;
 * the stretched flex-1 width keeps it the dominant, easy-to-tap target.
 */
export function JoinButton({ group, className }: { group: GroupDTO; className?: string }) {
  return (
    <Link
      href={`/verificar/${group.slug}`}
      className={`flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] sm:px-4 sm:text-sm ${className ?? ""}`}
    >
      <span className="sm:hidden">Unirse</span>
      <span className="hidden sm:inline">Unirme al grupo en WhatsApp</span>
      <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </Link>
  );
}

/**
 * ClickCount — small display showing how many users clicked the join button.
 */
export function ClickCount({ clicks }: { clicks: number }) {
  if (clicks === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MousePointerClick className="h-3.5 w-3.5 text-primary" />
      {clicks.toLocaleString("es-ES")} {clicks === 1 ? "persona se unió" : "personas se unieron"}
    </span>
  );
}
