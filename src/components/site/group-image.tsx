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
 * GroupImage — WhatsApp CDN image with graceful fallback.
 *
 * WhatsApp CDN images return 403 without the correct Referer header.
 * We route WhatsApp CDN URLs through /api/img proxy to fix this.
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

  if (!imgSrc) {
    return fallbackEmoji ? (
      <div
        className={`grid place-items-center bg-primary/10 text-xl ${className}`}
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        {fallbackEmoji}
      </div>
    ) : (
      <img
        src="/uploads/group_images/default-group.svg"
        alt={alt}
        title={title ?? alt}
        className={`h-full w-full object-cover ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt={alt}
        title={title ?? alt}
        width={120}
        height={120}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
