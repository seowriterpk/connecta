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
 * Path strategy: process.cwd()/public — correct in dev (project root) AND in
 * production standalone mode (server runs from .next/standalone, whose
 * public/ copy is what Node actually serves).
 */

import fs from "fs";
import path from "path";
import { query, queryOne } from "@/lib/db";
import { citySlug } from "@/lib/data";
import { SITE } from "@/lib/constants";

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

function urlEntry(loc: string, lastmod?: string | null, changefreq = "weekly", priority = "0.7"): string {
  return `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function writeSitemap(filename: string, urls: string[]): SitemapSubFile {
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
  fs.writeFileSync(path.join(SITEMAPS_DIR, filename), content);
  return { filename, urlCount: urls.length, bytes: Buffer.byteLength(content) };
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

  const batchSize = 200;
  const sitemapFiles: SitemapSubFile[] = [];

  for (let i = 0; i < groups.length; i += batchSize) {
    const batch = groups.slice(i, i + batchSize);
    const fileNum = Math.floor(i / batchSize) + 1;
    sitemapFiles.push(
      writeSitemap(
        `grupos-${fileNum}.xml`,
        batch.map((g) =>
          urlEntry(
            `${BASE_URL}/grupo/${g.slug}`,
            new Date(g.updatedAt).toISOString().slice(0, 10),
            "weekly",
            "0.8"
          )
        )
      )
    );
  }

  // Categories — active ones, adult included (indexable; robots carries the
  // RTA label on-page).
  const categories = await query<{ slug: string }>(
    "SELECT `slug` FROM `categories` WHERE `isActive` = 1"
  );
  const categoriasFile = writeSitemap(
    "categorias.xml",
    categories.map((c) => urlEntry(`${BASE_URL}/categoria/${c.slug}`, undefined, "weekly", "0.9"))
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
    countries.map((c) => urlEntry(`${BASE_URL}/pais/${c.code}`, undefined, "weekly", "0.9"))
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
    cityGroups.map((c) => urlEntry(`${BASE_URL}/ciudad/${citySlug(c.city)}`, undefined, "weekly", "0.8"))
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
    ...autores.map((a) => urlEntry(`${BASE_URL}/autor/${a.slug}`, undefined, "monthly", "0.5")),
  ]);

  // Guías — all published posts. lastmod = updatedAt so edited posts re-enter
  // the crawl queue.
  const posts = await query<{ slug: string; updatedAt: Date | string }>(
    "SELECT `slug`, `updatedAt` FROM `blog_posts` WHERE `status` = 'published' ORDER BY `publishedAt` DESC"
  );
  const blogFile = writeSitemap(
    "blog.xml",
    posts.map((p) =>
      urlEntry(
        `${BASE_URL}/guias/${p.slug}`,
        new Date(p.updatedAt).toISOString().slice(0, 10),
        "monthly",
        "0.7"
      )
    )
  );

  // Sitemap index
  const allFiles = [
    ...sitemapFiles,
    categoriasFile,
    paisesFile,
    ciudadesFile,
    blogFile,
    autoresFile,
    estaticasFile,
  ];
  const today = new Date().toISOString().slice(0, 10);
  const indexContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allFiles
    .map((f) => `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${f.filename}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`)
    .join("\n")}\n</sitemapindex>`;
  fs.writeFileSync(path.join(SITEMAPS_DIR, "..", "sitemap.xml"), indexContent);

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
    console.error("[sitemap] status query failed:", err?.message || err);
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
