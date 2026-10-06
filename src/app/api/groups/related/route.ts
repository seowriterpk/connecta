import { NextRequest, NextResponse } from "next/server";
import { getRelatedGroups } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id");
    const categoryId = sp.get("cat");
    const limit = Number(sp.get("limite")) || 4;
    if (!id || !categoryId) {
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros id y cat." },
        { status: 400 }
      );
    }
    const data = await getRelatedGroups(id, categoryId, limit);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar grupos relacionados." },
      { status: 500 }
    );
  }
}
