import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  try {
    // adult=only → adult categories (18+ mode, client-side fetch only).
    // default → clean categories only (indexing pages / SSR).
    const adultOnly = req.nextUrl.searchParams.get("adult") === "only";
    const data = await getCategories(adultOnly ? { adult: "only" } : {});
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar las categorías." },
      { status: 500 }
    );
  }
}
