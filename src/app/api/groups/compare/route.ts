import { NextRequest, NextResponse } from "next/server";
import { getGroupsBySlugs, getRatingsBatch } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Batch endpoint for the /comparar tool: resolves up to 3 group slugs into
 * full GroupDTOs (in the caller's order) plus their community ratings.
 */
export async function GET(req: NextRequest) {
  try {
    const slugsParam = req.nextUrl.searchParams.get("slugs") ?? "";
    const slugs = slugsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (slugs.length === 0) {
      return NextResponse.json({ ok: true, data: { groups: [], ratings: {} } });
    }

    const groups = await getGroupsBySlugs(slugs);
    const ratings = await getRatingsBatch(groups.map((g) => g.id));

    return NextResponse.json({ ok: true, data: { groups, ratings } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar los grupos." },
      { status: 500 }
    );
  }
}
