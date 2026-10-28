/**
 * Drip Feed Cron — runs every 15 minutes (hPanel: node scripts/crons/drip-feed.mjs)
 * Based on Groupizo VIP Logic SYSTEM 7 (Round-Robin Smart Queue).
 *
 * - Takes 5 groups from groups_queue (diverse by category+country)
 * - Generates unique SEO slug
 * - Inserts into groups table with status="live"
 * - Deletes from queue
 * - Duplicate defense: checks join_link before inserting
 * - After publishing >0 groups: spawns sitemap-generator.mjs so new URLs
 *   enter the sitemap INSTANTLY (Task 31 follow-up — the sitemap must never
 *   lag behind the drip publisher by hours)
 */

import {
  loadEnvFile,
  createPool,
  q,
  q1,
  x,
  newId,
  generateSlug,
  makeUniqueSlug,
  makeLogger,
  makeLock,
  ROOT,
} from "./_lib.mjs";
import { spawn } from "child_process";
import path from "path";

loadEnvFile();
const pool = createPool();
const log = makeLogger("drip-feed");
const lock = makeLock("drip-feed", 10);

/**
 * Spawns the sitemap generator as a child process (same script the nightly
 * 2am hPanel cron runs). Never throws — a sitemap hiccup must not fail the
 * publish run. Shares this process's env (DB_* / BASE_URL from .env or the
 * inline cron command), logs go to logs/sitemap-gen.log.
 */
function refreshSitemap() {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [path.join(ROOT, "scripts", "crons", "sitemap-generator.mjs")],
      { cwd: ROOT, stdio: "ignore" }
    );
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, 120_000); // hard cap: never wedge the drip run
    child.on("error", (e) => {
      clearTimeout(timer);
      log(`Sitemap refresh spawn failed: ${e.message}`);
      resolve(false);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      log(code === 0 ? "Sitemap refresh done (instant, post-drip)." : `Sitemap refresh exited with code ${code}.`);
      resolve(code === 0);
    });
  });
}

async function main() {
  log("Starting drip feed cron (mysql2 pool)...");

  if (!(await lock.acquire())) {
    log("Another instance is running. Exiting.");
    process.exit(0);
  }

  try {
    // Publish count configurable from the dashboard (admin_settings.dripFeedPerRun);
    // falls back to 5 if the table/row is missing (e.g. pre-Task-22 DB).
    const PER_RUN = await (async () => {
      try {
        const row = await q1(
          pool,
          "SELECT `value` FROM `admin_settings` WHERE `key` = 'dripFeedPerRun' LIMIT 1"
        );
        const n = Number(row?.value);
        return Number.isFinite(n) && n >= 1 && n <= 100 ? Math.floor(n) : 5;
      } catch {
        return 5;
      }
    })();

    // Round-robin: take 1 from each unique category+country combination.
    // Pull enough rows to find PER_RUN diverse combos (cheap indexed scan).
    const PULL = Math.min(Math.max(PER_RUN * 5, 50), 500);
    const queueItems = await q(
      pool,
      `SELECT * FROM \`groups_queue\` ORDER BY \`addedAt\` ASC LIMIT ${PULL}`
    );

    if (queueItems.length === 0) {
      log("Queue empty. Nothing to publish.");
      return;
    }

    const seen = new Set();
    const selected = [];
    for (const item of queueItems) {
      const key = `${item.category}__${item.country}`;
      if (!seen.has(key)) {
        seen.add(key);
        selected.push(item);
        if (selected.length >= PER_RUN) break;
      }
    }

    log(`Selected ${selected.length} groups for publishing (diverse).`);

    let published = 0;
    let duplicates = 0;
    let errors = 0;

    for (const item of selected) {
      try {
        // Duplicate defense (by invite code fragment)
        const code = item.joinLink.split("/").pop() ?? "";
        const existing = code
          ? await q1(pool, "SELECT `id` FROM `groups` WHERE `joinLink` LIKE ? LIMIT 1", [`%${code}%`])
          : null;

        if (existing) {
          await x(pool, "DELETE FROM `groups_queue` WHERE `id` = ?", [item.id]);
          duplicates += 1;
          log(`Duplicate killed: ${item.groupName}`);
          continue;
        }

        // Resolve real taxonomy ids by name (best effort; fallback to raw value)
        const cat = await q1(pool, "SELECT `id` FROM `categories` WHERE `name` = ? OR `id` = ? LIMIT 1", [item.category, item.category]);
        const country = await q1(pool, "SELECT `id` FROM `countries` WHERE `name` = ? OR `id` = ? LIMIT 1", [item.country, item.country]);

        // Generate slug
        let slug;
        if (item.isAdult) {
          const inviteCode = item.joinLink.split("/").pop() ?? "group";
          slug = `invite-${inviteCode.slice(0, 8)}`;
          const slugOwner = await q1(pool, "SELECT `id` FROM `groups` WHERE `slug` = ? LIMIT 1", [slug]);
          if (slugOwner) slug = `${slug}-${Date.now().toString(36)}`;
        } else {
          const base = generateSlug(`${item.groupName} invite link`);
          const existingSlugs = await q(pool, "SELECT `slug` FROM `groups` WHERE `slug` LIKE ?", [`${base}%`]);
          const existingSet = new Set(existingSlugs.map((g) => g.slug));
          slug = makeUniqueSlug(base, (s) => existingSet.has(s));
        }

        const id = newId();
        await x(
          pool,
          `INSERT INTO \`groups\`
            (\`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`description\`, \`category\`, \`categoryId\`, \`country\`, \`countryId\`, \`city\`, \`keywords\`, \`tags\`, \`profileImage\`, \`language\`, \`status\`, \`linkStatus\`, \`isAdult\`, \`submitSource\`, \`uploaderId\`, \`lastActiveAt\`, \`lastValidatedAt\`, \`imageRefreshedAt\`, \`createdAt\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', 'active', ?, 'staff', ?, NOW(), NOW(), NOW(), NOW())`,
          [
            id,
            item.groupName,
            slug,
            item.joinLink,
            item.description ?? "",
            item.category,
            cat ? cat.id : item.category,
            item.country,
            country ? country.id : item.country,
            item.city ?? null,
            item.keywords ?? "[]",
            item.tags ?? "[]",
            item.profileImage ?? null,
            item.language ?? "Espanol",
            item.isAdult ? 1 : 0,
            item.uploaderId ?? null,
          ]
        );

        await x(pool, "DELETE FROM `groups_queue` WHERE `id` = ?", [item.id]);
        published += 1;
        log(`Published: '${item.groupName}' [slug: ${slug}]`);
      } catch (e) {
        errors += 1;
        log(`Error publishing '${item.groupName}': ${e.message}`);
      }
    }

    log(`Drip feed complete. Published ${published}, duplicates killed ${duplicates}, errors ${errors}.`);

    // Instant sitemap refresh — only when something actually went live.
    // (Empty queue or all-duplicates runs skip it; sitemap-gen has its own
    // lock so a collision with the nightly cron just exits cleanly.)
    if (published > 0) {
      await refreshSitemap();
    }
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
