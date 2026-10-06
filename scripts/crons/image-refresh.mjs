/**
 * Image Refresh Cron — runs every 10 minutes (hPanel: node scripts/crons/image-refresh.mjs)
 * Based on Groupizo VIP Logic SYSTEM 3.
 *
 * - Picks 60 groups where imageRefreshedAt < 2 hours ago (or NULL)
 * - Re-fetches og:image from WhatsApp invite URL
 * - Downloads + compresses with sharp (300x300 JPEG 80%) if available
 * - Saves locally to /public/uploads/group_images/
 */

import {
  loadEnvFile,
  createPool,
  q,
  x,
  fetchWhatsAppMeta,
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
const UPLOAD_DIR = path.join(ROOT, "public", "uploads", "group_images");

async function downloadAndCompress(url, groupId) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());

    // Use sharp if available, otherwise just save raw (shared-hosting safe)
    let sharp = null;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      sharp = null;
    }
    const filename = `group_${groupId}_${Date.now()}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (sharp) {
      await sharp(buffer).resize(300, 300, { fit: "cover" }).jpeg({ quality: 80 }).toFile(filepath);
    } else {
      fs.writeFileSync(filepath, buffer);
    }

    return `/uploads/group_images/${filename}`;
  } catch {
    return null;
  }
}

async function main() {
  log("Starting image refresh cron (mysql2 pool)...");

  if (!(await lock.acquire())) {
    log("Another instance is running. Exiting.");
    process.exit(0);
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  try {
    const groups = await q(
      pool,
      "SELECT `id`, `joinLink` FROM `groups` WHERE `status` = 'live' AND `linkStatus` = 'active' AND (`imageRefreshedAt` IS NULL OR `imageRefreshedAt` < (NOW() - INTERVAL 2 HOUR)) ORDER BY `imageRefreshedAt` ASC LIMIT 60"
    );

    log(`Processing ${groups.length} groups for image refresh...`);

    let refreshed = 0;
    let failed = 0;

    for (const group of groups) {
      try {
        const meta = await fetchWhatsAppMeta(group.joinLink);
        if (meta.status === "active" && meta.imageUrl) {
          const localPath = await downloadAndCompress(meta.imageUrl, group.id);
          if (localPath) {
            await x(pool, "UPDATE `groups` SET `profileImage` = ?, `imageRefreshedAt` = NOW() WHERE `id` = ?", [localPath, group.id]);
            refreshed++;
          } else {
            failed++;
          }
        } else {
          // Link revoked or no image — update timestamp to skip next time
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
