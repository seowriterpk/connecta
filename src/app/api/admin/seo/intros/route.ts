import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, exec } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Body {
  entityType?: string;
  entityName?: string;
  customTitle?: string;
  customHeroDesc?: string;
  customIntro?: string;
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

  const entityType = String(body.entityType || "").trim();
  const entityName = String(body.entityName || "").trim();
  if (!entityType || !entityName) {
    return NextResponse.json(
      { ok: false, error: "entityType y entityName son obligatorios." },
      { status: 400 }
    );
  }

  const existing = await queryOne(
    "SELECT `id` FROM `entity_intros` WHERE `entityType` = ? AND `entityName` = ? LIMIT 1",
    [entityType, entityName]
  );
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Ya existe un intro para esta entidad." },
      { status: 409 }
    );
  }

  const result = await exec(
    `INSERT INTO \`entity_intros\`
      (\`entityType\`, \`entityName\`, \`customTitle\`, \`customHeroDesc\`, \`customIntro\`)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entityType,
      entityName,
      body.customTitle?.slice(0, 120) || null,
      body.customHeroDesc?.slice(0, 300) || null,
      body.customIntro?.slice(0, 1500) || null,
    ]
  );

  await logAdminAction("seo.intro.create", String(result.insertId), `${entityType}:${entityName}`);

  return NextResponse.json({ ok: true, id: result.insertId });
}
