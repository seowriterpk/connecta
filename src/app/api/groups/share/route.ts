import { NextRequest, NextResponse } from "next/server";
import { incrementShares } from "@/lib/data";
import { getClientIp, hashValue, checkRateLimit, hitRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const groupId = body?.groupId ? String(body.groupId) : null;
    if (!groupId) {
      return NextResponse.json({ ok: false, error: "Falta groupId." }, { status: 400 });
    }

    // Rate limit: max 5 shares per IP per hour per group (share inflation guard,
    // same pattern as the click tracker).
    const ip = getClientIp(req);
    const ipHash = hashValue(ip);
    const rateKey = `share:${groupId}:${ipHash}`;
    const rateCheck = await checkRateLimit(rateKey, "share", 5, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json({ ok: true }); // silent fail — don't break user experience
    }
    await hitRateLimit(rateKey, "share", 3600);

    incrementShares(groupId).catch(() => {});
    return NextResponse.json({ ok: true, message: "Share tracked." });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar." }, { status: 500 });
  }
}
