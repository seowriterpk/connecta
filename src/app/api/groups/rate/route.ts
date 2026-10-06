import { NextRequest, NextResponse } from "next/server";
import { submitRating, getGroupRatingStats } from "@/lib/data";
import { queryOne, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

function getSessionId(req: NextRequest): string | null {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/cg-sid=([^;]+)/);
  return match ? match[1] : null;
}

export async function GET(req: NextRequest) {
  try {
    const groupId = req.nextUrl.searchParams.get("id");
    if (!groupId) {
      return NextResponse.json({ ok: false, error: "Falta id." }, { status: 400 });
    }

    // /api/groups/rate/user?id= → returns the user's existing rating (0 if none)
    const isUserQuery = req.nextUrl.searchParams.get("user");
    if (isUserQuery !== null) {
      const ipHash = getSessionId(req);
      if (!ipHash) {
        return NextResponse.json({ ok: true, data: 0 });
      }
      const existing = await queryOne<Row>(
        "SELECT `rating` FROM `group_reviews` WHERE `groupId` = ? AND `ipHash` = ? LIMIT 1",
        [groupId, ipHash]
      );
      return NextResponse.json({ ok: true, data: existing ? Number((existing as Row).rating ?? 0) : 0 });
    }

    const stats = await getGroupRatingStats(groupId);
    return NextResponse.json({ ok: true, data: stats });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo cargar la valoración." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
    }
    const groupId = String(body.groupId ?? "").trim();
    const rating = Number(body.rating);
    if (!groupId) {
      return NextResponse.json({ ok: false, error: "Falta groupId." }, { status: 400 });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "Valoración debe ser entre 1 y 5." }, { status: 400 });
    }
    const existingSid = getSessionId(req);
    const ipHash = existingSid ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    const result = await submitRating(groupId, rating, ipHash);

    const res = NextResponse.json({ ok: true, data: result, userRating: rating }, { status: 201 });
    // Set session cookie if new
    if (!existingSid) {
      res.cookies.set("cg-sid", ipHash, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo guardar la valoración." }, { status: 500 });
  }
}
