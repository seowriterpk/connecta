/**
 * Slug Generator (SEO-Safe Spanish URL Builder)
 * Based on Groupizo manual SYSTEM 8.
 *
 * Rules:
 * 1. Lowercase
 * 2. Replace accented Spanish chars (á→a, ñ→n, etc.)
 * 3. Replace & with "and", % with "por", @ with "en"
 *    (& → "and" per production directive: "Digital Accounts Buy & Sell"
 *     must slug to "digital-accounts-buy-and-sell", never blank/404)
 * 4. Replace spaces with hyphens
 * 5. Remove everything not a-z, 0-9, or hyphen
 * 6. Collapse multiple hyphens
 * 7. Trim hyphens from start/end
 * 8. Truncate to 80 chars
 */

const ACCENT_MAP: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u",
  Á: "a", É: "e", Í: "i", Ó: "o", Ú: "u",
  ñ: "n", Ñ: "n",
  ü: "u", Ü: "u",
  ç: "c", Ç: "c",
};

export function generateSlug(text: string): string {
  if (!text) return "grupo";

  let s = text;

  // Step 2: Replace accented characters
  for (const [from, to] of Object.entries(ACCENT_MAP)) {
    s = s.split(from).join(to);
  }

  // Step 1: Lowercase
  s = s.toLowerCase();

  // Step 3: Replace special symbols with words
  // & → "and" (never "y", never dropped): keeps slug non-empty and readable
  s = s.replace(/\s*&\s*/g, " and ");
  s = s.replace(/&/g, "and");
  s = s.replace(/%/g, "por");
  s = s.replace(/@/g, "en");

  // Step 4: Replace spaces with hyphens
  s = s.replace(/\s+/g, "-");

  // Step 5: Remove everything not a-z, 0-9, or hyphen
  s = s.replace(/[^a-z0-9-]/g, "");

  // Step 6: Collapse multiple hyphens
  s = s.replace(/-+/g, "-");

  // Step 7: Trim hyphens from start/end
  s = s.replace(/^-+|-+$/g, "");

  // Step 8: Truncate to 80 chars (at a hyphen boundary)
  if (s.length > 80) {
    s = s.slice(0, 80);
    const lastHyphen = s.lastIndexOf("-");
    if (lastHyphen > 40) s = s.slice(0, lastHyphen);
  }

  return s || "grupo";
}

/**
 * Make slug unique by appending a counter or random number.
 * Checks against a set of existing slugs.
 */
export function makeUniqueSlug(
  baseSlug: string,
  existsFn: (slug: string) => boolean,
  maxAttempts = 50
): string {
  let slug = baseSlug || "grupo";
  if (!existsFn(slug)) return slug;

  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!existsFn(candidate)) return candidate;
  }

  // Fallback: timestamp (guaranteed unique)
  return `${baseSlug}-${Date.now().toString(36)}`;
}
