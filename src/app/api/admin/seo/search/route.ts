/**
 * GET /api/admin/seo/search?q=...&type=group|category|country|city|tag
 *
 * Predictive-search (autocomplete) endpoint for the admin SEO forms.
 * Returns up to 10 options as you type, each with contextual info
 * (total groups for taxonomies, clicks/country for groups) so the admin
 * can click-to-add the right entity without memorizing slugs.
 */
import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-guard";
import { query, type Row } from "@/lib/db";

export const dynamic = "force-dynamic";

type SRow = Row & Record<string, any>;

export async function GET(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    const type = req.nextUrl.searchParams.get("type") ?? "category";
    if (q.length < 2) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

    let rows: SRow[] = [];
    let data: Array<{ value: string; label: string; name: string; sub: string }> = [];

    switch (type) {
      case "group": {
        rows = await query<SRow>(
          `SELECT g.\`groupName\`, g.\`slug\`, g.\`clicks\`, g.\`isAdult\`, c.\`name\` AS \`catName\`, co.\`name\` AS \`countryName\`
           FROM \`groups\` g
           LEFT JOIN \`categories\` c ON c.\`id\` = g.\`categoryId\`
           LEFT JOIN \`countries\` co ON co.\`id\` = g.\`countryId\`
           WHERE g.\`groupName\` LIKE ? OR g.\`slug\` LIKE ?
           ORDER BY g.\`clicks\` DESC LIMIT 10`,
          [like, like]
        );
        data = rows.map((r) => ({
          value: String(r.slug ?? ""),
          label: String(r.groupName ?? ""),
          name: String(r.groupName ?? ""),
          sub: `${r.clicks ?? 0} clics · ${r.catName ?? "sin categoría"}${r.countryName ? ` · ${r.countryName}` : ""}${r.isAdult ? " · 18+" : ""}`,
        }));
        break;
      }
      case "category": {
        rows = await query<SRow>(
          `SELECT c.\`name\`, c.\`slug\`, c.\`isAdult\`,
             (SELECT COUNT(*) FROM \`groups\` g WHERE g.\`categoryId\` = c.\`id\` AND g.\`status\` = 'live') AS \`total\`
           FROM \`categories\` c
           WHERE c.\`name\` LIKE ? OR c.\`slug\` LIKE ?
           ORDER BY c.\`sortOrder\` ASC LIMIT 10`,
          [like, like]
        );
        data = rows.map((r) => ({
          value: String(r.slug ?? ""),
          label: `${String(r.name ?? "")}${r.isAdult ? " · 18+" : ""}`,
          name: String(r.name ?? ""),
          sub: `${Number(r.total ?? 0)} grupos · slug: ${r.slug}`,
        }));
        break;
      }
      case "country": {
        rows = await query<SRow>(
          `SELECT co.\`name\`, co.\`code\`, co.\`slug\`,
             (SELECT COUNT(*) FROM \`groups\` g WHERE g.\`countryId\` = co.\`id\` AND g.\`status\` = 'live') AS \`total\`
           FROM \`countries\` co
           WHERE co.\`name\` LIKE ? OR co.\`code\` LIKE ?
           ORDER BY co.\`name\` ASC LIMIT 10`,
          [like, like]
        );
        data = rows.map((r) => ({
          value: String(r.slug ?? r.code ?? ""),
          label: String(r.name ?? ""),
          name: String(r.name ?? ""),
          sub: `${Number(r.total ?? 0)} grupos · código: ${r.code}`,
        }));
        break;
      }
      case "city": {
        rows = await query<SRow>(
          `SELECT g.\`city\`, co.\`name\` AS \`countryName\`, COUNT(*) AS \`total\`
           FROM \`groups\` g LEFT JOIN \`countries\` co ON co.\`id\` = g.\`countryId\`
           WHERE g.\`city\` IS NOT NULL AND g.\`city\` <> '' AND (g.\`city\` LIKE ? OR co.\`name\` LIKE ?)
             AND g.\`status\` = 'live'
           GROUP BY g.\`city\`, co.\`name\` ORDER BY \`total\` DESC LIMIT 10`,
          [like, like]
        );
        data = rows.map((r) => ({
          value: String(r.city ?? ""),
          label: String(r.city ?? ""),
          name: String(r.city ?? ""),
          sub: `${Number(r.total ?? 0)} grupos${r.countryName ? ` · ${r.countryName}` : ""}`,
        }));
        break;
      }
      case "tag": {
        // Tags are stored as a JSON array of strings — unnest with JSON_TABLE
        // and match with LIKE (case/accent-insensitive via table collation).
        rows = await query<SRow>(
          `SELECT jt.\`tag\` AS \`tag\`, COUNT(*) AS \`total\`
           FROM \`groups\` g
           JOIN JSON_TABLE(
             g.\`tags\`,
             '$[*]' COLUMNS (\`tag\` VARCHAR(64) PATH '$')
           ) jt
           WHERE g.\`status\` = 'live' AND JSON_VALID(g.\`tags\`)
             AND jt.\`tag\` LIKE ?
           GROUP BY jt.\`tag\` ORDER BY \`total\` DESC LIMIT 10`,
          [like]
        );
        data = rows.map((r) => ({
          value: String(r.tag ?? ""),
          label: `#${String(r.tag ?? "")}`,
          name: String(r.tag ?? ""),
          sub: `${Number(r.total ?? 0)} grupos`,
        }));
        break;
      }
      default:
        return NextResponse.json({ ok: false, error: "Tipo desconocido." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "Error de búsqueda." }, { status: 500 });
  }
}
