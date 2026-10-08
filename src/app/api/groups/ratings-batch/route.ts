import { NextRequest, NextResponse } from "next/server";
import { getRatingsBatch } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
    const data = await getRatingsBatch(ids);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudieron cargar las valoraciones." }, { status: 500 });
  }
}
