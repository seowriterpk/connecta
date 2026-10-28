/**
 * admin-queue.ts — server-side listing + mutations for the queue/schedule
 * management page (/admin/cola — Task 30-b).
 *
 * Two listing sources share one UI:
 *  - "queue"   → groups_queue (drip-feed schedule, published by the cron)
 *  - "pending" → groups WHERE status='pending' (awaiting review/publish)
 *
 * Publishing replicates the drip-feed cron logic exactly (scripts/crons/
 * drip-feed.mjs) using the app libs (db / slug), so manual "Publicar ahora"
 * and the automatic cron produce identical rows.
 *
 * Server-only (imports the db layer + WhatsApp validator). Client-safe
 * types/parsing live in src/lib/admin-listing-params.ts.
 */

import { query, queryOne, exec, newId, type Row } from "@/lib/db";
import { generateSlug, makeUniqueSlug } from "@/lib/slug";
import { isValidWhatsAppInvite } from "@/lib/whatsapp-validator";
import type {
  AdminAdultFilter,
  AdminPendingRow,
  AdminQueueFilters,
  AdminQueuePage,
  AdminQueueRow,
  AdminQueueSort,
  AdminQueueStats,
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

function adultCond(mode: AdminAdultFilter): { sql: string; param: number } {
  return { sql: "`isAdult` = ?", param: mode === "only" ? 1 : 0 };
}

function pageMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

const QUEUE_ORDER_SQL: Record<AdminQueueSort, string> = {
  added: "ORDER BY `addedAt` DESC, `id` ASC",
  addedAsc: "ORDER BY `addedAt` ASC, `id` ASC",
  name: "ORDER BY `groupName` ASC, `addedAt` DESC, `id` ASC",
};

const PENDING_ORDER_SQL: Record<AdminQueueSort, string> = {
  added: "ORDER BY `createdAt` DESC, `id` ASC",
  addedAsc: "ORDER BY `createdAt` ASC, `id` ASC",
  name: "ORDER BY `groupName` ASC, `createdAt` DESC, `id` ASC",
};

function buildSharedWhere(f: AdminQueueFilters, nameCol: string): {
  where: string;
  params: unknown[];
} {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    conds.push(`(\`${nameCol}\` LIKE ? OR \`joinLink\` LIKE ?)`);
    const l = like(f.q);
    params.push(l, l);
  }
  if (f.category !== "all") {
    conds.push("`category` = ?");
    params.push(f.category);
  }
  if (f.country !== "all") {
    conds.push("`country` = ?");
    params.push(f.country);
  }
  if (f.adult !== "all") {
    const a = adultCond(f.adult);
    conds.push(a.sql);
    params.push(a.param);
  }
  return { where: conds.length ? ` WHERE ${conds.join(" AND ")}` : "", params };
}

function mapQueueRow(r: Row & Record<string, unknown>): AdminQueueRow {
  return {
    id: Number(r.id),
    groupName: String(r.groupName ?? ""),
    joinLink: String(r.joinLink ?? ""),
    description: String(r.description ?? ""),
    category: String(r.category ?? ""),
    country: String(r.country ?? ""),
    city: (r.city as string | null) ?? null,
    profileImage: (r.profileImage as string | null) ?? null,
    isAdult: !!r.isAdult,
    language: String(r.language ?? "Espanol"),
    tags: String(r.tags ?? "[]"),
    keywords: String(r.keywords ?? "[]"),
    addedAt: toIso(r.addedAt as Date | string) ?? new Date(0).toISOString(),
  };
}

function mapPendingRow(r: Row & Record<string, unknown>): AdminPendingRow {
  return {
    id: String(r.id),
    groupName: String(r.groupName ?? ""),
    slug: String(r.slug ?? ""),
    joinLink: String(r.joinLink ?? ""),
    category: String(r.category ?? ""),
    country: String(r.country ?? ""),
    city: (r.city as string | null) ?? null,
    profileImage: (r.profileImage as string | null) ?? null,
    isAdult: !!r.isAdult,
    createdAt: toIso(r.createdAt as Date | string) ?? new Date(0).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Listings (server page + GET /api/admin/queue)
// ---------------------------------------------------------------------------

export async function fetchAdminQueuePage(
  f: AdminQueueFilters
): Promise<AdminQueuePage> {
  const { where, params } = buildSharedWhere(f, "groupName");

  const [totalRow, rows] = await Promise.all([
    queryOne<Row & { c: number }>(
      `SELECT COUNT(*) AS \`c\` FROM \`groups_queue\`${where}`,
      params
    ),
    query<Row & Record<string, unknown>>(
      `SELECT \`id\`, \`groupName\`, \`joinLink\`, \`description\`, \`category\`,
              \`country\`, \`city\`, \`profileImage\`, \`isAdult\`, \`language\`,
              \`tags\`, \`keywords\`, \`addedAt\`
       FROM \`groups_queue\`${where}
       ${QUEUE_ORDER_SQL[f.sort]}
       LIMIT ? OFFSET ?`,
      [...params, f.pageSize, (f.page - 1) * f.pageSize]
    ),
  ]);

  const total = Number((totalRow as { c?: number } | null)?.c ?? 0);
  return {
    rows: rows.map(mapQueueRow),
    ...pageMeta(total, f.page, f.pageSize),
  };
}

export async function fetchAdminPendingPage(
  f: AdminQueueFilters
): Promise<AdminQueuePage> {
  const { where, params } = buildSharedWhere(f, "groupName");
  const whereSql = ` WHERE \`status\` = 'pending'${where ? ` AND ${where.slice(7)}` : ""}`;

  const [totalRow, rows] = await Promise.all([
    queryOne<Row & { c: number }>(
      `SELECT COUNT(*) AS \`c\` FROM \`groups\`${whereSql}`,
      params
    ),
    query<Row & Record<string, unknown>>(
      `SELECT \`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`category\`,
              \`country\`, \`city\`, \`profileImage\`, \`isAdult\`, \`createdAt\`
       FROM \`groups\`${whereSql}
       ${PENDING_ORDER_SQL[f.sort]}
       LIMIT ? OFFSET ?`,
      [...params, f.pageSize, (f.page - 1) * f.pageSize]
    ),
  ]);

  const total = Number((totalRow as { c?: number } | null)?.c ?? 0);
  return {
    rows: rows.map(mapPendingRow),
    ...pageMeta(total, f.page, f.pageSize),
  };
}

/**
 * Global counters + per-category schedule breakdown.
 * One roundtrip for the scalars, two GROUP BYs for the category counts.
 */
export async function getQueueStats(): Promise<AdminQueueStats> {
  const [scalarRow, queueCats, pendingCats] = await Promise.all([
    queryOne<Row & Record<string, unknown>>(
      `SELECT
         (SELECT COUNT(*) FROM \`groups_queue\`) AS \`queueTotal\`,
         (SELECT COUNT(*) FROM \`groups\` WHERE \`status\` = 'pending') AS \`pendingTotal\`,
         (SELECT COUNT(*) FROM \`groups_queue\` WHERE \`isAdult\` = 1) AS \`queueAdult\`,
         (SELECT COUNT(*) FROM \`groups\` WHERE \`status\` = 'pending' AND \`isAdult\` = 1) AS \`pendingAdult\`,
         (SELECT MIN(\`addedAt\`) FROM \`groups_queue\`) AS \`queueOldest\`,
         (SELECT MAX(\`addedAt\`) FROM \`groups_queue\`) AS \`queueNewest\``
    ),
    query<Row & { name: string; c: number }>(
      "SELECT `category` AS `name`, COUNT(*) AS `c` FROM `groups_queue` GROUP BY `category`"
    ),
    query<Row & { name: string; c: number }>(
      "SELECT `category` AS `name`, COUNT(*) AS `c` FROM `groups` WHERE `status` = 'pending' GROUP BY `category`"
    ),
  ]);

  const byName = new Map<string, { name: string; queue: number; pending: number }>();
  for (const r of queueCats) {
    const name = String(r.name ?? "").trim() || "Sin categoría";
    const entry = byName.get(name) ?? { name, queue: 0, pending: 0 };
    entry.queue += Number(r.c ?? 0);
    byName.set(name, entry);
  }
  for (const r of pendingCats) {
    const name = String(r.name ?? "").trim() || "Sin categoría";
    const entry = byName.get(name) ?? { name, queue: 0, pending: 0 };
    entry.pending += Number(r.c ?? 0);
    byName.set(name, entry);
  }

  const s = (scalarRow ?? {}) as Row & Record<string, unknown>;
  return {
    queueTotal: Number(s.queueTotal ?? 0),
    pendingTotal: Number(s.pendingTotal ?? 0),
    queueAdult: Number(s.queueAdult ?? 0),
    pendingAdult: Number(s.pendingAdult ?? 0),
    queueOldest: toIso(s.queueOldest as Date | string | null),
    queueNewest: toIso(s.queueNewest as Date | string | null),
    categories: Array.from(byName.values()).sort(
      (a, b) =>
        b.queue - a.queue || b.pending - a.pending || a.name.localeCompare(b.name, "es")
    ),
  };
}

// ---------------------------------------------------------------------------
// Publish (replicates scripts/crons/drip-feed.mjs with the app libs)
// ---------------------------------------------------------------------------

export interface QueueActionResult {
  published: number;
  skipped: number;
  errors: { name: string; reason: string }[];
}

export async function publishQueueItems(ids: number[]): Promise<QueueActionResult> {
  const result: QueueActionResult = { published: 0, skipped: 0, errors: [] };
  if (ids.length === 0) return result;

  const uniq = Array.from(new Set(ids.filter((n) => Number.isInteger(n) && n > 0)));
  const rows = await query<Row & Record<string, unknown>>(
    `SELECT * FROM \`groups_queue\` WHERE \`id\` IN (${uniq.map(() => "?").join(", ")})`,
    uniq
  );
  const found = new Map(rows.map((r) => [Number(r.id), r]));
  const missing = uniq.filter((n) => !found.has(n));
  result.skipped += missing.length; // vanished between render + click (cron ran)

  // FIFO like the cron: publish oldest-first so manual batches keep the order.
  const items = rows.sort(
    (a, b) =>
      new Date(a.addedAt as Date | string).getTime() -
      new Date(b.addedAt as Date | string).getTime()
  );

  for (const item of items) {
    const name = String(item.groupName ?? "");
    try {
      const joinLink = String(item.joinLink ?? "");
      const code = joinLink.split("/").pop() ?? "";

      // Duplicate defense (by invite code fragment) — same as the cron, but
      // here duplicates are skipped (left in queue) so the admin sees them.
      const existing = code
        ? await queryOne<Row>(
            "SELECT `id` FROM `groups` WHERE `joinLink` LIKE ? LIMIT 1",
            [`%${code}%`]
          )
        : null;
      if (existing) {
        result.skipped++;
        continue;
      }

      // Resolve real taxonomy ids by name (best effort; fallback to raw value).
      const cat = await queryOne<Row>(
        "SELECT `id` FROM `categories` WHERE `name` = ? OR `id` = ? LIMIT 1",
        [item.category, item.category]
      );
      const country = await queryOne<Row>(
        "SELECT `id` FROM `countries` WHERE `name` = ? OR `id` = ? LIMIT 1",
        [item.country, item.country]
      );

      // Slug — adult → invite-<code8> (+timestamp if taken); else SEO slug.
      let slug: string;
      if (item.isAdult) {
        const inviteCode = code || "group";
        slug = `invite-${inviteCode.slice(0, 8)}`;
        const slugOwner = await queryOne<Row>(
          "SELECT `id` FROM `groups` WHERE `slug` = ? LIMIT 1",
          [slug]
        );
        if (slugOwner) slug = `${slug}-${Date.now().toString(36)}`;
      } else {
        const base = generateSlug(`${name} invite link`);
        const existingSlugs = await query<Row & { slug: string }>(
          "SELECT `slug` FROM `groups` WHERE `slug` LIKE ?",
          [`${base}%`]
        );
        const existingSet = new Set(existingSlugs.map((g) => g.slug));
        slug = makeUniqueSlug(base, (s) => existingSet.has(s));
      }

      await exec(
        `INSERT INTO \`groups\`
          (\`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`description\`, \`category\`,
           \`categoryId\`, \`country\`, \`countryId\`, \`city\`, \`keywords\`, \`tags\`,
           \`profileImage\`, \`language\`, \`status\`, \`linkStatus\`, \`isAdult\`,
           \`submitSource\`, \`uploaderId\`, \`lastActiveAt\`, \`lastValidatedAt\`,
           \`imageRefreshedAt\`, \`createdAt\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', 'active', ?, 'staff', ?, NOW(), NOW(), NOW(), NOW())`,
        [
          newId(),
          name,
          slug,
          joinLink,
          String(item.description ?? ""),
          String(item.category ?? ""),
          cat ? String(cat.id) : String(item.category ?? ""),
          String(item.country ?? ""),
          country ? String(country.id) : String(item.country ?? ""),
          (item.city as string | null) ?? null,
          String(item.keywords ?? "[]"),
          String(item.tags ?? "[]"),
          (item.profileImage as string | null) ?? null,
          String(item.language ?? "Espanol") || "Espanol",
          item.isAdult ? 1 : 0,
          (item.uploaderId as string | null) ?? null,
        ]
      );

      await exec("DELETE FROM `groups_queue` WHERE `id` = ?", [item.id]);
      result.published++;
    } catch (err) {
      result.errors.push({
        name,
        reason: err instanceof Error ? err.message : "Error desconocido.",
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Move pending → queue
// ---------------------------------------------------------------------------

export interface MoveResult {
  moved: number;
  skipped: number;
  errors: { name: string; reason: string }[];
}

export async function movePendingToQueue(ids: string[]): Promise<MoveResult> {
  const result: MoveResult = { moved: 0, skipped: 0, errors: [] };
  if (ids.length === 0) return result;

  const uniq = Array.from(
    new Set(ids.map((v) => String(v)).filter((v) => v.length > 0 && v.length <= 191))
  );
  const rows = await query<Row & Record<string, unknown>>(
    `SELECT \`id\`, \`groupName\`, \`joinLink\`, \`description\`, \`category\`, \`country\`,
            \`city\`, \`keywords\`, \`tags\`, \`profileImage\`, \`uploaderId\`, \`isAdult\`, \`language\`
     FROM \`groups\`
     WHERE \`status\` = 'pending' AND \`id\` IN (${uniq.map(() => "?").join(", ")})`,
    uniq
  );
  const foundIds = new Set(rows.map((r) => String(r.id)));
  result.skipped = uniq.length - foundIds.size;

  for (const g of rows) {
    const name = String(g.groupName ?? "");
    try {
      await exec(
        `INSERT INTO \`groups_queue\`
          (\`groupName\`, \`joinLink\`, \`description\`, \`category\`, \`country\`, \`city\`,
           \`keywords\`, \`tags\`, \`profileImage\`, \`uploaderId\`, \`isAdult\`, \`language\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          String(g.joinLink ?? ""),
          String(g.description ?? ""),
          String(g.category ?? ""),
          String(g.country ?? ""),
          (g.city as string | null) ?? null,
          // groups stores tags/keywords as JSON strings — copy as-is.
          String(g.keywords ?? "[]") || "[]",
          String(g.tags ?? "[]") || "[]",
          (g.profileImage as string | null) ?? null,
          (g.uploaderId as string | null) ?? null,
          g.isAdult ? 1 : 0,
          String(g.language ?? "Espanol") || "Espanol",
        ]
      );
      await exec("DELETE FROM `groups` WHERE `id` = ? AND `status` = 'pending'", [
        g.id,
      ]);
      result.moved++;
    } catch (err) {
      result.errors.push({
        name,
        reason: err instanceof Error ? err.message : "Error desconocido.",
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteQueueItems(ids: number[]): Promise<number> {
  const uniq = Array.from(
    new Set(ids.filter((n) => Number.isInteger(n) && n > 0))
  );
  if (uniq.length === 0) return 0;
  const res = await exec(
    `DELETE FROM \`groups_queue\` WHERE \`id\` IN (${uniq.map(() => "?").join(", ")})`,
    uniq
  );
  return Number(res.affectedRows ?? 0);
}

export async function deletePendingGroups(ids: string[]): Promise<number> {
  const uniq = Array.from(
    new Set(ids.map((v) => String(v)).filter((v) => v.length > 0 && v.length <= 191))
  );
  if (uniq.length === 0) return 0;
  const res = await exec(
    `DELETE FROM \`groups\` WHERE \`status\` = 'pending' AND \`id\` IN (${uniq.map(() => "?").join(", ")})`,
    uniq
  );
  return Number(res.affectedRows ?? 0);
}

// ---------------------------------------------------------------------------
// Edit a queued item
// ---------------------------------------------------------------------------

export interface AdminQueueEditFields {
  groupName: string;
  joinLink: string;
  description: string;
  category: string;
  country: string;
  city: string;
  /** Comma-separated list (stored as JSON like bulk-import does). */
  tags: string;
  keywords: string;
  isAdult: boolean;
  /** Empty string clears the image. */
  profileImage: string;
}

function splitListJson(raw: string, max = 10): string {
  const items = raw
    .split(",")
    .map((s) => s.trim().slice(0, 60))
    .filter(Boolean);
  return JSON.stringify(items.slice(0, max));
}

export async function updateQueueItem(
  id: number,
  fields: AdminQueueEditFields
): Promise<AdminQueueRow> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Elemento de cola inválido.");
  }

  const groupName = String(fields.groupName ?? "").trim();
  if (groupName.length < 3 || groupName.length > 120) {
    throw new Error("El nombre debe tener entre 3 y 120 caracteres.");
  }

  const joinLink = String(fields.joinLink ?? "").trim();
  if (!isValidWhatsAppInvite(joinLink)) {
    throw new Error("El enlace no es una invitación válida de WhatsApp (chat.whatsapp.com/…).");
  }

  const description = String(fields.description ?? "").trim();
  if (description.length < 20 || description.length > 8000) {
    throw new Error("La descripción debe tener entre 20 y 8000 caracteres.");
  }

  const category = String(fields.category ?? "").trim();
  if (!category || category.length > 255) {
    throw new Error("Selecciona una categoría válida.");
  }

  const country = String(fields.country ?? "").trim();
  if (!country || country.length > 255) {
    throw new Error("Selecciona un país válido.");
  }

  const city = String(fields.city ?? "").trim().slice(0, 255) || null;

  const imgRaw = String(fields.profileImage ?? "").trim();
  let profileImage: string | null = null;
  if (imgRaw) {
    if (!/^https?:\/\//i.test(imgRaw)) {
      throw new Error("La URL de la imagen debe comenzar con http(s)://");
    }
    profileImage = imgRaw.slice(0, 512);
  }

  const res = await exec(
    `UPDATE \`groups_queue\`
     SET \`groupName\` = ?, \`joinLink\` = ?, \`description\` = ?, \`category\` = ?,
         \`country\` = ?, \`city\` = ?, \`tags\` = ?, \`keywords\` = ?,
         \`profileImage\` = ?, \`isAdult\` = ?
     WHERE \`id\` = ?`,
    [
      groupName.slice(0, 255),
      joinLink.slice(0, 512),
      description,
      category,
      country,
      city,
      splitListJson(String(fields.tags ?? "")),
      splitListJson(String(fields.keywords ?? "")),
      profileImage,
      fields.isAdult ? 1 : 0,
      id,
    ]
  );

  if (Number(res.affectedRows ?? 0) === 0) {
    const still = await queryOne<Row>("SELECT `id` FROM `groups_queue` WHERE `id` = ?", [id]);
    if (!still) throw new Error("El elemento ya no está en la cola.");
  }

  const row = await queryOne<Row & Record<string, unknown>>(
    `SELECT \`id\`, \`groupName\`, \`joinLink\`, \`description\`, \`category\`,
            \`country\`, \`city\`, \`profileImage\`, \`isAdult\`, \`language\`,
            \`tags\`, \`keywords\`, \`addedAt\`
     FROM \`groups_queue\` WHERE \`id\` = ?`,
    [id]
  );
  if (!row) throw new Error("El elemento ya no está en la cola.");
  return mapQueueRow(row);
}
