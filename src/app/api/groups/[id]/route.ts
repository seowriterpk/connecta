import { NextRequest, NextResponse } from "next/server";
import { getGroupById, incrementViews, touchGroupActivity } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await getGroupById(id);
    if (!group) {
      return NextResponse.json(
        { ok: false, error: "Grupo no encontrado." },
        { status: 404 }
      );
    }
    // Increment views + touch lastActiveAt in the background (best-effort)
    incrementViews(id).catch(() => {});
    touchGroupActivity(id).catch(() => {});
    return NextResponse.json({ ok: true, data: group });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al cargar el grupo." },
      { status: 500 }
    );
  }
}
