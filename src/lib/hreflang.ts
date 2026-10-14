import { SITE } from "@/lib/constants";

/**
 * hreflang alternates for indexable pages.
 *
 * Single-locale site (Spanish) with self-referencing `es` + `x-default`
 * signals — cheap clarity for Google's international targeting, and it
 * prevents stray "no hreflang" warnings in audits.
 *
 * Usage: `alternates: hreflangAlternates("/guias")`
 */
export function hreflangAlternates(path: string): {
  canonical: string;
  languages: { es: string; "x-default": string };
} {
  const url = `${SITE.url}${path}`;
  return {
    canonical: url,
    languages: {
      es: url,
      "x-default": url,
    },
  };
}
