/**
 * Related Groups Engine (Smart Selection)
 * Based on Groupizo VIP Logic SYSTEM 14.
 *
 * Returns 10 related groups: 4 newest + 4 fewest clicks + 2 random.
 * Priority: same category AND country, with fallbacks.
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
    members: computeDisplayedMembers(g.clicks ?? 0, g.views ?? 0, g.id),
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

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

export async function getRelatedGroups(
  currentGroupId: string,
  category: string,
  country: string,
  limit = 10,
  opts: { isAdult?: boolean } = {}
): Promise<any[]> {
  const usedIds = new Set<string>([currentGroupId]);
  // Silo: related groups must live in the same content silo as this group.
  const siloIsAdult = opts.isAdult ? 1 : 0;

  const fetchGroups = (extraWhere: string, params: unknown[], orderBy: string, take: number) => {
    const notIn = [...usedIds];
    const notInSql = notIn.length > 0 ? `AND g.\`id\` NOT IN (${notIn.map(() => "?").join(", ")})` : "";
    return query<GroupRow>(
      `SELECT ${RELATED_SELECT} ${RELATED_FROM}
       WHERE g.\`status\` = 'live' AND g.\`linkStatus\` = 'active' AND g.\`isAdult\` = ? ${extraWhere ? `AND ${extraWhere}` : ""} ${notInSql}
       ORDER BY ${orderBy}
       LIMIT ?`,
      [siloIsAdult, ...params, ...notIn, take]
    );
  };

  // FETCH 1: 4 newest from same category AND country
  let newest = await fetchGroups(
    "g.`category` = ? AND g.`country` = ?",
    [category, country],
    "g.`createdAt` DESC",
    4
  );
  newest.forEach((g) => usedIds.add(g.id));

  // Fallback: if not enough, same category only (no country)
  if (newest.length < 4) {
    const fallback = await fetchGroups(
      "g.`category` = ?",
      [category],
      "g.`createdAt` DESC",
      4 - newest.length
    );
    newest = [...newest, ...fallback];
    fallback.forEach((g) => usedIds.add(g.id));
  }

  // FETCH 2: 4 with fewest clicks (exposure boost)
  let fewestClicks = await fetchGroups(
    "g.`category` = ? AND g.`country` = ?",
    [category, country],
    "g.`clicks` ASC, g.`createdAt` DESC",
    4
  );
  fewestClicks.forEach((g) => usedIds.add(g.id));

  if (fewestClicks.length < 4) {
    const fallback = await fetchGroups(
      "g.`category` = ?",
      [category],
      "g.`clicks` ASC, g.`createdAt` DESC",
      4 - fewestClicks.length
    );
    fewestClicks = [...fewestClicks, ...fallback];
    fallback.forEach((g) => usedIds.add(g.id));
  }

  // FETCH 3: 2 random
  let randomGroups = await fetchGroups("", [], "g.`createdAt` DESC", 20);
  randomGroups = shuffle(randomGroups).slice(0, 2);

  // Merge and shuffle
  const all = [...newest, ...fewestClicks, ...randomGroups];
  return shuffle(all).slice(0, limit).map(toDTO);
}

/**
 * Recent Related Groups (verify-page directive):
 * The MOST RECENT groups in the SAME category as the current group,
 * always within the same content silo (adult ↔ adult, clean ↔ clean).
 * Fills any shortfall with the most recent same-silo groups so the
 * grid never shows cross-silo (non-adult) groups on adult pages.
 */
export async function getRecentRelatedGroups(
  currentGroupId: string,
  categoryId: string | null | undefined,
  isAdult: boolean,
  limit = 6
): Promise<GroupDTO[]> {
  const usedIds = new Set<string>([currentGroupId]);
  const siloIsAdult = isAdult ? 1 : 0;
  const notInSql = (n: number) =>
    n > 0 ? `AND g.\`id\` NOT IN (${Array.from({ length: n }, () => "?").join(", ")})` : "";

  let rows: GroupRow[] = [];

  // Primary: most recent live+active groups in the SAME category, same silo.
  if (categoryId) {
    rows = await query<GroupRow>(
      `SELECT ${RELATED_SELECT} ${RELATED_FROM}
       WHERE g.\`status\` = 'live' AND g.\`linkStatus\` = 'active' AND g.\`isAdult\` = ? AND g.\`categoryId\` = ? ${notInSql(usedIds.size)}
       ORDER BY g.\`createdAt\` DESC
       LIMIT ?`,
      [siloIsAdult, categoryId, ...usedIds, limit]
    );
    rows.forEach((r) => usedIds.add(r.id));
  }

  // Fallback: fill with most recent same-silo groups (any category).
  if (rows.length < limit) {
    const fallback = await query<GroupRow>(
      `SELECT ${RELATED_SELECT} ${RELATED_FROM}
       WHERE g.\`status\` = 'live' AND g.\`linkStatus\` = 'active' AND g.\`isAdult\` = ? ${notInSql(usedIds.size)}
       ORDER BY g.\`createdAt\` DESC
       LIMIT ?`,
      [siloIsAdult, ...usedIds, limit - rows.length]
    );
    rows = [...rows, ...fallback];
  }

  return rows.map(toDTO);
}
