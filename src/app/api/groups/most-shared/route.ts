import { NextResponse } from "next/server";
import { getMostSharedGroups } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const data = await getMostSharedGroups(6);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudieron cargar los más compartidos." }, { status: 500 });
  }
}
