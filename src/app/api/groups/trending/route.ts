import { NextResponse } from "next/server";
import { getTrending } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const data = await getTrending(6);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar los grupos en tendencia." },
      { status: 500 }
    );
  }
}
