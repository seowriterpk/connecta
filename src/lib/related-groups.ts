/**
 * Related Groups Engine
 *
 * OWNER DIRECTIVE (2026-10-21): related groups must ALWAYS be from the SAME
 * CATEGORY. The old < 4-results fallback filled the section with groups
 * from the same COUNTRY — any category — which is how a "friendship" group
 * ended up in an education group's "Grupos similares". The fallback is gone.
 * If a category is thin, the section simply shows fewer (honest) groups.
 *
 * getRelatedGroups (group detail page — "Grupos similares"):
 * ONE indexed query (g.categoryId) — same silo + same category, status live,
 * id <> current. Ordering: active links first ((linkStatus = 'active') DESC,
 * boolean sort — valid on MySQL/MariaDB), then most-clicked, then older.
 * Expired groups stay listable everywhere (owner rule), they just sort
 * behind active ones so the freshest working links lead the section.
 *
 * getRecentRelatedGroups (verify page — "Grupos nuevos de la misma
 * categoría"): the most recent live groups in the same category (and silo),
 * active links first, then createdAt DESC.
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

/**
 * Related groups for the group detail page — strictly SAME CATEGORY (never
 * country, never random), same content silo, ONE indexed query.
 * Active links sort first, then clicks DESC, then createdAt ASC.
 */
export async function getRelatedGroups(
  currentGroupId: string,
  categoryId: string,
  limit = 8,
  opts: { isAdult?: boolean } = {}
): Promise<GroupDTO[]> {
  const siloIsAdult = opts.isAdult ? 1 : 0;
  // No category → nothing honest to relate; the section hides itself.
  if (!categoryId) return [];

  const rows = await query<GroupRow>(
    `SELECT ${RELATED_SELECT} ${RELATED_FROM}
     WHERE g.\`status\` = 'live' AND g.\`isAdult\` = ? AND g.\`categoryId\` = ? AND g.\`id\` <> ?
     ORDER BY (g.\`linkStatus\` = 'active') DESC, g.\`clicks\` DESC, g.\`createdAt\` ASC
     LIMIT ?`,
    [siloIsAdult, categoryId, currentGroupId, limit]
  );
  return rows.map(toDTO);
}

/**
 * Most recent groups in the same category (and the same content silo) as
 * the current group — used by the /verificar/[slug] interstitial.
 * Active links sort first, then newest.
 */
export async function getRecentRelatedGroups(
  currentGroupId: string,
  categoryId: string | undefined,
  isAdult: boolean,
  limit = 9
): Promise<GroupDTO[]> {
  const siloIsAdult = isAdult ? 1 : 0;
  if (!categoryId) return [];

  const rows = await query<GroupRow>(
    `SELECT ${RELATED_SELECT} ${RELATED_FROM}
     WHERE g.\`status\` = 'live' AND g.\`isAdult\` = ? AND g.\`categoryId\` = ? AND g.\`id\` <> ?
     ORDER BY (g.\`linkStatus\` = 'active') DESC, g.\`createdAt\` DESC
     LIMIT ?`,
    [siloIsAdult, categoryId, currentGroupId, limit]
  );
  return rows.map(toDTO);
}
