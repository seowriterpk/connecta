/**
 * GET /sitemaps/:filename — serve a generated sitemap chunk.
 *
 * Why a route handler instead of the public/ folder: Next.js 16 scans
 * public/ ONCE at server boot. Sitemap files are (re)generated at runtime —
 * admin "Regenerar ahora", the drip-feed cron and the nightly cron — so any
 * chunk created after the server started was invisible to the static router
 * and 404'd (the grupos-2.xml…grupos-9.xml bug). This handler reads from
 * disk per request, so every file is served the second it is written.
 *
 * AUTO-HEAL: right after a fresh deploy public/ has no sitemaps at all
 * (they're runtime artifacts, gitignored). If Googlebot remembers an old
 * chunk URL and fetches it before anything else, the request triggers a
 * full regeneration (shared 60s cooldown with /sitemap.xml), then re-reads
 * — so a fresh deploy serves remembered chunk URLs instead of 404ing them.
 *
 * Filenames are strictly whitelisted (grupos-N.xml + the 6 fixed names) —
 * no traversal, no arbitrary file reads. 404 (plain) when the file doesn't
 * exist after healing: a sitemap URL that isn't listed in the index must
 * 404 for crawlers (and empty sections are never written — Task 36).
 */

import { NextRequest, NextResponse } from "next/server";
import { readSitemapChunk } from "@/lib/sitemap-files";
import { maybeHealSitemaps } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

const XML_HEADERS: Record<string, string> = {
  "Content-Type": "application/xml; charset=utf-8",
  // Short cache: fresh after regeneration (admin regenerates → Search
  // Console resubmits → gets the new file within a minute), while still
  // shielding the disk from hammering. Next's static public serving would
  // stamp `max-age=31536000, immutable` — wrong for sitemaps.
  "Cache-Control": "public, max-age=60",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ filename: string }> }
): Promise<NextResponse> {
  const { filename } = await ctx.params;
  let xml = readSitemapChunk(filename);

  if (xml === null) {
    // Missing file: fresh deploy (public/ empty until first hit) or a
    // section that legitimately has no file (empty section, Task 36 —
    // healing won't create it, the 404 below is correct). Heal is bounded
    // by the shared cooldown, then re-read once.
    await maybeHealSitemaps();
    xml = readSitemapChunk(filename);
  }

  if (xml === null) {
    return new NextResponse("Sitemap no encontrado", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(xml, { status: 200, headers: XML_HEADERS });
}
