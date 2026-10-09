/**
 * Sitemap Generator Cron — runs nightly at 2am (hPanel: node scripts/crons/sitemap-generator.mjs)
 * Based on Groupizo VIP Logic SYSTEM 17.
 *
 * - Generates XML sitemap files in /public/sitemaps/
 * - grupos-N.xml (200 per file, never adult), categorias, paises, ciudades, estaticas
 * - sitemap.xml index pointing to all
 */

import {
  loadEnvFile,
  createPool,
  q,
  citySlug,
  makeLogger,
  makeLock,
  ROOT,
} from "./_lib.mjs";
import fs from "fs";
import path from "path";

loadEnvFile();
const pool = createPool();
const BASE_URL = process.env.BASE_URL || "https://conectagrupos.com";
const SITEMAPS_DIR = path.join(ROOT, "public", "sitemaps");
const log = makeLogger("sitemap-gen");
const lock = makeLock("sitemap-gen", 30);

function urlEntry(loc, lastmod, changefreq = "weekly", priority = "0.7") {
  return `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function writeSitemap(filename, urls) {
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
  fs.writeFileSync(path.join(SITEMAPS_DIR, filename), content);
  log(`Wrote ${filename} (${urls.length} URLs)`);
}

async function main() {
  log("Starting sitemap generator cron (mysql2 pool)...");

  if (!(await lock.acquire())) {
    log("Another instance is running. Exiting.");
    process.exit(0);
  }

  if (!fs.existsSync(SITEMAPS_DIR)) {
    fs.mkdirSync(SITEMAPS_DIR, { recursive: true });
  }

  try {
    // Groups (never adult, 200 per file)
    const groups = await q(
      pool,
      "SELECT `slug`, `updatedAt` FROM `groups` WHERE `status` = 'live' AND `isAdult` = 0 ORDER BY `updatedAt` DESC"
    );

    const batchSize = 200;
    const sitemapFiles = [];

    for (let i = 0; i < groups.length; i += batchSize) {
      const batch = groups.slice(i, i + batchSize);
      const fileNum = Math.floor(i / batchSize) + 1;
      const filename = `grupos-${fileNum}.xml`;
      const urls = batch.map((g) =>
        urlEntry(
          `${BASE_URL}/grupo/${g.slug}`,
          new Date(g.updatedAt).toISOString().slice(0, 10),
          "weekly",
          "0.8"
        )
      );
      writeSitemap(filename, urls);
      sitemapFiles.push({ filename, lastmod: new Date().toISOString().slice(0, 10) });
    }

    // Categories (never adult — adult categories are not submitted to search engines)
    const categories = await q(pool, "SELECT `slug` FROM `categories` WHERE `isActive` = 1 AND `isAdult` = 0");
    writeSitemap("categorias.xml", categories.map((c) => urlEntry(`${BASE_URL}/categoria/${c.slug}`, undefined, "weekly", "0.9")));

    // Countries
    const countries = await q(pool, "SELECT `code` FROM `countries` WHERE `isActive` = 1");
    writeSitemap("paises.xml", countries.map((c) => urlEntry(`${BASE_URL}/pais/${c.code}`, undefined, "weekly", "0.9")));

    // Cities (only those with groups)
    const cityGroups = await q(
      pool,
      "SELECT DISTINCT `city` FROM `groups` WHERE `status` = 'live' AND `isAdult` = 0 AND `city` IS NOT NULL AND `city` <> ''"
    );
    writeSitemap("ciudades.xml", cityGroups.map((c) => urlEntry(`${BASE_URL}/ciudad/${citySlug(c.city)}`, undefined, "weekly", "0.8")));

    // Static pages
    writeSitemap("estaticas.xml", [
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

    // Author profiles — staff uploaders ONLY (+ index page).
    // UGC contributors never get author pages (they only appear as
    // "publicado por" credits on group pages), so they must NOT be here.
    const autores = await q(
      pool,
      "SELECT `slug` FROM `uploaders`"
    );
    writeSitemap(
      "autores.xml",
      [
        urlEntry(`${BASE_URL}/autores`, undefined, "weekly", "0.6"),
        ...autores.map((a) => urlEntry(`${BASE_URL}/autor/${a.slug}`, undefined, "monthly", "0.5")),
      ]
    );

    // Sitemap index
    const allFiles = [
      ...sitemapFiles,
      { filename: "categorias.xml", lastmod: new Date().toISOString().slice(0, 10) },
      { filename: "paises.xml", lastmod: new Date().toISOString().slice(0, 10) },
      { filename: "ciudades.xml", lastmod: new Date().toISOString().slice(0, 10) },
      { filename: "autores.xml", lastmod: new Date().toISOString().slice(0, 10) },
      { filename: "estaticas.xml", lastmod: new Date().toISOString().slice(0, 10) },
    ];

    const indexContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allFiles
      .map((f) => `  <sitemap>\n    <loc>${BASE_URL}/sitemaps/${f.filename}</loc>\n    <lastmod>${f.lastmod}</lastmod>\n  </sitemap>`)
      .join("\n")}\n</sitemapindex>`;

    fs.writeFileSync(path.join(SITEMAPS_DIR, "..", "sitemap.xml"), indexContent);
    log(`Wrote sitemap.xml index (${allFiles.length} sub-sitemaps)`);

    log(`Sitemap generation complete. Total groups: ${groups.length}`);
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
