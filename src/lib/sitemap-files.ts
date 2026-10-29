/**
 * Sitemap disk access — shared by the /sitemap.xml + /sitemaps/* route
 * handlers (src/app/sitemap.xml, src/app/sitemaps/[filename]) and the
 * generator (src/lib/sitemap.ts).
 *
 * WHY ROUTE HANDLERS (Task 35): Next.js 16 scans `public/` exactly ONCE at
 * server boot (dist/server/lib/router-utils/filesystem.js — the
 * `publicFolderItems` set is populated only in the `!opts.dev` branch).
 * Sitemap files written AFTER the server started — which is what every
 * regeneration does (admin "Regenerar ahora", drip-feed cron, nightly cron) —
 * are invisible to the static router and return 404 forever. Writing to
 * `.next/standalone/public/` too (the old Task-33 approach) does NOT help:
 * the boot-time set is the only thing the router consults in production.
 *
 * Serving the XML through App-Router route handlers reads from disk on every
 * request: freshly generated files are live instantly, no restart, no
 * redeploy, and we control the cache headers (Next's static public serving
 * stamps `max-age=31536000, immutable` on them — wrong for sitemaps).
 */

import fs from "fs";
import path from "path";

/**
 * Every public/ copy that can hold sitemap files:
 *   1. <cwd>/public                        — repo public (dev, and prod cwd)
 *   2. <cwd>/.next/standalone/public       — the copy the standalone build
 *      serves (present only in production, after `next build`)
 * Both are written by the generator, so their contents stay in sync.
 */
export function sitemapPublicDirs(): string[] {
  const dirs = [path.join(process.cwd(), "public")];
  const standalone = path.join(process.cwd(), ".next", "standalone", "public");
  try {
    if (fs.statSync(standalone).isDirectory()) dirs.push(standalone);
  } catch {
    /* no standalone build — dev mode */
  }
  return dirs;
}

/** grupos-N.xml chunk pattern (N = 1..9999). */
const CHUNK_RE = /^grupos-\d{1,4}\.xml$/;

/** Fixed-name sub-sitemaps the generator can emit. */
const NAMED_FILES = new Set([
  "categorias.xml",
  "paises.xml",
  "ciudades.xml",
  "blog.xml",
  "autores.xml",
  "estaticas.xml",
]);

/**
 * Strict filename whitelist. Also blocks path traversal: a safe name is
 * always its own basename (no "/", "\", "..").
 */
export function isValidSitemapFilename(name: string): boolean {
  if (typeof name !== "string" || name.length === 0) return false;
  if (path.basename(name) !== name) return false;
  return NAMED_FILES.has(name) || CHUNK_RE.test(name);
}

/**
 * Read a sitemap chunk from the public copies. Search order: standalone
 * first (the copy the production server itself would serve), then repo
 * public. Returns null when the file doesn't exist anywhere (or the name
 * is not a valid sitemap filename).
 */
export function readSitemapChunk(filename: string): string | null {
  if (!isValidSitemapFilename(filename)) return null;
  const dirs = sitemapPublicDirs();
  for (let i = dirs.length - 1; i >= 0; i--) {
    try {
      return fs.readFileSync(path.join(dirs[i], "sitemaps", filename), "utf8");
    } catch {
      /* not in this copy — try the next */
    }
  }
  return null;
}

/** Read the sitemap index (public/sitemap.xml). Same search order. */
export function readSitemapIndex(): string | null {
  const dirs = sitemapPublicDirs();
  for (let i = dirs.length - 1; i >= 0; i--) {
    try {
      return fs.readFileSync(path.join(dirs[i], "sitemap.xml"), "utf8");
    } catch {
      /* not in this copy — try the next */
    }
  }
  return null;
}
