import { NextRequest, NextResponse } from "next/server";
import { incrementClicks } from "@/lib/data";
import { getClientIp, hashValue, checkRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const groupId = body?.groupId ? String(body.groupId) : null;
    if (!groupId) {
      return NextResponse.json({ ok: false, error: "Falta groupId." }, { status: 400 });
    }

    // Rate limit: max 5 clicks per IP per hour per group
    const ip = getClientIp(req);
    const ipHash = hashValue(ip);
    const rateCheck = await checkRateLimit(`click:${groupId}:${ipHash}`, "click", 5, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json({ ok: true }); // silent fail — don't break user experience
    }

    incrementClicks(groupId).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar el clic." }, { status: 500 });
  }
}
