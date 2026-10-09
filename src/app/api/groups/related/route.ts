import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getRecentRelatedGroups } from "@/lib/related-groups";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id");
    const limit = Math.min(Math.max(Number(sp.get("limite")) || 4, 1), 12);
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el parámetro id." },
        { status: 400 }
      );
    }

    // Derive category + content silo from the group itself so this endpoint
    // can never leak cross-silo (non-adult ↔ adult) recommendations.
    const group = await queryOne<{ id: string; categoryId: string | null; isAdult: number }>(
      "SELECT `id`, `categoryId`, `isAdult` FROM `groups` WHERE `id` = ? LIMIT 1",
      [id]
    );
    if (!group) {
      return NextResponse.json(
        { ok: false, error: "Grupo no encontrado." },
        { status: 404 }
      );
    }

    const data = await getRecentRelatedGroups(
      group.id,
      group.categoryId ?? undefined,
      !!group.isAdult,
      limit
    );
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar grupos relacionados." },
      { status: 500 }
    );
  }
}
