import { NextRequest, NextResponse } from "next/server";
import { getPopularTags } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Adult policy: default returns clean tags only (safe for SSR/SEO).
    // adult=only returns tags of adult groups — used client-side when the
    // 18+ mode is active (never server-rendered on indexing pages).
    const adultOnly = req.nextUrl.searchParams.get("adult") === "only";
    const limit = Number(req.nextUrl.searchParams.get("limite")) || 14;
    const data = await getPopularTags(Math.min(limit, 30), adultOnly ? { adult: "only" } : {});
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar las etiquetas." },
      { status: 500 }
    );
  }
}
