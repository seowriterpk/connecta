import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, exec } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type Action = "resolve" | "dismiss";

const ACTION_TO_STATUS: Record<Action, string> = {
  resolve: "RESOLVED",
  dismiss: "DISMISSED",
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: { action?: Action; csrf?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido." },
      { status: 400 }
    );
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  if (!body.action || !ACTION_TO_STATUS[body.action]) {
    return NextResponse.json(
      { ok: false, error: "Acción no válida." },
      { status: 400 }
    );
  }

  const report = await queryOne<{ id: string; groupId: string }>(
    "SELECT `id`, `groupId` FROM `group_reports` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!report) {
    return NextResponse.json(
      { ok: false, error: "Reporte no encontrado." },
      { status: 404 }
    );
  }

  await exec("UPDATE `group_reports` SET `status` = ? WHERE `id` = ?", [
    ACTION_TO_STATUS[body.action],
    id,
  ]);

  await logAdminAction(`report.${body.action}`, id, report.groupId);

  return NextResponse.json({ ok: true });
}
