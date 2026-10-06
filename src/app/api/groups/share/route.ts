import { NextRequest, NextResponse } from "next/server";
import { incrementShares } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const groupId = body?.groupId ? String(body.groupId) : null;
    if (!groupId) {
      return NextResponse.json({ ok: false, error: "Falta groupId." }, { status: 400 });
    }
    incrementShares(groupId).catch(() => {});
    return NextResponse.json({ ok: true, message: "Share tracked." });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar." }, { status: 500 });
  }
}
