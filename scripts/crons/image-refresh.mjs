/**
 * Image Refresh Cron — runs every 10 minutes (hPanel: node scripts/crons/image-refresh.mjs)
 * Based on Groupizo VIP Logic SYSTEM 3.
 *
 * - Picks 60 groups where imageRefreshedAt < 2 hours ago (or NULL)
 * - Re-fetches og:image from WhatsApp invite URL (through the residential proxy)
 * - Persists to <project>/media/group_images/<group-name-slug>.jpg
 *   (name-based, random-digits suffix on collision, sharp 300x300 JPEG 80% when available)
 * - DB stores the local /media/group_images URL — robots-blocked (never indexed)
 */

import {
  loadEnvFile,
  createPool,
  q,
  x,
  fetchWhatsAppMeta,
  downloadGroupImageFile,
  isLocalMediaUrl,
  isWhatsappCdnUrl,
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
      "SELECT `id`, `groupName`, `joinLink`, `profileImage` FROM `groups` WHERE `status` = 'live' AND `linkStatus` = 'active' AND (`imageRefreshedAt` IS NULL OR `imageRefreshedAt` < (NOW() - INTERVAL 2 HOUR)) ORDER BY `imageRefreshedAt` ASC LIMIT 60"
    );

    log(`Processing ${groups.length} groups for image refresh...`);

    let refreshed = 0;
    let failed = 0;

    for (const group of groups) {
      try {
        // Already local? Just bump the timestamp (re-download only when the
        // invite link yields a NEW og:image we don't have yet).
        const meta = await fetchWhatsAppMeta(group.joinLink);
        if (meta.status === "active" && meta.imageUrl) {
          const localPath = await downloadGroupImageFile(meta.imageUrl, group.groupName);
          if (localPath) {
            await x(pool, "UPDATE `groups` SET `profileImage` = ?, `imageRefreshedAt` = NOW() WHERE `id` = ?", [localPath, group.id]);
            refreshed++;
          } else {
            failed++;
          }
        } else if (isLocalMediaUrl(group.profileImage)) {
          // Link revoked/unknown but we still hold a local copy — keep it,
          // don't null it out, just move on.
          await x(pool, "UPDATE `groups` SET `imageRefreshedAt` = NOW() WHERE `id` = ?", [group.id]);
        } else {
          // Link revoked or no image and nothing local — update timestamp to
          // skip next time.
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
