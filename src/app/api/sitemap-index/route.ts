/**
 * GET /api/sitemap-index — serves the sitemap index XML.
 *
 * This is an INTERNAL endpoint: next.config.mjs rewrites the public URL
 * `/sitemap.xml` here (beforeFiles — runs BEFORE the public-folder check).
 * Why the indirection?
 *
 *   1. Next.js 16 scans public/ only ONCE at boot. Sitemap files are
 *      regenerated at runtime, so the static path 404'd every chunk written
 *      after the server started (the grupos-2.xml…404 bug). Reading from
 *      disk per request here fixes that.
 *   2. An app route at the literal path `app/sitemap.xml/route.ts` triggers
 *      Next's dev-mode "conflicting public file and page file" 500 whenever
 *      a generated public/sitemap.xml exists on disk — a landmine after
 *      every local regeneration. The rewrite bypasses the public file
 *      entirely, so dev and prod behave identically: this handler always
 *      serves /sitemap.xml.
 *
 * AUTO-HEAL: right after a fresh deploy (or a wiped public/) no sitemap.xml
 * exists yet — the nightly cron may be hours away. Instead of 404ing
 * Googlebot, the first request triggers a full regeneration (same code as
 * the admin button), then serves the fresh index. A 60s cooldown prevents
 * hammering the DB if generation itself fails (e.g. DB briefly down).
 */

import { NextResponse } from "next/server";
import { readSitemapIndex } from "@/lib/sitemap-files";
import { generateSitemaps } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

let lastHealAttempt = 0;
const HEAL_COOLDOWN_MS = 60_000;

const XML_HEADERS: Record<string, string> = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=60",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(): Promise<NextResponse> {
  let xml = readSitemapIndex();

  if (xml === null && Date.now() - lastHealAttempt > HEAL_COOLDOWN_MS) {
    lastHealAttempt = Date.now();
    try {
      await generateSitemaps();
      xml = readSitemapIndex();
    } catch (err) {
      console.error(
        "[sitemap.xml] auto-heal regeneration failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  if (xml === null) {
    return new NextResponse("Sitemap no disponible", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(xml, { status: 200, headers: XML_HEADERS });
}
