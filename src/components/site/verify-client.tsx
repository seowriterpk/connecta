"use client";

/**
 * VerifyClient — frontend for the /verificar/[slug] flow, fully backed by a
 * REAL backend (POST /api/groups/verify-check). The old version was a pure
 * client-side timer with no network activity — this one:
 *
 *   - calls the API the moment the page mounts (visible in the network tab);
 *   - renders the steps the SERVER returned, with their REAL results and
 *     details (masked invite code, listing date, format verdicts);
 *   - paces the reveal (~800ms per step) so the flow reads naturally;
 *   - shows the honest audit-trail summary (check count + timestamp) that
 *     matches the `link_checks` DB row the server just wrote.
 *
 * The checks are lightweight by design (format + structure + status), so the
 * labels below say exactly what was checked — nothing more.
 */

import * as React from "react";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, ShieldAlert, XCircle, RefreshCw } from "lucide-react";
import type { GroupDTO } from "@/lib/types";

interface CheckStep {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

interface VerifyResponse {
  ok: true;
  data: {
    steps: CheckStep[];
    passed: boolean;
    checkedAt: string;
    checkCount: number;
    listedSince: string | null;
    /** Link-checker verdict: "active" | "revoked" | "unknown". */
    linkStatus: string;
  };
}

const STEP_INTERVAL_MS = 800;

export function VerifyClient({ group }: { group: GroupDTO }) {
  const [steps, setSteps] = React.useState<CheckStep[] | null>(null);
  const [revealed, setRevealed] = React.useState(0);
  const [meta, setMeta] = React.useState<{ passed: boolean; checkCount: number; checkedAt: string; linkStatus: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const runCheck = React.useCallback(() => {
    setError(null);
    setSteps(null);
    setMeta(null);
    setRevealed(0);
    setDone(false);

    fetch("/api/groups/verify-check?XTransformPort=3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: group.slug }),
    })
      .then((r) => r.json())
      .then((j: VerifyResponse | { ok: false; error: string }) => {
        if (!j || j.ok !== true) {
          setError((j as { error?: string })?.error ?? "No se pudo completar la comprobación.");
          return;
        }
        setSteps(j.data.steps);
        setMeta({ passed: j.data.passed, checkCount: j.data.checkCount, checkedAt: j.data.checkedAt, linkStatus: j.data.linkStatus ?? "unknown" });
      })
      .catch(() => {
        setError("No se pudo contactar con el servidor de comprobación. Inténtalo de nuevo.");
      });
  }, [group.slug]);

  React.useEffect(() => {
    runCheck();
  }, [runCheck]);

  // Pace the step reveal once the server answered (presentational pacing —
  // every result is already real and final at this point).
  React.useEffect(() => {
    if (!steps || done) return;
    if (revealed >= steps.length) {
      setDone(true);
      return;
    }
    const t = window.setTimeout(() => setRevealed((n) => n + 1), STEP_INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [steps, revealed, done]);

  // OWNER DIRECTIVE: the join button enables as soon as the checks finish —
  // EVEN when the link was marked expired. We TELL the user the verdict
  // (see the amber box below) but never take the button away: he can go and
  // check the link himself on WhatsApp.
  const ready = done;
  const isExpired = done && meta?.linkStatus === "revoked";

  function handleJoin() {
    // Track click (fire-and-forget)
    fetch("/api/groups/click?XTransformPort=3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group.id }),
      keepalive: true,
    }).catch(() => {});
    // Redirect to WhatsApp — in a new tab so the verification page
    // (and the site) stays open behind it.
    window.open(group.inviteLink, "_blank", "noopener");
  }

  return (
    <div className="mt-6">
      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-emerald-400 to-teal-500 transition-all duration-500 ease-out"
          style={{ width: `${steps ? Math.round((Math.min(revealed, steps.length) / steps.length) * 100) : 6}%` }}
        >
          <div className="absolute inset-0 animate-pulse bg-white/20" />
        </div>
      </div>

      {/* Steps — served by the backend, paced for readability */}
      <div className="mt-4 space-y-2">
        {steps === null && !error && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            <span className="text-foreground">Conectando con el servidor de comprobación…</span>
          </div>
        )}
        {steps?.map((step, i) => {
          const isDone = i < revealed;
          const isActive = i === revealed && !done;
          if (!isDone && !isActive) {
            return (
              <div key={step.key} className="flex items-center gap-2 text-sm">
                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/20" />
                <span className="text-muted-foreground">{step.label}</span>
              </div>
            );
          }
          return (
            <div key={step.key}>
              <div className="flex items-center gap-2 text-sm">
                {isActive ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : step.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                )}
                <span className={isActive ? "text-foreground" : "text-foreground"}>{step.label}</span>
                {isDone && (
                  <span className={`ml-auto text-xs ${step.ok ? "text-emerald-500" : "text-rose-500"}`}>
                    {step.ok ? "✓" : "✕"}
                  </span>
                )}
              </div>
              {isDone && step.detail && (
                <p className="ml-6 mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Backend error → honest retry */}
      {error && (
        <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/[0.06] p-3">
          <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={runCheck}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold shadow-sm transition active:scale-[0.98] hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar comprobación
          </button>
        </div>
      )}

      {/* Expired verdict — TELL, don't block (owner directive) */}
      {isExpired && (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/[0.08] p-3" role="alert">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <strong>Enlace caducado:</strong> nuestro verificador marcó esta invitación como
              expirada. Puedes intentarlo de todos modos y comprobarlo tú mismo — si WhatsApp
              dice que ya no sirve, avísanos para que lo renueven.
            </span>
          </p>
        </div>
      )}

      {/* Join button — always available once the checks complete */}
      <button
        onClick={handleJoin}
        disabled={!ready}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition active:scale-[0.98] ${
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
            Comprobando…
          </>
        )}
      </button>

      {/* Honest result summary — matches the link_checks row just written */}
      {meta && done && meta.passed && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Comprobación completada · n.º {meta.checkCount} registrada en el historial del grupo
        </p>
      )}
      {done && meta && !meta.passed && !isExpired && (
        <p className="mt-2 text-center text-xs leading-relaxed text-amber-600 dark:text-amber-400">
          La comprobación detectó incidencias en el enlace. Puedes intentarlo, pero si WhatsApp
          dice que el enlace no sirve, avísanos para que lo renueven.
        </p>
      )}
    </div>
  );
}
