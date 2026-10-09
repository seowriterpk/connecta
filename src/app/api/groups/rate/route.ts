import { NextRequest, NextResponse } from "next/server";
import { submitRating, getGroupRatingStats } from "@/lib/data";
import { queryOne, type Row } from "@/lib/db";
import { hashValue, getClientIp, checkRateLimit, hitRateLimit } from "@/lib/rate-limiter";

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
      // Identity: legacy session cookie first, then per-IP hash.
      const sid = getSessionId(req);
      if (sid) {
        const bySid = await queryOne<Row>(
          "SELECT `rating` FROM `group_reviews` WHERE `groupId` = ? AND `ipHash` = ? LIMIT 1",
          [groupId, sid]
        );
        if (bySid) {
          return NextResponse.json({ ok: true, data: Number((bySid as Row).rating ?? 0) });
        }
      }
      const ipHash = hashValue(getClientIp(req));
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

    // Anti-inflation: reviewers are identified by a per-IP hash (unique key
    // groupId+ipHash → one review per IP per group, re-rates update in place),
    // and each IP is capped at 15 rating POSTs per hour.
    const ip = getClientIp(req);
    const ipHash = hashValue(ip);
    const rateKey = `rate_ip:${ipHash}`;
    const burst = await checkRateLimit(rateKey, "group_rate", 15, 3600);
    if (!burst.allowed) {
      return NextResponse.json(
        { ok: false, error: "Demasiadas valoraciones seguidas. Inténtalo más tarde." },
        { status: 429 }
      );
    }

    // Legacy continuity: a pre-existing cookie-sid review is updated in place.
    const legacySid = getSessionId(req);
    const legacy = legacySid
      ? await queryOne<Row>(
          "SELECT `id` FROM `group_reviews` WHERE `groupId` = ? AND `ipHash` = ? LIMIT 1",
          [groupId, legacySid]
        )
      : null;
    const raterKey = legacy ? String((legacy as Row).ipHash ?? legacySid) : ipHash;

    const result = await submitRating(groupId, rating, raterKey);
    await hitRateLimit(rateKey, "group_rate", 3600);

    return NextResponse.json({ ok: true, data: result, userRating: rating }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo guardar la valoración." }, { status: 500 });
  }
}
