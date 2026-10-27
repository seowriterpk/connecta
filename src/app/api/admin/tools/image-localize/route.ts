import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import {
  countImageCandidates,
  runImageLocalizeBatch,
  type ImageLocalizeFilter,
} from "@/lib/admin-tools";
import {
  countImageScopes,
  previewImageCandidates,
  runImageLocalizeSingle,
} from "@/lib/image-tools";
import { getAdminSettings } from "@/lib/admin-settings";

export const dynamic = "force-dynamic";

interface ImageLocalizeBody {
  csrf?: string;
  limit?: number;
  /** "single" → per-group retry; absent → classic batch (unchanged contract). */
  action?: string;
  groupId?: string;
  filter?: {
    scope?: string;
    status?: string;
    onlyActiveLinks?: boolean;
    overwrite?: boolean;
    categoryId?: string;
    countryId?: string;
  };
}

/** Same normalization the batch path has always used (scope/status guards). */
function parseFilter(f: {
  scope?: string;
  status?: string;
  onlyActiveLinks?: boolean;
  overwrite?: boolean;
  categoryId?: string;
  countryId?: string;
}): ImageLocalizeFilter {
  const scope =
    f.scope === "cdn" || f.scope === "null" || f.scope === "all" ? f.scope : "missing";
  const status = f.status === "pending" || f.status === "all" ? f.status : "live";
  return {
    scope,
    status,
    onlyActiveLinks: f.onlyActiveLinks !== false,
    overwrite: f.overwrite === true,
    categoryId: f.categoryId || undefined,
    countryId: f.countryId || undefined,
  };
}

/**
 * GET — live dashboard metadata for the CURRENT filter (auth: admin
 * session cookie, same guard pattern as every read-only admin route).
 * Returns { ok, scopes: { missing, cdn, null, local, total },
 * preview: [candidate rows with category/country names] } so the UI can
 * render the scope chips with real counts plus a queue preview without
 * any page reload.
 */
export async function GET(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const p = req.nextUrl.searchParams;
  const filter = parseFilter({
    scope: p.get("scope") ?? undefined,
    status: p.get("status") ?? undefined,
    onlyActiveLinks: p.get("onlyActiveLinks") !== "false",
    overwrite: p.get("overwrite") === "true",
    categoryId: p.get("categoryId") ?? undefined,
    countryId: p.get("countryId") ?? undefined,
  });

  const previewLimit = Math.min(Math.max(Number(p.get("preview")) || 12, 1), 24);

  const [scopes, preview] = await Promise.all([
    countImageScopes(filter),
    previewImageCandidates(filter, previewLimit),
  ]);

  return NextResponse.json({ ok: true, scopes, preview });
}

/**
 * POST — one manual image-localization batch (dashboard bulk tool).
 * Same loop pattern as link-check: frontend drives batches of ~20 so no
 * request lives long on the low-end server. Download-once policy: rows
 * that already have a /media/ image are skipped unless overwrite is set.
 *
 * POST with body.action === "single" + groupId re-runs localization for a
 * single group (per-row "Reintentar" buttons). The classic batch contract
 * (no action field) is byte-for-byte unchanged: { csrf, limit, filter } →
 * { ok, rows, scanned, remaining, limit }.
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

  // --- Per-group retry ----------------------------------------------------
  if (body.action === "single") {
    const groupId = typeof body.groupId === "string" ? body.groupId.trim() : "";
    if (!groupId) {
      return NextResponse.json(
        { ok: false, error: "Falta el identificador del grupo." },
        { status: 400 }
      );
    }
    const row = await runImageLocalizeSingle(groupId);
    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Grupo no encontrado." },
        { status: 404 }
      );
    }
    await logAdminAction("tools.imageRetry", row.name, row.outcome);
    return NextResponse.json({ ok: true, row });
  }

  // --- Classic batch (unchanged contract) ---------------------------------
  const settings = await getAdminSettings();
  const limit = Math.min(
    Math.max(Number(body.limit) || settings.imageBatchSize, 1),
    200
  );

  const f = body.filter ?? {};
  const filter = parseFilter(f);

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
