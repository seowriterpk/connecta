"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, MousePointerClick } from "lucide-react";
import type { GroupDTO } from "@/lib/types";

/**
 * JoinButton — links to /verificar/:slug (never direct WhatsApp).
 * Compact on mobile, full on desktop.
 */
export function JoinButton({ group, className }: { group: GroupDTO; className?: string }) {
  return (
    <Link
      href={`/verificar/${group.slug}`}
      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] sm:px-5 sm:py-3.5 ${className ?? ""}`}
    >
      <span className="sm:hidden">Unirse</span>
      <span className="hidden sm:inline">Unirme al grupo en WhatsApp</span>
      <ExternalLink className="h-4 w-4" />
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
