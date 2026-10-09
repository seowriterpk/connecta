/**
 * Taxonomy intro engine — category / country / city pages.
 *
 * Provides, per entity:
 * 1. Stored overrides (entity_intros table): customTitle / customHeroDesc /
 *    customIntro — the long bottom description the content team edits in bulk
 *    (JSON export → write → JSON import from the admin SEO page).
 * 2. Dynamic fallback derived from the OLDEST live groups of the entity:
 *    one keyword per group (production directive: "use oldest groups, one
 *    keyword per group, to create the dynamic meta description and top intro").
 *
 * All lookups are cheap single queries; callers run them inside their
 * existing Promise.all waterfalls so no extra latency is added.
 */

import { cache } from "react";
import { query, queryOne, type Row } from "@/lib/db";

export type TaxonomyType = "category" | "country" | "city";

export interface TaxonomyContent {
  /** Stored custom values (null when not set). */
  customTitle: string | null;
  customHeroDesc: string | null;
  customIntro: string | null;
  /** Keyword-derived sentence from the oldest groups ("" when no keywords). */
  keywordSentence: string;
  /** Keywords used (one per oldest group, deduped, max 6). */
  keywords: string[];
}

type GRow = Row & Record<string, any>;

function parseKeywords(raw: unknown): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.map(String).filter((s) => s.trim().length > 0);
  } catch {
    return [];
  }
}

/**
 * One keyword per group, taken from the OLDEST live clean groups of the
 * entity — stable, diverse, and updates itself as groups are added.
 */
export async function getOldestGroupKeywords(
  type: TaxonomyType,
  entityName: string,
  max = 6
): Promise<string[]> {
  if (!entityName) return [];
  try {
    const where =
      type === "category"
        ? "c.`name` = ?"
        : type === "country"
        ? "co.`name` = ?"
        : "g.`city` = ?";
    const rows = await query<GRow>(
      `SELECT g.\`keywords\`
       FROM \`groups\` g
       LEFT JOIN \`categories\` c ON c.\`id\` = g.\`categoryId\`
       LEFT JOIN \`countries\` co ON co.\`id\` = g.\`countryId\`
       WHERE g.\`status\` = 'live' AND g.\`isAdult\` = 0 AND ${where}
       ORDER BY g.\`createdAt\` ASC
       LIMIT ?`,
      [entityName, Math.max(max * 3, 12)]
    );
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of rows) {
      // one keyword per group: take its FIRST keyword only
      const kws = parseKeywords(r.keywords);
      const kw = kws[0]?.trim().toLowerCase();
      if (kw && !seen.has(kw)) {
        seen.add(kw);
        out.push(kw);
        if (out.length >= max) break;
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Full content resolution for a taxonomy entity:
 * custom overrides + keyword-derived fallback pieces.
 * React-cache()d — generateMetadata and the page body share one lookup per
 * request (no duplicate queries).
 */
export const getTaxonomyContent = cache(
  async function getTaxonomyContent(
    type: TaxonomyType,
    entityName: string
  ): Promise<TaxonomyContent> {
  const [introRow, keywords] = await Promise.all([
    queryOne<Row>(
      "SELECT `customTitle`, `customHeroDesc`, `customIntro` FROM `entity_intros` WHERE `entityType` = ? AND `entityName` = ? LIMIT 1",
      [type, entityName]
    ),
    getOldestGroupKeywords(type, entityName, 6),
  ]);

  const customTitle = (introRow?.customTitle as string | null)?.trim() || null;
  const customHeroDesc = (introRow?.customHeroDesc as string | null)?.trim() || null;
  const customIntro = (introRow?.customIntro as string | null)?.trim() || null;

  const keywordSentence =
    keywords.length > 0
      ? keywords.map((k) => k.toLowerCase()).join(", ")
      : "";

  return { customTitle, customHeroDesc, customIntro, keywordSentence, keywords };
  }
);

/**
 * Meta description for a taxonomy entity (~155 chars):
 * custom hero description wins; otherwise keyword-derived dynamic text.
 */
export function buildTaxonomyMetaDescription(
  type: TaxonomyType,
  entityName: string,
  content: TaxonomyContent,
  groupCount: number
): string {
  if (content.customHeroDesc) {
    return content.customHeroDesc.slice(0, 158);
  }
  const label =
    type === "category" ? "categoría" : type === "country" ? "país" : "ciudad";
  const base =
    `Los mejores grupos de WhatsApp de ${entityName}: ${groupCount} ` +
    `${groupCount === 1 ? "comunidad activa" : "comunidades activas"}`;
  if (content.keywords.length > 0) {
    const kw = content.keywords.slice(0, 5).join(", ");
    return `${base}. Temas: ${kw}. Enlaces revisados, gratis y en español.`.slice(0, 158);
  }
  return `${base} en la ${label} de ConectaGrupos. Enlaces revisados, gratis y en español.`.slice(
    0,
    158
  );
}

/**
 * Top intro sentence shown under the entity H1:
 * custom hero wins; otherwise the keyword-derived sentence.
 */
export function buildTaxonomyTopIntro(content: TaxonomyContent): string | null {
  if (content.customHeroDesc) return content.customHeroDesc.slice(0, 300);
  if (content.keywordSentence) {
    return `Comunidades activas sobre ${content.keywordSentence} y más.`;
  }
  return null;
}
