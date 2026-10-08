import { NextResponse } from "next/server";
import { getRandomGroup } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getRandomGroup();
    if (!data) {
      return NextResponse.json({ ok: false, error: "No hay grupos disponibles." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo cargar un grupo aleatorio." }, { status: 500 });
  }
}
