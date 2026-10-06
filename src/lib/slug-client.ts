/**
 * Browser-safe replica of the slug generator.
 * Mirrors src/lib/slug.ts (server-side) without importing node-only modules.
 * Used by client-side admin edit form for the "Auto slug" button.
 */

const ACCENT_MAP: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u",
  Á: "a", É: "e", Í: "i", Ó: "o", Ú: "u",
  ñ: "n", Ñ: "n",
  ü: "u", Ü: "u",
  ç: "c", Ç: "c",
};

export function generateSlugClient(text: string): string {
  if (!text) return "grupo";
  let s = text;
  for (const [from, to] of Object.entries(ACCENT_MAP)) {
    s = s.split(from).join(to);
  }
  s = s.toLowerCase();
  // & → "and" — mirrors server slug.ts (directive: "&" names must slug with "and")
  s = s.replace(/\s*&\s*/g, " and ");
  s = s.replace(/&/g, "and");
  s = s.replace(/%/g, "por");
  s = s.replace(/@/g, "en");
  s = s.replace(/\s+/g, "-");
  s = s.replace(/[^a-z0-9-]/g, "");
  s = s.replace(/-+/g, "-");
  s = s.replace(/^-+|-+$/g, "");
  if (s.length > 80) {
    s = s.slice(0, 80);
    const lastHyphen = s.lastIndexOf("-");
    if (lastHyphen > 40) s = s.slice(0, lastHyphen);
  }
  return s || "grupo";
}
