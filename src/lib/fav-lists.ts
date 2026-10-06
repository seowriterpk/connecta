/**
 * Favorites share lists — public, server-side stored lists of group ids.
 *
 * A user exports their localStorage favorites to a short share code; anyone
 * with the /lista/<code> URL sees the list rendered live from the DB
 * (always current data, dead groups drop out automatically).
 */

import { randomBytes } from "crypto";
import { exec, queryOne, type Row } from "./db";
import { newId } from "./db";

/** URL-safe share code, 10 chars, no ambiguous glyphs (0/O, 1/l/I). */
export function generateShareCode(): string {
  const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const CODE_RE = /^[a-z0-9]{6,24}$/;

export interface FavListRow {
  id: string;
  shareCode: string;
  title: string | null;
  groupIdsJson: string;
  viewCount: number;
  createdAt: Date;
}

/** Parse + validate the stored id list (defensive: cap 120, dedup). */
export function parseListIds(json: string): string[] {
  try {
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    for (const id of raw) {
      if (typeof id === "string" && ID_RE.test(id) && !seen.has(id)) {
        seen.add(id);
        if (seen.size >= 120) break;
      }
    }
    return [...seen];
  } catch {
    return [];
  }
}

/**
 * Create a share list from a validated id array.
 * Returns the share code. Rejects empty / oversized / malformed input.
 */
export async function createFavList(
  ids: unknown,
  title: unknown
): Promise<{ ok: true; shareCode: string } | { ok: false; error: string }> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: "La lista está vacía." };
  }
  if (ids.length > 120) {
    return { ok: false, error: "La lista es demasiado grande (máximo 120 grupos)." };
  }
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const id of ids) {
    if (typeof id === "string" && ID_RE.test(id) && !seen.has(id)) {
      seen.add(id);
      clean.push(id);
    }
  }
  if (clean.length === 0) {
    return { ok: false, error: "La lista no contiene grupos válidos." };
  }

  const cleanTitle =
    typeof title === "string" && title.trim().length > 0
      ? title.trim().slice(0, 120)
      : null;

  // Retry a few times on the (astronomically unlikely) shareCode collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const shareCode = generateShareCode();
    try {
      await exec(
        `INSERT INTO \`fav_lists\` (\`id\`, \`shareCode\`, \`title\`, \`groupIdsJson\`)
         VALUES (?, ?, ?, ?)`,
        [newId(), shareCode, cleanTitle, JSON.stringify(clean)]
      );
      return { ok: true, shareCode };
    } catch {
      // duplicate shareCode → retry with a fresh code
    }
  }
  return { ok: false, error: "No se pudo crear el enlace. Inténtalo de nuevo." };
}

/** Fetch a list by share code (without bumping the view counter). */
export async function getFavListByCode(
  code: string
): Promise<FavListRow | null> {
  if (!CODE_RE.test(code)) return null;
  return queryOne<FavListRow>(
    "SELECT `id`, `shareCode`, `title`, `groupIdsJson`, `viewCount`, `createdAt` FROM `fav_lists` WHERE `shareCode` = ? LIMIT 1",
    [code]
  );
}

/** Fire-and-forget view counter bump for the public page. */
export async function bumpFavListView(code: string): Promise<void> {
  if (!CODE_RE.test(code)) return;
  try {
    await exec(
      "UPDATE `fav_lists` SET `viewCount` = `viewCount` + 1, `lastViewedAt` = NOW() WHERE `shareCode` = ?",
      [code]
    );
  } catch {
    /* counter is best-effort */
  }
}

/** For /api/health-style introspection: total lists created. */
export async function countFavLists(): Promise<number> {
  const row = await queryOne<Row & { c: number }>(
    "SELECT COUNT(*) AS c FROM `fav_lists`"
  );
  return Number(row?.c ?? 0);
}

/** Delete a single list by id. Returns true if a row was removed. */
export async function deleteFavList(id: string): Promise<boolean> {
  if (!ID_RE.test(id)) return false;
  const result = await exec("DELETE FROM `fav_lists` WHERE `id` = ?", [id]);
  return result.affectedRows > 0;
}

/**
 * Stale list = viewCount = 0 AND created more than STALE_DAYS ago
 * (shared once — via the creator's own visit — then never opened again).
 */
export const STALE_DAYS = 90;

/** Count lists eligible for garbage collection. */
export async function countStaleFavLists(): Promise<number> {
  const row = await queryOne<Row & { c: number }>(
    "SELECT COUNT(*) AS c FROM `fav_lists` WHERE `viewCount` = 0 AND `createdAt` < (NOW() - INTERVAL ? DAY)",
    [STALE_DAYS]
  );
  return Number(row?.c ?? 0);
}

/**
 * Garbage-collect stale share lists (viewCount = 0, older than STALE_DAYS).
 * Safe to call opportunistically — small table, indexed by viewCount scan.
 * Returns the number of deleted rows.
 */
export async function gcFavLists(): Promise<number> {
  const result = await exec(
    "DELETE FROM `fav_lists` WHERE `viewCount` = 0 AND `createdAt` < (NOW() - INTERVAL ? DAY)",
    [STALE_DAYS]
  );
  return result.affectedRows;
}
