// ConectaGrupos — acceso a datos (server-side).
// Raw SQL over the mysql2/promise pool. Same public API as before, so no
// page/component needs to change — only the engine underneath did.

import { query, queryOne, exec, newId, type Row } from "@/lib/db";
import { SITE } from "@/lib/constants";
import { generateSlug, makeUniqueSlug } from "@/lib/slug";
import { computeDisplayedMembers } from "@/lib/members";
import type {
  CategoryDTO,
  CountryDTO,
  GroupDTO,
  GroupStatus,
  GroupsQuery,
  StatsDTO,
} from "@/lib/types";

/** Adult content policy for list queries (see GroupsQuery.adult). */
type AdultFilter = "exclude" | "include" | "only";

const DEFAULT_ADULT: AdultFilter = "exclude";

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function toIso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") {
    // Prisma-SQLITE epoch millis → ISO
    return new Date(v).toISOString();
  }
  return String(v);
}

type GroupRow = Row & Record<string, any>;

/** Base SELECT for groups with taxonomy joins (category / country / uploader). */
const GROUP_SELECT = `
  g.*,
  c.\`name\`  AS \`catName\`,   c.\`slug\` AS \`catSlug\`,   c.\`description\` AS \`catDesc\`,
  c.\`icon\`   AS \`catIcon\`,   c.\`color\` AS \`catColor\`, c.\`sortOrder\`  AS \`catSort\`,
  c.\`isAdult\` AS \`catIsAdult\`, c.\`isActive\` AS \`catIsActive\`,
  co.\`name\`  AS \`countryName\`, co.\`code\` AS \`countryCode\`, co.\`flag\` AS \`countryFlag\`,
  co.\`region\` AS \`countryRegion\`, co.\`dialCode\` AS \`countryDial\`, co.\`slug\` AS \`countrySlug\`,
  u.\`name\`   AS \`uploaderName\`,  u.\`slug\` AS \`uploaderSlug\`
`;

const GROUP_FROM = `
  FROM \`groups\` g
  LEFT JOIN \`categories\` c  ON c.\`id\`  = g.\`categoryId\`
  LEFT JOIN \`countries\`  co ON co.\`id\` = g.\`countryId\`
  LEFT JOIN \`uploaders\`   u  ON u.\`id\`  = g.\`uploaderId\`
`;

function toGroupDTO(g: GroupRow): GroupDTO {
  return {
    id: g.id,
    title: g.groupName ?? g.title,
    slug: g.slug,
    description: g.description ?? "",
    inviteLink: g.joinLink ?? g.inviteLink,
    imageUrl: g.profileImage ?? g.imageUrl ?? null,
    categoryId: g.categoryId,
    countryId: g.countryId,
    members: computeDisplayedMembers(g.clicks ?? 0, g.joinCount ?? 0, g.id),
    isFeatured: g.popularityBadge === "featured",
    isVerified: g.linkStatus === "active",
    status: (g.status as GroupStatus) ?? "ACTIVE",
    tags: parseTags(g.tags),
    keywords: parseTags(g.keywords),
    views: g.views ?? 0,
    shares: g.shares ?? 0,
    clicks: g.clicks ?? 0,
    joinCount: g.joinCount ?? 0,
    contactName: g.contactName ?? null,
    city: g.city ?? null,
    language: g.language ?? "Espanol",
    isAdult: !!g.isAdult,
    linkStatus: g.linkStatus ?? "active",
    uploaderId: g.uploaderId ?? null,
    uploaderName: g.uploaderName ?? null,
    uploaderSlug: g.uploaderSlug ?? null,
    createdAt: toIso(g.createdAt) ?? new Date(0).toISOString(),
    lastActiveAt: toIso(g.lastActiveAt),
    category: g.catName
      ? {
          id: g.categoryId,
          name: g.catName,
          slug: g.catSlug,
          description: g.catDesc ?? "",
          icon: g.catIcon ?? "💬",
          color: g.catColor ?? "emerald",
          sortOrder: g.catSort ?? 1000,
          groupCount: 0,
          isAdult: !!g.catIsAdult,
          isActive: g.catIsActive == null ? true : !!g.catIsActive,
        }
      : undefined,
    country: g.countryName
      ? {
          id: g.countryId,
          name: g.countryName,
          code: g.countryCode,
          flag: g.countryFlag,
          region: g.countryRegion,
          dialCode: g.countryDial ?? null,
          groupCount: 0,
        }
      : undefined,
  };
}

function like(value: string): string {
  return `%${value.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

// ---------------------------------------------------------------------------
// Taxonomies
// ---------------------------------------------------------------------------

export async function getCategories(
  opts: { adult?: "exclude" | "only" } = {}
): Promise<CategoryDTO[]> {
  // Clean by default — adult categories never render on indexing pages.
  const only = (opts.adult ?? "exclude") === "only";
  const rows = await query<Row>(
    `SELECT c.*, (SELECT COUNT(*) FROM \`groups\` g WHERE g.\`categoryId\` = c.\`id\` AND g.\`status\` = 'live' AND g.\`isAdult\` = ${only ? 1 : 0}) AS \`groupCount\`
     FROM \`categories\` c
     ${only ? "WHERE c.`isAdult` = 1" : "WHERE c.`isAdult` = 0"}
     ORDER BY c.\`sortOrder\` ASC`
  );
  return rows.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    icon: c.icon ?? "💬",
    color: c.color ?? "emerald",
    sortOrder: c.sortOrder ?? 1000,
    groupCount: Number(c.groupCount ?? 0),
    isAdult: !!c.isAdult,
    isActive: c.isActive == null ? true : !!c.isActive,
  }));
}

export async function getCountries(): Promise<CountryDTO[]> {
  const rows = await query<Row>(
    `SELECT co.*, (SELECT COUNT(*) FROM \`groups\` g WHERE g.\`countryId\` = co.\`id\` AND g.\`status\` = 'live' AND g.\`isAdult\` = 0) AS \`groupCount\`
     FROM \`countries\` co
     WHERE co.\`isActive\` = 1
     ORDER BY co.\`name\` ASC`
  );
  return rows.map((c: any) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    flag: c.flag,
    region: c.region,
    dialCode: c.dialCode ?? null,
    groupCount: Number(c.groupCount ?? 0),
    isActive: c.isActive == null ? true : !!c.isActive,
  }));
}

export async function getStats(): Promise<StatsDTO> {
  // Clean-only counts: global stats describe the clean, indexable directory.
  const row = await queryOne<Row>(
    `SELECT
       (SELECT COUNT(*) FROM \`groups\` WHERE \`status\` = 'live' AND \`isAdult\` = 0) AS \`groups\`,
       (SELECT COUNT(*) FROM \`categories\` WHERE \`isAdult\` = 0)                    AS \`categories\`,
       (SELECT COUNT(*) FROM \`countries\`)                     AS \`countries\`,
       (SELECT COALESCE(SUM(\`clicks\`), 0) FROM \`groups\` WHERE \`status\` = 'live' AND \`isAdult\` = 0) AS \`members\`,
       (SELECT COUNT(*) FROM \`groups\` WHERE \`status\` = 'live' AND \`isAdult\` = 0 AND \`popularityBadge\` = 'featured') AS \`featured\``
  );
  const r: any = row ?? {};
  return {
    groups: Number(r.groups ?? 0),
    categories: Number(r.categories ?? 0),
    countries: Number(r.countries ?? 0),
    members: Number(r.members ?? 0),
    featured: Number(r.featured ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Groups — list / filter / sort
// ---------------------------------------------------------------------------

interface BuiltWhere {
  where: string;
  params: unknown[];
}

function buildGroupWhere(q: {
  search?: string;
  categoryId?: string;
  countryId?: string;
  region?: string;
  tag?: string;
  featured?: boolean;
  status?: string;
  adult?: AdultFilter;
}): BuiltWhere {
  const clauses: string[] = [];
  const params: unknown[] = [];

  clauses.push("g.`status` = ?");
  params.push(q.status ?? "live");

  if (q.categoryId) {
    clauses.push("g.`categoryId` = ?");
    params.push(q.categoryId);
  }
  if (q.countryId) {
    clauses.push("g.`countryId` = ?");
    params.push(q.countryId);
  }
  if (q.featured) {
    clauses.push("g.`popularityBadge` = 'featured'");
  }
  if (q.tag) {
    clauses.push("g.`tags` LIKE ?");
    params.push(like(`"${q.tag}"`));
  }
  // Adult policy — default: 100% clean (indexing pages / SSR).
  switch (q.adult ?? DEFAULT_ADULT) {
    case "exclude":
      clauses.push("g.`isAdult` = 0");
      break;
    case "only":
      clauses.push("g.`isAdult` = 1");
      break;
    case "include":
    default:
      break; // no filter — both clean and adult
  }
  if (q.search && q.search.trim().length > 0) {
    clauses.push("(g.`groupName` LIKE ? OR g.`description` LIKE ?)");
    const l = like(q.search.trim());
    params.push(l, l);
  }
  if (q.region) {
    clauses.push("co.`region` = ?");
    params.push(q.region);
  }
  return { where: clauses.join(" AND "), params };
}

function sortToOrderBy(sort?: string): string {
  switch (sort) {
    case "miembros":
      return "g.`clicks` DESC, g.`views` DESC";
    case "populares":
      return "g.`views` DESC, g.`clicks` DESC";
    case "destacados":
      return "g.`clicks` DESC, g.`views` DESC";
    case "recientes":
    default:
      return "g.`createdAt` DESC";
  }
}

export async function getGroups(query_: GroupsQuery = {}): Promise<GroupDTO[]> {
  const { sort = "recientes", limit = 30, offset = 0 } = query_;
  const { where, params } = buildGroupWhere(query_);
  const take = Math.min(Math.max(limit, 1), 60);
  const skip = Math.max(offset, 0);
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE ${where}
     ORDER BY ${sortToOrderBy(sort)}
     LIMIT ? OFFSET ?`,
    [...params, take, skip]
  );
  return rows.map(toGroupDTO);
}

export async function getGroupById(id: string): Promise<GroupDTO | null> {
  const row = await queryOne<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM} WHERE g.\`id\` = ? LIMIT 1`,
    [id]
  );
  return row ? toGroupDTO(row) : null;
}

export async function incrementViews(id: string): Promise<void> {
  try {
    await Promise.all([
      exec("UPDATE `groups` SET `views` = `views` + 1 WHERE `id` = ?", [id]),
      // Daily time-series row (trending "movers" on /populares)
      exec(
        "INSERT INTO `group_daily_stats` (`groupId`, `day`, `views`, `clicks`) VALUES (?, CURDATE(), 1, 0) ON DUPLICATE KEY UPDATE `views` = `views` + 1",
        [id]
      ),
    ]);
  } catch {
    /* ignore */
  }
}

export async function submitGroup(payload: {
  title: string;
  description: string;
  inviteLink: string;
  imageUrl?: string;
  categoryId: string;
  countryId: string;
  city?: string;
  contactName?: string;
  tags?: string[];
}): Promise<GroupDTO> {
  // Resolve category/country names for the denormalized columns
  const cat = await queryOne<Row>("SELECT `name` FROM `categories` WHERE `id` = ? LIMIT 1", [payload.categoryId]);
  const country = await queryOne<Row>("SELECT `name` FROM `countries` WHERE `id` = ? LIMIT 1", [payload.countryId]);

  // Generate unique slug from title
  const baseSlug = generateSlug(payload.title);
  const existing = await query<Row>(
    "SELECT `slug` FROM `groups` WHERE `slug` LIKE ?",
    [`${baseSlug}%`]
  );
  const existingSet = new Set(existing.map((r: any) => r.slug));
  const slug = makeUniqueSlug(baseSlug, (s) => existingSet.has(s));

  const id = newId();
  await exec(
    `INSERT INTO \`groups\`
      (\`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`description\`, \`category\`, \`categoryId\`, \`country\`, \`countryId\`, \`city\`, \`tags\`, \`profileImage\`, \`status\`, \`contactName\`, \`submitSource\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'staff')`,
    [
      id,
      payload.title.trim(),
      slug,
      payload.inviteLink.trim(),
      payload.description.trim(),
      (cat as any)?.name ?? "",
      payload.categoryId,
      (country as any)?.name ?? "",
      payload.countryId,
      payload.city?.trim() || null,
      JSON.stringify(payload.tags ?? []),
      payload.imageUrl?.trim() || null,
      payload.contactName?.trim() || null,
    ]
  );

  const created = await getGroupById(id);
  if (!created) throw new Error("submitGroup: no se pudo leer el grupo creado");
  return created;
}

export async function getMetrics() {
  const row = await queryOne<Row>(
    `SELECT
       (SELECT COUNT(*) FROM \`groups\` WHERE \`status\` = 'live')    AS \`groups\`,
       (SELECT COUNT(*) FROM \`categories\`)                         AS \`categories\`,
       (SELECT COUNT(*) FROM \`countries\`)                          AS \`countries\`,
       (SELECT COUNT(*) FROM \`groups\` WHERE \`status\` = 'pending') AS \`pending\`,
       (SELECT COUNT(*) FROM \`group_reports\` WHERE \`status\` = 'OPEN') AS \`reports\`,
       (SELECT COUNT(*) FROM \`newsletter\` WHERE \`status\` = 'SUBSCRIBED') AS \`newsletter\`,
       (SELECT COALESCE(SUM(\`clicks\`), 0) FROM \`groups\` WHERE \`status\` = 'live') AS \`members\`,
       (SELECT COUNT(*) FROM \`groups\` WHERE \`status\` = 'live' AND \`popularityBadge\` = 'featured') AS \`featured\``
  );
  const r: any = row ?? {};

  const activeGroups = await query<Row>(
    `SELECT co.\`name\`, co.\`flag\`, co.\`region\`
     FROM \`groups\` g JOIN \`countries\` co ON co.\`id\` = g.\`countryId\`
     WHERE g.\`status\` = 'live'`
  );
  const regionMap = new Map<string, number>();
  const countryMap = new Map<string, { name: string; flag: string; count: number }>();
  for (const g of activeGroups as any[]) {
    if (!g.region) continue;
    regionMap.set(g.region, (regionMap.get(g.region) ?? 0) + 1);
    const existing = countryMap.get(g.name);
    if (existing) existing.count += 1;
    else countryMap.set(g.name, { name: g.name, flag: g.flag, count: 1 });
  }
  const regions = [...regionMap.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
  const topCountries = [...countryMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    groups: Number(r.groups ?? 0),
    categories: Number(r.categories ?? 0),
    countries: Number(r.countries ?? 0),
    pending: Number(r.pending ?? 0),
    reports: Number(r.reports ?? 0),
    newsletter: Number(r.newsletter ?? 0),
    featured: Number(r.featured ?? 0),
    members: Number(r.members ?? 0),
    regions,
    topCountries,
  };
}

export async function getGroupOfTheDay(): Promise<GroupDTO | null> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live' AND g.\`popularityBadge\` = 'featured'
     ORDER BY g.\`clicks\` DESC LIMIT 60`
  );
  if (rows.length === 0) {
    const fallback = await queryOne<GroupRow>(
      `SELECT ${GROUP_SELECT} ${GROUP_FROM}
       WHERE g.\`status\` = 'live' ORDER BY g.\`views\` DESC LIMIT 1`
    );
    return fallback ? toGroupDTO(fallback) : null;
  }
  // Deterministic daily rotation based on day-of-year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const pick = rows[dayOfYear % rows.length];
  return toGroupDTO(pick);
}

export async function getRelatedGroups(
  id: string,
  categoryId: string,
  limit = 4
): Promise<GroupDTO[]> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live' AND g.\`id\` <> ? AND g.\`categoryId\` = ?
     ORDER BY g.\`clicks\` DESC, g.\`views\` DESC
     LIMIT ?`,
    [id, categoryId, limit]
  );
  return rows.map(toGroupDTO);
}

export async function getTrending(limit = 6): Promise<GroupDTO[]> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live'
     ORDER BY g.\`views\` DESC, g.\`clicks\` DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map(toGroupDTO);
}

export async function getPopularTags(
  limit = 14,
  opts: { adult?: "exclude" | "only" } = {}
): Promise<{ tag: string; count: number }[]> {
  // Adult policy: default counts only clean tags (indexing pages / SSR);
  // adult=only counts tags of adult groups (18+ mode, client-side fetch).
  const only = (opts.adult ?? "exclude") === "only";
  const rows = await query<Row>(
    "SELECT `tags` FROM `groups` WHERE `status` = 'live' AND `isAdult` = ?",
    [only ? 1 : 0]
  );
  const counts = new Map<string, number>();
  for (const r of rows as any[]) {
    for (const t of parseTags(r.tags)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function createReport(input: {
  groupId: string;
  reason: string;
  details?: string;
  contact?: string;
}): Promise<{ id: string }> {
  const id = newId();
  await exec(
    `INSERT INTO \`group_reports\` (\`id\`, \`groupId\`, \`reporterIp\`, \`reason\`, \`status\`)
     VALUES (?, ?, '0.0.0.0', ?, 'OPEN')`,
    [id, input.groupId, input.reason]
  );
  return { id };
}

export async function subscribeNewsletter(
  email: string,
  source = "footer"
): Promise<{ id: string; existed: boolean }> {
  const existing = await queryOne<Row>(
    "SELECT `id`, `status` FROM `newsletter` WHERE `email` = ? LIMIT 1",
    [email]
  );
  if (existing) {
    if ((existing as any).status === "UNSUBSCRIBED") {
      await exec(
        "UPDATE `newsletter` SET `status` = 'SUBSCRIBED', `source` = ? WHERE `email` = ?",
        [source, email]
      );
    }
    return { id: (existing as any).id, existed: true };
  }
  const id = newId();
  await exec(
    "INSERT INTO `newsletter` (`id`, `email`, `source`, `status`) VALUES (?, ?, ?, 'SUBSCRIBED')",
    [id, email, source]
  );
  return { id, existed: false };
}

export async function getGroupsCount(
  query_: Omit<GroupsQuery, "sort" | "limit" | "offset"> = {}
): Promise<number> {
  const { where, params } = buildGroupWhere(query_);
  const row = await queryOne<Row>(
    `SELECT COUNT(*) AS \`c\` ${GROUP_FROM} WHERE ${where}`,
    params
  );
  return Number((row as any)?.c ?? 0);
}

export async function getRandomGroup(): Promise<GroupDTO | null> {
  // Clean-by-default (SafeSearch posture): the "Sorpréndeme" hero button
  // lives on clean surfaces — adult groups are never served at random.
  const row = await queryOne<Row>(
    "SELECT COUNT(*) AS `c` FROM `groups` WHERE `status` = 'live' AND `isAdult` = 0"
  );
  const total = Number((row as any)?.c ?? 0);
  if (total === 0) return null;
  const skip = Math.floor(Math.random() * total);
  const g = await queryOne<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live' AND g.\`isAdult\` = 0
     LIMIT 1 OFFSET ?`,
    [skip]
  );
  return g ? toGroupDTO(g) : null;
}

export async function getRecentGroups(limit = 6): Promise<GroupDTO[]> {
  // Clean-by-default: recent feeds never leak adult rows into clean UI.
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live' AND g.\`isAdult\` = 0
     ORDER BY g.\`createdAt\` DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map(toGroupDTO);
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export async function getGroupRatingStats(groupId: string): Promise<{ avg: number; count: number }> {
  const row = await queryOne<Row>(
    "SELECT COALESCE(AVG(`rating`), 0) AS `avg`, COUNT(*) AS `count` FROM `group_reviews` WHERE `groupId` = ?",
    [groupId]
  );
  const r: any = row ?? { avg: 0, count: 0 };
  return { avg: Math.round(Number(r.avg) * 10) / 10, count: Number(r.count) };
}

export async function submitRating(
  groupId: string,
  rating: number,
  ipHash: string
): Promise<{ avg: number; count: number; updated: boolean }> {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  const existing = await queryOne<Row>(
    "SELECT `id` FROM `group_reviews` WHERE `groupId` = ? AND `ipHash` = ? LIMIT 1",
    [groupId, ipHash]
  );
  if (existing) {
    await exec("UPDATE `group_reviews` SET `rating` = ? WHERE `id` = ?", [clamped, (existing as any).id]);
  } else {
    await exec(
      "INSERT INTO `group_reviews` (`id`, `groupId`, `rating`, `ipHash`) VALUES (?, ?, ?, ?)",
      [newId(), groupId, clamped, ipHash]
    );
  }
  const stats = await getGroupRatingStats(groupId);
  return { ...stats, updated: !!existing };
}

export async function getTopRatedGroups(limit = 6): Promise<GroupDTO[]> {
  const rated = await query<Row>(
    `SELECT \`groupId\`, AVG(\`rating\`) AS \`avg\`, COUNT(*) AS \`count\`
     FROM \`group_reviews\` GROUP BY \`groupId\`
     ORDER BY \`count\` DESC LIMIT 50`
  );
  if (rated.length === 0) return [];
  const ids = (rated as any[])
    .sort((a, b) => {
      const aAvg = Number(a.avg ?? 0);
      const bAvg = Number(b.avg ?? 0);
      if (bAvg !== aAvg) return bAvg - aAvg;
      return Number(b.count) - Number(a.count);
    })
    .slice(0, limit)
    .map((r) => r.groupId);
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`id\` IN (${placeholders}) AND g.\`status\` = 'live'`,
    ids
  );
  const byId = new Map(rows.map((r) => [r.id, toGroupDTO(r)]));
  return ids.map((id) => byId.get(id)).filter((g): g is GroupDTO => !!g);
}

/**
 * Groups by explicit ID list, preserving the caller's order (most recent
 * favorite first). Only `live` groups are returned. Used by /favoritos.
 */
export async function getGroupsByIds(ids: string[]): Promise<GroupDTO[]> {
  const clean = Array.from(new Set(ids.map((s) => s.trim()).filter(Boolean))).slice(0, 60);
  if (clean.length === 0) return [];
  const placeholders = clean.map(() => "?").join(", ");
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`id\` IN (${placeholders}) AND g.\`status\` = 'live'`,
    clean
  );
  const byId = new Map(rows.map((r) => [r.id, toGroupDTO(r)]));
  return clean.map((id) => byId.get(id)).filter((g): g is GroupDTO => !!g);
}

export async function getRatingsBatch(
  groupIds: string[]
): Promise<Record<string, { avg: number; count: number }>> {
  if (groupIds.length === 0) return {};
  const placeholders = groupIds.map(() => "?").join(", ");
  const rows = await query<Row>(
    `SELECT \`groupId\`, AVG(\`rating\`) AS \`avg\`, COUNT(*) AS \`count\`
     FROM \`group_reviews\` WHERE \`groupId\` IN (${placeholders})
     GROUP BY \`groupId\``,
    groupIds
  );
  const map: Record<string, { avg: number; count: number }> = {};
  for (const r of rows as any[]) {
    map[r.groupId] = {
      avg: Math.round(Number(r.avg ?? 0) * 10) / 10,
      count: Number(r.count ?? 0),
    };
  }
  return map;
}

// ---------------------------------------------------------------------------
// Counters
// ---------------------------------------------------------------------------

export async function incrementShares(id: string): Promise<void> {
  try {
    await exec("UPDATE `groups` SET `shares` = `shares` + 1 WHERE `id` = ?", [id]);
  } catch {
    /* ignore */
  }
}

export async function touchGroupActivity(id: string): Promise<void> {
  try {
    await exec("UPDATE `groups` SET `lastActiveAt` = NOW() WHERE `id` = ?", [id]);
  } catch {
    /* ignore */
  }
}

export async function incrementClicks(id: string): Promise<void> {
  try {
    await Promise.all([
      exec("UPDATE `groups` SET `clicks` = `clicks` + 1 WHERE `id` = ?", [id]),
      // Daily time-series row (trending "movers" on /populares)
      exec(
        "INSERT INTO `group_daily_stats` (`groupId`, `day`, `views`, `clicks`) VALUES (?, CURDATE(), 0, 1) ON DUPLICATE KEY UPDATE `clicks` = `clicks` + 1",
        [id]
      ),
    ]);
  } catch {
    /* ignore */
  }
}

export async function getMostSharedGroups(limit = 6): Promise<GroupDTO[]> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live' AND g.\`shares\` > 0
     ORDER BY g.\`shares\` DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map(toGroupDTO);
}

// ---------------------------------------------------------------------------
// Trending movers (view growth, last 7 days vs previous 7 days)
// ---------------------------------------------------------------------------

export interface TrendingMover {
  group: GroupDTO;
  /** Views in the last 7 days (incl. today). */
  weekViews: number;
  /** Views in the previous 7 days. */
  prevViews: number;
  /** weekViews - prevViews (positive = rising). */
  delta: number;
  /** Relative change vs previous week (null when prevViews is 0). */
  deltaPct: number | null;
  /** Daily view counts for the last 14 days, oldest → newest. */
  series: number[];
}

/**
 * Groups with the strongest view growth this week (backed by
 * group_daily_stats). Ordered by absolute delta, tie-broken by weekly volume.
 */
export async function getTrendingMovers(limit = 6): Promise<TrendingMover[]> {
  try {
    const rows = await query<GroupRow>(
      `SELECT ${GROUP_SELECT}, st.\`weekViews\`, st.\`prevViews\`, st.\`seriesJson\`
       ${GROUP_FROM}
       JOIN (
         SELECT \`groupId\`,
           SUM(CASE WHEN \`day\` >= SUBDATE(CURDATE(), 6) THEN \`views\` ELSE 0 END) AS \`weekViews\`,
           SUM(CASE WHEN \`day\` < SUBDATE(CURDATE(), 6) AND \`day\` >= SUBDATE(CURDATE(), 13) THEN \`views\` ELSE 0 END) AS \`prevViews\`,
           CONCAT('[', GROUP_CONCAT(\`views\` ORDER BY \`day\` SEPARATOR ','), ']') AS \`seriesJson\`
         FROM \`group_daily_stats\`
         WHERE \`day\` >= SUBDATE(CURDATE(), 13)
         GROUP BY \`groupId\`
       ) st ON st.\`groupId\` = g.\`id\`
       WHERE g.\`status\` = 'live' AND g.\`isAdult\` = 0
       ORDER BY (st.\`weekViews\` - st.\`prevViews\`) DESC, st.\`weekViews\` DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map((r) => {
      const weekViews = Number(r.weekViews ?? 0);
      const prevViews = Number(r.prevViews ?? 0);
      let series: number[] = [];
      try {
        const parsed = JSON.parse(String(r.seriesJson ?? "[]"));
        if (Array.isArray(parsed)) series = parsed.map(Number).filter(Number.isFinite);
      } catch {
        /* keep empty series */
      }
      return {
        group: toGroupDTO(r),
        weekViews,
        prevViews,
        delta: weekViews - prevViews,
        deltaPct: prevViews > 0 ? Math.round(((weekViews - prevViews) / prevViews) * 100) : null,
        series,
      };
    });
  } catch {
    // Table not migrated yet or transient error — degrade gracefully.
    return [];
  }
}

// ---------------------------------------------------------------------------
// Dedicated page data functions
// ---------------------------------------------------------------------------

export async function getCategoryBySlug(slug: string) {
  const c = await queryOne<Row>("SELECT * FROM `categories` WHERE `slug` = ? LIMIT 1", [slug]);
  if (!c) return null;
  const isAdult = !!(c as any).isAdult;
  // Count within the category's own silo (adult cat counts adult groups).
  const count = await getGroupsCount({
    categoryId: (c as any).id,
    adult: isAdult ? "only" : "exclude",
  });
  return {
    id: (c as any).id,
    name: (c as any).name,
    slug: (c as any).slug,
    description: (c as any).description,
    icon: (c as any).icon,
    color: (c as any).color,
    sortOrder: (c as any).sortOrder,
    isAdult,
    groupCount: count,
  };
}

export async function getCountryByCode(code: string) {
  const c = await queryOne<Row>(
    "SELECT * FROM `countries` WHERE `code` = ? LIMIT 1",
    [code.toLowerCase()]
  );
  if (!c) return null;
  const count = await getGroupsCount({ countryId: (c as any).id });
  return {
    id: (c as any).id,
    name: (c as any).name,
    code: (c as any).code,
    flag: (c as any).flag,
    region: (c as any).region,
    dialCode: (c as any).dialCode,
    groupCount: count,
  };
}

export async function getGroupsByCategorySlug(slug: string, limit = 60): Promise<GroupDTO[]> {
  const cat = await queryOne<Row>("SELECT `id` FROM `categories` WHERE `slug` = ? LIMIT 1", [slug]);
  if (!cat) return [];
  return getGroups({ categoryId: (cat as any).id, limit, sort: "destacados" });
}

export async function getGroupsByCountryCode(code: string, limit = 60): Promise<GroupDTO[]> {
  const country = await queryOne<Row>(
    "SELECT `id` FROM `countries` WHERE `code` = ? LIMIT 1",
    [code.toLowerCase()]
  );
  if (!country) return [];
  return getGroups({ countryId: (country as any).id, limit, sort: "destacados" });
}

export function citySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getAllCities(): Promise<
  { city: string; slug: string; groupCount: number; countryCode: string; countryFlag: string }[]
> {
  const rows = await query<Row>(
    `SELECT g.\`city\`, co.\`code\`, co.\`flag\`
     FROM \`groups\` g LEFT JOIN \`countries\` co ON co.\`id\` = g.\`countryId\`
     WHERE g.\`status\` = 'live' AND g.\`city\` IS NOT NULL AND g.\`city\` <> ''`
  );
  const map = new Map<string, { city: string; groupCount: number; countryCode: string; countryFlag: string }>();
  for (const r of rows as any[]) {
    const existing = map.get(r.city);
    if (existing) {
      existing.groupCount += 1;
    } else {
      map.set(r.city, {
        city: r.city,
        groupCount: 1,
        countryCode: r.code ?? "",
        countryFlag: r.flag ?? "🏳️",
      });
    }
  }
  return [...map.values()]
    .map((c) => ({ ...c, slug: citySlug(c.city) }))
    .sort((a, b) => b.groupCount - a.groupCount);
}

export async function getCityBySlug(slug: string) {
  const cities = await getAllCities();
  return cities.find((c) => c.slug === slug) ?? null;
}

export async function getGroupsByCity(city: string, limit = 60): Promise<GroupDTO[]> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live' AND g.\`city\` = ?
     ORDER BY g.\`clicks\` DESC, g.\`views\` DESC
     LIMIT ?`,
    [city, limit]
  );
  return rows.map(toGroupDTO);
}

export async function getAllGroupIds(): Promise<string[]> {
  const rows = await query<Row>("SELECT `id` FROM `groups` WHERE `status` = 'live'");
  return (rows as any[]).map((r) => r.id);
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const rows = await query<Row>("SELECT `slug` FROM `categories`");
  return (rows as any[]).map((r) => r.slug);
}

export async function getAllCountryCodes(): Promise<string[]> {
  const rows = await query<Row>("SELECT `code` FROM `countries`");
  return (rows as any[]).map((r) => r.code);
}

// ---------------------------------------------------------------------------
// Slug-based + paginated data functions
// ---------------------------------------------------------------------------

const PAGE_SIZE = 120;

export async function getGroupBySlug(slug: string): Promise<GroupDTO | null> {
  const g = await queryOne<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM} WHERE g.\`slug\` = ? LIMIT 1`,
    [slug]
  );
  return g ? toGroupDTO(g) : null;
}

/**
 * Groups by explicit slug list, preserving the caller's order. Only `live`
 * groups are returned. Used by the /comparar tool.
 */
export async function getGroupsBySlugs(slugs: string[]): Promise<GroupDTO[]> {
  const clean = Array.from(new Set(slugs.map((s) => s.trim().toLowerCase()).filter(Boolean))).slice(0, 3);
  if (clean.length === 0) return [];
  const placeholders = clean.map(() => "?").join(", ");
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`slug\` IN (${placeholders}) AND g.\`status\` = 'live'`,
    clean
  );
  const bySlug = new Map(rows.map((r) => [r.slug, toGroupDTO(r)]));
  return clean.map((s) => bySlug.get(s)).filter((g): g is GroupDTO => !!g);
}

export interface PaginatedGroups {
  groups: GroupDTO[];
  total: number;
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

async function buildPaginated(
  where: BuiltWhere,
  orderBy: string,
  page: number,
  pageSize: number = PAGE_SIZE
): Promise<PaginatedGroups> {
  const totalRow = await queryOne<Row>(
    `SELECT COUNT(*) AS \`c\` ${GROUP_FROM} WHERE ${where.where}`,
    where.params
  );
  const total = Number((totalRow as any)?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const skip = (safePage - 1) * pageSize;
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE ${where.where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...where.params, pageSize, skip]
  );
  return {
    groups: rows.map(toGroupDTO),
    total,
    page: safePage,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export async function getGroupsByCategorySlugPaginated(slug: string, page: number) {
  const cat = await queryOne<Row>("SELECT * FROM `categories` WHERE `slug` = ? LIMIT 1", [slug]);
  if (!cat) return null;
  // Silo + default order "populares" (matches the client filter row's default).
  // SSR batch is 24 for fast first paint; deeper pages load via AJAX load-more.
  const isAdult = !!(cat as any).isAdult;
  const result = await buildPaginated(
    buildGroupWhere({ categoryId: (cat as any).id, adult: isAdult ? "only" : "exclude" }),
    "g.`views` DESC, g.`clicks` DESC",
    page,
    24
  );
  return { category: cat, ...result };
}

export async function getGroupsByCountryCodePaginated(code: string, page: number) {
  const country = await queryOne<Row>(
    "SELECT * FROM `countries` WHERE `code` = ? LIMIT 1",
    [code.toLowerCase()]
  );
  if (!country) return null;
  const result = await buildPaginated(
    buildGroupWhere({ countryId: (country as any).id }),
    "g.`clicks` DESC, g.`views` DESC",
    page
  );
  return { country, ...result };
}

export async function getGroupsByCityPaginated(city: string, page: number) {
  return buildPaginated(
    { where: "g.`status` = 'live' AND g.`city` = ?", params: [city] },
    "g.`clicks` DESC, g.`views` DESC",
    page
  );
}

/**
 * Get 30 related groups for a given group.
 * Priority: same city → same country → same category → any popular.
 */
export async function getRelatedGroupsExtended(group: GroupDTO, limit = 30): Promise<GroupDTO[]> {
  const excludeId = group.id;

  const fetch = (whereExtra: string, params: unknown[], lim: number) =>
    query<GroupRow>(
      `SELECT ${GROUP_SELECT} ${GROUP_FROM}
       WHERE g.\`status\` = 'live' AND g.\`id\` <> ? ${whereExtra ? `AND ${whereExtra}` : ""}
       ORDER BY g.\`clicks\` DESC, g.\`views\` DESC
       LIMIT ?`,
      [excludeId, ...params, lim]
    );

  const combined: GroupRow[] = [];

  if (group.city) {
    const byCity = await fetch("g.`city` = ?", [group.city], limit);
    combined.push(...byCity);
    if (combined.length >= limit) return combined.slice(0, limit).map(toGroupDTO);

    const remaining = limit - combined.length;
    const notIn = [...combined.map((g) => g.id), excludeId];
    const byCountry = await fetch(
      "g.`countryId` = ? AND g.`id` NOT IN (" + notIn.map(() => "?").join(", ") + ")",
      [group.countryId, ...notIn],
      remaining
    );
    combined.push(...byCountry);
    if (combined.length >= limit) return combined.slice(0, limit).map(toGroupDTO);

    const remaining2 = limit - combined.length;
    const notIn2 = [...combined.map((g) => g.id), excludeId];
    const byCategory = await fetch(
      "g.`categoryId` = ? AND g.`id` NOT IN (" + notIn2.map(() => "?").join(", ") + ")",
      [group.categoryId, ...notIn2],
      remaining2
    );
    combined.push(...byCategory);
    return combined.slice(0, limit).map(toGroupDTO);
  }

  const byCountry = await fetch("g.`countryId` = ?", [group.countryId], limit);
  combined.push(...byCountry);
  if (combined.length < limit) {
    const remaining = limit - combined.length;
    const notIn = [...combined.map((g) => g.id), excludeId];
    const byCategory = await fetch(
      "g.`categoryId` = ? AND g.`id` NOT IN (" + notIn.map(() => "?").join(", ") + ")",
      [group.categoryId, ...notIn],
      remaining
    );
    combined.push(...byCategory);
  }
  if (combined.length < limit) {
    const remaining2 = limit - combined.length;
    const notIn2 = [...combined.map((g) => g.id), excludeId];
    const fallback = await fetch(
      "g.`id` NOT IN (" + notIn2.map(() => "?").join(", ") + ")",
      notIn2,
      remaining2
    );
    combined.push(...fallback);
  }
  return combined.slice(0, limit).map(toGroupDTO);
}

export async function getAllGroupSlugs(): Promise<string[]> {
  const rows = await query<Row>("SELECT `slug` FROM `groups` WHERE `status` = 'live'");
  return (rows as any[]).map((r) => r.slug);
}

// ---------------------------------------------------------------------------
// SEARCH — AND-words search across groupName, description, tags, keywords
// ---------------------------------------------------------------------------

export interface SearchGroupsResult {
  groups: GroupDTO[];
  total: number;
}

/**
 * Search across groupName, description, tags and keywords.
 * AND-logic: every word in `q` must match (in any of the four fields).
 */
export async function searchGroups(q: string, limit = 48): Promise<SearchGroupsResult> {
  const raw = (q ?? "").trim();
  if (!raw) return { groups: [], total: 0 };

  const words = Array.from(new Set(raw.split(/\s+/).map((w) => w.toLowerCase()).filter(Boolean)));
  if (words.length === 0) return { groups: [], total: 0 };

  // Search is a personal results page — adult content allowed (directive).
  const clauses: string[] = ["g.`status` = 'live'"];
  const params: unknown[] = [];
  for (const word of words) {
    const l = like(word);
    clauses.push(
      "(g.`groupName` LIKE ? OR g.`description` LIKE ? OR g.`tags` LIKE ? OR g.`keywords` LIKE ?)"
    );
    params.push(l, l, l, l);
  }
  const where = clauses.join(" AND ");
  const take = Math.min(Math.max(limit, 1), 100);

  const [rows, totalRow] = await Promise.all([
    query<GroupRow>(
      `SELECT ${GROUP_SELECT} ${GROUP_FROM}
       WHERE ${where}
       ORDER BY g.\`clicks\` DESC, g.\`views\` DESC, g.\`createdAt\` DESC
       LIMIT ?`,
      [...params, take]
    ),
    queryOne<Row>(`SELECT COUNT(*) AS \`c\` ${GROUP_FROM} WHERE ${where}`, params),
  ]);
  return { groups: rows.map(toGroupDTO), total: Number((totalRow as any)?.c ?? 0) };
}

// ---------------------------------------------------------------------------
// TAG PAGES
// ---------------------------------------------------------------------------

export async function getTagBySlug(
  slug: string
): Promise<{ name: string; slug: string; count: number } | null> {
  const rows = await query<Row>(
    "SELECT `tags` FROM `groups` WHERE `status` = 'live' AND `isAdult` = 0"
  );
  const counts = new Map<string, number>();
  for (const r of rows as any[]) {
    for (const t of parseTags(r.tags)) {
      if (citySlug(t) === slug) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
  }
  if (counts.size === 0) return null;
  const [name, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { name, slug: citySlug(name), count };
}

export async function getGroupsByTagPaginated(
  tagName: string,
  page: number
): Promise<PaginatedGroups> {
  const PAGE = 48;
  const where = "g.`status` = 'live' AND g.`isAdult` = 0 AND g.`tags` LIKE ?";
  const params: unknown[] = [like(`"${tagName}"`)];

  const totalRow = await queryOne<Row>(
    `SELECT COUNT(*) AS \`c\` ${GROUP_FROM} WHERE ${where}`,
    params
  );
  const total = Number((totalRow as any)?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const skip = (safePage - 1) * PAGE;
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE ${where}
     ORDER BY g.\`clicks\` DESC, g.\`views\` DESC, g.\`createdAt\` DESC
     LIMIT ? OFFSET ?`,
    [...params, PAGE, skip]
  );
  return {
    groups: rows.map(toGroupDTO),
    total,
    page: safePage,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export async function getRelatedTags(
  tagName: string,
  limit = 16
): Promise<{ tag: string; count: number }[]> {
  const rows = await query<Row>(
    "SELECT `tags` FROM `groups` WHERE `status` = 'live' AND `isAdult` = 0 AND `tags` LIKE ?",
    [like(`"${tagName}"`)]
  );
  const target = tagName.toLowerCase();
  const counts = new Map<string, number>();
  for (const r of rows as any[]) {
    for (const t of parseTags(r.tags)) {
      if (t.toLowerCase() === target) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// UPLOADER (author) PAGES
// ---------------------------------------------------------------------------

export interface UploaderDTO {
  id: string;
  name: string;
  slug: string;
  jobTitle: string;
  description: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  createdAt: Date;
  lastActiveAt: Date;
}

export async function getUploaderBySlug(slug: string): Promise<UploaderDTO | null> {
  const u = await queryOne<Row>("SELECT * FROM `uploaders` WHERE `slug` = ? LIMIT 1", [slug]);
  if (u) {
    const r = u as any;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      jobTitle: r.jobTitle ?? "Curador de Comunidades",
      description: r.description ?? null,
      facebookUrl: r.facebookUrl ?? null,
      twitterUrl: r.twitterUrl ?? null,
      linkedinUrl: r.linkedinUrl ?? null,
      websiteUrl: r.websiteUrl ?? null,
      imageUrl: r.imageUrl ?? null,
      createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt ?? Date.now()),
      lastActiveAt: r.lastActiveAt instanceof Date ? r.lastActiveAt : new Date(r.lastActiveAt ?? Date.now()),
    };
  }

  // Community contributors also get public profiles at /autor/[slug].
  // (ugc_contributors — people who publish groups through the UGC form.)
  const c = await queryOne<Row>(
    "SELECT `id`, `displayName`, `displaySlug`, `avatarUrl`, `publishedCount`, `submittedCount`, `reputationScore`, `isBlocked`, `isRemoved`, `lastSubmissionAt`, `createdAt` FROM `ugc_contributors` WHERE `displaySlug` = ? LIMIT 1",
    [slug]
  );
  if (!c) return null;
  const r = c as any;
  if (r.isBlocked || r.isRemoved) return null;
  const published = Number(r.publishedCount ?? 0);
  const description =
    `Contribuidor de la comunidad de ${SITE.name}: ha publicado ${published} ` +
    `${published === 1 ? "grupo" : "grupos"} en el directorio.`;
  return {
    id: r.id,
    name: r.displayName,
    slug: r.displaySlug,
    jobTitle: "Contribuidor de la comunidad",
    description,
    facebookUrl: null,
    twitterUrl: null,
    linkedinUrl: null,
    websiteUrl: null,
    imageUrl: r.avatarUrl || null,
    createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt ?? Date.now()),
    lastActiveAt:
      r.lastSubmissionAt instanceof Date
        ? r.lastSubmissionAt
        : new Date(r.lastSubmissionAt ?? Date.now()),
  };
}

export async function getAllUploaderSlugs(): Promise<string[]> {
  // Public author profiles: staff uploaders + community contributors.
  const rows = await query<Row>(
    "SELECT `slug` FROM `uploaders` UNION SELECT `displaySlug` FROM `ugc_contributors` WHERE `isBlocked` = 0 AND `isRemoved` = 0"
  );
  return (rows as any[]).map((r) => r.slug);
}

export interface AuthorIndexDTO {
  id: string;
  name: string;
  slug: string;
  jobTitle: string;
  description: string | null;
  imageUrl: string | null;
  kind: "staff" | "community";
  publishedCount: number;
  totalMembers: number;
  createdAt: Date;
}

/**
 * All public authors (staff uploaders + unblocked community contributors)
 * with live-group stats, sorted by published count desc. Powers /autores.
 *
 * NOTE: "members" is a derived value (computeDisplayedMembers), not a DB
 * column, so we aggregate in JS from a lightweight per-group owner query.
 */
export async function getAllAuthors(): Promise<AuthorIndexDTO[]> {
  const [staff, community, groupStats] = await Promise.all([
    query<Row>(
      `SELECT u.\`id\`, u.\`name\`, u.\`slug\`, u.\`jobTitle\`, u.\`description\`, u.\`imageUrl\`, u.\`createdAt\`
       FROM \`uploaders\` u
       ORDER BY u.\`name\` ASC`
    ),
    query<Row>(
      `SELECT c.\`id\`, c.\`displayName\` AS \`name\`, c.\`displaySlug\` AS \`slug\`, c.\`avatarUrl\` AS \`imageUrl\`,
              c.\`publishedCount\`, c.\`createdAt\`
       FROM \`ugc_contributors\` c
       WHERE c.\`isBlocked\` = 0 AND c.\`isRemoved\` = 0
       ORDER BY c.\`publishedCount\` DESC, c.\`displayName\` ASC`
    ),
    query<Row>(
      `SELECT \`uploaderId\`, \`ugcContributorId\`, \`id\`, \`clicks\`, \`joinCount\`
       FROM \`groups\`
       WHERE \`status\` = 'live' AND \`isAdult\` = 0`
    ),
  ]);

  // ownerKey → { published, members }
  const stats = new Map<string, { published: number; members: number }>();
  for (const g of groupStats as any[]) {
    const key = g.uploaderId ?? g.ugcContributorId;
    if (!key) continue;
    const entry = stats.get(key) ?? { published: 0, members: 0 };
    entry.published += 1;
    entry.members += computeDisplayedMembers(Number(g.clicks ?? 0), Number(g.joinCount ?? 0), String(g.id));
    stats.set(key, entry);
  }

  const authors: AuthorIndexDTO[] = [];

  for (const r of staff as any[]) {
    const s = stats.get(r.id) ?? { published: 0, members: 0 };
    authors.push({
      id: r.id,
      name: r.name,
      slug: r.slug,
      jobTitle: r.jobTitle ?? "Curador de Comunidades",
      description: r.description ?? null,
      imageUrl: r.imageUrl ?? null,
      kind: "staff",
      publishedCount: s.published,
      totalMembers: s.members,
      createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt ?? Date.now()),
    });
  }

  for (const r of community as any[]) {
    const s = stats.get(r.id) ?? { published: 0, members: 0 };
    authors.push({
      id: r.id,
      name: r.name,
      slug: r.slug,
      jobTitle: "Contribuidor de la comunidad",
      description: null,
      imageUrl: r.imageUrl ?? null,
      kind: "community",
      publishedCount: s.published > 0 ? s.published : Number(r.publishedCount ?? 0),
      totalMembers: s.members,
      createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt ?? Date.now()),
    });
  }

  // Global ordering: most published first.
  return authors.sort((a, b) => b.publishedCount - a.publishedCount || a.name.localeCompare(b.name));
}

export async function getGroupsByUploader(uploaderId: string, limit = 60): Promise<GroupDTO[]> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live' AND g.\`isAdult\` = 0 AND (g.\`uploaderId\` = ? OR g.\`ugcContributorId\` = ?)
     ORDER BY g.\`clicks\` DESC, g.\`views\` DESC, g.\`createdAt\` DESC
     LIMIT ?`,
    [uploaderId, uploaderId, Math.min(Math.max(limit, 1), 100)]
  );
  return rows.map(toGroupDTO);
}

export async function getUploaderCategories(
  uploaderId: string
): Promise<{ name: string; slug: string; count: number }[]> {
  const rows = await query<Row>(
    `SELECT DISTINCT c.\`name\`, c.\`slug\`
     FROM \`groups\` g JOIN \`categories\` c ON c.\`id\` = g.\`categoryId\`
     WHERE g.\`status\` = 'live' AND g.\`isAdult\` = 0 AND (g.\`uploaderId\` = ? OR g.\`ugcContributorId\` = ?)`,
    [uploaderId, uploaderId]
  );
  const map = new Map<string, { name: string; slug: string; count: number }>();
  for (const r of rows as any[]) {
    map.set(r.slug, { name: r.name, slug: r.slug, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// RSS FEED
// ---------------------------------------------------------------------------

export async function getNewestGroupsForRss(limit = 50): Promise<GroupDTO[]> {
  const rows = await query<GroupRow>(
    `SELECT ${GROUP_SELECT} ${GROUP_FROM}
     WHERE g.\`status\` = 'live' AND g.\`isAdult\` = 0
     ORDER BY g.\`createdAt\` DESC
     LIMIT ?`,
    [Math.min(Math.max(limit, 1), 100)]
  );
  return rows.map(toGroupDTO);
}

export interface GroupActivity {
  /** Daily view counts for the last 14 days, oldest → newest. */
  series: number[];
  weekViews: number;
  prevViews: number;
  totalViews: number;
}

/** 14-day view history for a single group (group detail activity card). */
export async function getGroupActivity(groupId: string): Promise<GroupActivity | null> {
  try {
    const rows = await query<Row & { day: Date | string; views: number }>(
      "SELECT `day`, `views` FROM `group_daily_stats` WHERE `groupId` = ? AND `day` >= SUBDATE(CURDATE(), 13) ORDER BY `day` ASC",
      [groupId]
    );
    if (rows.length === 0) return null;
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const d = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
      byDay.set(d, Number(r.views ?? 0));
    }
    const series: number[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
      series.push(byDay.get(d) ?? 0);
    }
    const weekViews = series.slice(7).reduce((a, b) => a + b, 0);
    const prevViews = series.slice(0, 7).reduce((a, b) => a + b, 0);
    return { series, weekViews, prevViews, totalViews: series.reduce((a, b) => a + b, 0) };
  } catch {
    return null;
  }
}
