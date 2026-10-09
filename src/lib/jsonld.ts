/**
 * JSON-LD script injector (XSS-hardened).
 *
 * Serializes a structured-data object for embedding inside
 * `<script type="application/ld+json">`. Escapes characters that can
 * terminate a script tag (`</script>` in DB-derived group titles,
 * blog excerpts, etc.) plus JS line terminators — the standard
 * safe-embedding recipe (same approach React uses for inline scripts).
 */
export function jsonLdScript(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
