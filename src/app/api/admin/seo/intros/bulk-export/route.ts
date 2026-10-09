/**
 * GET /api/admin/seo/intros/bulk-export?scope=category|country|city|all&mode=empty|full
 *
 * Bulk export of entity intros (the long bottom descriptions of category /
 * country / city pages) as a JSON file the content team can edit offline.
 *
 * - mode=empty  → every entity of the scope with blank fields (write from scratch)
 * - mode=full   → every entity with its CURRENT stored values (edit existing)
 *
 * The file is re-uploaded via /api/admin/seo/intros/bulk-import.
 */
import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-guard";
import { query, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

interface IntroRow extends Row {
  entityType: string;
  entityName: string;
  customTitle: string | null;
  customHeroDesc: string | null;
  customIntro: string | null;
}

type SRow = Row & Record<string, any>;

const SCOPES: Record<string, { entityType: string; sql: string; params: unknown[] }> = {
  category: {
    entityType: "category",
    sql: "SELECT `name` AS `name` FROM `categories` WHERE `isActive` = 1 ORDER BY `sortOrder` ASC",
    params: [],
  },
  country: {
    entityType: "country",
    sql: "SELECT `name` AS `name` FROM `countries` ORDER BY `name` ASC",
    params: [],
  },
  city: {
    entityType: "city",
    sql: `SELECT DISTINCT \`city\` AS \`name\` FROM \`groups\`
          WHERE \`city\` IS NOT NULL AND \`city\` <> '' AND \`status\` = 'live'
          ORDER BY \`city\` ASC`,
    params: [],
  },
};

export async function GET(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  try {
    const scope = req.nextUrl.searchParams.get("scope") ?? "category";
    const mode = req.nextUrl.searchParams.get("mode") === "full" ? "full" : "empty";

    const scopesToExport =
      scope === "all" ? Object.keys(SCOPES) : SCOPES[scope] ? [scope] : null;
    if (!scopesToExport) {
      return NextResponse.json({ ok: false, error: "Scope desconocido." }, { status: 400 });
    }

    const rows: Array<{
      entityType: string;
      entityName: string;
      customTitle: string;
      customHeroDesc: string;
      customIntro: string;
    }> = [];

    for (const s of scopesToExport) {
      const def = SCOPES[s];
      // All entities of the scope
      const entities = await query<SRow>(def.sql, def.params);
      // Existing intros for this entity type
      const intros = await query<IntroRow>(
        "SELECT `entityType`, `entityName`, `customTitle`, `customHeroDesc`, `customIntro` FROM `entity_intros` WHERE `entityType` = ?",
        [def.entityType]
      );
      const introByName = new Map(intros.map((i) => [i.entityName, i]));

      for (const e of entities) {
        const name = String(e.name ?? "").trim();
        if (!name) continue;
        const existing = mode === "full" ? introByName.get(name) : undefined;
        rows.push({
          entityType: def.entityType,
          entityName: name,
          customTitle: existing?.customTitle ?? "",
          customHeroDesc: existing?.customHeroDesc ?? "",
          customIntro: existing?.customIntro ?? "",
        });
      }
    }

    const payload = {
      _info: {
        description:
          "ConectaGrupos — intros de entidades (texto largo inferior de las páginas de categoría, país y ciudad). Rellena customIntro (párrafos separados por línea en blanco), customTitle y customHeroDesc. Sube este mismo archivo en Importar.",
        scope,
        mode,
        exportedAt: new Date().toISOString(),
        rows: rows.length,
      },
      rows,
    };

    const fileName = `intros-${scope}-${mode}-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo exportar." }, { status: 500 });
  }
}
