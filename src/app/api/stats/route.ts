import { NextResponse } from "next/server";
import { getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json({ ok: true, data: stats });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar las estadísticas." },
      { status: 500 }
    );
  }
}
