/**
 * Related Groups Engine
 *
 * getRelatedGroups (group detail page — "Grupos similares"):
 * Up to 8 unique related groups with a DETERMINISTIC "clicks + old" order —
 * most-clicked groups first, older groups break ties (no shuffling).
 * Maximum of 2 queries:
 *   1) Same content silo + same category (indexed g.categoryId), status
 *      live + linkStatus active, id <> current, ORDER BY g.clicks DESC,
 *      g.createdAt ASC, LIMIT 8. Dedupe guaranteed by SQL.
 *   2) Fallback (only if query 1 returned < 4): same silo + same country
 *      (indexed g.countryId), excluding already-fetched ids + current,
 *      same ordering, LIMIT (8 - results). Merged, re-sorted by
 *      clicks DESC / createdAt ASC and capped at the limit.
 *
 * getRecentRelatedGroups (verify page — "Grupos nuevos de la misma
 * categoría"): the most recent live + active groups in the same category
 * (and the same content silo) as the current group.
 *
 * SILOED LINKING (adult separation directive): related groups always match
 * the current group's content silo — adult groups only ever recommend other
 * adult groups; clean groups only ever recommend clean groups.
 */

import { query, type Row } from "./db";
import type { GroupDTO } from "./types";
import { computeDisplayedMembers } from "./members";

type GroupRow = Row & Record<string, any>;

function toDTO(g: GroupRow): GroupDTO {
  return {
    id: g.id,
    title: g.groupName,
    slug: g.slug,
    description: g.description,
    inviteLink: g.joinLink,
    imageUrl: g.profileImage ?? null,
    categoryId: g.categoryId,
    countryId: g.countryId,
    members: computeDisplayedMembers(g.clicks ?? 0, g.joinCount ?? 0, g.id),
    isFeatured: g.popularityBadge === "featured",
    isVerified: g.linkStatus === "active",
    status: g.status as any,
    tags: JSON.parse(g.tags || "[]"),
    keywords: JSON.parse(g.keywords || "[]"),
    views: g.views ?? 0,
    shares: g.shares ?? 0,
    clicks: g.clicks ?? 0,
    joinCount: g.joinCount ?? 0,
    contactName: null,
    city: g.city,
    language: g.language ?? "Espanol",
    isAdult: !!g.isAdult,
    linkStatus: g.linkStatus ?? "active",
    uploaderId: g.uploaderId ?? null,
    uploaderName: null,
    uploaderSlug: null,
    createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : String(g.createdAt),
    lastActiveAt: g.lastActiveAt instanceof Date ? g.lastActiveAt.toISOString() : null,
    category: g.catName
      ? { id: g.categoryId, name: g.catName, slug: g.catSlug, description: g.catDesc ?? "", icon: g.catIcon ?? "💬", color: g.catColor ?? "emerald", sortOrder: g.catSort ?? 1000, groupCount: 0, isAdult: !!g.catIsAdult }
      : undefined,
    country: g.countryName
      ? { id: g.countryId, name: g.countryName, code: g.countryCode, flag: g.countryFlag, region: g.countryRegion, dialCode: g.countryDial ?? null, groupCount: 0 }
      : undefined,
  };
}

const RELATED_SELECT = `
  g.*,
  c.\`name\` AS \`catName\`, c.\`slug\` AS \`catSlug\`, c.\`description\` AS \`catDesc\`, c.\`icon\` AS \`catIcon\`, c.\`color\` AS \`catColor\`, c.\`sortOrder\` AS \`catSort\`, c.\`isAdult\` AS \`catIsAdult\`,
  co.\`name\` AS \`countryName\`, co.\`code\` AS \`countryCode\`, co.\`flag\` AS \`countryFlag\`, co.\`region\` AS \`countryRegion\`, co.\`dialCode\` AS \`countryDial\`
`;

const RELATED_FROM = `
  FROM \`groups\` g
  LEFT JOIN \`categories\` c ON c.\`id\` = g.\`categoryId\`
  LEFT JOIN \`countries\` co ON co.\`id\` = g.\`countryId\`
`;

const RELATED_BASE_WHERE = "g.\`status\` = 'live' AND g.\`linkStatus\` = 'active'";

function rowCreatedAt(g: GroupRow): number {
  return g.createdAt instanceof Date ? g.createdAt.getTime() : new Date(g.createdAt).getTime() || 0;
}

/**
 * Related groups for the group detail page — deterministic "clicks + old"
 * ordering (clicks DESC, createdAt ASC). Maximum of 2 sequential queries.
 */
export async function getRelatedGroups(
  currentGroupId: string,
  categoryId: string,
  countryId: string,
  limit = 8,
  opts: { isAdult?: boolean } = {}
): Promise<GroupDTO[]> {
  // Silo: related groups must live in the same content silo as this group.
  const siloIsAdult = opts.isAdult ? 1 : 0;
  const usedIds = new Set<string>([currentGroupId]);

  // QUERY 1 — same silo + same category (indexed id column), popular
  // (clicks DESC) then older (createdAt ASC). Dedupe guaranteed by SQL.
  const categoryFilter = categoryId ? "AND g.`categoryId` = ?" : "";
  let rows = await query<GroupRow>(
    `SELECT ${RELATED_SELECT} ${RELATED_FROM}
     WHERE ${RELATED_BASE_WHERE} AND g.\`isAdult\` = ? ${categoryFilter} AND g.\`id\` <> ?
     ORDER BY g.\`clicks\` DESC, g.\`createdAt\` ASC
     LIMIT ?`,
    [siloIsAdult, ...(categoryId ? [categoryId] : []), currentGroupId, limit]
  );
  rows.forEach((g) => usedIds.add(g.id));

  // QUERY 2 (fallback) — only when the category silo is thin (< 4 groups):
  // same silo + same country, excluding everything already fetched.
  if (rows.length < 4) {
    const excludeIds = [...usedIds];
    const countryFilter = countryId ? "AND g.`countryId` = ?" : "";
    const notInSql =
      excludeIds.length > 0
        ? `AND g.\`id\` NOT IN (${excludeIds.map(() => "?").join(", ")})`
        : "";
    const fallback = await query<GroupRow>(
      `SELECT ${RELATED_SELECT} ${RELATED_FROM}
       WHERE ${RELATED_BASE_WHERE} AND g.\`isAdult\` = ? ${countryFilter} ${notInSql}
       ORDER BY g.\`clicks\` DESC, g.\`createdAt\` ASC
       LIMIT ?`,
      [siloIsAdult, ...(countryId ? [countryId] : []), ...excludeIds, limit - rows.length]
    );
    fallback.forEach((g) => usedIds.add(g.id));
    rows = [...rows, ...fallback];
  }

  // Deterministic merge order: clicks DESC, then createdAt ASC (older first).
  const sorted = [...rows].sort((a, b) => {
    const byClicks = (b.clicks ?? 0) - (a.clicks ?? 0);
    if (byClicks !== 0) return byClicks;
    return rowCreatedAt(a) - rowCreatedAt(b);
  });
  return sorted.slice(0, limit).map(toDTO);
}

/**
 * Most recent groups in the same category (and the same content silo) as
 * the current group — used by the /verificar/[slug] interstitial.
 */
export async function getRecentRelatedGroups(
  currentGroupId: string,
  categoryId: string | undefined,
  isAdult: boolean,
  limit = 9
): Promise<GroupDTO[]> {
  const siloIsAdult = isAdult ? 1 : 0;
  const categoryFilter = categoryId ? "AND g.`categoryId` = ?" : "";
  const rows = await query<GroupRow>(
    `SELECT ${RELATED_SELECT} ${RELATED_FROM}
     WHERE ${RELATED_BASE_WHERE} AND g.\`isAdult\` = ? ${categoryFilter} AND g.\`id\` <> ?
     ORDER BY g.\`createdAt\` DESC
     LIMIT ?`,
    [siloIsAdult, ...(categoryId ? [categoryId] : []), currentGroupId, limit]
  );
  return rows.map(toDTO);
}
