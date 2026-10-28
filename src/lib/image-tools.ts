/**
 * image-tools.ts — read-side + single-row helpers for the mass-image
 * dashboard (Task 29-a).
 *
 * Everything here mirrors the battle-tested semantics of
 * `buildImageWhere` / `runImageLocalizeBatch` in admin-tools.ts (kept
 * byte-compatible: same scope conditions, same download-once policy, same
 * DB write semantics) but adds the read-only pieces the premium dashboard
 * needs WITHOUT touching the batch contract:
 *
 *  - countImageScopes:   live per-scope counts for the filter chips
 *  - previewImageCandidates: the exact rows the next batch would process
 *  - runImageLocalizeSingle: per-group "Reintentar" (fresh attempt)
 *
 * SQL stays cheap: only indexed columns (status, linkStatus, categoryId,
 * countryId) plus profileImage LIKE checks, and the scope counts are a
 * single conditional-aggregation scan instead of four COUNT queries.
 */

import { downloadGroupImage, isWhatsappCdnUrl, deleteLocalImageByUrl } from "@/lib/image-downloader";
import { fetchWhatsAppMeta } from "@/lib/whatsapp-validator";
import { exec, query, type Row } from "@/lib/db";
import type { ImageLocalizeFilter, ImageLocalizeRowResult } from "@/lib/admin-tools";

// ---------------------------------------------------------------------------
// Scope conditions — MUST stay in sync with buildImageWhere() in admin-tools
// ---------------------------------------------------------------------------

/** missing → NULL or any non-local image (includes CDN, exotic URLs). */
const COND_MISSING =
  "(`profileImage` IS NULL OR `profileImage` NOT LIKE '/media/%')";
/** cdn → WhatsApp CDN URLs only. */
const COND_CDN =
  "(`profileImage` LIKE '%whatsapp.com%' OR `profileImage` LIKE '%whatsapp.net%')";
/** null → profileImage IS NULL. */
const COND_NULL = "`profileImage` IS NULL";

/** Status/link/category/country context (everything except the scope). */
function buildBaseContext(
  f: ImageLocalizeFilter
): { where: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.status !== "all") {
    conds.push("`status` = ?");
    params.push(f.status);
  }
  if (f.onlyActiveLinks) {
    conds.push("`linkStatus` = 'active'");
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

/**
 * The exact WHERE clause runImageLocalizeBatch would use for this filter
 * (including the "all without overwrite degenerates to missing" policy).
 */
function buildEffectiveWhere(
  f: ImageLocalizeFilter
): { where: string; params: unknown[] } {
  const base = buildBaseContext(f);
  const conds: string[] = [];
  if (base.where) conds.push(base.where.replace(/^ WHERE /, ""));
  switch (f.scope) {
    case "missing":
      conds.push(COND_MISSING);
      break;
    case "cdn":
      conds.push(COND_CDN);
      break;
    case "null":
      conds.push(COND_NULL);
      break;
    case "all":
      if (!f.overwrite) conds.push(COND_MISSING);
      break;
  }
  return {
    where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "",
    params: base.params,
  };
}

// ---------------------------------------------------------------------------
// Live scope counts (filter chips)
// ---------------------------------------------------------------------------

export interface ImageScopeCounts {
  /** NULL or non-local images (what "Faltantes" would process). */
  missing: number;
  /** WhatsApp CDN URLs only. */
  cdn: number;
  /** profileImage IS NULL. */
  null: number;
  /** Already self-hosted under /media/. */
  local: number;
  /** Total rows matching the status/link/category/country context. */
  total: number;
}

/**
 * Per-scope counts for the current status/link/category/country context —
 * one conditional-aggregation query (single table scan, no per-scope
 * COUNT(*) round-trips).
 */
export async function countImageScopes(
  f: ImageLocalizeFilter
): Promise<ImageScopeCounts> {
  const { where, params } = buildBaseContext(f);
  const rows = await query<
    Row & {
      total: number;
      missing: number | null;
      cdn: number | null;
      nullImages: number | null;
      localImages: number | null;
    }
  >(
    `SELECT COUNT(*) AS total,
            SUM(${COND_MISSING}) AS missing,
            SUM(${COND_CDN}) AS cdn,
            SUM(${COND_NULL}) AS nullImages,
            SUM(\`profileImage\` LIKE '/media/%') AS localImages
     FROM \`groups\`${where}`,
    params
  );
  const r = rows[0];
  const n = (v: unknown) => Number(v ?? 0);
  return {
    missing: n(r?.missing),
    cdn: n(r?.cdn),
    null: n(r?.nullImages),
    local: n(r?.localImages),
    total: n(r?.total),
  };
}

// ---------------------------------------------------------------------------
// Queue preview
// ---------------------------------------------------------------------------

export interface ImageCandidate {
  id: string;
  groupName: string;
  slug: string;
  joinLink: string;
  profileImage: string | null;
  linkStatus: string;
  categoryName: string | null;
  countryName: string | null;
}

interface PreviewRow extends Row {
  id: string;
  groupName: string;
  slug: string;
  joinLink: string;
  profileImage: string | null;
  linkStatus: string;
  categoryName: string | null;
  countryName: string | null;
}

/**
 * Candidate rows the NEXT batch would process for this filter — same
 * WHERE (effective scope) and same ORDER BY as runImageLocalizeBatch, so
 * the dashboard shows exactly what "Iniciar descarga" will touch.
 */
export async function previewImageCandidates(
  f: ImageLocalizeFilter,
  limit: number
): Promise<ImageCandidate[]> {
  const { where, params } = buildEffectiveWhere(f);
  const rows = await query<PreviewRow>(
    `SELECT g.\`id\`, g.\`groupName\`, g.\`slug\`, g.\`joinLink\`,
            g.\`profileImage\`, g.\`linkStatus\`,
            c.\`name\` AS categoryName, co.\`name\` AS countryName
     FROM \`groups\` g
     LEFT JOIN \`categories\` c ON c.\`id\` = g.\`categoryId\`
     LEFT JOIN \`countries\` co ON co.\`id\` = g.\`countryId\`
     ${where}
     ORDER BY (g.\`imageRefreshedAt\` IS NULL) DESC, g.\`imageRefreshedAt\` ASC
     LIMIT ?`,
    [...params, Math.min(Math.max(limit, 1), 24)]
  );
  return rows.map((r) => ({
    id: String(r.id),
    groupName: String(r.groupName ?? ""),
    slug: String(r.slug ?? ""),
    joinLink: String(r.joinLink ?? ""),
    profileImage: r.profileImage ? String(r.profileImage) : null,
    linkStatus: String(r.linkStatus ?? ""),
    categoryName: r.categoryName ? String(r.categoryName) : null,
    countryName: r.countryName ? String(r.countryName) : null,
  }));
}

// ---------------------------------------------------------------------------
// Single-group retry ("Reintentar")
// ---------------------------------------------------------------------------

interface SingleCandidateRow extends Row {
  id: string;
  groupName: string;
  joinLink: string;
  profileImage: string | null;
}

/**
 * Re-run localization for ONE group (per-group "Reintentar" button).
 *
 * Mirrors the per-row branch logic of runImageLocalizeBatch exactly:
 * download-once policy, CDN fast path, meta fetch for NULL/exotic rows and
 * the same DB writes (profileImage + imageRefreshedAt on success, an
 * imageRefreshedAt bump otherwise). `overwrite` defaults to true because a
 * manual retry means "attempt a fresh download now" — for rows that already
 * have a local image, plain re-selection would be a no-op.
 *
 * Returns null when the group id does not exist.
 */
export async function runImageLocalizeSingle(
  groupId: string,
  overwrite = true
): Promise<ImageLocalizeRowResult | null> {
  const rows = await query<SingleCandidateRow>(
    "SELECT `id`, `groupName`, `joinLink`, `profileImage` FROM `groups` WHERE `id` = ? LIMIT 1",
    [groupId]
  );
  const row = rows[0];
  if (!row) return null;

  const name = String(row.groupName);
  const current = row.profileImage ? String(row.profileImage) : null;
  let outcome: ImageLocalizeRowResult["outcome"] = "failed";
  let bytes = 0;
  let localUrl: string | null = null;

  try {
    if (current && current.startsWith("/media/")) {
      if (!overwrite) {
        outcome = "already-local";
      } else {
        // Fresh meta fetch — may yield a newer invite image.
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
      // Replace mode: remove the row's previous local file (now orphaned).
      if (current && current.startsWith("/media/") && current !== localUrl) {
        await deleteLocalImageByUrl(current);
      }
    } else if (outcome !== "already-local") {
      await exec(
        "UPDATE `groups` SET `imageRefreshedAt` = NOW() WHERE `id` = ?",
        [row.id]
      );
    }
  } catch {
    /* DB hiccup — outcome still reported */
  }

  return { id: String(row.id), name, outcome, bytes, localUrl };
}
