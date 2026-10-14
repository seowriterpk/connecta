/**
 * make-import-sql.mjs — generates `import.sql` for the LIVE Hostinger MySQL.
 *
 * Run:  node scripts/make-import-sql.mjs
 * Out:  import.sql (repo root)
 *
 * What it produces (MySQL + MariaDB compatible, phpMyAdmin-importable):
 *   1. Session preamble (charset, SQL mode, FK checks off).
 *   2. CREATE TABLE IF NOT EXISTS for every business table (SHOW CREATE TABLE
 *      rewritten with IF NOT EXISTS, collation normalized to
 *      utf8mb4_unicode_ci — universal) → safe to import over a LIVE database
 *      that already has the tables (no more "table already exists" aborts).
 *   3. INSERT ... ON DUPLICATE KEY UPDATE for every row → re-running the file
 *      is safe AND updates existing rows (update semantics, not insert-ignore).
 *   4. Post-migrations (idempotent): /blog→/guias link rewrites, the
 *      "Ciudad de Panamá" city merge, blog author = Antonio C., rebrand
 *      REPLACE safety passes.
 *
 * ALSO writes `import-schema-fix.sql` — a tiny conditional-DDL-only file
 * (CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS for
 * every column, MariaDB 10.2+ syntax). Run it BEFORE import.sql if the live
 * schema drifted (import aborts with "Unknown column"); it is a 100% no-op
 * when the schema is already current.
 *
 * Excluded: admin_activity_log (internal noise), ugc_rate_limits (ephemeral).
 * The Next.js app self-heals any schema drift via SCHEMA GUARD on boot
 * (db.ts), so this dump only needs to carry data.
 */

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";

const DB = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "grupos",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gruposwhatsapp",
};

/** Tables in dump order (soft references only — logical order for humans). */
const TABLES = [
  "categories",
  "countries",
  "uploaders",
  "groups",
  "groups_queue",
  "blog_posts",
  "entity_intros",
  "group_feedback",
  "group_reviews",
  "group_reports",
  "group_daily_stats",
  "link_checks",
  "seo_overrides",
  "ugc_contributors",
  "ugc_submissions",
  "ugc_settings",
  "fav_lists",
  "newsletter",
];

/** Big-content tables get one INSERT per row (packet safety on shared hosting). */
const ONE_ROW_PER_INSERT = new Set(["blog_posts", "entity_intros", "groups"]);

/** 4-byte-safe UTF-8 SQL string literal. */
function sqlStr(val) {
  if (val === null || val === undefined) return "NULL";
  const s = String(val);
  return `'${s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    // strip NUL + other control chars MySQL rejects (keep \n \r \t handled above)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")}'`;
}

function sqlVal(v) {
  if (v === null || v === undefined) return "NULL";
  if (v instanceof Date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `'${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())} ${pad(
      v.getUTCHours()
    )}:${pad(v.getUTCMinutes())}:${pad(v.getUTCSeconds())}'`;
  }
  if (typeof v === "number") return String(v);
  if (typeof v === "bigint") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "object" && v.type === "Buffer") return sqlStr(v.toString("utf8"));
  return sqlStr(v);
}

function chunks(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/** Parse exact column definitions out of a SHOW CREATE TABLE statement
 *  (one per line, lines starting with a backtick; index/key lines skipped). */
function parseColumnDefs(createSql) {
  const m = createSql.match(/\)\s*ENGINE=/);
  const close = m ? m.index : createSql.lastIndexOf(")");
  const open = createSql.indexOf("(");
  if (open < 0 || close <= open) return [];
  const body = createSql.slice(open + 1, close);
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("`") && l.length > 0)
    .map((l) => l.replace(/,$/, ""));
}

async function main() {
  const pool = await mysql.createPool({ ...DB, charset: "utf8mb4", timezone: "Z", connectionLimit: 4 });
  const conn = await pool.getConnection();
  const parts = [];

  parts.push(`-- ============================================================================
-- Grupos Hoy (gruposhoy.com) — import.sql
-- ============================================================================
-- COMPLETE content update for the LIVE database (Hostinger MySQL / MariaDB).
--
-- WHAT THIS DOES
--   • Creates any missing tables (link_checks, group_feedback, entity_intros…)
--     — CONDITIONALLY: every CREATE is CREATE TABLE IF NOT EXISTS, so this
--     file imports cleanly EVEN IF ALL TABLES ALREADY EXIST on live.
--   • Inserts/updates ALL content: 104 groups, 22 categories, 20 countries,
--     40 blog posts (guias), 49 entity intros, uploader, feedback, SEO data
--   • Runs the post-migrations: /blog→/guias link rewrites, city merge
--     (Ciudad de Panamá → Panamá), blog author = Antonio C., rebrand passes
--
-- HOW TO IMPORT (Hostinger hPanel → phpMyAdmin, or mysql CLI)
--   1. (Recommended) Backup first: Export your current DB.
--   2. Select the gruposhoy database → Import → choose this file → UTF-8.
--   3. Or CLI:  mysql -u USER -p GRUPOSHOY_DB < import.sql
--
-- SAFE TO RE-RUN / SAFE OVER AN EXISTING DATABASE: every CREATE TABLE uses
-- IF NOT EXISTS, every INSERT uses ON DUPLICATE KEY UPDATE, and every
-- migration is idempotent. If the import aborts with "Unknown column"
-- (older live schema), run import-schema-fix.sql first, then re-run this
-- file — everything up to the error is already applied and will simply be
-- updated, never duplicated. Rows that exist on live but NOT in this file
-- (e.g. groups submitted by users) are left untouched.
--
-- AFTER IMPORTING: the /guias section (merged blog + guías) will show all
-- 40 posts at https://gruposhoy.com/guias. Then regenerate sitemaps:
--   node scripts/crons/sitemap-generator.mjs   (BASE_URL=gruposhoy.com)
--
-- Generated: ${new Date().toISOString()}
-- ============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET FOREIGN_KEY_CHECKS = 0;
`);

const schemaFixParts = [];
schemaFixParts.push(`-- ============================================================================
-- Grupos Hoy (gruposhoy.com) — import-schema-fix.sql
-- ============================================================================
-- CONDITIONAL SCHEMA PATCH (tiny companion to import.sql).
--
-- WHAT THIS DOES
--   • CREATE TABLE IF NOT EXISTS for every business table (structure only).
--   • ALTER TABLE ... ADD COLUMN IF NOT EXISTS for EVERY column — patches
--     older live tables that were created before a column existed.
--   • No data. No drops. No overwrites. Rows are never touched.
--
-- WHEN TO RUN
--   • Run this FIRST if import.sql aborted with "Unknown column 'x' in
--     'field list'" — it adds the missing column, then re-run import.sql.
--   • Or run it before the first import as cheap insurance.
--   • 100% NO-OP when the schema is already current (every statement is
--     guarded by IF NOT EXISTS) — safe to run any number of times.
--
-- ENGINE NOTE: ADD COLUMN IF NOT EXISTS requires MariaDB 10.2+ (Hostinger
-- shared hosting is MariaDB). On plain MySQL 8, skip this file — deploy the
-- app once instead: its SCHEMA GUARD (src/lib/db.ts) self-heals the schema
-- on boot, then run import.sql.
--
-- Generated: ${new Date().toISOString()}
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
`);

  for (const table of TABLES) {
    const [colsRows] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [DB.database, table]
    );
    if (!colsRows || colsRows.length === 0) {
      console.log(`skip ${table} (not found)`);
      continue;
    }
    const cols = colsRows.map((c) => c.COLUMN_NAME);
    const pk = colsRows.filter((c) => c.COLUMN_KEY === "PRI").map((c) => c.COLUMN_NAME);
    // Columns that update on duplicate (everything — full refresh semantics).
    const updateCols = cols.filter((c) => !pk.includes(c));

    const [createRow] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    let createSql = createRow[0]["Create Table"];
    // Normalize MariaDB-only collations to universal utf8mb4_unicode_ci.
    createSql = createSql.replace(/utf8mb4_uca1400_\w+/g, "utf8mb4_unicode_ci");
    // THE FIX: make the DDL conditional so importing over a live database
    // that already has these tables doesn't abort with "table already exists".
    createSql = createSql.replace(/^CREATE TABLE `/i, "CREATE TABLE IF NOT EXISTS `");

    parts.push(`\n-- ---------------------------------------------------------------------------\n-- Table: ${table}\n-- ---------------------------------------------------------------------------\n\n${createSql};\n`);

    // Companion schema-fix file: exact per-column defs parsed from the same
    // SHOW CREATE TABLE output (guaranteed identical to the real schema).
    const colDefs = parseColumnDefs(createSql);
    schemaFixParts.push(
      `\n-- ---------------------------------------------------------------------------\n-- Table: ${table}\n-- ---------------------------------------------------------------------------\n\n${createSql};\n`
    );
    for (const def of colDefs) {
      schemaFixParts.push(`ALTER TABLE \`${table}\` ADD COLUMN IF NOT EXISTS ${def};\n`);
    }

    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (!rows || rows.length === 0) {
      parts.push(`-- (no rows)\n`);
      console.log(`${table}: 0 rows (structure only)`);
      continue;
    }

    const colList = cols.map((c) => `\`${c}\``).join(", ");
    const updateClause = updateCols.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(", ");
    const batchSize = ONE_ROW_PER_INSERT.has(table) ? 1 : 25;

    for (const batch of chunks(rows, batchSize)) {
      const values = batch
        .map((r) => `(${cols.map((c) => sqlVal(r[c])).join(", ")})`)
        .join(",\n");
      parts.push(
        `INSERT INTO \`${table}\` (${colList}) VALUES\n${values}\nON DUPLICATE KEY UPDATE ${updateClause};\n`
      );
    }
    console.log(`${table}: ${rows.length} rows dumped`);
  }

  // Post-migrations — idempotent, ordered.
  parts.push(`
-- ---------------------------------------------------------------------------
-- POST-MIGRATIONS (idempotent — safe to re-run)
-- ---------------------------------------------------------------------------

-- 1) Blog → Guías merge: rewrite internal links inside post content.
UPDATE \`blog_posts\` SET \`content\` = REPLACE(\`content\`, '](/blog/', '](/guias/') WHERE \`content\` LIKE '%](/blog/%';
UPDATE \`blog_posts\` SET \`content\` = REPLACE(\`content\`, '](/blog)', '](/guias)') WHERE \`content\` LIKE '%](/blog)%';

-- 2) City merge: duplicate city rows → single canonical name.
UPDATE \`groups\` SET \`city\` = 'Panamá' WHERE \`city\` = 'Ciudad de Panamá';

-- 3) Blog author: every post signed by Antonio C. (editorial decision).
UPDATE \`blog_posts\` SET \`authorName\` = 'Antonio C.' WHERE \`authorName\` LIKE '%Equipo%';

-- 4) Rebrand safety passes (ConectaGrupos → Grupos Hoy), for rows that may
--    exist on live but are not part of this dump.
UPDATE \`blog_posts\` SET
  \`authorName\` = REPLACE(\`authorName\`, 'ConectaGrupos', 'Grupos Hoy'),
  \`title\`       = REPLACE(\`title\`, 'ConectaGrupos', 'Grupos Hoy'),
  \`excerpt\`     = REPLACE(\`excerpt\`, 'ConectaGrupos', 'Grupos Hoy'),
  \`content\`     = REPLACE(\`content\`, 'ConectaGrupos', 'Grupos Hoy'),
  \`metaTitle\`   = REPLACE(\`metaTitle\`, 'ConectaGrupos', 'Grupos Hoy'),
  \`metaDescription\` = REPLACE(\`metaDescription\`, 'ConectaGrupos', 'Grupos Hoy')
WHERE CONCAT_WS(' ', \`authorName\`, \`title\`, \`excerpt\`, \`content\`, \`metaTitle\`, \`metaDescription\`) LIKE '%conecta%';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF IMPORT — verify with:
--   SELECT COUNT(*) FROM blog_posts WHERE status='published';      -- 40
--   SELECT COUNT(*) FROM entity_intros;                            -- 49
--   SELECT COUNT(*) FROM \`groups\` WHERE status='live';                 -- 104
--   SELECT city, COUNT(*) FROM \`groups\` WHERE city LIKE '%anamá%' GROUP BY city;  -- single row: Panamá
-- ============================================================================
`);

  await conn.release();
  await pool.end();

  const out = path.join(process.cwd(), "import.sql");
  fs.writeFileSync(out, parts.join(""), "utf8");
  const size = (fs.statSync(out).size / 1024 / 1024).toFixed(2);
  console.log(`\nWrote ${out} (${size} MB)`);

  const outFix = path.join(process.cwd(), "import-schema-fix.sql");
  schemaFixParts.push(`\nSET FOREIGN_KEY_CHECKS = 1;\n`);
  fs.writeFileSync(outFix, schemaFixParts.join(""), "utf8");
  const sizeFix = (fs.statSync(outFix).size / 1024).toFixed(1);
  console.log(`Wrote ${outFix} (${sizeFix} KB)`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
