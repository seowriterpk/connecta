import { NextRequest, NextResponse } from "next/server";
import { incrementClicks } from "@/lib/data";
import { getClientIp, hashValue, checkRateLimit, hitRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const groupId = body?.groupId ? String(body.groupId) : null;
    if (!groupId) {
      return NextResponse.json({ ok: false, error: "Falta groupId." }, { status: 400 });
    }

    // Rate limit: max 5 clicks per IP per hour per group (view/click inflation guard)
    const ip = getClientIp(req);
    const ipHash = hashValue(ip);
    const rateKey = `click:${groupId}:${ipHash}`;
    const rateCheck = await checkRateLimit(rateKey, "click", 5, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json({ ok: true }); // silent fail — don't break user experience
    }

    // Record the hit so repeated clicks from the same IP actually get deduped.
    // (Previously the limit was checked but never recorded — it could not trigger.)
    await hitRateLimit(rateKey, "click", 3600);

    incrementClicks(groupId).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar el clic." }, { status: 500 });
  }
}
