import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, exec } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SeoOverrideRow {
  id: number;
  pageType: string;
  entityId: string;
  metaTitleOverride: string | null;
  metaDescriptionOverride: string | null;
  robotsOverride: string | null;
}

interface Body {
  pageType?: string;
  entityId?: string;
  metaTitleOverride?: string;
  metaDescriptionOverride?: string;
  robotsOverride?: string;
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

  const existing = await queryOne<SeoOverrideRow>(
    "SELECT `id`, `pageType`, `entityId`, `metaTitleOverride`, `metaDescriptionOverride`, `robotsOverride` FROM `seo_overrides` WHERE `id` = ? LIMIT 1",
    [numId]
  );
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Override no encontrado." }, { status: 404 });
  }

  const metaTitle =
    body.metaTitleOverride !== undefined
      ? (body.metaTitleOverride?.slice(0, 120) || null)
      : existing.metaTitleOverride;
  const metaDescription =
    body.metaDescriptionOverride !== undefined
      ? (body.metaDescriptionOverride?.slice(0, 300) || null)
      : existing.metaDescriptionOverride;
  const robots =
    body.robotsOverride !== undefined
      ? (body.robotsOverride?.slice(0, 80) || null)
      : existing.robotsOverride;

  await exec(
    "UPDATE `seo_overrides` SET `metaTitleOverride` = ?, `metaDescriptionOverride` = ?, `robotsOverride` = ? WHERE `id` = ?",
    [metaTitle, metaDescription, robots, numId]
  );

  await logAdminAction("seo.override.update", id, `${existing.pageType}:${existing.entityId}`);

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

  const existing = await queryOne<{ id: number; pageType: string; entityId: string }>(
    "SELECT `id`, `pageType`, `entityId` FROM `seo_overrides` WHERE `id` = ? LIMIT 1",
    [numId]
  );
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Override no encontrado." }, { status: 404 });
  }

  await exec("DELETE FROM `seo_overrides` WHERE `id` = ?", [numId]);

  await logAdminAction("seo.override.delete", id, `${existing.pageType}:${existing.entityId}`);

  return NextResponse.json({ ok: true });
}
