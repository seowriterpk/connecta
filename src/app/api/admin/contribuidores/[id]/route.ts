import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { exec, queryOne, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type Action = "block" | "unblock" | "remove";

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: { action?: Action; csrf?: string; reason?: string } = {};
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

  if (!body.action || !["block", "unblock", "remove"].includes(body.action)) {
    return NextResponse.json(
      { ok: false, error: "Acción no válida." },
      { status: 400 }
    );
  }

  const contributor = await queryOne<Row>(
    "SELECT `id`, `displayName` FROM `ugc_contributors` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!contributor) {
    return NextResponse.json(
      { ok: false, error: "Colaborador no encontrado." },
      { status: 404 }
    );
  }
  const contributorName = String((contributor as { displayName: string }).displayName);

  const reason = String(body.reason || "").slice(0, 240);

  if (body.action === "block") {
    await exec(
      "UPDATE `ugc_contributors` SET `isBlocked` = 1, `blockedReason` = ? WHERE `id` = ?",
      [reason || "Bloqueado por administración", id]
    );
  } else if (body.action === "unblock") {
    await exec(
      "UPDATE `ugc_contributors` SET `isBlocked` = 0, `isRemoved` = 0, `blockedReason` = '', `removeReason` = '' WHERE `id` = ?",
      [id]
    );
  } else if (body.action === "remove") {
    await exec(
      "UPDATE `ugc_contributors` SET `isRemoved` = 1, `removeReason` = ?, `removedAt` = ? WHERE `id` = ?",
      [reason || "Eliminado por administración", new Date(), id]
    );
  }

  await logAdminAction(`contributor.${body.action}`, id, contributorName);

  return NextResponse.json({ ok: true });
}
