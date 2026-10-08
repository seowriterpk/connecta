/**
 * CountryFlag — renders a self-hosted PNG flag (public/flags/{code}.png).
 *
 * Why PNG files instead of emoji flags?
 * - Windows (Chrome/Edge/Firefox) does NOT render Unicode flag emoji:
 *   "🇦🇷" renders as the letter pair "AR" — users saw no flags at all.
 * - Self-hosted flagcdn w160 PNGs: ~4KB each, cached forever, render
 *   identically on every OS/browser, and Googlebot sees a real <img>
 *   with descriptive alt text.
 *
 * Works in both server and client components (no hooks).
 *
 * Props:
 * - code: lowercase ISO 3166-1 alpha-2 ("ar", "mx", …). Falls back to
 *   the emoji glyph when the code is missing/invalid.
 * - name: country display name — used for the alt text.
 * - className: sizing utilities (default "h-3.5 w-5" ≈ 20×14px).
 * - emoji: fallback glyph when code is unavailable.
 * - emojiClassName: sizing for the emoji fallback span.
 */

const CODE_RE = /^[a-z]{2}$/i;

export function CountryFlag({
  code,
  name,
  className = "h-3.5 w-5",
  emoji,
  emojiClassName = "text-base leading-none",
}: {
  code?: string | null;
  name?: string | null;
  className?: string;
  emoji?: string | null;
  emojiClassName?: string;
}) {
  const clean = (code ?? "").trim().toLowerCase();
  if (clean && CODE_RE.test(clean)) {
    return (
      <img
        src={`/flags/${clean}.png`}
        alt={name ? `Bandera de ${name}` : ""}
        width={20}
        height={14}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`inline-block shrink-0 select-none rounded-[2px] object-cover shadow-[0_0_1px_rgba(0,0,0,0.25)] ${className}`}
      />
    );
  }
  if (emoji) {
    return (
      <span aria-hidden className={`inline-block shrink-0 leading-none ${emojiClassName}`}>
        {emoji}
      </span>
    );
  }
  return null;
}
