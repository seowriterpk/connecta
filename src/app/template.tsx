import type { ReactNode } from "react";

/**
 * Route template (task 13-b) — re-mounts on every navigation (App Router
 * template semantics). Wraps page content in a subtle, zero-JS enter
 * animation (`.page-enter`: 180ms fade + 6px rise, defined in globals.css)
 * so route changes feel immediate instead of abruptly swapping.
 * `prefers-reduced-motion: reduce` disables it in CSS.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
