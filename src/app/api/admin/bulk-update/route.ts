import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, tx, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Changes {
  categoryId?: string;
  countryId?: string;
  addTags?: string[];
  removeTags?: string[];
  isAdult?: boolean;
  status?: string;
  linkStatus?: string;
}

interface Body {
  groupIds?: string[];
  changes?: Changes;
  csrf?: string;
}

const VALID_STATUS = new Set(["live", "pending", "rejected", "flagged", "pruned"]);
const VALID_LINK_STATUS = new Set(["active", "revoked", "unknown"]);

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(String(raw));
    if (Array.isArray(v)) return v.map(String);
  } catch {
    /* fallthrough */
  }
  return String(raw)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const groupIds = Array.from(new Set((body.groupIds ?? []).map(String).filter(Boolean))).slice(0, 200);
  if (groupIds.length === 0) {
    return NextResponse.json({ ok: false, error: "Selecciona al menos un grupo." }, { status: 400 });
  }

  const changes = body.changes ?? {};
  const hasChange =
    changes.categoryId !== undefined ||
    changes.countryId !== undefined ||
    (changes.addTags?.length ?? 0) > 0 ||
    (changes.removeTags?.length ?? 0) > 0 ||
    changes.isAdult !== undefined ||
    changes.status !== undefined ||
    changes.linkStatus !== undefined;
  if (!hasChange) {
    return NextResponse.json({ ok: false, error: "No hay cambios que aplicar." }, { status: 400 });
  }

  // Resolve category (name + adult silo) when moving.
  let category: { id: string; name: string; isAdult: boolean } | null = null;
  if (changes.categoryId) {
    const c = await queryOne<Row & Record<string, unknown>>(
      "SELECT `id`, `name`, `isAdult` FROM `categories` WHERE `id` = ? LIMIT 1",
      [changes.categoryId]
    );
    if (!c) {
      return NextResponse.json({ ok: false, error: "La categoría seleccionada no existe." }, { status: 400 });
    }
    category = { id: String(c.id), name: String(c.name), isAdult: !!c.isAdult };
  }

  // Resolve country name when moving.
  let country: { id: string; name: string } | null = null;
  if (changes.countryId) {
    const co = await queryOne<Row & Record<string, unknown>>(
      "SELECT `id`, `name` FROM `countries` WHERE `id` = ? LIMIT 1",
      [changes.countryId]
    );
    if (!co) {
      return NextResponse.json({ ok: false, error: "El país seleccionado no existe." }, { status: 400 });
    }
    country = { id: String(co.id), name: String(co.name) };
  }

  if (changes.status && !VALID_STATUS.has(changes.status)) {
    return NextResponse.json({ ok: false, error: `Estado inválido: ${changes.status}` }, { status: 400 });
  }
  if (changes.linkStatus && !VALID_LINK_STATUS.has(changes.linkStatus)) {
    return NextResponse.json({ ok: false, error: `Estado de enlace inválido: ${changes.linkStatus}` }, { status: 400 });
  }

  const addTags = (changes.addTags ?? []).map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 20);
  const removeTags = new Set(
    (changes.removeTags ?? []).map((t) => String(t).trim().toLowerCase()).filter(Boolean)
  );

  let updated = 0;
  let skipped = 0;

  await tx(async (conn) => {
    for (const id of groupIds) {
      const [row] = (await conn.query(
        "SELECT `id`, `tags`, `categoryId`, `countryId` FROM `groups` WHERE `id` = ? LIMIT 1",
        [id]
      )) as unknown as [Array<Row & Record<string, unknown>>];

      const current = row?.[0];
      if (!current) {
        skipped++;
        continue;
      }

      // Tag merge: keep current order, add new at the end, remove requested.
      const currentTags = parseTags(current.tags);
      let nextTags = currentTags.filter((t) => !removeTags.has(t));
      for (const t of addTags) {
        if (!nextTags.includes(t)) nextTags.push(t);
      }
      nextTags = nextTags.slice(0, 10);
      const tagsChanged = JSON.stringify(nextTags) !== JSON.stringify(currentTags);

      const nextCategoryId = category ? category.id : String(current.categoryId ?? "");
      const nextCountryId = country ? country.id : String(current.countryId ?? "");

      const sets: string[] = [];
      const params: unknown[] = [];

      if (category) {
        sets.push("`category` = ?", "`categoryId` = ?");
        params.push(category.name, nextCategoryId);
        // Keep the adult silo coherent: moving to an adult category (or out of
        // one) re-syncs the isAdult flag unless the admin set it explicitly.
        if (changes.isAdult === undefined) {
          sets.push("`isAdult` = ?");
          params.push(category.isAdult ? 1 : 0);
        }
      }
      if (country) {
        sets.push("`country` = ?", "`countryId` = ?");
        params.push(country.name, nextCountryId);
      }
      if (tagsChanged) {
        sets.push("`tags` = ?");
        params.push(JSON.stringify(nextTags));
      }
      if (changes.isAdult !== undefined) {
        sets.push("`isAdult` = ?");
        params.push(changes.isAdult ? 1 : 0);
      }
      if (changes.status !== undefined) {
        sets.push("`status` = ?");
        params.push(changes.status);
      }
      if (changes.linkStatus !== undefined) {
        sets.push("`linkStatus` = ?");
        params.push(changes.linkStatus);
      }

      if (sets.length === 0) {
        skipped++;
        continue;
      }

      sets.push("`updatedAt` = NOW()");
      params.push(id);
      await conn.query(`UPDATE \`groups\` SET ${sets.join(", ")} WHERE \`id\` = ?`, params);
      updated++;
    }
  });

  // Audit log (one line summarizing the bulk operation)
  const parts: string[] = [];
  if (category) parts.push(`categoría→${category.name}`);
  if (country) parts.push(`país→${country.name}`);
  if (addTags.length) parts.push(`+tags[${addTags.join(",")}]`);
  if (removeTags.size) parts.push(`-tags[${[...removeTags].join(",")}]`);
  if (changes.isAdult !== undefined) parts.push(`isAdult=${changes.isAdult ? 1 : 0}`);
  if (changes.status) parts.push(`status=${changes.status}`);
  if (changes.linkStatus) parts.push(`linkStatus=${changes.linkStatus}`);
  await logAdminAction(
    "grupo.bulk-update",
    groupIds.slice(0, 5).join(",") + (groupIds.length > 5 ? `…+${groupIds.length - 5}` : ""),
    `Actualización masiva: ${updated} grupos (${parts.join(" · ")})`
  );

  return NextResponse.json({
    ok: true,
    updated,
    skipped,
    total: groupIds.length,
  });
}
