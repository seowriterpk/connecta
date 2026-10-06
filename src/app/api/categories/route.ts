import { NextResponse } from "next/server";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const data = await getCategories();
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar las categorías." },
      { status: 500 }
    );
  }
}
