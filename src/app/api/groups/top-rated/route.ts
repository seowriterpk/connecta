import { NextResponse } from "next/server";
import { getTopRatedGroups } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const data = await getTopRatedGroups(6);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudieron cargar los mejores valorados." }, { status: 500 });
  }
}
