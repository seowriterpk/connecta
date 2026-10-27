/**
 * /api/admin/queue — listing + mutations for the queue/schedule manager
 * (/admin/cola — Task 30-b).
 *
 * GET  ?source=queue|pending&q=&category=&country=&adult=&sort=&page=&pageSize=
 *      → { ok: true, data: { page: AdminQueuePage, stats: AdminQueueStats } }
 *      Stats are ALWAYS returned so the KPI cards + category chips refresh
 *      after every fetch (poll included).
 *
 * POST { action, csrf, ids, id?, fields? }
 *      actions: publish | move | deleteQueue | deletePending | editQueue
 *      Auth: checkAdminApi + checkCsrfApi. Public-data mutations call
 *      clearDataCache() + logAdminAction().
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { clearDataCache } from "@/lib/cache";
import {
  deletePendingGroups,
  deleteQueueItems,
  fetchAdminPendingPage,
  fetchAdminQueuePage,
  getQueueStats,
  movePendingToQueue,
  publishQueueItems,
  updateQueueItem,
  type AdminQueueEditFields,
} from "@/lib/admin-queue";
import {
  parseAdminQueueFilters,
  type AdminQueueSource,
} from "@/lib/admin-listing-params";

export const dynamic = "force-dynamic";

/** Hard cap per bulk action — keeps slug/dedup queries bounded per request. */
const MAX_BULK_IDS = 500;

function toNumberIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function toStringIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => (typeof v === "string" || typeof v === "number" ? String(v) : ""))
    .filter((v) => v.length > 0 && v.length <= 191);
}

// ---------------------------------------------------------------------------
// GET — listing + stats
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  try {
    const sp = req.nextUrl.searchParams;
    const source: AdminQueueSource = sp.get("source") === "pending" ? "pending" : "queue";
    const filters = parseAdminQueueFilters((key) => sp.get(key));
    const [page, stats] = await Promise.all([
      source === "pending"
        ? fetchAdminPendingPage(filters)
        : fetchAdminQueuePage(filters),
      getQueueStats(),
    ]);
    return NextResponse.json({ ok: true, data: { page, stats } });
  } catch (err) {
    console.error("[admin/queue GET] error", err);
    return NextResponse.json(
      { ok: false, error: "Error al cargar la cola de publicación." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — bulk/single mutations
// ---------------------------------------------------------------------------

interface Body {
  action?: string;
  csrf?: string;
  ids?: unknown;
  id?: unknown;
  fields?: Partial<AdminQueueEditFields>;
}

export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo JSON inválido." },
      { status: 400 }
    );
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  try {
    switch (body.action) {
      // ---- Publish queue items (drip-feed logic, immediate) ----
      case "publish": {
        const ids = toNumberIds(body.ids);
        if (ids.length === 0) {
          return NextResponse.json(
            { ok: false, error: "No se recibieron elementos de la cola." },
            { status: 400 }
          );
        }
        if (ids.length > MAX_BULK_IDS) {
          return NextResponse.json(
            {
              ok: false,
              error: `Demasiados elementos en un solo lote (máximo ${MAX_BULK_IDS}).`,
            },
            { status: 400 }
          );
        }
        const result = await publishQueueItems(ids);
        clearDataCache();
        await logAdminAction(
          "queue.publish",
          undefined,
          `${result.published} publicados · ${result.skipped} omitidos · ${result.errors.length} errores`
        );
        return NextResponse.json({ ok: true, ...result });
      }

      // ---- Move pending groups into the queue ----
      case "move": {
        const ids = toStringIds(body.ids);
        if (ids.length === 0) {
          return NextResponse.json(
            { ok: false, error: "No se recibieron grupos pendientes." },
            { status: 400 }
          );
        }
        if (ids.length > MAX_BULK_IDS) {
          return NextResponse.json(
            {
              ok: false,
              error: `Demasiados grupos en un solo lote (máximo ${MAX_BULK_IDS}).`,
            },
            { status: 400 }
          );
        }
        const result = await movePendingToQueue(ids);
        clearDataCache();
        await logAdminAction(
          "queue.move",
          undefined,
          `${result.moved} movidos a la cola · ${result.skipped} omitidos · ${result.errors.length} errores`
        );
        return NextResponse.json({ ok: true, ...result });
      }

      // ---- Hard delete queue items ----
      case "deleteQueue": {
        const ids = toNumberIds(body.ids);
        if (ids.length === 0) {
          return NextResponse.json(
            { ok: false, error: "No se recibieron elementos de la cola." },
            { status: 400 }
          );
        }
        const deleted = await deleteQueueItems(ids);
        clearDataCache();
        await logAdminAction("queue.delete", undefined, `${deleted} eliminados de la cola`);
        return NextResponse.json({ ok: true, deleted });
      }

      // ---- Hard delete pending groups ----
      case "deletePending": {
        const ids = toStringIds(body.ids);
        if (ids.length === 0) {
          return NextResponse.json(
            { ok: false, error: "No se recibieron grupos pendientes." },
            { status: 400 }
          );
        }
        const deleted = await deletePendingGroups(ids);
        clearDataCache();
        await logAdminAction(
          "queue.deletePending",
          undefined,
          `${deleted} pendientes eliminados`
        );
        return NextResponse.json({ ok: true, deleted });
      }

      // ---- Edit one queued item ----
      case "editQueue": {
        const id = Number(body.id);
        const f = body.fields ?? {};
        const fields: AdminQueueEditFields = {
          groupName: String(f.groupName ?? ""),
          joinLink: String(f.joinLink ?? ""),
          description: String(f.description ?? ""),
          category: String(f.category ?? ""),
          country: String(f.country ?? ""),
          city: String(f.city ?? ""),
          tags: String(f.tags ?? ""),
          keywords: String(f.keywords ?? ""),
          isAdult: !!f.isAdult,
          profileImage: String(f.profileImage ?? ""),
        };
        try {
          const row = await updateQueueItem(id, fields);
          await logAdminAction("queue.edit", String(id), row.groupName);
          return NextResponse.json({ ok: true, row });
        } catch (err) {
          // Validation errors carry Spanish messages for the UI.
          return NextResponse.json(
            {
              ok: false,
              error:
                err instanceof Error
                  ? err.message
                  : "No se pudo actualizar el elemento.",
            },
            { status: 400 }
          );
        }
      }

      default:
        return NextResponse.json(
          { ok: false, error: "Acción desconocida." },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[admin/queue POST] error", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al procesar la acción." },
      { status: 500 }
    );
  }
}
