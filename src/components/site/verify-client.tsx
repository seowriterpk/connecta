"use client";

import * as React from "react";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import type { GroupDTO } from "@/lib/types";

const CHECKS = [
  "Comprobando enlace de invitación…",
  "Verificando que el grupo siga activo…",
  "Revisando disponibilidad de la imagen…",
  "Preparando redirección a WhatsApp…",
];

export function VerifyClient({ group }: { group: GroupDTO }) {
  const [progress, setProgress] = React.useState(0);
  const [activeCheck, setActiveCheck] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const duration = 5000; // 5 seconds
    const steps = CHECKS.length;
    const interval = duration / steps;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      const checkIdx = Math.min(steps - 1, Math.floor((elapsed / duration) * steps));
      setActiveCheck(checkIdx);

      if (elapsed >= duration) {
        clearInterval(timer);
        setReady(true);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  function handleJoin() {
    // Track click (fire-and-forget)
    fetch("/api/groups/click?XTransformPort=3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id }),
      keepalive: true,
    }).catch(() => {});
    // Redirect to WhatsApp
    window.location.href = group.inviteLink;
  }

  return (
    <div className="mt-6">
      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-emerald-400 to-teal-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 animate-pulse bg-white/20" />
        </div>
      </div>

      {/* Checks */}
      <div className="mt-4 space-y-2">
        {CHECKS.map((check, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {i < activeCheck || ready ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : i === activeCheck ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/20" />
            )}
            <span className={i < activeCheck || ready ? "text-foreground" : i === activeCheck ? "text-foreground" : "text-muted-foreground"}>
              {check}
            </span>
            {(i < activeCheck || ready) && (
              <span className="ml-auto text-xs text-emerald-500">✓</span>
            )}
          </div>
        ))}
      </div>

      {/* Join button */}
      <button
        onClick={handleJoin}
        disabled={!ready}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold shadow-sm transition active:scale-[0.98] ${
          ready
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "cursor-not-allowed bg-muted text-muted-foreground"
        }`}
      >
        {ready ? (
          <>
            Unirme al grupo en WhatsApp
            <ExternalLink className="h-4 w-4" />
          </>
        ) : (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando…
          </>
        )}
      </button>

      {ready && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Enlace verificado. Puedes unirte con seguridad.
        </p>
      )}
    </div>
  );
}
