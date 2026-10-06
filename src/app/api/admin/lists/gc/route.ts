import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { gcFavLists, countStaleFavLists, STALE_DAYS } from "@/lib/fav-lists";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/lists/gc — garbage-collect stale shared lists
 * (viewCount = 0 AND older than STALE_DAYS).
 */
export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let csrf: string | null = null;
  try {
    const body = await req.json();
    csrf = body?.csrf ?? null;
  } catch {
    /* body optional — fall back to header */
  }
  const csrfErr = await checkCsrfApi(csrf ?? req.headers.get("x-csrf-token"));
  if (csrfErr) return csrfErr;

  try {
    const before = await countStaleFavLists();
    const deleted = await gcFavLists();
    if (deleted > 0) {
      await logAdminAction("favlist.gc", undefined, `${deleted} listas`);
    }
    return NextResponse.json({
      ok: true,
      data: { deleted, eligible: before, staleDays: STALE_DAYS },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo ejecutar la limpieza." },
      { status: 500 }
    );
  }
}
