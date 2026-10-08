import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/img?url=<whatsapp-cdn-url>
 *
 * Proxies WhatsApp CDN images with the correct Referer header
 * so they don't return 403. Used by the add-group form and
 * group pages to display WhatsApp group profile images.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only allow WhatsApp CDN URLs (security: prevent open proxy)
  if (!url.startsWith("https://pps.whatsapp.net/") && !url.startsWith("https://mmg.whatsapp.net/")) {
    return NextResponse.json({ error: "Only WhatsApp CDN URLs allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "Referer": "https://chat.whatsapp.com/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    // Hardening: only ever serve image content from this proxy (never HTML/JS
    // that could be sniffed/executed from our origin).
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }
    const buffer = Buffer.from(await res.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
