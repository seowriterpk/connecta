import { NextRequest, NextResponse } from "next/server";
import { createFavList, gcFavLists } from "@/lib/fav-lists";
import { checkRateLimit, hitRateLimit, hashValue, getClientIp } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * POST /api/favorites/share
 * Body: { ids: string[], title?: string }
 * Creates a public share list and returns the share code + URL.
 *
 * Rate-limited: 10 creations per IP per hour (anti-abuse).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipHash = hashValue(ip);
    const rateKey = `fav_share_ip:${ipHash}`;

    const check = await checkRateLimit(rateKey, "fav_share", 10, 3600);
    if (!check.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Has creado demasiados enlaces. Espera un rato e inténtalo de nuevo.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Petición no válida." },
        { status: 400 }
      );
    }

    const result = await createFavList(
      (body as { ids?: unknown }).ids,
      (body as { title?: unknown }).title
    );
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    await hitRateLimit(rateKey, "fav_share");

    // Opportunistic GC: ~10% of creates sweep stale lists (viewCount=0, >90d).
    // Keeps the fav_lists table bounded without a dedicated cron worker.
    if (Math.random() < 0.1) {
      gcFavLists().catch(() => {});
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          shareCode: result.shareCode,
          shareUrl: `/lista/${result.shareCode}`,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo crear el enlace." },
      { status: 500 }
    );
  }
}
