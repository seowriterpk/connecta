/**
 * Link Checker Cron — runs every 6 hours (hPanel: node scripts/crons/link-checker.mjs)
 * Based on Groupizo VIP Logic SYSTEM 2 (Parallel Bulk Checking).
 *
 * - Checks 150 groups (oldest validated first) — batch size configurable from
 *   the dashboard (admin_settings.linkCheckCronBatch)
 * - 3-state: active / revoked / unknown (skip on error)
 * - Lock file prevents overlapping runs
 *
 * Task 33 (false-revoke incident, owner 2026-10-29):
 *  - BOUNDED CONCURRENCY: the old `Promise.allSettled` fired the whole batch
 *    (150+) SIMULTANEOUSLY through one keep-alive proxy pool → a handful of
 *    sticky exit IPs got hammered → WhatsApp 403/429'd them → the (then buggy)
 *    direct fallback served block pages → ~80% of groups falsely "revoked".
 *    Now: 6 workers max, staggered starts, every request on a FRESH proxy
 *    connection (own exit IP) with 403/429-aware retry (see _lib.mjs).
 *  - HEALING PASS: falsely-revoked rows are invisible to the active batch
 *    (it only selects linkStatus='active'), so each run also re-verifies the
 *    50 oldest-validated REVOKED rows — the fixed classifier flips false
 *    revokes back to active automatically over time.
 */

import {
  loadEnvFile,
  createPool,
  q,
  x,
  fetchWhatsAppMeta,
  mapLimit,
  makeLogger,
  makeLock,
} from "./_lib.mjs";

loadEnvFile();
const pool = createPool();
const log = makeLogger("link-checker");
const lock = makeLock("link-checker", 10);

/** Max simultaneous meta fetches. Every fetch uses its OWN exit IP, so this
 *  is total request-rate pacing, not per-IP load (per-IP = 1). */
const CONCURRENCY = 6;
/** Stagger between worker starts (ms) so the first wave isn't a burst. */
const STAGGER_MS = 250;

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
    // Batch size configurable from the dashboard (admin_settings.linkCheckCronBatch);
    // falls back to 150 if the table/row is missing (e.g. pre-Task-22 DB).
    const LIMIT = await (async () => {
      try {
        const row = await q(
          pool,
          "SELECT `value` FROM `admin_settings` WHERE `key` = 'linkCheckCronBatch' LIMIT 1"
        );
        const n = Number(row?.[0]?.value);
        return Number.isFinite(n) && n >= 20 && n <= 2000 ? Math.floor(n) : 150;
      } catch {
        return 150;
      }
    })();

    // Pull LIMIT groups, oldest validated first
    const groups = await q(
      pool,
      `SELECT \`id\`, \`joinLink\` FROM \`groups\` WHERE \`status\` = 'live' AND \`linkStatus\` = 'active' ORDER BY \`lastValidatedAt\` ASC LIMIT ${LIMIT}`
    );

    log(`Checking ${groups.length} active links (${CONCURRENCY} concurrent, staggered)...`);

    const results = await mapLimit(groups, CONCURRENCY, (g) => checkGroup(g), STAGGER_MS);

    let active = 0;
    let revoked = 0;
    let skipped = 0;

    for (const r of results) {
      if (!r) {
        skipped++;
        continue;
      }
      const { groupId, status } = r;
      if (status === "active") {
        await x(pool, "UPDATE `groups` SET `linkStatus` = 'active', `lastValidatedAt` = NOW() WHERE `id` = ?", [groupId]);
        active++;
      } else if (status === "revoked") {
        // DOWNLOAD-ONCE policy (user directive 2026-10-21): the self-hosted
        // image at /media/group_images is KEPT when the link dies — the
        // public card keeps showing it with the red "Expirado" icon.
        // We only flip linkStatus; no data is destroyed.
        await x(
          pool,
          "UPDATE `groups` SET `linkStatus` = 'revoked', `lastValidatedAt` = NOW() WHERE `id` = ?",
          [groupId]
        );
        revoked++;
      } else {
        // unknown — skip, just update validated timestamp
        await x(pool, "UPDATE `groups` SET `lastValidatedAt` = NOW() WHERE `id` = ?", [groupId]);
        skipped++;
      }
    }

    log(`Active batch done. Active: ${active} | Revoked: ${revoked} | Skipped/Unknown: ${skipped}`);

    // --- Healing pass (Task 33): re-verify oldest REVOKED rows -------------
    const HEAL_BATCH = 50;
    const revokedRows = await q(
      pool,
      `SELECT \`id\`, \`joinLink\` FROM \`groups\` WHERE \`status\` = 'live' AND \`linkStatus\` = 'revoked' ORDER BY \`lastValidatedAt\` ASC LIMIT ${HEAL_BATCH}`
    );

    if (revokedRows.length > 0) {
      log(`Healing pass: re-verifying ${revokedRows.length} revoked rows...`);
      const healResults = await mapLimit(revokedRows, CONCURRENCY, (g) => checkGroup(g), STAGGER_MS);
      let recovered = 0;
      let stillRevoked = 0;
      let unknown = 0;

      for (const r of healResults) {
        if (!r) {
          unknown++;
          continue;
        }
        if (r.status === "active") {
          // FALSE revoke — restore. (Never touch profileImage: download-once
          // policy kept it; rows without an image get one from the image
          // refresh cron / bulk tool once they're active again.)
          await x(
            pool,
            "UPDATE `groups` SET `linkStatus` = 'active', `lastValidatedAt` = NOW() WHERE `id` = ?",
            [r.groupId]
          );
          recovered++;
        } else if (r.status === "revoked") {
          // Confirmed again by the hardened classifier — leave revoked.
          await x(pool, "UPDATE `groups` SET `lastValidatedAt` = NOW() WHERE `id` = ?", [r.groupId]);
          stillRevoked++;
        } else {
          // Unknown → do NOT bump lastValidatedAt so it re-enters the
          // healing queue first on the next run.
          unknown++;
        }
      }

      log(
        `Healing pass done. Recovered (false revoke → active): ${recovered} | Still revoked: ${stillRevoked} | Unknown: ${unknown}`
      );
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
