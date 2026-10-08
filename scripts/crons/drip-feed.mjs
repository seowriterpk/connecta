/**
 * Drip Feed Cron — runs every 15 minutes (hPanel: node scripts/crons/drip-feed.mjs)
 * Based on Groupizo VIP Logic SYSTEM 7 (Round-Robin Smart Queue).
 *
 * - Takes 5 groups from groups_queue (diverse by category+country)
 * - Generates unique SEO slug
 * - Inserts into groups table with status="live"
 * - Deletes from queue
 * - Duplicate defense: checks join_link before inserting
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
} from "./_lib.mjs";

loadEnvFile();
const pool = createPool();
const log = makeLogger("drip-feed");
const lock = makeLock("drip-feed", 10);

async function main() {
  log("Starting drip feed cron (mysql2 pool)...");

  if (!(await lock.acquire())) {
    log("Another instance is running. Exiting.");
    process.exit(0);
  }

  try {
    // Round-robin: take 1 from each unique category+country combination
    const queueItems = await q(
      pool,
      "SELECT * FROM `groups_queue` ORDER BY `addedAt` ASC LIMIT 50"
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
        if (selected.length >= 5) break;
      }
    }

    log(`Selected ${selected.length} groups for publishing (diverse).`);

    for (const item of selected) {
      try {
        // Duplicate defense (by invite code fragment)
        const code = item.joinLink.split("/").pop() ?? "";
        const existing = code
          ? await q1(pool, "SELECT `id` FROM `groups` WHERE `joinLink` LIKE ? LIMIT 1", [`%${code}%`])
          : null;

        if (existing) {
          await x(pool, "DELETE FROM `groups_queue` WHERE `id` = ?", [item.id]);
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
        log(`Published: '${item.groupName}' [slug: ${slug}]`);
      } catch (e) {
        log(`Error publishing '${item.groupName}': ${e.message}`);
      }
    }

    log("Drip feed complete.");
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
