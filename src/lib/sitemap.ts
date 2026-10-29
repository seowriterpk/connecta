/**
 * Sitemap generator — shared runtime for the in-app regeneration endpoint.
 *
 * This is a faithful port of scripts/crons/sitemap-generator.mjs (the nightly
 * 2am hPanel cron) so admins can regenerate the sitemap INSTANTLY from the
 * dashboard right after a bulk upload/publish instead of waiting for the
 * nightly cron. Output files are byte-compatible with the cron's:
 *
 *   public/sitemaps/grupos-N.xml  (200 live groups per file, adult INCLUDED —
 *                                  adult pages are indexable and the sitemap
 *                                  is their discovery path)
 *   public/sitemaps/categorias.xml paises.xml ciudades.xml blog.xml
 *   public/sitemaps/autores.xml   estaticas.xml
 *   public/sitemap.xml            (index pointing at every sub-sitemap)
 *
 * Path strategy (Task 35): files are written to EVERY public/ copy —
 * <cwd>/public AND <cwd>/.next/standalone/public (when a standalone build
 * exists) — mirroring scripts/crons writePublicFile(). They are SERVED by
 * the App-Router route handlers (/sitemap.xml via a beforeFiles rewrite to
 * src/app/api/sitemap-index, and /sitemaps/* via
 * src/app/sitemaps/[filename]), which read from disk per request:
 * Next.js 16 only scans public/ ONCE at boot, so files written at runtime
 * are invisible to the static router (that was the grupos-2.xml…404 bug).
 *
 * EMPTY SECTIONS (Task 36): a sub-sitemap with ZERO urls is NEVER written.
 * An empty <urlset> violates the sitemap protocol and Search Console flags
 * it as "Missing XML tag: url / parent: urlset" with 0 discovered pages —
 * exactly the blog.xml GSC error from 28/10 (the file was generated at a
 * time when blog_posts had no published rows yet). Empty sections are
 * omitted from the index and their stale files are DELETED from disk, so
 * the index never references a file that doesn't exist and no urlset is
 * ever empty. Kept in sync with scripts/crons/sitemap-generator.mjs.
 */

import fs from "fs";
import path from "path";
import { query, queryOne } from "@/lib/db";
import { citySlug } from "@/lib/data";
import { SITE } from "@/lib/constants";
import { sitemapPublicDirs } from "@/lib/sitemap-files";

const BASE_URL = process.env.BASE_URL || SITE.url;
const SITEMAPS_DIR = path.join(process.cwd(), "public", "sitemaps");

export interface SitemapSubFile {
  filename: string;
  urlCount: number;
  bytes: number;
}

export interface SitemapGenerationResult {
  ok: true;
  baseUrl: string;
  groups: number;
  categories: number;
  countries: number;
  cities: number;
  posts: number;
  authors: number;
  staticPages: number;
  totalUrls: number;
  files: SitemapSubFile[];
  durationMs: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// In-flight lock + debounce (auto-refresh hooks can fire in bursts)
// ---------------------------------------------------------------------------

let inflight: Promise<SitemapGenerationResult> | null = null;
let lastRun: SitemapGenerationResult | null = null;

/**
 * Fire-and-forget refresh for mutation hooks (queue publish, UGC approve,
 * bulk live…). Regenerates immediately unless a run happened <20s ago, in
 * which case the data is fresh enough. Never throws.
 */
export function refreshSitemapsAfterPublish(): void {
  if (inflight) return; // already regenerating
  if (lastRun && Date.now() - new Date(lastRun.generatedAt).getTime() < 20_000) {
    return; // generated moments ago — nothing meaningful to add
  }
  generateSitemaps().catch((err) => {
    console.error("[sitemap] auto-refresh failed:", err?.message || err);
  });
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/** XML-escape a <loc> value. Slugs are URL-safe by construction, but this
 *  is defense in depth: one stray `&` in an admin-entered slug would break
 *  the whole file's XML and Search Console would refuse it. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** YYYY-MM-DD from a DB date, or null when missing/invalid. A null
 *  lastmod simply omits the tag (valid per protocol) instead of throwing
 *  `new Date(undefined).toISOString()` → RangeError, which used to abort
 *  the WHOLE regeneration over a single bad row. */
function safeDate(v: Date | string | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function urlEntry(loc: string, lastmod?: string | null, changefreq = "weekly", priority = "0.7"): string {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

/**
 * Write a file into every public/ copy (root + standalone build when
 * present). `relPath` is relative to public/, e.g. "sitemaps/grupos-1.xml".
 * Mirrors writePublicFile() in scripts/crons/_lib.mjs.
 */
function writePublicFile(relPath: string, content: string): void {
  for (const dir of sitemapPublicDirs()) {
    const target = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}

/**
 * Write a sub-sitemap. ZERO urls → the file is REMOVED from every public
 * copy and null is returned (caller omits it from the sitemap index):
 * an empty <urlset> is the "Missing XML tag: url" GSC error (Task 36).
 */
function writeSitemap(filename: string, urls: string[]): SitemapSubFile | null {
  if (urls.length === 0) {
    for (const dir of sitemapPublicDirs()) {
      try {
        fs.unlinkSync(path.join(dir, "sitemaps", filename));
      } catch {
        /* file not in this copy — fine */
      }
    }
    return null;
  }
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
  writePublicFile(path.join("sitemaps", filename), content);
  return { filename, urlCount: urls.length, bytes: Buffer.byteLength(content) };
}

/**
 * Remove grupos-N.xml chunks left over from a bigger DB (e.g. the site
 * shrank from 9 chunks to 7 — the old grupos-8/9.xml would linger on disk,
 * never referenced by the index but still counted by the status card and
 * fetchable by crawlers that remember old URLs). Only the grupos-N pattern
 * is ever touched, and only when the DB still has live groups.
 */
function cleanupStaleChunks(chunkCount: number): void {
  if (chunkCount <= 0) return; // never wipe chunks on an empty/glitchy read
  for (const dir of sitemapPublicDirs()) {
    const sdir = path.join(dir, "sitemaps");
    let entries: string[];
    try {
      entries = fs.readdirSync(sdir);
    } catch {
      continue; // no sitemaps dir in this copy
    }
    for (const entry of entries) {
      const m = /^grupos-(\d{1,4})\.xml$/.exec(entry);
      if (m && Number(m[1]) > chunkCount) {
        try {
          fs.unlinkSync(path.join(sdir, entry));
        } catch {
          /* best effort */
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateSitemaps(): Promise<SitemapGenerationResult> {
  if (inflight) return inflight; // dedupe concurrent triggers
  inflight = run().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function run(): Promise<SitemapGenerationResult> {
  const started = Date.now();
  fs.mkdirSync(SITEMAPS_DIR, { recursive: true });

  // Groups — ALL live groups (adult included: adult pages are indexable and
  // the sitemap is their discovery path — clean pages don't link there).
  // Revoked/expired links are INCLUDED too (NEVER-NOINDEX DIRECTIVE,
  // owner 2026-10-28): every live group URL stays indexable and in the
  // sitemap; expired links only sink in ranking.
  const groups = await query<{ slug: string; updatedAt: Date | string }>(
    "SELECT `slug`, `updatedAt` FROM `groups` WHERE `status` = 'live' ORDER BY `updatedAt` DESC"
  );
  const liveGroups = groups.filter((g) => typeof g.slug === "string" && g.slug.length > 0);

  const batchSize = 200;
  const sitemapFiles: SitemapSubFile[] = [];

  for (let i = 0; i < liveGroups.length; i += batchSize) {
    const batch = liveGroups.slice(i, i + batchSize);
    const fileNum = Math.floor(i / batchSize) + 1;
    const chunk = writeSitemap(
      `grupos-${fileNum}.xml`,
      batch.map((g) =>
        urlEntry(
          `${BASE_URL}/grupo/${g.slug}`,
          safeDate(g.updatedAt),
          "weekly",
          "0.8"
        )
      )
    );
    if (chunk) sitemapFiles.push(chunk);
  }
  cleanupStaleChunks(sitemapFiles.length);

  // Categories — active ones, adult included (indexable; robots carries the
  // RTA label on-page).
  const categories = await query<{ slug: string }>(
    "SELECT `slug` FROM `categories` WHERE `isActive` = 1"
  );
  const categoriasFile = writeSitemap(
    "categorias.xml",
    categories
      .filter((c) => c.slug)
      .map((c) => urlEntry(`${BASE_URL}/categoria/${c.slug}`, undefined, "weekly", "0.9"))
  );

  // Countries — ONLY indexable ones. The pais pages apply the thin-content
  // rule (clean live groupCount < 3 → noindex, follow); a sitemap must never
  // list a URL the page itself noindexes.
  const countries = await query<{ code: string }>(
    `SELECT co.\`code\`
     FROM \`countries\` co
     WHERE co.\`isActive\` = 1
       AND (SELECT COUNT(*) FROM \`groups\` g
            WHERE g.\`countryId\` = co.\`id\` AND g.\`status\` = 'live' AND g.\`isAdult\` = 0) >= 3`
  );
  const paisesFile = writeSitemap(
    "paises.xml",
    countries
      .filter((c) => c.code)
      .map((c) => urlEntry(`${BASE_URL}/pais/${c.code}`, undefined, "weekly", "0.9"))
  );

  // Cities — ONLY indexable ones: clean live groups AND the same thin-page
  // threshold the city page uses (>= 3 clean groups). Adult-included (cookie)
  // views are never in any sitemap — sitemaps describe the clean default state.
  const cityGroups = await query<{ city: string }>(
    `SELECT \`city\`, COUNT(*) AS \`n\`
     FROM \`groups\`
     WHERE \`status\` = 'live' AND \`isAdult\` = 0 AND \`city\` IS NOT NULL AND \`city\` <> ''
     GROUP BY \`city\` HAVING COUNT(*) >= 3`
  );
  const ciudadesFile = writeSitemap(
    "ciudades.xml",
    cityGroups
      .filter((c) => c.city)
      .map((c) => urlEntry(`${BASE_URL}/ciudad/${citySlug(c.city)}`, undefined, "weekly", "0.8"))
  );

  // Static pages
  const staticUrls = [
    urlEntry(`${BASE_URL}/`, undefined, "daily", "1.0"),
    urlEntry(`${BASE_URL}/populares`, undefined, "daily", "0.9"),
    urlEntry(`${BASE_URL}/agregar-grupo`, undefined, "monthly", "0.6"),
    urlEntry(`${BASE_URL}/sobre-nosotros`, undefined, "monthly", "0.6"),
    urlEntry(`${BASE_URL}/autores`, undefined, "weekly", "0.6"),
    urlEntry(`${BASE_URL}/guias`, undefined, "monthly", "0.6"),
    urlEntry(`${BASE_URL}/contacto`, undefined, "monthly", "0.5"),
    urlEntry(`${BASE_URL}/politica-de-privacidad`, undefined, "yearly", "0.3"),
    urlEntry(`${BASE_URL}/terminos`, undefined, "yearly", "0.3"),
    urlEntry(`${BASE_URL}/politica-de-cookies`, undefined, "yearly", "0.3"),
    urlEntry(`${BASE_URL}/reportar-grupo`, undefined, "monthly", "0.5"),
  ];
  const estaticasFile = writeSitemap("estaticas.xml", staticUrls);

  // Author profiles — the uploaders table (+ the /autores index page). UGC
  // contributors never get author pages, so they must NOT be here.
  const autores = await query<{ slug: string }>("SELECT `slug` FROM `uploaders`");
  const autoresFile = writeSitemap("autores.xml", [
    urlEntry(`${BASE_URL}/autores`, undefined, "weekly", "0.6"),
    ...autores
      .filter((a) => a.slug)
      .map((a) => urlEntry(`${BASE_URL}/autor/${a.slug}`, undefined, "monthly", "0.5")),
  ]);

  // Guías — all published posts. lastmod = updatedAt so edited posts re-enter
  // the crawl queue.
  const posts = await query<{ slug: string; updatedAt: Date | string }>(
    "SELECT `slug`, `updatedAt` FROM `blog_posts` WHERE `status` = 'published' ORDER BY `publishedAt` DESC"
  );
  const blogFile = writeSitemap(
    "blog.xml",
    posts
      .filter((p) => p.slug)
      .map((p) =>
        urlEntry(
          `${BASE_URL}/guias/${p.slug}`,
          safeDate(p.updatedAt),
          "monthly",
          "0.7"
        )
      )
  );

  // Sitemap index — only files that were actually written (empty sections
  // return null and must never appear in the index: a sitemap URL listed in
  // the index but missing on disk 404s, and an empty urlset file is the GSC
  // "missing url tag" error. Both are avoided by construction now.)
  const allFiles = [
    ...sitemapFiles,
    categoriasFile,
    paisesFile,
    ciudadesFile,
    blogFile,
    autoresFile,
    estaticasFile,
  ].filter((f): f is SitemapSubFile => f !== null);
  const today = new Date().toISOString().slice(0, 10);
  const indexContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allFiles
    .map((f) => `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${f.filename}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`)
    .join("\n")}\n</sitemapindex>`;
  writePublicFile("sitemap.xml", indexContent);

  const result: SitemapGenerationResult = {
    ok: true,
    baseUrl: BASE_URL,
    groups: groups.length,
    categories: categories.length,
    countries: countries.length,
    cities: cityGroups.length,
    posts: posts.length,
    authors: autores.length,
    staticPages: staticUrls.length,
    totalUrls: allFiles.reduce((sum, f) => sum + f.urlCount, 0),
    files: allFiles,
    durationMs: Date.now() - started,
    generatedAt: new Date().toISOString(),
  };
  lastRun = result;
  return result;
}

// ---------------------------------------------------------------------------
// Auto-heal — shared by the /sitemap.xml and /sitemaps/* route handlers
// ---------------------------------------------------------------------------

let lastHealAttempt = 0;
const HEAL_COOLDOWN_MS = 60_000;

/**
 * Regenerate sitemaps when a route handler finds its file missing (fresh
 * deploy: public/ starts empty until the first request or the nightly
 * cron). ONE shared cooldown across both handlers, so a Googlebot burst
 * over /sitemap.xml + all chunks triggers at most one regeneration per
 * minute. Never throws.
 */
export async function maybeHealSitemaps(): Promise<void> {
  if (Date.now() - lastHealAttempt < HEAL_COOLDOWN_MS) return;
  lastHealAttempt = Date.now();
  try {
    await generateSitemaps();
  } catch (err) {
    console.error(
      "[sitemap] auto-heal regeneration failed:",
      err instanceof Error ? err.message : err
    );
  }
}

// ---------------------------------------------------------------------------
// Status reader — powers the dashboard card (fresh vs stale badge)
// ---------------------------------------------------------------------------

export interface SitemapStatus {
  exists: boolean;
  generatedAt: string | null; // index file mtime
  totalUrls: number;
  groupsInSitemap: number;
  liveGroupsInDb: number;
  stale: boolean; // live groups in DB ≠ groups in sitemap files
  files: { filename: string; urlCount: number; bytes: number; updatedAt: string }[];
  error?: string;
}

/** Counts how many stale grupos-N.xml files exist (leftovers from a bigger DB). */
function listSitemapDir(): { filename: string; stat: fs.Stats }[] {
  if (!fs.existsSync(SITEMAPS_DIR)) return [];
  return fs
    .readdirSync(SITEMAPS_DIR)
    .filter((f) => f.endsWith(".xml"))
    .map((filename) => ({ filename, stat: fs.statSync(path.join(SITEMAPS_DIR, filename)) }))
    .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
}

function countUrls(file: string): number {
  try {
    const content = fs.readFileSync(path.join(SITEMAPS_DIR, file), "utf8");
    return (content.match(/<url>/g) || []).length;
  } catch {
    return 0;
  }
}

export async function getSitemapStatus(): Promise<SitemapStatus> {
  const files = listSitemapDir();
  const indexStat = (() => {
    try {
      return fs.statSync(path.join(SITEMAPS_DIR, "..", "sitemap.xml"));
    } catch {
      return null;
    }
  })();

  if (!indexStat || files.length === 0) {
    return {
      exists: false,
      generatedAt: null,
      totalUrls: 0,
      groupsInSitemap: 0,
      liveGroupsInDb: 0,
      stale: true,
      files: [],
    };
  }

  const detail = files.map((f) => ({
    filename: f.filename,
    urlCount: countUrls(f.filename),
    bytes: f.stat.size,
    updatedAt: f.stat.mtime.toISOString(),
  }));
  const groupsInSitemap = detail
    .filter((f) => f.filename.startsWith("grupos-"))
    .reduce((sum, f) => sum + f.urlCount, 0);
  const totalUrls = detail.reduce((sum, f) => sum + f.urlCount, 0);

  let liveGroupsInDb = 0;
  try {
    // Same filter the generator uses (live) so "stale" is exact.
    const row = await queryOne<{ c: number }>(
      "SELECT COUNT(*) AS `c` FROM `groups` WHERE `status` = 'live'"
    );
    liveGroupsInDb = Number(row?.c ?? 0);
  } catch (err) {
    console.error("[sitemap] status query failed:", err instanceof Error ? err.message : err);
  }

  return {
    exists: true,
    generatedAt: indexStat.mtime.toISOString(),
    totalUrls,
    groupsInSitemap,
    liveGroupsInDb,
    stale: liveGroupsInDb !== groupsInSitemap,
    files: detail,
  };
}
