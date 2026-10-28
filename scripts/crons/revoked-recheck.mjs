/**
 * Revoked Recheck — ONE-SHOT mass healer for the false-revoke wave (Task 33).
 *
 * Run once on Hostinger after deploying the Task 33 fixes:
 *   node scripts/crons/revoked-recheck.mjs
 * (optionally: RECHECK_LIMIT=500 node scripts/crons/revoked-recheck.mjs)
 *
 * What happened: during proxy overload the old classifier saw WhatsApp's
 * datacenter block page (200, no og:title) and marked ~80% of groups
 * "revoked". Those rows are invisible to the link-checker (it only selects
 * linkStatus='active'), so they would never self-heal — except slowly via
 * the 50-rows-per-run healing pass.
 *
 * This script re-verifies EVERY live+revoked row with the hardened
 * classifier (3 rotating proxy IPs per row, direct fetch can never classify
 * revoked) and flips false revokes back to active in bounded, staggered
 * batches. Rows that confirm revoked keep their status (download-once policy
 * — their local image is never destroyed).
 *
 * After healing, rows missing a local image are picked up again by the
 * image-refresh cron and the dashboard bulk image tool.
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
const log = makeLogger("revoked-recheck");
const lock = makeLock("revoked-recheck", 30);

const CONCURRENCY = 6;
const STAGGER_MS = 250;
const LIMIT = (() => {
  const n = Number(process.env.RECHECK_LIMIT);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 0; // 0 = all
})();

async function main() {
  log("Starting revoked recheck (one-shot mass healer, Task 33)...");
  log(
    "Hardened classifier active: 3 rotating proxy IPs per link; direct datacenter pages can NEVER classify revoked."
  );

  if (!(await lock.acquire())) {
    log("Another instance is running. Exiting.");
    process.exit(0);
  }

  try {
    const rows = await q(
      pool,
      `SELECT \`id\`, \`groupName\`, \`joinLink\` FROM \`groups\`
       WHERE \`status\` = 'live' AND \`linkStatus\` = 'revoked'
       ORDER BY \`lastValidatedAt\` ASC${LIMIT ? ` LIMIT ${LIMIT}` : ""}`
    );

    if (rows.length === 0) {
      log("No revoked live rows to recheck. Nothing to do.");
      return;
    }

    log(`Re-verifying ${rows.length} revoked rows (${CONCURRENCY} concurrent, staggered)...`);

    let done = 0;
    const counters = { recovered: 0, stillRevoked: 0, unknown: 0, errors: 0 };

    await mapLimit(
      rows,
      CONCURRENCY,
      async (row) => {
        try {
          const meta = await fetchWhatsAppMeta(row.joinLink);
          if (meta.status === "active") {
            // FALSE revoke — restore to active.
            await x(
              pool,
              "UPDATE `groups` SET `linkStatus` = 'active', `lastValidatedAt` = NOW() WHERE `id` = ?",
              [row.id]
            );
            counters.recovered++;
            log(`RECOVERED: '${row.groupName}' was falsely revoked → active again`);
          } else if (meta.status === "revoked") {
            await x(pool, "UPDATE `groups` SET `lastValidatedAt` = NOW() WHERE `id` = ?", [row.id]);
            counters.stillRevoked++;
          } else {
            // unknown — leave untouched so the next link-checker healing
            // pass retries it first (oldest lastValidatedAt wins).
            counters.unknown++;
          }
        } catch {
          counters.errors++;
        }
        done++;
        if (done % 50 === 0) {
          log(`Progress: ${done}/${rows.length} (recovered ${counters.recovered})`);
        }
      },
      STAGGER_MS
    );

    log(
      `Revoked recheck COMPLETE. Total: ${rows.length} | Recovered → active: ${counters.recovered} | Still revoked: ${counters.stillRevoked} | Unknown (retry later): ${counters.unknown} | Errors: ${counters.errors}`
    );
    log("Recovered rows without a local image will get one from the image-refresh cron / bulk tool.");
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
