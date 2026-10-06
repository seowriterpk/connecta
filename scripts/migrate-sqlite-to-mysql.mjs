/**
 * One-time migration: SQLite (old Prisma dev DB) → MySQL (mysql2 pool).
 * Run with bun: bun scripts/migrate-sqlite-to-mysql.mjs
 *
 * - Creates the MySQL schema first (same Schema Guard as the app).
 * - Copies every row from every table, converting Prisma's ms-epoch
 *   DATETIME integers into JS Dates (mysql2 writes proper DATETIMEs).
 * - INSERT IGNORE → safe to re-run (no duplicates).
 */

import { Database } from "bun:sqlite";
import { dbReady, query, exec } from "../src/lib/db";
import fs from "fs";
import path from "path";

const SQLITE_PATH = path.join(import.meta.dir, "..", "db", "legacy-sqlite.db");

if (!fs.existsSync(SQLITE_PATH)) {
  console.error(`No SQLite file at ${SQLITE_PATH} — nothing to migrate.`);
  process.exit(1);
}

const DATE_COL = /(At|Date|Until)$/i;

function toMysqlValue(colName, value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && DATE_COL.test(colName)) {
    return new Date(value); // ms epoch → Date
  }
  if (typeof value === "bigint") return Number(value);
  return value;
}

async function migrateTable(sqlite, table) {
  const cols = sqlite
    .query(`PRAGMA table_info("${table}")`)
    .all()
    .map((c) => c.name);
  if (cols.length === 0) return 0;

  const rows = sqlite.query(`SELECT * FROM "${table}"`).all();
  if (rows.length === 0) return 0;

  const colList = cols.map((c) => `\`${c}\``).join(", ");
  const placeholders = cols.map(() => "?").join(", ");

  // Read in batches and INSERT IGNORE (idempotent)
  for (const row of rows) {
    const params = cols.map((c) => toMysqlValue(c, row[c] ?? null));
    await exec(
      `INSERT IGNORE INTO \`${table}\` (${colList}) VALUES (${placeholders})`,
      params
    );
  }
  return rows.length;
}

async function main() {
  console.log("Opening SQLite:", SQLITE_PATH);
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  console.log("Ensuring MySQL schema (Schema Guard)...");
  await dbReady();

  const tables = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name);

  const order = [
    "categories",
    "countries",
    "uploaders",
    "ugc_contributors",
    "groups",
    "groups_queue",
    "ugc_submissions",
    "group_reports",
    "group_reviews",
    "ugc_rate_limits",
    "ugc_settings",
    "seo_overrides",
    "entity_intros",
    "admin_activity_log",
    "newsletter",
  ];

  let total = 0;
  for (const t of order) {
    if (!tables.includes(t)) continue;
    const n = await migrateTable(sqlite, t);
    if (n > 0) console.log(`  ✓ ${t}: ${n} rows`);
    total += n;
  }

  console.log(`\nMigration complete — ${total} rows copied to MySQL.`);

  // Verify
  const [{ c }] = await query("SELECT COUNT(*) AS c FROM `groups`");
  const [{ c: live }] = await query("SELECT COUNT(*) AS c FROM `groups` WHERE `status` = 'live'");
  console.log(`Verification: groups=${c} (live=${live})`);

  sqlite.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("MIGRATION FAILED:", e);
  process.exit(1);
});
