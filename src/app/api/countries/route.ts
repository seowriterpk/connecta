import { NextResponse } from "next/server";
import { getCountries } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const data = await getCountries();
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar los países." },
      { status: 500 }
    );
  }
}
