import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { applyUgcAction, type UgcAction } from "@/lib/ugc-admin";

export const dynamic = "force-dynamic";

interface BulkUgcBody {
  csrf?: string;
  action?: string;
  ids?: unknown;
}

/**
 * POST — bulk approve / reject / spam over the UGC queue.
 * Cap 100 per request; the frontend chunks larger selections so the
 * request stays fast on the low-end server. Per-item results are returned
 * so the UI can mark exactly which rows failed (and why).
 */
export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: BulkUgcBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const action = body.action;
  if (action !== "approve" && action !== "reject" && action !== "spam") {
    return NextResponse.json({ ok: false, error: "Acción no válida." }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ ok: false, error: "Sin envíos seleccionados." }, { status: 400 });
  }

  const ids = body.ids
    .map((v) => String(v))
    .filter((v) => v.length > 0)
    .slice(0, 100);

  const results: Array<{
    id: string;
    ok: boolean;
    error?: string;
    status?: string;
    publishedSlug?: string | null;
    name?: string;
  }> = [];

  for (const id of ids) {
    const res = await applyUgcAction(id, action as UgcAction);
    if (res.ok) {
      results.push({
        id,
        ok: true,
        status: res.status,
        publishedSlug: res.publishedSlug,
        name: res.name,
      });
    } else {
      results.push({ id, ok: false, error: res.error });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  await logAdminAction(
    `ugc.bulk.${action}`,
    `${okCount}/${ids.length}`,
    results.find((r) => r.ok)?.name ?? undefined
  );

  return NextResponse.json({
    ok: true,
    action,
    results,
    counts: { ok: okCount, failed: ids.length - okCount },
  });
}
