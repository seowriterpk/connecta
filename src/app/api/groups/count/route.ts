import { NextRequest, NextResponse } from "next/server";
import { getGroupsCount } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    // Mirror the /api/groups adult policy (default = clean only).
    const adultParam = sp.get("adult");
    const adult =
      adultParam === "1" || adultParam === "include"
        ? ("include" as const)
        : adultParam === "only"
        ? ("only" as const)
        : undefined;
    const count = await getGroupsCount({
      search: sp.get("q") ?? undefined,
      categoryId: sp.get("cat") ?? undefined,
      countryId: sp.get("pais") ?? undefined,
      region: sp.get("region") ?? undefined,
      tag: sp.get("tag") ?? undefined,
      featured: sp.get("destacados") === "1",
      adult,
    });
    return NextResponse.json({ ok: true, data: count });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo contar." }, { status: 500 });
  }
}
