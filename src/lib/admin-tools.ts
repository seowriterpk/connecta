/**
 * admin-tools.ts — manual bulk tools for the dashboard (Task 22).
 *
 * Two batch operations, both designed for the LOW-END Hostinger server:
 *  - runLinkCheckBatch:      re-validate invite links through the proxy
 *  - runImageLocalizeBatch:  download/refresh self-hosted group images
 *
 * The frontend drives them in SMALL batches (default 20, configurable in
 * admin settings) so no single HTTP request lives long, CPU stays flat,
 * and the user can stop anytime — already-written rows are never lost.
 * Writes follow the exact cron semantics (linkStatus + lastValidatedAt,
 * profileImage + imageRefreshedAt) so both paths stay interchangeable.
 */

import { downloadGroupImage, isWhatsappCdnUrl, deleteLocalImageByUrl } from "@/lib/image-downloader";
import { fetchWhatsAppMeta } from "@/lib/whatsapp-validator";
import { exec, query, type Row } from "@/lib/db";

export interface LinkCheckFilter {
  /** Group status scope. Default "live". */
  status: "live" | "pending" | "all";
  /** Only check links with this status. Default "all". */
  linkStatus: "all" | "active" | "revoked";
  /** Only rows never validated or validated before this Date. */
  checkedBefore?: Date | null;
  categoryId?: string;
  countryId?: string;
}

export interface LinkCheckRowResult {
  id: string;
  name: string;
  slug: string;
  oldStatus: string;
  newStatus: string; // active | revoked | unknown | skipped
  changed: boolean;
}

interface CheckCandidateRow extends Row {
  id: string;
  groupName: string;
  slug: string;
  joinLink: string;
  linkStatus: string;
}

function buildLinkCheckWhere(
  f: LinkCheckFilter
): { where: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.status !== "all") {
    conds.push("`status` = ?");
    params.push(f.status);
  }
  if (f.linkStatus !== "all") {
    conds.push("`linkStatus` = ?");
    params.push(f.linkStatus);
  }
  if (f.checkedBefore) {
    conds.push("(`lastValidatedAt` IS NULL OR `lastValidatedAt` < ?)");
    params.push(f.checkedBefore);
  }
  if (f.categoryId) {
    conds.push("`categoryId` = ?");
    params.push(f.categoryId);
  }
  if (f.countryId) {
    conds.push("`countryId` = ?");
    params.push(f.countryId);
  }
  return {
    where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "",
    params,
  };
}

/** Count of groups matching the filter (for the "N pendientes" badge). */
export async function countLinkCheckCandidates(f: LinkCheckFilter): Promise<number> {
  const { where, params } = buildLinkCheckWhere(f);
  const row = await queryOneRow(
    `SELECT COUNT(*) AS cnt FROM \`groups\`${where}`,
    params
  );
  return Number((row as { cnt: number })?.cnt ?? 0);
}

async function queryOneRow(sql: string, params: unknown[] = []): Promise<Row | null> {
  const rows = await query<Row>(sql, params);
  return rows[0] ?? null;
}

/** Tiny worker pool — fixed concurrency over a shared cursor (low CPU). */
async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      await worker(items[i], i);
    }
  });
  await Promise.all(lanes);
}

/**
 * Validate up to `limit` invite links. Semantics identical to the
 * link-checker cron: active → linkStatus='active'; revoked → 'revoked'
 * (image kept!); unknown → only lastValidatedAt bumps (fail-safe).
 */
export async function runLinkCheckBatch(
  filter: LinkCheckFilter,
  limit: number,
  concurrency = 5
): Promise<{ rows: LinkCheckRowResult[]; scanned: number }> {
  const { where, params } = buildLinkCheckWhere(filter);
  const candidates = await query<CheckCandidateRow>(
    `SELECT \`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`linkStatus\`
     FROM \`groups\`${where}
     ORDER BY (\`lastValidatedAt\` IS NULL) DESC, \`lastValidatedAt\` ASC
     LIMIT ?`,
    [...params, Math.min(Math.max(limit, 1), 200)]
  );

  const results: LinkCheckRowResult[] = [];

  await runPool(candidates, concurrency, async (row) => {
    let verdict: "active" | "revoked" | "unknown" | "skipped" = "unknown";
    try {
      const meta = await fetchWhatsAppMeta(row.joinLink);
      verdict = meta.status;
    } catch {
      verdict = "unknown"; // never throw out of the pool
    }

    try {
      if (verdict === "active" || verdict === "revoked") {
        // Cron parity: revoked rows KEEP their self-hosted image.
        await exec(
          "UPDATE `groups` SET `linkStatus` = ?, `lastValidatedAt` = NOW() WHERE `id` = ?",
          [verdict, row.id]
        );
      } else {
        await exec(
          "UPDATE `groups` SET `lastValidatedAt` = NOW() WHERE `id` = ?",
          [row.id]
        );
      }
    } catch {
      /* DB hiccup — result still reported as checked */
    }

    results.push({
      id: row.id,
      name: String(row.groupName),
      slug: String(row.slug),
      oldStatus: String(row.linkStatus),
      newStatus: verdict,
      // "unknown" is inconclusive (network/proxy hiccup) — the DB keeps the
      // previous status, so it must NOT surface as a change.
      changed: verdict !== "unknown" && String(row.linkStatus) !== verdict,
    });
  });

  return { rows: results, scanned: candidates.length };
}

// ---------------------------------------------------------------------------
// Image localization
// ---------------------------------------------------------------------------

export interface ImageLocalizeFilter {
  /**
   * missing → NULL or non-local images (default)
   * cdn    → only WhatsApp CDN URLs
   * null   → only NULL profileImage
   * all    → everything (only useful with overwrite)
   */
  scope: "missing" | "cdn" | "null" | "all";
  status: "live" | "pending" | "all";
  /** Skip rows whose link is revoked (saves paid proxy bandwidth). */
  onlyActiveLinks: boolean;
  /** Re-download even when the image is already local. */
  overwrite: boolean;
  categoryId?: string;
  countryId?: string;
}

export interface ImageLocalizeRowResult {
  id: string;
  name: string;
  outcome: "localized" | "already-local" | "revoked-link" | "no-image" | "failed";
  bytes: number;
  localUrl: string | null;
}

interface ImageCandidateRow extends Row {
  id: string;
  groupName: string;
  joinLink: string;
  profileImage: string | null;
}

function buildImageWhere(f: ImageLocalizeFilter): { where: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.status !== "all") {
    conds.push("`status` = ?");
    params.push(f.status);
  }
  if (f.onlyActiveLinks) {
    conds.push("`linkStatus` = 'active'");
  }
  switch (f.scope) {
    case "missing":
      conds.push("(`profileImage` IS NULL OR `profileImage` NOT LIKE '/media/%')");
      break;
    case "cdn":
      conds.push(
        "(`profileImage` LIKE '%whatsapp.com%' OR `profileImage` LIKE '%whatsapp.net%')"
      );
      break;
    case "null":
      conds.push("`profileImage` IS NULL");
      break;
    case "all":
      if (!f.overwrite) {
        // Without overwrite, "all" degenerates to "missing" (local images
        // are already downloaded-once per policy).
        conds.push("(`profileImage` IS NULL OR `profileImage` NOT LIKE '/media/%')");
      }
      break;
  }
  if (f.categoryId) {
    conds.push("`categoryId` = ?");
    params.push(f.categoryId);
  }
  if (f.countryId) {
    conds.push("`countryId` = ?");
    params.push(f.countryId);
  }
  return { where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params };
}

export async function countImageCandidates(f: ImageLocalizeFilter): Promise<number> {
  const { where, params } = buildImageWhere(f);
  const row = await queryOneRow(`SELECT COUNT(*) AS cnt FROM \`groups\`${where}`, params);
  return Number((row as { cnt: number })?.cnt ?? 0);
}

/**
 * Localize up to `limit` group images (download og:image/CDN image once →
 * /media/group_images). Already-local rows are skipped (download-once)
 * unless the caller passes overwrite. Failures bump imageRefreshedAt so
 * broken rows can't starve the queue (Task 19 policy).
 *
 * Task 34 SPEED: concurrency 12 (was 3). Safe because every WhatsApp
 * request exits through its OWN rotating-gateway IP (freshConnection), so
 * per-IP load is always 1 — 12 workers just means 12 different IPs. A
 * healthy 100-row batch now lands in ~20-25s instead of minutes.
 */
export async function runImageLocalizeBatch(
  filter: ImageLocalizeFilter,
  limit: number,
  concurrency = 12
): Promise<{ rows: ImageLocalizeRowResult[]; scanned: number }> {
  const { where, params } = buildImageWhere(filter);
  const candidates = await query<ImageCandidateRow>(
    `SELECT \`id\`, \`groupName\`, \`joinLink\`, \`profileImage\`
     FROM \`groups\`${where}
     ORDER BY (\`imageRefreshedAt\` IS NULL) DESC, \`imageRefreshedAt\` ASC
     LIMIT ?`,
    [...params, Math.min(Math.max(limit, 1), 200)]
  );

  const results: ImageLocalizeRowResult[] = [];

  await runPool(candidates, concurrency, async (row) => {
    const name = String(row.groupName);
    const current = row.profileImage ? String(row.profileImage) : null;
    let outcome: ImageLocalizeRowResult["outcome"] = "failed";
    let bytes = 0;
    let localUrl: string | null = null;

    try {
      if (current && current.startsWith("/media/")) {
        if (!filter.overwrite) {
          outcome = "already-local";
        } else {
          // Overwrite: fetch fresh meta (may yield a newer invite image).
          const meta = await fetchWhatsAppMeta(String(row.joinLink));
          if (meta.status !== "active" || !meta.imageUrl) {
            outcome = meta.status === "revoked" ? "revoked-link" : "no-image";
          } else {
            const dl = await downloadGroupImage(meta.imageUrl, name);
            if (dl.localUrl) {
              outcome = "localized";
              bytes = dl.bytes;
              localUrl = dl.localUrl;
            }
          }
        }
      } else if (current && isWhatsappCdnUrl(current)) {
        // Fast path: direct CDN download, no meta fetch needed.
        const dl = await downloadGroupImage(current, name);
        if (dl.localUrl) {
          outcome = "localized";
          bytes = dl.bytes;
          localUrl = dl.localUrl;
        }
      } else {
        // NULL or exotic URL → fetch invite meta first.
        const meta = await fetchWhatsAppMeta(String(row.joinLink));
        if (meta.status === "revoked") {
          outcome = "revoked-link";
        } else if (meta.status !== "active" || !meta.imageUrl) {
          outcome = "no-image";
        } else {
          const dl = await downloadGroupImage(meta.imageUrl, name);
          if (dl.localUrl) {
            outcome = "localized";
            bytes = dl.bytes;
            localUrl = dl.localUrl;
          }
        }
      }
    } catch {
      outcome = "failed";
    }

    try {
      if (outcome === "localized" && localUrl) {
        await exec(
          "UPDATE `groups` SET `profileImage` = ?, `imageRefreshedAt` = NOW() WHERE `id` = ?",
          [localUrl, row.id]
        );
        // Replace mode: the row's PREVIOUS local file is now an orphan —
        // remove it so 8k overwrite runs don't double the media folder.
        if (current && current.startsWith("/media/") && current !== localUrl) {
          await deleteLocalImageByUrl(current);
        }
      } else if (outcome !== "already-local") {
        // Failed/revoked/no-image → bump so the row doesn't immediately
        // reappear at the top of the queue.
        await exec(
          "UPDATE `groups` SET `imageRefreshedAt` = NOW() WHERE `id` = ?",
          [row.id]
        );
      }
    } catch {
      /* DB hiccup — outcome still reported */
    }

    results.push({ id: String(row.id), name, outcome, bytes, localUrl });
  });

  return { rows: results, scanned: candidates.length };
}

// ---------------------------------------------------------------------------
// Dashboard stats for both tool pages (cheap COUNT queries, page-rendered)
// ---------------------------------------------------------------------------

export interface ToolStats {
  groupsTotal: number;
  live: number;
  pending: number;
  linkActive: number;
  linkRevoked: number;
  linkUnknown: number;
  neverChecked: number;
  checkedLast24h: number;
  localImages: number;
  cdnImages: number;
  nullImages: number;
  ugcPending: number;
  queueDepth: number;
}

export async function getToolStats(): Promise<ToolStats> {
  const g = await queryOneRow(
    `SELECT COUNT(*) AS total,
            SUM(\`status\` = 'live') AS live,
            SUM(\`status\` = 'pending') AS pending,
            SUM(\`linkStatus\` = 'active') AS linkActive,
            SUM(\`linkStatus\` = 'revoked') AS linkRevoked,
            SUM(\`linkStatus\` = 'unknown') AS linkUnknown,
            SUM(\`lastValidatedAt\` IS NULL) AS neverChecked,
            SUM(\`lastValidatedAt\` >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS checkedLast24h,
            SUM(\`profileImage\` LIKE '/media/%') AS localImages,
            SUM(\`profileImage\` LIKE '%whatsapp.com%' OR \`profileImage\` LIKE '%whatsapp.net%') AS cdnImages,
            SUM(\`profileImage\` IS NULL) AS nullImages
     FROM \`groups\``
  );
  const ugc = await queryOneRow(
    "SELECT COUNT(*) AS cnt FROM `ugc_submissions` WHERE `status` IN ('submitted','needs_review')"
  );
  const q = await queryOneRow("SELECT COUNT(*) AS cnt FROM `groups_queue`");

  const n = (v: unknown) => Number(v ?? 0);
  return {
    groupsTotal: n((g as { total: number })?.total),
    live: n((g as { live: number })?.live),
    pending: n((g as { pending: number })?.pending),
    linkActive: n((g as { linkActive: number })?.linkActive),
    linkRevoked: n((g as { linkRevoked: number })?.linkRevoked),
    linkUnknown: n((g as { linkUnknown: number })?.linkUnknown),
    neverChecked: n((g as { neverChecked: number })?.neverChecked),
    checkedLast24h: n((g as { checkedLast24h: number })?.checkedLast24h),
    localImages: n((g as { localImages: number })?.localImages),
    cdnImages: n((g as { cdnImages: number })?.cdnImages),
    nullImages: n((g as { nullImages: number })?.nullImages),
    ugcPending: n((ugc as { cnt: number })?.cnt),
    queueDepth: n((q as { cnt: number })?.cnt),
  };
}
