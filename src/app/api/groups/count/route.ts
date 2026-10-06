import { NextRequest, NextResponse } from "next/server";
import { getGroupsCount } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const count = await getGroupsCount({
      search: sp.get("q") ?? undefined,
      categoryId: sp.get("cat") ?? undefined,
      countryId: sp.get("pais") ?? undefined,
      region: sp.get("region") ?? undefined,
      tag: sp.get("tag") ?? undefined,
      featured: sp.get("destacados") === "1",
    });
    return NextResponse.json({ ok: true, data: count });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo contar." }, { status: 500 });
  }
}
