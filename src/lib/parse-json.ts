/**
 * Safe JSON-array parsing for DB columns that SHOULD hold a JSON array
 * (groups.tags, groups.keywords, …) but may hold legacy plain strings.
 *
 * Why: some rows were imported with a bare tag string ("memes") instead of a
 * JSON array ('["memes"]'). `JSON.parse` throws on those and used to crash
 * the whole GROUP PAGE (related-groups toDTO) — one bad row took down a
 * public, indexed URL. This helper never throws:
 *
 *   - null / undefined / ""          → []
 *   - valid JSON array               → stringified items
 *   - valid JSON but not an array    → []
 *   - plain string ("memes")         → ["memes"]  (honest single-tag fallback)
 *   - anything unparseable           → []
 */

export function parseJsonArray(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === "string" ? item : String(item)))
        .filter((item) => item.length > 0);
    }
    if (typeof parsed === "string" && parsed.length > 0) {
      return [parsed];
    }
    return [];
  } catch {
    // Not JSON at all — a bare legacy string like `memes` = one tag.
    if (/^[\w\sáéíóúüñÁÉÍÓÚÜÑ.,-]+$/u.test(raw)) return [raw];
    return [];
  }
}
