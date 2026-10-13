/**
 * Global navigation loading fallback (task 13-b) — root-level App Router
 * Suspense boundary. Shows instantly on initial loads while the page's
 * server components stream. Per-segment loading.tsx files (which cover
 * client-side navigations) re-export the same shared UI.
 */
export { default } from "@/components/site/route-loading-fallback";
