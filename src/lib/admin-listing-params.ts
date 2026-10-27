/**
 * admin-listing-params.ts — client-safe types + URL parsing/building for
 * the admin data-tables (grupos / reportes / listas — Task 29-b).
 *
 * IMPORTANT: this module must stay free of any server-only import (db,
 * fav-lists) because the client explorers import it. The matching SQL
 * lives in src/lib/admin-listings.ts (server-only).
 */

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export type AdminGroupStatusFilter =
  | "all"
  | "live"
  | "pending"
  | "rejected"
  | "flagged"
  | "pruned";

export type AdminLinkStatusFilter = "all" | "active" | "revoked" | "unknown";
export type AdminAdultFilter = "all" | "exclude" | "only";
export type AdminGroupSort = "created" | "name" | "clicks" | "views" | "status";
export type SortDir = "asc" | "desc";

export interface AdminGroupsFilters {
  q: string;
  status: AdminGroupStatusFilter;
  linkStatus: AdminLinkStatusFilter;
  category: string; // category id or "all"
  country: string; // country id or "all"
  adult: AdminAdultFilter;
  sort: AdminGroupSort;
  dir: SortDir;
  page: number; // 1-based
  pageSize: number; // 25 | 50 | 100
}

export interface AdminGroupRow {
  id: string;
  groupName: string;
  slug: string;
  category: string;
  country: string;
  city: string | null;
  status: string;
  linkStatus: string;
  clicks: number;
  views: number;
  createdAt: string; // ISO
  profileImage: string | null;
  isAdult: boolean;
}

export interface AdminGroupsPage {
  rows: AdminGroupRow[];
  /** Rows matching the current filters. */
  total: number;
  /** Rows in the whole table (no filters) — for the "X de Y" summary. */
  unfilteredTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const GROUP_PAGE_SIZES = [25, 50, 100] as const;

const GROUP_STATUSES: readonly string[] = ["all", "live", "pending", "rejected", "flagged", "pruned"];
const LINK_STATUSES: readonly string[] = ["all", "active", "revoked", "unknown"];
const ADULT_MODES: readonly string[] = ["all", "exclude", "only"];
const GROUP_SORTS: readonly string[] = ["created", "name", "clicks", "views", "status"];

export function clampPageValue(v: number, fallback: number): number {
  if (!Number.isFinite(v) || v < 1) return fallback;
  return Math.min(Math.floor(v), 100_000);
}

export function clampPageSize(v: number, fallback = 25): number {
  if (!Number.isFinite(v)) return fallback;
  return Math.min(Math.max(Math.floor(v), 25), 100);
}

/**
 * Parse filters from a param getter (works for Next `searchParams` records
 * and `URLSearchParams`). Back-compat: the legacy `status=revoked` deep
 * link is mapped onto the new linkStatus filter.
 */
export function parseAdminGroupsFilters(
  get: (key: string) => string | null | undefined
): AdminGroupsFilters {
  const rawStatus = String(get("status") ?? "all");
  // Legacy conflation: "revoked" used to ride on the status select.
  const status =
    rawStatus === "revoked"
      ? "all"
      : GROUP_STATUSES.includes(rawStatus)
        ? rawStatus
        : "all";
  const rawLink = String(get("linkStatus") ?? "all");
  const linkStatus =
    rawStatus === "revoked"
      ? "revoked"
      : LINK_STATUSES.includes(rawLink)
        ? rawLink
        : "all";
  const rawAdult = String(get("adult") ?? "all");
  const rawSort = String(get("sort") ?? "created");
  const rawDir = String(get("dir") ?? "desc");
  return {
    q: String(get("q") ?? "").trim().slice(0, 120),
    status: status as AdminGroupsFilters["status"],
    linkStatus: linkStatus as AdminGroupsFilters["linkStatus"],
    category: String(get("category") ?? "all").slice(0, 191),
    country: String(get("country") ?? "all").slice(0, 191),
    adult: (ADULT_MODES.includes(rawAdult) ? rawAdult : "all") as AdminAdultFilter,
    sort: (GROUP_SORTS.includes(rawSort) ? rawSort : "created") as AdminGroupSort,
    dir: rawDir === "asc" ? "asc" : "desc",
    page: clampPageValue(Number(get("page") ?? 1), 1),
    pageSize: clampPageSize(Number(get("pageSize") ?? 25)),
  };
}

/** URL query for a filter state (shareable URLs; defaults omitted). */
export function adminGroupsSearchParams(f: AdminGroupsFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.status !== "all") sp.set("status", f.status);
  if (f.linkStatus !== "all") sp.set("linkStatus", f.linkStatus);
  if (f.category !== "all") sp.set("category", f.category);
  if (f.country !== "all") sp.set("country", f.country);
  if (f.adult !== "all") sp.set("adult", f.adult);
  if (f.sort !== "created") sp.set("sort", f.sort);
  if (f.dir !== "desc") sp.set("dir", f.dir);
  if (f.page > 1) sp.set("page", String(f.page));
  if (f.pageSize !== 25) sp.set("pageSize", String(f.pageSize));
  return sp;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type AdminReportStatusFilter = "all" | "OPEN" | "RESOLVED" | "DISMISSED";

export interface AdminReportRow {
  id: string;
  groupId: string;
  reporterIp: string;
  reason: string;
  status: string;
  createdAt: string; // ISO
  groupName: string | null;
  groupSlug: string | null;
  groupStatus: string | null;
  groupLinkStatus: string | null;
}

export interface AdminReportsPage {
  rows: AdminReportRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: { OPEN: number; RESOLVED: number; DISMISSED: number; all: number };
}

export const REPORT_PAGE_SIZES = [25, 50, 100] as const;

export function parseAdminReportsFilters(
  get: (key: string) => string | null | undefined
): { status: AdminReportStatusFilter; page: number; pageSize: number } {
  const raw = String(get("status") ?? "OPEN");
  const status = (["all", "OPEN", "RESOLVED", "DISMISSED"].includes(raw)
    ? raw
    : "OPEN") as AdminReportStatusFilter;
  return {
    status,
    page: clampPageValue(Number(get("page") ?? 1), 1),
    pageSize: clampPageSize(Number(get("pageSize") ?? 25)),
  };
}

export function adminReportsSearchParams(
  status: AdminReportStatusFilter,
  page: number,
  pageSize: number
): URLSearchParams {
  const sp = new URLSearchParams();
  if (status !== "OPEN") sp.set("status", status);
  if (page > 1) sp.set("page", String(page));
  if (pageSize !== 25) sp.set("pageSize", String(pageSize));
  return sp;
}

// ---------------------------------------------------------------------------
// Shared favorite lists
// ---------------------------------------------------------------------------

export type AdminListFilter = "todas" | "populares" | "sin-visitas" | "obsoletas";

export interface AdminListRow {
  id: string;
  shareCode: string;
  title: string | null;
  groupCount: number;
  viewCount: number;
  createdAt: string; // ISO
  lastViewedAt: string | null;
  stale: boolean;
}

export interface AdminListsPage {
  rows: AdminListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totals: { total: number; views: number };
  staleCount: number;
  staleDays: number;
}

export const LIST_PAGE_SIZES = [25, 50, 100] as const;

/** Filter chips for the lists table. `staleDays` arrives as a prop (server). */
export function adminListFilters(staleDays: number): {
  value: AdminListFilter;
  label: string;
}[] {
  return [
    { value: "todas", label: "Todas" },
    { value: "populares", label: "Con visitas" },
    { value: "sin-visitas", label: "Sin visitas" },
    { value: "obsoletas", label: `Obsoletas (${staleDays} d)` },
  ];
}

export function parseAdminListsFilters(
  get: (key: string) => string | null | undefined
): { filter: AdminListFilter; q: string; page: number; pageSize: number } {
  const raw = String(get("filtro") ?? "todas");
  const allowed = ["todas", "populares", "sin-visitas", "obsoletas"];
  const filter = (allowed.includes(raw) ? raw : "todas") as AdminListFilter;
  return {
    filter,
    q: String(get("q") ?? "").trim().slice(0, 60),
    page: clampPageValue(Number(get("page") ?? 1), 1),
    pageSize: clampPageSize(Number(get("pageSize") ?? 25)),
  };
}

export function adminListsSearchParams(
  filter: AdminListFilter,
  q: string,
  page: number,
  pageSize: number
): URLSearchParams {
  const sp = new URLSearchParams();
  if (filter !== "todas") sp.set("filtro", filter);
  if (q) sp.set("q", q);
  if (page > 1) sp.set("page", String(page));
  if (pageSize !== 25) sp.set("pageSize", String(pageSize));
  return sp;
}
