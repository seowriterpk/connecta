import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, exec } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Body {
  pageType?: string;
  entityId?: string;
  metaTitleOverride?: string;
  metaDescriptionOverride?: string;
  robotsOverride?: string;
  csrf?: string;
}

export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const pageType = String(body.pageType || "").trim();
  const entityId = String(body.entityId || "").trim();
  if (!pageType || !entityId) {
    return NextResponse.json(
      { ok: false, error: "pageType y entityId son obligatorios." },
      { status: 400 }
    );
  }

  const existing = await queryOne(
    "SELECT `id` FROM `seo_overrides` WHERE `pageType` = ? AND `entityId` = ? LIMIT 1",
    [pageType, entityId]
  );
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Ya existe un override para esta entidad." },
      { status: 409 }
    );
  }

  const result = await exec(
    `INSERT INTO \`seo_overrides\`
      (\`pageType\`, \`entityId\`, \`metaTitleOverride\`, \`metaDescriptionOverride\`, \`robotsOverride\`)
     VALUES (?, ?, ?, ?, ?)`,
    [
      pageType,
      entityId,
      body.metaTitleOverride?.slice(0, 120) || null,
      body.metaDescriptionOverride?.slice(0, 300) || null,
      body.robotsOverride?.slice(0, 80) || null,
    ]
  );

  await logAdminAction("seo.override.create", String(result.insertId), `${pageType}:${entityId}`);

  return NextResponse.json({ ok: true, id: result.insertId });
}
