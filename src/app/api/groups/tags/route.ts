import { NextResponse } from "next/server";
import { getPopularTags } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const data = await getPopularTags(14);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar las etiquetas." },
      { status: 500 }
    );
  }
}
