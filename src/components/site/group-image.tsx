"use client";

import * as React from "react";

interface GroupImageProps {
  src?: string | null;
  alt: string;
  title?: string;
  size?: number;
  className?: string;
  fallbackEmoji?: string;
}

/**
 * Deterministic pastel gradient palette for initial-avatars.
 * (16 entries — stable across reloads because it is derived from the alt text.)
 */
const AVATAR_GRADIENTS: [string, string][] = [
  ["#34d399", "#0d9488"], // emerald → teal
  ["#f472b6", "#db2777"], // pink → rose
  ["#fbbf24", "#d97706"], // amber → orange
  ["#a78bfa", "#7c3aed"], // violet → purple
  ["#f87171", "#dc2626"], // red
  ["#4ade80", "#16a34a"], // green
  ["#fb923c", "#ea580c"], // orange
  ["#22d3ee", "#0891b2"], // cyan
  ["#facc15", "#ca8a04"], // yellow
  ["#c084fc", "#9333ea"], // purple light
  ["#2dd4bf", "#0f766e"], // teal light
  ["#fb7185", "#e11d48"], // rose
  ["#86efac", "#059669"], // emerald light
  ["#fdba74", "#c2410c"], // orange light
  ["#d8b4fe", "#8b5cf6"], // violet light
  ["#67e8f9", "#0e7490"], // cyan light
];

function pickGradient(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

/** First letters of the first two significant words (ignores short stopwords). */
const STOP = new Set(["de", "del", "la", "el", "y", "en", "los", "las", "un", "una", "con", "para"]);

function initialsOf(text: string): string {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const significant = words.filter((w) => !STOP.has(w.toLowerCase()));
  const pool = significant.length >= 1 ? significant : words;
  const a = pool[0]?.[0] ?? "G";
  const b = pool[1]?.[0] ?? "";
  return (a + b).toUpperCase() || "G";
}

/**
 * GroupImage — WhatsApp CDN image with graceful, consistent fallbacks.
 *
 * All three render paths share the exact same square wrapper
 * (fixed size, overflow-hidden, caller's className) so avatars keep a
 * consistent aspect ratio and rounding everywhere:
 *
 *   1. Real image  → proxied through /api/img (WhatsApp CDN Referer fix).
 *   2. Emoji tile  → when `fallbackEmoji` is provided (category icon).
 *   3. Initials    → deterministic gradient + initials (no external asset).
 */
export function GroupImage({
  src,
  alt,
  title,
  size = 48,
  className = "",
  fallbackEmoji,
}: GroupImageProps) {
  const [errored, setErrored] = React.useState(false);

  // Route WhatsApp CDN URLs through our proxy
  const imgSrc = React.useMemo(() => {
    if (!src || errored) return null;
    if (src.startsWith("https://pps.whatsapp.net/") || src.startsWith("https://mmg.whatsapp.net/")) {
      return `/api/img?url=${encodeURIComponent(src)}&XTransformPort=3000`;
    }
    return src;
  }, [src, errored]);

  const wrapperStyle = React.useMemo<React.CSSProperties>(
    () => ({ width: size, height: size }),
    [size]
  );

  if (!imgSrc) {
    if (fallbackEmoji) {
      // Emoji tile — same square geometry as the image path.
      return (
        <span
          role="img"
          aria-label={alt}
          className={`grid select-none place-items-center overflow-hidden bg-primary/10 ${className}`}
          style={{ ...wrapperStyle, fontSize: Math.max(14, Math.round(size * 0.5)) }}
        >
          {fallbackEmoji}
        </span>
      );
    }

    // Deterministic gradient + initials — replaces default-group.svg so every
    // avatar keeps a crisp 1:1 ratio with zero asset dependencies.
    const [from, to] = pickGradient(alt);
    return (
      <span
        role="img"
        aria-label={alt}
        className={`grid select-none place-items-center overflow-hidden font-bold text-white ${className}`}
        style={{
          ...wrapperStyle,
          fontSize: Math.max(11, Math.round(size * 0.34)),
          background: `linear-gradient(135deg, ${from}, ${to})`,
          letterSpacing: "0.02em",
          textShadow: "0 1px 2px rgba(0,0,0,0.18)",
        }}
      >
        {initialsOf(alt)}
      </span>
    );
  }

  return (
    <span
      className={`relative block shrink-0 overflow-hidden ${className}`}
      style={wrapperStyle}
    >
      <img
        src={imgSrc}
        alt={alt}
        title={title ?? alt}
        width={size * 2}
        height={size * 2}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setErrored(true)}
      />
    </span>
  );
}
