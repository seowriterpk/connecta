/**
 * WhatsApp Link Validator (Invite Meta Fetcher)
 * Based on Groupizo VIP Logic SYSTEM 1.
 *
 * - Fake being a mobile phone (iPhone User-Agent)
 * - Route through the residential proxy FIRST (WhatsApp blocks datacenter IPs);
 *   direct fetch as fallback; never mark revoked on network error (fail-safe)
 * - Only download first 64KB (keeps every og: meta tag intact)
 * - 3-state result: active | revoked | unknown
 */

import { proxiedFetch } from "@/lib/proxy-fetch";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) " +
  "Version/17.5 Mobile/15E148 Safari/604.1";

export interface WhatsAppMeta {
  status: "active" | "revoked" | "unknown";
  groupName: string;
  imageUrl: string;
  inviteCode: string;
  description: string;
}

export function extractInviteCode(url: string): string | null {
  const match = url.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export function isValidWhatsAppInvite(url: string): boolean {
  return /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\/[A-Za-z0-9_-]+/i.test(url.trim());
}

/**
 * Fetches WhatsApp invite meta.
 * Attempt 1: through the residential proxy (PROXY_URL in .env.local) — WhatsApp
 *            blocks datacenter IPs, so the proxy is the reliable path.
 * Attempt 2: direct fetch (resilience if the proxy hiccups but the network allows).
 * Any fetch body → parse og: tags. No body at all → "unknown" (fail-safe).
 */
export async function fetchWhatsAppMeta(inviteUrl: string): Promise<WhatsAppMeta> {
  const code = extractInviteCode(inviteUrl);
  if (!code) {
    return {
      status: "revoked",
      groupName: "",
      imageUrl: "",
      inviteCode: "",
      description: "",
    };
  }

  const url = inviteUrl.startsWith("http") ? inviteUrl : `https://chat.whatsapp.com/${code}`;

  const headers: Record<string, string> = {
    "User-Agent": IPHONE_UA,
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "es-MX,es;q=0.9",
    "Accept-Encoding": "gzip, deflate",
  };

  // WhatsApp og:title can appear deep in the <head> after large inline
  // scripts. 8KB occasionally CUT AN HTML ENTITY IN HALF
  // ("&#x1d431;" → "&#x1"), producing broken group names like
  // "&#x1d431; &#x30fb; &#x1d400;… &#x1". 64KB keeps every meta tag intact.
  const HTML_PREVIEW_BYTES = 65536;

  // Attempt 1: through the residential proxy (PROXY_URL env var). WhatsApp
  // blocks datacenter IPs — the proxy is the primary, reliable route. 6s budget.
  let html = "";
  if (process.env.PROXY_URL) {
    try {
      const res = await proxiedFetch(url, {
        headers,
        redirect: "follow",
        timeoutMs: 6000,
      });
      if (res.ok) {
        const text = await res.text();
        html = text.slice(0, HTML_PREVIEW_BYTES);
      }
    } catch {
      // proxy failed — fall through to direct attempt
    }
  }

  // Attempt 2: direct fetch (resilience when the proxy hiccups).
  if (!html) {
    try {
      const res = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const text = await res.text();
        html = text.slice(0, HTML_PREVIEW_BYTES);
      }
    } catch {
      // direct failed too — html stays empty → "unknown" (fail-safe)
    }
  }

  // Parse HTML
  if (!html) {
    // Network error — UNKNOWN (do NOT mark revoked)
    return {
      status: "unknown",
      groupName: "",
      imageUrl: "",
      inviteCode: code,
      description: "",
    };
  }

  const ogTitle = extractMetaTag(html, "og:title");
  const ogImage = extractMetaTag(html, "og:image");
  const ogDesc = extractMetaTag(html, "og:description");

  // Decode HTML entities in title.
  //
  // WhatsApp encodes styled/gaming names (mathematical Unicode fonts such as
  // "𝐱・𝐀𝐃𝐈𝐋 𝐏𝐔𝐁𝐆 𝐒𝐡𝐨𝐩 •➊") as NUMERIC entities: &#x1d431; &#x30fb; &#x1d400; …
  // The old decoder only handled named entities (&amp; &lt; …), so those names
  // surfaced in the UI as literal "&#x1d431;" text. This decoder handles:
  //   - hex numeric:  &#x1D431;  / &#X1D431;
  //   - dec numeric:  &#119825;
  //   - named:        &amp; &lt; &gt; &quot; &#39; &apos; &nbsp;
  const decodeEntities = (s: string): string =>
    s
      .replace(/&#x([0-9a-f]+);?/gi, (m, hex: string) => safeFromCodePoint(parseInt(hex, 16), m))
      .replace(/&#(\d+);?/g, (m, dec: string) => safeFromCodePoint(parseInt(dec, 10), m))
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/gi, "'")
      // Strip zero-width / directional characters WhatsApp mixes in, plus any
      // C0 control characters (a half-cut entity like "&#x1" would otherwise
      // decode to \u0001 and end up inside the group name).
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\ufeff\u00ad]/g, "")
      .trim();

  // Convert a code point to a string, defensively: invalid code points
  // (surrogates, > 0x10FFFF) would throw from String.fromCodePoint and kill
  // the whole fetch — on failure we drop the entity instead of crashing.
  function safeFromCodePoint(cp: number, original: string): string {
    if (!Number.isFinite(cp) || cp < 0 || cp > 0x10ffff) return "";
    // Skip surrogate halves — they are not valid standalone characters.
    if (cp >= 0xd800 && cp <= 0xdfff) return "";
    try {
      return String.fromCodePoint(cp);
    } catch {
      return "";
    }
  }

  // Determine status
  if (ogTitle && ogTitle !== "WhatsApp Group Invite" && ogTitle.trim() !== "") {
    return {
      status: "active",
      groupName: decodeEntities(ogTitle),
      imageUrl: ogImage ? decodeEntities(ogImage) : "",
      inviteCode: code,
      description: ogDesc ? decodeEntities(ogDesc) : "",
    };
  }

  // og:title is missing or generic → revoked
  return {
    status: "revoked",
    groupName: "",
    imageUrl: "",
    inviteCode: code,
    description: "",
  };
}

function extractMetaTag(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const match = html.match(regex);
  if (match) return match[1];
  // Try reversed order (content before property)
  const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, "i");
  const match2 = html.match(regex2);
  return match2 ? match2[1] : null;
}
