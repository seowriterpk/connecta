"use client";

import * as React from "react";

interface HighlightProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Highlights occurrences of `query` in `text` with a <mark> element.
 * Case-insensitive. Returns null-safe.
 */
export function Highlight({ text, query, className, highlightClassName }: HighlightProps) {
  if (!query || query.trim().length === 0) {
    return <span className={className}>{text}</span>;
  }

  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) && part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className={`rounded bg-primary/20 px-0.5 text-primary ${highlightClassName ?? ""}`}
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}
