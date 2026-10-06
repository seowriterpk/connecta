import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, exec } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface EntityIntroRow {
  id: number;
  entityType: string;
  entityName: string;
  customTitle: string | null;
  customHeroDesc: string | null;
  customIntro: string | null;
}

interface Body {
  entityType?: string;
  entityName?: string;
  customTitle?: string;
  customHeroDesc?: string;
  customIntro?: string;
  csrf?: string;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ ok: false, error: "ID inválido." }, { status: 400 });
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const existing = await queryOne<EntityIntroRow>(
    "SELECT `id`, `entityType`, `entityName`, `customTitle`, `customHeroDesc`, `customIntro` FROM `entity_intros` WHERE `id` = ? LIMIT 1",
    [numId]
  );
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Intro no encontrado." }, { status: 404 });
  }

  const customTitle =
    body.customTitle !== undefined
      ? (body.customTitle?.slice(0, 120) || null)
      : existing.customTitle;
  const customHeroDesc =
    body.customHeroDesc !== undefined
      ? (body.customHeroDesc?.slice(0, 300) || null)
      : existing.customHeroDesc;
  const customIntro =
    body.customIntro !== undefined
      ? (body.customIntro?.slice(0, 1500) || null)
      : existing.customIntro;

  await exec(
    "UPDATE `entity_intros` SET `customTitle` = ?, `customHeroDesc` = ?, `customIntro` = ? WHERE `id` = ?",
    [customTitle, customHeroDesc, customIntro, numId]
  );

  await logAdminAction("seo.intro.update", id, `${existing.entityType}:${existing.entityName}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ ok: false, error: "ID inválido." }, { status: 400 });
  }

  let body: { csrf?: string } = {};
  try {
    body = await req.json();
  } catch { /* empty OK */ }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const existing = await queryOne<{ id: number; entityType: string; entityName: string }>(
    "SELECT `id`, `entityType`, `entityName` FROM `entity_intros` WHERE `id` = ? LIMIT 1",
    [numId]
  );
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Intro no encontrado." }, { status: 404 });
  }

  await exec("DELETE FROM `entity_intros` WHERE `id` = ?", [numId]);

  await logAdminAction("seo.intro.delete", id, `${existing.entityType}:${existing.entityName}`);

  return NextResponse.json({ ok: true });
}
