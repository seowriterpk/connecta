import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { exec } from "@/lib/db";

export const dynamic = "force-dynamic";

type BulkAction = "publish" | "reject" | "delete";

interface Body {
  ids?: string[];
  action?: BulkAction;
  csrf?: string;
}

const ACTIONS: Record<BulkAction, { label: string; status: string }> = {
  publish: { label: "grupos.bulk.publish", status: "live" },
  reject: { label: "grupos.bulk.reject", status: "rejected" },
  delete: { label: "grupos.bulk.delete", status: "rejected" },
};

export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: Body = {};
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

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  const action = body.action;
  if (!action || !ACTIONS[action]) {
    return NextResponse.json(
      { ok: false, error: "Acción no válida." },
      { status: 400 }
    );
  }
  if (ids.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No se seleccionaron grupos." },
      { status: 400 }
    );
  }
  if (ids.length > 200) {
    return NextResponse.json(
      { ok: false, error: "Máximo 200 grupos por lote." },
      { status: 400 }
    );
  }

  const def = ACTIONS[action];

  try {
    // Soft delete: mark as rejected. (Hard delete only via individual route.)
    const placeholders = ids.map(() => "?").join(", ");
    const result = await exec(
      `UPDATE \`groups\` SET \`status\` = ? WHERE \`id\` IN (${placeholders})`,
      [def.status, ...ids]
    );

    await logAdminAction(def.label, ids.join(","), `${result.affectedRows} grupos`);

    return NextResponse.json({ ok: true, count: result.affectedRows });
  } catch (err) {
    console.error("[admin/grupos/bulk] error", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al actualizar grupos." },
      { status: 500 }
    );
  }
}
