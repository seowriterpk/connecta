import { NextRequest, NextResponse } from "next/server";
import { getGroups } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const data = await getGroups({
      search: sp.get("q") ?? undefined,
      categoryId: sp.get("cat") ?? undefined,
      countryId: sp.get("pais") ?? undefined,
      region: sp.get("region") ?? undefined,
      tag: sp.get("tag") ?? undefined,
      featured: sp.get("destacados") === "1",
      sort: (sp.get("orden") as any) ?? undefined,
      limit: Number(sp.get("limite")) || undefined,
      offset: Number(sp.get("desde")) || undefined,
    });
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar los grupos." },
      { status: 500 }
    );
  }
}
