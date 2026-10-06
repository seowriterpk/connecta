import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import {
  importGroups,
  normalizeRow,
  type ImportTarget,
  type RawGroupRow,
} from "@/lib/bulk-import";

interface Body {
  groups?: RawGroupRow[];
  mode?: "csv" | "json";
  target?: ImportTarget;
  csrf?: string;
}

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bulk-upload
 * Body: { groups: RawGroupRow[], mode: "csv" | "json", target: "queue" | "pending", csrf: string }
 *
 * Validates each group (shape + URL), then bulk-inserts valid ones into either
 * groups_queue (for drip-feed) or groups table with status="pending".
 *
 * Returns { ok, imported, skipped, errors }.
 */
export async function POST(req: NextRequest) {
  // Auth
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  // Parse body
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo JSON inválido." },
      { status: 400 }
    );
  }

  // CSRF
  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  // Validate fields
  const groups = Array.isArray(body.groups) ? body.groups : [];
  if (groups.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No se recibieron grupos para importar." },
      { status: 400 }
    );
  }
  if (groups.length > 500) {
    return NextResponse.json(
      {
        ok: false,
        error: "Demasiados grupos en un solo lote (máximo 500).",
      },
      { status: 400 }
    );
  }

  const target: ImportTarget =
    body.target === "queue" || body.target === "pending" ? body.target : "pending";

  // Normalize + filter valid rows (validate shape + URL only — DB dedup happens in importGroups)
  const valid: ReturnType<typeof normalizeRow>[] = [];
  const preErrors: { rowIndex: number; rowName: string; reason: string }[] = [];
  for (let i = 0; i < groups.length; i++) {
    const row = groups[i] || {};
    try {
      valid.push(normalizeRow(row));
    } catch (e: any) {
      preErrors.push({
        rowIndex: i + 1,
        rowName: String(row.group_name || "").slice(0, 80),
        reason: e?.message || "Fila inválida.",
      });
    }
  }

  // Bulk insert valid groups (with DB-side dedup)
  const insertResult = await importGroups(valid, { target });

  // Merge pre-validation errors with insert errors
  const allErrors = [...preErrors, ...insertResult.errors];
  const totalImported = insertResult.imported;
  const totalSkipped = insertResult.skipped + preErrors.length;

  await logAdminAction(
    `bulk-upload.import (${target})`,
    undefined,
    `${totalImported} importados / ${totalSkipped} omitidos · ${body.mode || "csv"}`
  );

  return NextResponse.json({
    ok: true,
    target,
    imported: totalImported,
    skipped: totalSkipped,
    errors: allErrors,
  });
}
