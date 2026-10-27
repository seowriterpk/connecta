import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import {
  countLinkCheckCandidates,
  runLinkCheckBatch,
  type LinkCheckFilter,
} from "@/lib/admin-tools";
import { getAdminSettings } from "@/lib/admin-settings";

export const dynamic = "force-dynamic";

interface LinkCheckBody {
  csrf?: string;
  limit?: number;
  filter?: {
    status?: string;
    linkStatus?: string;
    categoryId?: string;
    countryId?: string;
    checkedBeforeHours?: number;
  };
}

/**
 * POST — one manual link-check batch (dashboard bulk tool).
 * The frontend loops this endpoint with the same filter until the batch
 * comes back short (scanned < limit) or the user presses Stop. Writes are
 * cron-parity: revoked keeps the image, unknown only bumps lastValidatedAt.
 */
export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: LinkCheckBody = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const settings = await getAdminSettings();
  const limit = Math.min(
    Math.max(Number(body.limit) || settings.linkCheckBatchSize, 1),
    200
  );

  const f = body.filter ?? {};
  const status = f.status === "pending" || f.status === "all" ? f.status : "live";
  const linkStatus =
    f.linkStatus === "active" || f.linkStatus === "revoked" ? f.linkStatus : "all";
  const checkedBefore =
    typeof f.checkedBeforeHours === "number" && f.checkedBeforeHours > 0
      ? new Date(Date.now() - f.checkedBeforeHours * 3_600_000)
      : null;

  const filter: LinkCheckFilter = {
    status,
    linkStatus,
    checkedBefore,
    categoryId: f.categoryId || undefined,
    countryId: f.countryId || undefined,
  };

  const { rows, scanned } = await runLinkCheckBatch(filter, limit);

  const remaining = await countLinkCheckCandidates(filter);

  if (scanned > 0) {
    await logAdminAction(
      "tools.linkCheck",
      `${scanned} grupos`,
      `${rows.filter((r) => r.newStatus === "active").length} activos / ${rows.filter((r) => r.newStatus === "revoked").length} revocados`
    );
  }

  return NextResponse.json({ ok: true, rows, scanned, remaining, limit });
}
