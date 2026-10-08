import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-guard";
import { query, queryOne, type Row } from "@/lib/db";
import { SITE } from "@/lib/constants";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const OUTPUT_DIR = path.join(process.cwd(), "public", "data");

export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const target = body.target || "all"; // all | categories | countries | groups | tags | cities | homepage

    // Ensure output dir exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const results: string[] = [];

    if (target === "all" || target === "categories") {
      const categories = await query<Row>(
        `SELECT c.\`id\`, c.\`name\`, c.\`slug\`, c.\`icon\`, c.\`color\`, c.\`description\`, c.\`isAdult\`,
                (SELECT COUNT(*) FROM \`groups\` g
                  WHERE g.\`categoryId\` = c.\`id\` AND g.\`status\` = ? AND g.\`isAdult\` = 0) AS \`groupCount\`
         FROM \`categories\` c
         WHERE c.\`isActive\` = 1
         ORDER BY c.\`sortOrder\` ASC`,
        ["live"]
      );
      const data = categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        color: c.color,
        description: c.description,
        isAdult: !!c.isAdult,
        groupCount: Number(c.groupCount ?? 0),
      }));
      fs.writeFileSync(path.join(OUTPUT_DIR, "categories.json"), JSON.stringify(data));
      results.push(`categories.json (${data.length} items)`);
    }

    if (target === "all" || target === "countries") {
      const countries = await query<Row>(
        `SELECT co.\`id\`, co.\`name\`, co.\`nameEs\`, co.\`slug\`, co.\`code\`, co.\`flag\`, co.\`region\`, co.\`dialCode\`,
                (SELECT COUNT(*) FROM \`groups\` g
                  WHERE g.\`countryId\` = co.\`id\` AND g.\`status\` = ? AND g.\`isAdult\` = 0) AS \`groupCount\`
         FROM \`countries\` co
         WHERE co.\`isActive\` = 1
         ORDER BY co.\`name\` ASC`,
        ["live"]
      );
      const data = countries.map((c: any) => ({
        id: c.id,
        name: c.name,
        nameEs: c.nameEs,
        slug: c.slug,
        code: c.code,
        flag: c.flag,
        region: c.region,
        dialCode: c.dialCode,
        groupCount: Number(c.groupCount ?? 0),
      }));
      fs.writeFileSync(path.join(OUTPUT_DIR, "countries.json"), JSON.stringify(data));
      results.push(`countries.json (${data.length} items)`);
    }

    if (target === "all" || target === "groups") {
      const groups = await query<Row>(
        `SELECT \`id\`, \`groupName\`, \`slug\`, \`description\`, \`joinLink\`, \`profileImage\`,
                \`category\`, \`country\`, \`city\`, \`tags\`, \`keywords\`, \`language\`,
                \`clicks\`, \`joinCount\`, \`views\`, \`shares\`, \`avgRating\`, \`ratingCount\`,
                \`createdAt\`, \`lastActiveAt\`
         FROM \`groups\`
         WHERE \`status\` = ? AND \`isAdult\` = 0
         ORDER BY \`createdAt\` DESC
         LIMIT 500`,
        ["live"]
      );
      const data = groups.map((g: any) => ({
        ...g,
        tags: JSON.parse(g.tags || "[]"),
        keywords: JSON.parse(g.keywords || "[]"),
        createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : String(g.createdAt),
        lastActiveAt: g.lastActiveAt instanceof Date ? g.lastActiveAt.toISOString() : null,
      }));
      fs.writeFileSync(path.join(OUTPUT_DIR, "groups.json"), JSON.stringify(data));
      results.push(`groups.json (${data.length} items)`);
    }

    if (target === "all" || target === "tags") {
      const groups = await query<Row & { tags: string }>(
        "SELECT `tags` FROM `groups` WHERE `status` = ? AND `isAdult` = 0",
        ["live"]
      );
      const tagCounts = new Map<string, number>();
      for (const g of groups) {
        try {
          const tags = JSON.parse(g.tags || "[]");
          for (const t of tags) {
            tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
          }
        } catch {}
      }
      const data = [...tagCounts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
      fs.writeFileSync(path.join(OUTPUT_DIR, "tags.json"), JSON.stringify(data));
      results.push(`tags.json (${data.length} items)`);
    }

    if (target === "all" || target === "cities") {
      const groups = await query<Row & { city: string | null; country: string }>(
        "SELECT `city`, `country` FROM `groups` WHERE `status` = ? AND `isAdult` = 0 AND `city` IS NOT NULL",
        ["live"]
      );
      const cityMap = new Map<string, { city: string; count: number; country: string }>();
      for (const g of groups) {
        if (!g.city) continue;
        const existing = cityMap.get(g.city);
        if (existing) existing.count++;
        else cityMap.set(g.city, { city: g.city, count: 1, country: g.country });
      }
      const data = [...cityMap.values()].sort((a, b) => b.count - a.count);
      fs.writeFileSync(path.join(OUTPUT_DIR, "cities.json"), JSON.stringify(data));
      results.push(`cities.json (${data.length} items)`);
    }

    if (target === "all" || target === "homepage") {
      const [liveGroupsRow, categoriesRow, countriesRow, totalClicksRow] = await Promise.all([
        queryOne<Row & { cnt: number }>(
          "SELECT COUNT(*) AS `cnt` FROM `groups` WHERE `status` = ? AND `isAdult` = 0",
          ["live"]
        ),
        queryOne<Row & { cnt: number }>(
          "SELECT COUNT(*) AS `cnt` FROM `categories` WHERE `isActive` = 1"
        ),
        queryOne<Row & { cnt: number }>(
          "SELECT COUNT(*) AS `cnt` FROM `countries` WHERE `isActive` = 1"
        ),
        queryOne<Row & { total: number }>(
          "SELECT COALESCE(SUM(`clicks`), 0) AS `total` FROM `groups` WHERE `status` = ?",
          ["live"]
        ),
      ]);
      const data = {
        siteName: SITE.name,
        totalGroups: Number(liveGroupsRow?.cnt ?? 0),
        totalCategories: Number(categoriesRow?.cnt ?? 0),
        totalCountries: Number(countriesRow?.cnt ?? 0),
        totalClicks: Number(totalClicksRow?.total ?? 0),
        generatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(OUTPUT_DIR, "homepage.json"), JSON.stringify(data));
      results.push(`homepage.json`);
    }

    return NextResponse.json({
      ok: true,
      message: `JSON files generated: ${results.join(", ")}`,
      files: results,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Error generating JSON: ${e.message}` },
      { status: 500 }
    );
  }
}
