import { NextRequest, NextResponse } from "next/server";
import { getRecentGroups } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limite")) || 6;
    const data = await getRecentGroups(Math.min(Math.max(limit, 1), 12));
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudieron cargar los grupos recientes." }, { status: 500 });
  }
}
