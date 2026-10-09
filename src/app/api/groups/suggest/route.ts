/**
 * GET /api/groups/suggest?q=...
 *
 * Predictive-search endpoint (autocomplete): fast, tiny payload, one query.
 * Returns up to 8 group suggestions matching the typed text (name, tags,
 * description) for instant type-ahead dropdowns.
 *
 * Adult silo: default = clean only (isAdult = 0). `adult=only` returns adult
 * suggestions only — the client passes the active silo.
 */
import { NextRequest, NextResponse } from "next/server";
import { query, type Row } from "@/lib/db";
import { computeDisplayedMembers } from "@/lib/members";

export const dynamic = "force-dynamic";

interface SuggestRow extends Row {
  slug: string;
  groupName: string;
  clicks: number;
  joinCount: number;
  id: string;
  city: string | null;
  isAdult: number;
  catIcon: string | null;
  countryName: string | null;
  countryFlag: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const adultParam = req.nextUrl.searchParams.get("adult");
    // "1"/"include" → both silos; "only" → adults only; default → clean only.
    const whereAdult =
      adultParam === "1" || adultParam === "include"
        ? ""
        : `AND g.\`isAdult\` = ${adultParam === "only" ? 1 : 0}`;

    const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

    const rows = await query<SuggestRow>(
      `SELECT g.\`id\`, g.\`slug\`, g.\`groupName\`, g.\`clicks\`, g.\`joinCount\`, g.\`city\`, g.\`isAdult\`,
              c.\`icon\` AS \`catIcon\`, co.\`name\` AS \`countryName\`, co.\`flag\` AS \`countryFlag\`
       FROM \`groups\` g
       LEFT JOIN \`categories\` c ON c.\`id\` = g.\`categoryId\`
       LEFT JOIN \`countries\` co ON co.\`id\` = g.\`countryId\`
       WHERE g.\`status\` = 'live' ${whereAdult}
         AND (g.\`groupName\` LIKE ? OR g.\`tags\` LIKE ? OR g.\`description\` LIKE ?)
       ORDER BY g.\`clicks\` DESC, g.\`createdAt\` DESC
       LIMIT 8`,
      [like, like, like]
    );

    const data = rows.map((r) => ({
      slug: r.slug,
      title: r.groupName,
      members: computeDisplayedMembers(r.clicks ?? 0, r.joinCount ?? 0, r.id),
      city: r.city ?? null,
      country: r.countryName ?? null,
      flag: r.countryFlag ?? null,
      catIcon: r.catIcon ?? "💬",
      isAdult: !!r.isAdult,
    }));

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, data: [] }, { status: 500 });
  }
}
