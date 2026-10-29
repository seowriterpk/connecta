/**
 * Sitemap Generator Cron — runs nightly at 2am (hPanel: node scripts/crons/sitemap-generator.mjs)
 * Based on Groupizo VIP Logic SYSTEM 17.
 *
 * - Generates XML sitemap files in /public/sitemaps/
 * - grupos-N.xml (200 per file, adult groups INCLUDED — they are indexable
 *   now and the sitemap is their discovery path), categorias (adult included),
 *   paises, ciudades (clean-only, matching the city pages), blog (published
 *   posts), estaticas
 * - sitemap.xml index pointing to all
 * - EMPTY SECTIONS (Task 36): a sub-sitemap with zero URLs is never written
 *   (an empty <urlset> is the Search Console "Missing XML tag: url" error —
 *   the blog.xml GSC error from 28/10); its stale file is deleted and it's
 *   omitted from the index. Kept in sync with src/lib/sitemap.ts.
 */

import {
  loadEnvFile,
  createPool,
  q,
  citySlug,
  makeLogger,
  makeLock,
  ROOT,
  publicDirs,
  writePublicFile,
} from "./_lib.mjs";
import fs from "fs";
import path from "path";

loadEnvFile();
const pool = createPool();
const BASE_URL = process.env.BASE_URL || "https://gruposhoy.com";
const log = makeLogger("sitemap-gen");
const lock = makeLock("sitemap-gen", 30);

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** YYYY-MM-DD or null when missing/invalid — a null lastmod omits the tag
 *  instead of throwing RangeError and aborting the whole run. */
function safeDate(v) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function urlEntry(loc, lastmod, changefreq = "weekly", priority = "0.7") {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

/** Zero URLs → remove the stale file from every public copy and return
 *  null (the caller omits it from the index). An empty <urlset> is the GSC
 *  "Missing XML tag: url" error — Task 36. */
function writeSitemap(filename, urls) {
  if (urls.length === 0) {
    for (const dir of publicDirs()) {
      try {
        fs.unlinkSync(path.join(dir, "sitemaps", filename));
        log(`Removed empty-section sitemap ${filename}`);
      } catch {
        /* file not in this copy — fine */
      }
    }
    return null;
  }
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
  // writePublicFile targets <root>/public/ AND .next/standalone/public/
  // (both copies are read by the /sitemaps/* route handlers, which serve
  // the XML — Next 16 never re-scans public/ after boot, so static
  // serving can't be relied on for runtime-generated files).
  writePublicFile(path.join("sitemaps", filename), content);
  log(`Wrote ${filename} (${urls.length} URLs)`);
  return { filename, urlCount: urls.length, bytes: Buffer.byteLength(content) };
}

/**
 * Remove grupos-N.xml chunks left over from a bigger DB (site shrank → old
 * high-numbered chunks would linger on disk, counted by the admin status
 * card and fetchable by crawlers that remember old URLs). Only the
 * grupos-N pattern is touched, and only when there are still live groups.
 * Kept in sync with src/lib/sitemap.ts.
 */
function cleanupStaleChunks(chunkCount) {
  if (chunkCount <= 0) return; // never wipe chunks on an empty/glitchy read
  for (const dir of publicDirs()) {
    const sdir = path.join(dir, "sitemaps");
    let entries;
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
          log(`Removed stale chunk ${entry} (now ${chunkCount} chunks)`);
        } catch {
          /* best effort */
        }
      }
    }
  }
}

async function main() {
  log("Starting sitemap generator cron (mysql2 pool)...");

  if (!(await lock.acquire())) {
    log("Another instance is running. Exiting.");
    process.exit(0);
  }

  try {
    // Groups — ALL live groups (adult included: adult pages are indexable
    // and the sitemap is their discovery path — clean pages don't link there).
    // Revoked/expired links INCLUDED too (NEVER-NOINDEX DIRECTIVE, owner
    // 2026-10-28): every live group URL stays indexable; expired only sinks
    // in ranking. Kept in sync with src/lib/sitemap.ts.
    const groups = await q(
      pool,
      "SELECT `slug`, `updatedAt` FROM `groups` WHERE `status` = 'live' ORDER BY `updatedAt` DESC"
    );
    const liveGroups = groups.filter((g) => typeof g.slug === "string" && g.slug.length > 0);

    const batchSize = 200;
    const sitemapFiles = [];

    for (let i = 0; i < liveGroups.length; i += batchSize) {
      const batch = liveGroups.slice(i, i + batchSize);
      const fileNum = Math.floor(i / batchSize) + 1;
      const urls = batch.map((g) =>
        urlEntry(
          `${BASE_URL}/grupo/${g.slug}`,
          safeDate(g.updatedAt),
          "weekly",
          "0.8"
        )
      );
      const chunk = writeSitemap(`grupos-${fileNum}.xml`, urls);
      if (chunk) sitemapFiles.push(chunk);
    }
    cleanupStaleChunks(sitemapFiles.length);

    // Categories — active ones, adult included (indexable since the
    // MIGRACIÓN ADULTO INDEXABLE; robots carries the RTA label on-page).
    const categories = await q(pool, "SELECT `slug` FROM `categories` WHERE `isActive` = 1");
    const categoriasFile = writeSitemap(
      "categorias.xml",
      categories
        .filter((c) => c.slug)
        .map((c) => urlEntry(`${BASE_URL}/categoria/${c.slug}`, undefined, "weekly", "0.9"))
    );

    // Countries — ONLY indexable ones. The pais pages apply the thin-content
    // rule (clean live groupCount < 3 → noindex, follow); a sitemap must never
    // list a URL the page itself noindexes (mixed robots signals waste crawl
    // budget and confuse Google).
    const countries = await q(
      pool,
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
    // threshold the city page uses (>= 3 clean groups → indexable; fewer →
    // noindex, so excluded here). Adult-included (cookie) views are never in
    // any sitemap — sitemaps describe the clean default state.
    const cityGroups = await q(
      pool,
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

    // Static pages — never empty by construction
    const estaticasFile = writeSitemap("estaticas.xml", [
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
    ]);

    // Author profiles — the uploaders table (+ the /autores index page).
    // After the AUTORES migration there is a single author: the Equipo
    // Grupos Hoy (equipo editorial) — /autor/equipo-gruposhoy.
    // UGC contributors never get author pages (they only appear as
    // "publicado por" credits on group pages), so they must NOT be here.
    const autores = await q(
      pool,
      "SELECT `slug` FROM `uploaders`"
    );
    const autoresFile = writeSitemap(
      "autores.xml",
      [
        urlEntry(`${BASE_URL}/autores`, undefined, "weekly", "0.6"),
        ...autores
          .filter((a) => a.slug)
          .map((a) => urlEntry(`${BASE_URL}/autor/${a.slug}`, undefined, "monthly", "0.5")),
      ]
    );

    // Guías — all published posts (Antonio C. editorial line). lastmod = updatedAt
    // so edited posts re-enter the crawl queue. (Blog + guías merged: /guias/{slug}.)
    // Empty blog (no published posts) → blog.xml is removed and omitted from
    // the index (an empty urlset is the GSC "missing url tag" error — Task 36).
    const posts = await q(
      pool,
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

    // Sitemap index — ONLY files that were actually written (empty sections
    // return null). The old code hardcoded all 6 fixed names, so a wiped or
    // empty section still appeared in the index and 404'd (Task 36).
    const allFiles = [
      ...sitemapFiles,
      categoriasFile,
      paisesFile,
      ciudadesFile,
      blogFile,
      autoresFile,
      estaticasFile,
    ].filter((f) => f !== null);
    const today = new Date().toISOString().slice(0, 10);

    const indexContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allFiles
      .map((f) => `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${f.filename}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`)
      .join("\n")}\n</sitemapindex>`;

    writePublicFile("sitemap.xml", indexContent);
    log(`Wrote sitemap.xml index (${allFiles.length} sub-sitemaps)`);

    log(`Sitemap generation complete. Total groups: ${liveGroups.length}`);
  } finally {
    lock.release();
    await pool.end();
  }
}

main().catch((e) => {
  log(`FATAL: ${e.message}`);
  lock.release();
  process.exit(1);
});
