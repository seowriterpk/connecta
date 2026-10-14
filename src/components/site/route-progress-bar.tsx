"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Route-change progress bar (NProgress-style, ZERO dependencies) — task 13-b.
 *
 * Why: every listing page is a force-dynamic server component, so client-side
 * navigation waits on an RSC fetch with no feedback. This bar starts on any
 * same-app anchor tap (capture phase) and stops when the navigation commits
 * (pathname change), with a safety timeout, `load` and `popstate` stops.
 *
 * - No bar is shown before SHOW_DELAY (instant/prefetched navigations never flash).
 * - Width creeps asymptotically toward 90% (rAF-driven increments, eased by the
 *   CSS transition on `.cg-route-progress-bar`), then sweeps to 100% and fades out.
 * - Hydration-safe: initial state (hidden / 0%) matches the SSR markup.
 * - aria-hidden — purely decorative feedback, no announcement spam.
 */

const SHOW_DELAY = 120; // ms — don't flash a bar for instant navigations
const SAFETY_TIMEOUT = 2500; // ms — always stop, even if no event fires
const FINISH_MS = 320; // ms — sweep-to-100% time before fading out
const HIDE_MS = 220; // ms — fade-out time

type Phase = "hidden" | "pending" | "loading" | "done" | "hiding";

export function RouteProgressBar() {
  const pathname = usePathname();
  const [phase, setPhaseState] = React.useState<Phase>("hidden");
  const [width, setWidth] = React.useState(0);

  const phaseRef = React.useRef<Phase>("hidden");
  const widthRef = React.useRef(0);
  // URL of the page the click happened ON (not the destination) — the trickle
  // compares against it to detect committed navigations.
  const startUrlRef = React.useRef<string | null>(null);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = React.useRef<number | null>(null);

  const setPhase = React.useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const later = React.useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  /** Stop: sweep to 100% then fade out; never flash if nothing was shown yet. */
  const stop = React.useCallback(() => {
    const current = phaseRef.current;
    if (current === "hidden" || current === "done" || current === "hiding") return;
    clearTimers();
    if (current === "pending") {
      // Navigation finished before the bar became visible — stay invisible.
      setPhase("hidden");
      return;
    }
    setPhase("done");
    widthRef.current = 100;
    setWidth(100);
    later(() => {
      setPhase("hiding"); // opacity → 0 while width stays 100 (fade, no reverse motion)
      later(() => {
        // Reset invisibly (opacity is already 0).
        widthRef.current = 0;
        setWidth(0);
        setPhase("hidden");
      }, HIDE_MS);
    }, FINISH_MS);
  }, [clearTimers, later, setPhase]);

  /**
   * rAF-driven trickle loop, held in a ref (no self-referencing callback so
   * the React hooks linter stays happy). Eases width toward 90% and also
   * catches ?search-only URL changes that usePathname can't see.
   */
  const tickRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    tickRef.current = () => {
      if (phaseRef.current !== "loading") return;
      // URL moved away from the click-time page → navigation committed. This
      // also catches ?search-only changes that usePathname can't see.
      if (startUrlRef.current && window.location.href !== startUrlRef.current) {
        stop();
        return;
      }
      widthRef.current = Math.min(90, widthRef.current + (90 - widthRef.current) * 0.25 + 0.5);
      setWidth(widthRef.current);
      rafRef.current = requestAnimationFrame(() => {
        later(() => tickRef.current(), 180);
      });
    };
  }, [later, stop]);

  /** Start (armed): the bar only becomes visible after SHOW_DELAY. */
  const start = React.useCallback(() => {
    if (phaseRef.current === "pending" || phaseRef.current === "loading") return;
    clearTimers();
    startUrlRef.current = window.location.href;
    widthRef.current = 0;
    setWidth(0);
    setPhase("pending");
    later(() => {
      widthRef.current = 10;
      setWidth(10);
      setPhase("loading");
      later(() => tickRef.current(), 200);
    }, SHOW_DELAY);
    later(stop, SAFETY_TIMEOUT);
  }, [clearTimers, later, setPhase, stop]);

  // A committed navigation changes the pathname → stop the bar.
  React.useEffect(() => {
    stop();
  }, [pathname, stop]);

  React.useEffect(() => {
    // iOS Safari only honors :active styles when a touchstart listener exists
    // somewhere in the document (enables the global press feedback in CSS).
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });

    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const el = e.target as HTMLElement | null;
      const anchor = el && typeof el.closest === "function" ? el.closest("a[href]") : null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("#") || href.includes("XTransformPort")) {
        return;
      }
      if (anchor.hasAttribute("download")) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;
      if ((anchor.getAttribute("rel") || "").includes("external")) return;
      try {
        const url = new URL(href, window.location.href);
        // Same path + same query → Next only scrolls/hashes, no fetch: skip.
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
        start();
      } catch {
        /* malformed href — ignore */
      }
    };
    // Capture phase: see the tap before stopPropagation handlers run.
    document.addEventListener("click", onClick, true);
    const onStop = () => stop();
    window.addEventListener("load", onStop);
    window.addEventListener("popstate", onStop);
    return () => {
      document.removeEventListener("touchstart", noop);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("load", onStop);
      window.removeEventListener("popstate", onStop);
      clearTimers();
    };
  }, [clearTimers, start, stop]);

  const visible = phase === "loading" || phase === "done";

  // z-[70]: above the sticky header (z-50) AND above ReadingProgress, which
  // already occupies fixed top-0 z-[60] later in the DOM on listing pages.
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div
        className="cg-route-progress-bar h-full bg-gradient-to-r from-primary via-emerald-500 to-teal-500"
        style={{ width: `${width}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}
