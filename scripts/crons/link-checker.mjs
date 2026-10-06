/**
 * Link Checker Cron — runs every 6 hours (hPanel: node scripts/crons/link-checker.mjs)
 * Based on Groupizo VIP Logic SYSTEM 2 (Parallel Bulk Checking).
 *
 * - Checks 150 groups (oldest validated first)
 * - Promise.allSettled parallel requests
 * - 3-state: active / revoked / unknown (skip on error)
 * - Lock file prevents overlapping runs
 */

import {
  loadEnvFile,
  createPool,
  q,
  x,
  fetchWhatsAppMeta,
  makeLogger,
  makeLock,
} from "./_lib.mjs";

loadEnvFile();
const pool = createPool();
const log = makeLogger("link-checker");
const lock = makeLock("link-checker", 10);

async function checkGroup(group) {
  try {
    const meta = await fetchWhatsAppMeta(group.joinLink);
    return { groupId: group.id, status: meta.status };
  } catch {
    return { groupId: group.id, status: "unknown" };
  }
}

async function main() {
  log("Starting link checker cron (mysql2 pool)...");

  if (!(await lock.acquire())) {
    process.exit(0);
  }

  try {
    // Pull 150 groups, oldest validated first
    const groups = await q(
      pool,
      "SELECT `id`, `joinLink` FROM `groups` WHERE `status` = 'live' AND `linkStatus` = 'active' ORDER BY `lastValidatedAt` ASC LIMIT 150"
    );

    log(`Checking ${groups.length} groups in parallel...`);

    const results = await Promise.allSettled(groups.map((g) => checkGroup(g)));

    let active = 0;
    let revoked = 0;
    let skipped = 0;

    for (const r of results) {
      if (r.status === "fulfilled") {
        const { groupId, status } = r.value;
        if (status === "active") {
          await x(pool, "UPDATE `groups` SET `linkStatus` = 'active', `lastValidatedAt` = NOW() WHERE `id` = ?", [groupId]);
          active++;
        } else if (status === "revoked") {
          await x(
            pool,
            "UPDATE `groups` SET `linkStatus` = 'revoked', `profileImage` = NULL, `lastValidatedAt` = NOW() WHERE `id` = ?",
            [groupId]
          );
          revoked++;
        } else {
          // unknown — skip, just update validated timestamp
          await x(pool, "UPDATE `groups` SET `lastValidatedAt` = NOW() WHERE `id` = ?", [groupId]);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    log(`Batch done. Active: ${active} | Revoked: ${revoked} | Skipped: ${skipped}`);
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
