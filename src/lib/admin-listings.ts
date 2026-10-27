/**
 * admin-listings.ts — server-side paginated listing queries for the admin
 * data-tables (grupos / reportes / listas) — Task 29-b.
 *
 * One source of truth for both the server-rendered FIRST page (instant
 * paint, shareable URL) and the client-side refetch API routes that power
 * instant filtering (no full-page reloads). The SQL lives here so the
 * server page and the JSON API can never drift apart.
 *
 * Server-only (imports the db layer). Client-safe types/parsing live in
 * src/lib/admin-listing-params.ts. All rows are plain-serializable
 * (dates → ISO strings) so the same shape crosses the server/client
 * boundary and the fetch response unchanged.
 */

import { query, queryOne, type Row } from "@/lib/db";
import { countStaleFavLists, STALE_DAYS } from "@/lib/fav-lists";
import type {
  AdminGroupRow,
  AdminGroupSort,
  AdminGroupsFilters,
  AdminGroupsPage,
  AdminListFilter,
  AdminListRow,
  AdminListsPage,
  AdminReportRow,
  AdminReportStatusFilter,
  AdminReportsPage,
} from "@/lib/admin-listing-params";

// ---------------------------------------------------------------------------
// Common helpers
// ---------------------------------------------------------------------------

/** LIKE pattern with % _ \ escaped (same semantics as Prisma `contains`). */
function like(v: string): string {
  return `%${v.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

function toIso(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ---------------------------------------------------------------------------
// Groups listing (/admin/grupos + GET /api/admin/grupos)
// ---------------------------------------------------------------------------

function buildGroupsWhere(f: AdminGroupsFilters): { where: string; params: unknown[] } {
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
  if (f.category !== "all") {
    conds.push("`categoryId` = ?");
    params.push(f.category);
  }
  if (f.country !== "all") {
    conds.push("`countryId` = ?");
    params.push(f.country);
  }
  if (f.adult !== "all") {
    conds.push("`isAdult` = ?");
    params.push(f.adult === "only" ? 1 : 0);
  }
  if (f.q) {
    conds.push("(`groupName` LIKE ? OR `slug` LIKE ? OR `joinLink` LIKE ?)");
    const l = like(f.q);
    params.push(l, l, l);
  }
  return { where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params };
}

const GROUP_SORT_SQL: Record<AdminGroupSort, string> = {
  created: "`createdAt`",
  name: "`groupName`",
  clicks: "`clicks`",
  views: "`views`",
  status: "`status`",
};

export async function fetchAdminGroupsPage(f: AdminGroupsFilters): Promise<AdminGroupsPage> {
  const { where, params } = buildGroupsWhere(f);

  const key = GROUP_SORT_SQL[f.sort];
  const dir = f.dir === "asc" ? "ASC" : "DESC";
  // Secondary keys keep pagination stable when the primary key ties.
  const orderSql =
    f.sort === "created"
      ? `ORDER BY \`createdAt\` ${dir}, \`id\` ASC`
      : `ORDER BY ${key} ${dir}, \`createdAt\` DESC, \`id\` ASC`;

  const [totalRow, unfilteredRow, rows] = await Promise.all([
    queryOne<Row & { c: number }>(
      `SELECT COUNT(*) AS \`c\` FROM \`groups\`${where}`,
      params
    ),
    queryOne<Row & { c: number }>("SELECT COUNT(*) AS `c` FROM `groups`"),
    query<Row & Record<string, unknown>>(
      `SELECT \`id\`, \`groupName\`, \`slug\`, \`category\`, \`country\`, \`city\`,
              \`status\`, \`linkStatus\`, \`clicks\`, \`views\`, \`createdAt\`,
              \`profileImage\`, \`isAdult\`
       FROM \`groups\`${where}
       ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, f.pageSize, (f.page - 1) * f.pageSize]
    ),
  ]);

  const total = Number((totalRow as { c?: number } | null)?.c ?? 0);
  const unfilteredTotal = Number((unfilteredRow as { c?: number } | null)?.c ?? 0);
  const mapped: AdminGroupRow[] = rows.map((g) => ({
    id: String(g.id),
    groupName: String(g.groupName ?? ""),
    slug: String(g.slug ?? ""),
    category: String(g.category ?? ""),
    country: String(g.country ?? ""),
    city: (g.city as string | null) ?? null,
    status: String(g.status ?? "pending"),
    linkStatus: String(g.linkStatus ?? "active"),
    clicks: Number(g.clicks ?? 0),
    views: Number(g.views ?? 0),
    createdAt: toIso(g.createdAt as Date | string) ?? new Date(0).toISOString(),
    profileImage: (g.profileImage as string | null) ?? null,
    isAdult: !!g.isAdult,
  }));

  return {
    rows: mapped,
    total,
    unfilteredTotal,
    page: f.page,
    pageSize: f.pageSize,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  };
}

// ---------------------------------------------------------------------------
// Reports listing (/admin/reportes + GET /api/admin/reportes)
// ---------------------------------------------------------------------------

/** Status → count map for the filter tabs (one cheap GROUP BY). */
export async function getReportStatusCounts(): Promise<{
  OPEN: number;
  RESOLVED: number;
  DISMISSED: number;
  all: number;
}> {
  const rows = await query<{ status: string; c: number }>(
    "SELECT `status`, COUNT(*) AS `c` FROM `group_reports` GROUP BY `status`"
  );
  const map = new Map(rows.map((r) => [r.status, Number(r.c ?? 0)]));
  return {
    OPEN: map.get("OPEN") ?? 0,
    RESOLVED: map.get("RESOLVED") ?? 0,
    DISMISSED: map.get("DISMISSED") ?? 0,
    all: rows.reduce((acc, r) => acc + Number(r.c ?? 0), 0),
  };
}

export async function fetchAdminReportsPage(
  status: AdminReportStatusFilter,
  page: number,
  pageSize: number
): Promise<AdminReportsPage> {
  const whereSql = status === "all" ? "" : "WHERE r.`status` = ?";
  const params: unknown[] = status === "all" ? [] : [status];

  const [totalRow, rows, counts] = await Promise.all([
    queryOne<Row & { c: number }>(
      `SELECT COUNT(*) AS \`c\` FROM \`group_reports\` r ${whereSql}`,
      params
    ),
    query<Row & Record<string, unknown>>(
      `SELECT r.\`id\`, r.\`groupId\`, r.\`reporterIp\`, r.\`reason\`, r.\`status\`, r.\`createdAt\`,
              g.\`groupName\`, g.\`slug\` AS \`groupSlug\`, g.\`status\` AS \`groupStatus\`, g.\`linkStatus\` AS \`groupLinkStatus\`
       FROM \`group_reports\` r
       LEFT JOIN \`groups\` g ON g.\`id\` = r.\`groupId\`
       ${whereSql}
       ORDER BY r.\`createdAt\` DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    ),
    getReportStatusCounts(),
  ]);

  const total = Number((totalRow as { c?: number } | null)?.c ?? 0);
  const mapped: AdminReportRow[] = rows.map((r) => ({
    id: String(r.id),
    groupId: String(r.groupId ?? ""),
    reporterIp: String(r.reporterIp ?? ""),
    reason: String(r.reason ?? ""),
    status: String(r.status ?? "OPEN"),
    createdAt: toIso(r.createdAt as Date | string) ?? new Date(0).toISOString(),
    groupName: (r.groupName as string | null) ?? null,
    groupSlug: (r.groupSlug as string | null) ?? null,
    groupStatus: (r.groupStatus as string | null) ?? null,
    groupLinkStatus: (r.groupLinkStatus as string | null) ?? null,
  }));

  return {
    rows: mapped,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  };
}

// ---------------------------------------------------------------------------
// Shared favorite lists listing (/admin/listas + GET /api/admin/lists)
// ---------------------------------------------------------------------------

/** Global totals (used by the summary chips + the dashboard metric card). */
export async function getFavListTotals(): Promise<{ total: number; views: number }> {
  const row = await queryOne<Row & { total: number; views: number }>(
    "SELECT COUNT(*) AS `total`, COALESCE(SUM(`viewCount`), 0) AS `views` FROM `fav_lists`"
  );
  return {
    total: Number((row as { total?: number } | null)?.total ?? 0),
    views: Number((row as { views?: number } | null)?.views ?? 0),
  };
}

function buildListsWhere(filter: AdminListFilter, q: string): { sql: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filter === "populares") conds.push("`viewCount` > 0");
  if (filter === "sin-visitas") conds.push("`viewCount` = 0");
  if (filter === "obsoletas") {
    conds.push("`viewCount` = 0 AND `createdAt` < (NOW() - INTERVAL ? DAY)");
    params.push(STALE_DAYS);
  }
  const term = q.trim().toLowerCase();
  if (term) {
    // shareCode is lowercase; title matched case-insensitively.
    conds.push("(`shareCode` LIKE ? OR LOWER(`title`) LIKE ?)");
    params.push(`%${term}%`, `%${term}%`);
  }
  return conds.length
    ? { sql: `WHERE ${conds.join(" AND ")}`, params }
    : { sql: "", params: [] };
}

export async function fetchAdminListsPage(
  filter: AdminListFilter,
  q: string,
  page: number,
  pageSize: number
): Promise<AdminListsPage> {
  const { sql: whereSql, params: whereParams } = buildListsWhere(filter, q);

  const [totalRow, rows, totals, staleCount] = await Promise.all([
    queryOne<Row & { c: number }>(
      `SELECT COUNT(*) AS \`c\` FROM \`fav_lists\` ${whereSql}`.trim(),
      whereParams
    ),
    query<Row & Record<string, unknown>>(
      `SELECT \`id\`, \`shareCode\`, \`title\`, \`groupIdsJson\`, \`viewCount\`, \`createdAt\`, \`lastViewedAt\`
       FROM \`fav_lists\` ${whereSql}
       ORDER BY \`createdAt\` DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, pageSize, (page - 1) * pageSize]
    ),
    getFavListTotals(),
    countStaleFavLists(),
  ]);

  const total = Number((totalRow as { c?: number } | null)?.c ?? 0);
  const staleMs = STALE_DAYS * 86_400_000;
  const mapped: AdminListRow[] = rows.map((r) => {
    let groupCount = 0;
    try {
      const v = JSON.parse(String(r.groupIdsJson ?? "[]"));
      groupCount = Array.isArray(v) ? v.length : 0;
    } catch {
      groupCount = 0;
    }
    const createdAt = toIso(r.createdAt as Date | string) ?? new Date(0).toISOString();
    return {
      id: String(r.id),
      shareCode: String(r.shareCode ?? ""),
      title: (r.title as string | null) ?? null,
      groupCount,
      viewCount: Number(r.viewCount ?? 0),
      createdAt,
      lastViewedAt: toIso(r.lastViewedAt as Date | string | null),
      stale:
        Number(r.viewCount ?? 0) === 0 &&
        Date.now() - new Date(createdAt).getTime() > staleMs,
    };
  });

  return {
    rows: mapped,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    totals,
    staleCount,
    staleDays: STALE_DAYS,
  };
}
