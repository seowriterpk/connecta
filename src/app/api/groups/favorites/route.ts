import { NextRequest, NextResponse } from "next/server";
import { getGroupsByIds } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * GET /api/groups/favorites?ids=id1,id2,...
 * Returns the `live` groups matching the given IDs, in the order provided
 * (localStorage favorites order = most recently saved first). Capped at 60.
 */
export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[A-Za-z0-9_-]{1,64}$/.test(s))
      .slice(0, 60);
    if (ids.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }
    const data = await getGroupsByIds(ids);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar tus grupos guardados." },
      { status: 500 }
    );
  }
}
