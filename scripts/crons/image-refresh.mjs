/**
 * Image Refresh Cron — runs every 10 minutes (hPanel: node scripts/crons/image-refresh.mjs)
 * Based on Groupizo VIP Logic SYSTEM 3.
 *
 * - Picks 60 groups that still DON'T hold a local image (new rows, groups
 *   whose image was nulled by the link-checker, imports from before the
 *   localization policy) where imageRefreshedAt < 2 hours ago (or NULL)
 * - Re-fetches og:image from WhatsApp invite URL (through the residential proxy)
 * - Persists to <project>/media/group_images/<group-name-slug>.jpg
 *   (name-based, random-digits suffix on collision, sharp 300x300 JPEG 80% when available)
 * - DB stores the local /media/group_images URL — robots-blocked (never indexed)
 *
 * COST POLICY (3k+ groups): groups that ALREADY have a local image are never
 * re-fetched — the og:image rarely changes, and re-downloading every group
 * every 2h would burn ~7GB/day of paid proxy bandwidth at 3k scale. The cron
 * is now a localization *safety net* (new/missing images only), so steady-state
 * proxy cost is ~zero.
 */

import {
  loadEnvFile,
  createPool,
  q,
  x,
  fetchWhatsAppMeta,
  downloadGroupImageFile,
  makeLogger,
  makeLock,
  ROOT,
} from "./_lib.mjs";
import fs from "fs";
import path from "path";

loadEnvFile();
const pool = createPool();
const log = makeLogger("image-refresh");
const lock = makeLock("image-refresh", 10);
const MEDIA_DIR = path.join(ROOT, "media", "group_images");

async function main() {
  log("Starting image refresh cron (mysql2 pool)...");

  if (!(await lock.acquire())) {
    log("Another instance is running. Exiting.");
    process.exit(0);
  }

  fs.mkdirSync(MEDIA_DIR, { recursive: true });

  try {
    const groups = await q(
      pool,
      "SELECT `id`, `groupName`, `joinLink`, `profileImage` FROM `groups` WHERE `status` = 'live' AND `linkStatus` = 'active' AND (`profileImage` IS NULL OR `profileImage` NOT LIKE '/media/%') AND (`imageRefreshedAt` IS NULL OR `imageRefreshedAt` < (NOW() - INTERVAL 2 HOUR)) ORDER BY `imageRefreshedAt` ASC LIMIT 60"
    );

    log(`Processing ${groups.length} groups for image refresh...`);

    let refreshed = 0;
    let failed = 0;

    for (const group of groups) {
      try {
        // Selected rows never hold a local copy — fetch the invite og:image
        // and persist it under media/group_images.
        const meta = await fetchWhatsAppMeta(group.joinLink);
        if (meta.status === "active" && meta.imageUrl) {
          const localPath = await downloadGroupImageFile(meta.imageUrl, group.groupName);
          if (localPath) {
            await x(pool, "UPDATE `groups` SET `profileImage` = ?, `imageRefreshedAt` = NOW() WHERE `id` = ?", [localPath, group.id]);
            refreshed++;
          } else {
            // Download rejected/failed — bump the timestamp so a permanently
            // broken row doesn't hog a slot in every 10-min run (it retries
            // once per 2h window instead of every run, keeping the cron
            // cycling through the rest of the backlog).
            await x(pool, "UPDATE `groups` SET `imageRefreshedAt` = NOW() WHERE `id` = ?", [group.id]);
            failed++;
          }
        } else {
          // Link revoked/unknown or no image — update timestamp to skip
          // this row until the next window (the link-checker owns revoked rows).
          await x(pool, "UPDATE `groups` SET `imageRefreshedAt` = NOW() WHERE `id` = ?", [group.id]);
        }
      } catch {
        failed++;
      }
    }

    log(`Image refresh done. Refreshed: ${refreshed} | Failed: ${failed}`);
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
