/**
 * One-off migration: localize existing WhatsApp CDN group images.
 *
 * For every group whose profileImage still points at the WhatsApp CDN
 * (pps/mmg/static.whatsapp.net — signed URLs that expire and hotlink us to
 * WhatsApp), this script:
 *
 *   1. Tries to download the STORED image URL (still valid until its `oe=`
 *      signature expires).
 *   2. On failure, re-fetches the invite page (via proxy) for a FRESH
 *      og:image and downloads that instead.
 *   3. Updates profileImage to the local /media/group_images/<name>.jpg URL.
 *
 * Revoked/dead links keep their old value (nothing lost). Idempotent — rows
 * already using local /media/ URLs are skipped. Never marks anything revoked.
 *
 * Usage:  node scripts/download-existing-images.mjs
 */

import {
  loadEnvFile,
  createPool,
  q,
  x,
  fetchWhatsAppMeta,
  downloadGroupImageFile,
  isWhatsappCdnUrl,
  makeLogger,
} from "./crons/_lib.mjs";

loadEnvFile();
const pool = createPool();
const log = makeLogger("localize-images");

async function localizeGroup(group) {
  // Step 1: try the stored (possibly still-signed) URL directly.
  let localPath = await downloadGroupImageFile(group.profileImage, group.groupName);

  // Step 2: stored URL expired → fetch a fresh og:image from the invite page.
  if (!localPath) {
    try {
      const meta = await fetchWhatsAppMeta(group.joinLink);
      if (meta.status === "active" && meta.imageUrl) {
        localPath = await downloadGroupImageFile(meta.imageUrl, group.groupName);
      }
    } catch {
      /* dead link — leave as-is */
    }
  }

  if (localPath) {
    await x(pool, "UPDATE `groups` SET `profileImage` = ? WHERE `id` = ?", [localPath, group.id]);
    return "localized";
  }
  return "kept";
}

async function main() {
  log("Scanning groups with WhatsApp CDN images...");

  const groups = await q(
    pool,
    "SELECT `id`, `groupName`, `joinLink`, `profileImage` FROM `groups` WHERE `profileImage` LIKE 'https://pps.whatsapp.net/%' OR `profileImage` LIKE 'https://mmg.whatsapp.net/%' OR `profileImage` LIKE 'https://static.whatsapp.net/%'"
  );

  log(`Found ${groups.length} groups with CDN images. Downloading (concurrency 3)...`);

  let localized = 0;
  let kept = 0;
  let cursor = 0;

  const worker = async () => {
    while (cursor < groups.length) {
      const group = groups[cursor++];
      const result = await localizeGroup(group);
      if (result === "localized") localized++;
      else kept++;
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  log(`Done. Localized: ${localized} | Kept as-is (dead links/expired images): ${kept}`);
  await pool.end();
}

main().catch(async (e) => {
  log(`FATAL: ${e.message}`);
  await pool.end();
  process.exit(1);
});
