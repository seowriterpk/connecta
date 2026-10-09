/**
 * POST /api/admin/seo/intros/bulk-import
 *
 * Bulk import of entity intros from the JSON file exported by
 * /api/admin/seo/intros/bulk-export (after the content team edits it).
 *
 * Body: { rows: [{ entityType, entityName, customTitle, customHeroDesc, customIntro }], csrf }
 * Upserts via INSERT ... ON DUPLICATE KEY UPDATE (uq_intro_type_name).
 * Empty customIntro/customTitle/customHeroDesc fields are stored as NULL
 * (falling back to the dynamic keyword-derived content on the public pages).
 */
import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { exec } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TYPES = new Set(["category", "country", "city", "tag"]);
const MAX_INTRO = 8000;
const MAX_TITLE = 120;
const MAX_HERO = 300;

interface RowIn {
  entityType?: string;
  entityName?: string;
  customTitle?: string;
  customHeroDesc?: string;
  customIntro?: string;
}

interface Body {
  rows?: RowIn[];
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

  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: "El archivo no contiene filas." }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json(
      { ok: false, error: "Máximo 500 filas por importación." },
      { status: 400 }
    );
  }

  let imported = 0;
  let skipped = 0;

  for (const r of rows) {
    const entityType = String(r.entityType ?? "").trim().toLowerCase();
    const entityName = String(r.entityName ?? "").trim();
    if (!VALID_TYPES.has(entityType) || !entityName) {
      skipped++;
      continue;
    }
    const customTitle = String(r.customTitle ?? "").trim().slice(0, MAX_TITLE) || null;
    const customHeroDesc = String(r.customHeroDesc ?? "").trim().slice(0, MAX_HERO) || null;
    const customIntro = String(r.customIntro ?? "").trim().slice(0, MAX_INTRO) || null;

    try {
      await exec(
        `INSERT INTO \`entity_intros\`
           (\`entityType\`, \`entityName\`, \`customTitle\`, \`customHeroDesc\`, \`customIntro\`)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           \`customTitle\` = VALUES(\`customTitle\`),
           \`customHeroDesc\` = VALUES(\`customHeroDesc\`),
           \`customIntro\` = VALUES(\`customIntro\`)`,
        [entityType, entityName, customTitle, customHeroDesc, customIntro]
      );
      imported++;
    } catch {
      skipped++;
    }
  }

  try {
    await logAdminAction(`Bulk intros import: ${imported} filas (${skipped} omitidas)`);
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({ ok: true, imported, skipped });
}
