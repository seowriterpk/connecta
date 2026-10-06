import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { deleteFavList } from "@/lib/fav-lists";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** DELETE /api/admin/lists/[id] — remove one shared favorites list. */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  // CSRF via header (DELETE has no JSON body in our client)
  const csrfErr = await checkCsrfApi(req.headers.get("x-csrf-token"));
  if (csrfErr) return csrfErr;

  const removed = await deleteFavList(id);
  if (!removed) {
    return NextResponse.json(
      { ok: false, error: "Lista no encontrada." },
      { status: 404 }
    );
  }

  await logAdminAction("favlist.delete", id, id);

  return NextResponse.json({ ok: true });
}
