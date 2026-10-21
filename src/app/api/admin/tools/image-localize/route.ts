import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import {
  countImageCandidates,
  runImageLocalizeBatch,
  type ImageLocalizeFilter,
} from "@/lib/admin-tools";
import { getAdminSettings } from "@/lib/admin-settings";

export const dynamic = "force-dynamic";

interface ImageLocalizeBody {
  csrf?: string;
  limit?: number;
  filter?: {
    scope?: string;
    status?: string;
    onlyActiveLinks?: boolean;
    overwrite?: boolean;
    categoryId?: string;
    countryId?: string;
  };
}

/**
 * POST — one manual image-localization batch (dashboard bulk tool).
 * Same loop pattern as link-check: frontend drives batches of ~20 so no
 * request lives long on the low-end server. Download-once policy: rows
 * that already have a /media/ image are skipped unless overwrite is set.
 */
export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: ImageLocalizeBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const settings = await getAdminSettings();
  const limit = Math.min(
    Math.max(Number(body.limit) || settings.imageBatchSize, 1),
    200
  );

  const f = body.filter ?? {};
  const scope =
    f.scope === "cdn" || f.scope === "null" || f.scope === "all" ? f.scope : "missing";
  const status = f.status === "pending" || f.status === "all" ? f.status : "live";

  const filter: ImageLocalizeFilter = {
    scope,
    status,
    onlyActiveLinks: f.onlyActiveLinks !== false,
    overwrite: f.overwrite === true,
    categoryId: f.categoryId || undefined,
    countryId: f.countryId || undefined,
  };

  const { rows, scanned } = await runImageLocalizeBatch(filter, limit);

  const remaining = await countImageCandidates(filter);

  if (scanned > 0) {
    await logAdminAction(
      "tools.imageLocalize",
      `${scanned} imágenes`,
      `${rows.filter((r) => r.outcome === "localized").length} guardadas`
    );
  }

  return NextResponse.json({ ok: true, rows, scanned, remaining, limit });
}
