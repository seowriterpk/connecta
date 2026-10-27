/**
 * Adult-route detection for shared server components.
 *
 * Owner directive (2026-10-21): adult categories and adult group pages must
 * ship ZERO structured data — the per-page ItemList/Breadcrumb/@graph blocks
 * were already gated in the pages themselves; this helper lets the ROOT
 * LAYOUT suppress the site-wide WebSite/Organization JSON-LD on those same
 * routes (the last schema source that reached them).
 *
 * Only /categoria/{slug} and /grupo/{slug} can be adult (the middleware
 * matcher annotates exactly those), so any other pathname is clean by
 * default. The lookups are single-column, single-index micro-queries.
 */
import { queryOne } from "@/lib/db";

export async function isAdultContentRoute(pathname: string): Promise<boolean> {
  const match = /^\/(categoria|grupo)\/([^/?#]+)/.exec(pathname ?? "");
  if (!match) return false;

  let slug = match[2];
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // malformed %-sequence → fall through with the raw slug (harmless lookup)
  }

  if (match[1] === "categoria") {
    const cat = await queryOne<{ isAdult: number | null }>(
      "SELECT `isAdult` FROM `categories` WHERE `slug` = ? LIMIT 1",
      [slug]
    );
    return !!cat?.isAdult;
  }

  const group = await queryOne<{ isAdult: number | null }>(
    "SELECT `isAdult` FROM `groups` WHERE `slug` = ? LIMIT 1",
    [slug]
  );
  return !!group?.isAdult;
}
