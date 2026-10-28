/**
 * /api/admin/sitemap — instant sitemap regeneration + status.
 *
 * GET  → { ok, data: SitemapStatus }  (freshness, URL counts, file list)
 * POST { csrf } → { ok, data: SitemapGenerationResult }
 *      Regenerates ALL sitemap files now (groups, categories, countries,
 *      cities, blog, authors, statics + index). Same output as the nightly
 *      2am hPanel cron — use this right after a bulk upload/publish.
 *
 * Auth: checkAdminApi + checkCsrfApi (same as every admin mutation).
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { generateSitemaps, getSitemapStatus } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  try {
    const status = await getSitemapStatus();
    return NextResponse.json({ ok: true, data: status });
  } catch (err) {
    console.error("[admin/sitemap GET] error", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo leer el estado del sitemap." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: { csrf?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — CSRF still required below
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  try {
    const result = await generateSitemaps();
    await logAdminAction(
      "sitemap.regenerate",
      undefined,
      `${result.groups} grupos · ${result.totalUrls} URLs · ${result.files.length} archivos · ${result.durationMs}ms`
    );
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("[admin/sitemap POST] error", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo regenerar el sitemap." },
      { status: 500 }
    );
  }
}
