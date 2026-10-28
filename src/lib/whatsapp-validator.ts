/**
 * WhatsApp Link Validator (Invite Meta Fetcher)
 * Based on Groupizo VIP Logic SYSTEM 1.
 *
 * - Fake being a mobile phone (iPhone User-Agent)
 * - Route through the residential proxy with IP ROTATION: up to 3 attempts,
 *   each on a FRESH proxy connection (new exit IP), retrying on 403/429
 *   (WhatsApp rate-limit) and network errors with backoff + jitter
 * - CLASSIFICATION RULE (Task 33 — false-revoke incident, owner 2026-10-29):
 *     · "revoked" may ONLY be concluded from HTML fetched through the proxy
 *       (residential IPs get the real invite page).
 *     · A direct datacenter fetch can only CONFIRM "active" — when WhatsApp
 *       blocks the datacenter IP it serves a 200 block/captcha page with NO
 *       og:title, which is byte-identical to a revoked page. The old code
 *       classified those as "revoked" → ~80% of groups falsely marked
 *       revoked/omitted during proxy overload.
 * - Only download first 64KB (keeps every og: meta tag intact)
 * - 3-state result: active | revoked | unknown
 */

import { proxiedFetch, isRateLimitedStatus } from "@/lib/proxy-fetch";

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
  /** Where the classified HTML came from: proxy (trustworthy) or direct (can
   *  only prove active). "none" → network failed everywhere → unknown. */
  source?: "proxy" | "direct" | "none";
}

export function extractInviteCode(url: string): string | null {
  const match = url.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export function isValidWhatsAppInvite(url: string): boolean {
  return /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\/[A-Za-z0-9_-]+/i.test(url.trim());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms: number) => ms + Math.floor(Math.random() * Math.round(ms * 0.5));

/**
 * Fetches WhatsApp invite meta.
 *
 * Attempts 1-3: through the residential proxy (PROXY_URL), EVERY attempt on a
 *              fresh connection = a NEW exit IP from the rotating gateway.
 *              On 403/429 (rate-limited IP) → rotate fast and retry;
 *              on timeouts/network errors → backoff + jitter and retry.
 * Last resort: ONE direct fetch — can only confirm "active" (og:title
 *              present). A direct page WITHOUT og:title is classified
 *              "unknown", NEVER "revoked" (datacenter block pages look
 *              exactly like revoked pages).
 * Any fetch body → parse og: tags. No trustworthy body → "unknown" (fail-safe).
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
      source: "none",
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
  const PROXY_ATTEMPTS = 3;
  const PROXY_TIMEOUT_MS = 7000;

  // --- Attempts through the residential proxy, rotating the exit IP ---------
  let html = "";
  let source: WhatsAppMeta["source"] = "none";
  if (process.env.PROXY_URL) {
    for (let attempt = 1; attempt <= PROXY_ATTEMPTS; attempt++) {
      try {
        const res = await proxiedFetch(url, {
          headers,
          redirect: "follow",
          timeoutMs: PROXY_TIMEOUT_MS,
          // Fresh CONNECT tunnel → new rotating-gateway exit IP per attempt.
          freshConnection: true,
        });
        if (res.ok) {
          const text = await res.text();
          html = text.slice(0, HTML_PREVIEW_BYTES);
          source = "proxy";
          break;
        }
        // 403/429/5xx = the exit IP is rate-limited/burned — rotate fast.
        // Any other status also rotates, with a longer backoff.
        const wait = isRateLimitedStatus(res.status) ? jitter(400) : jitter(900 * attempt);
        // Drain the failed response body so the one-shot agent can close.
        try {
          await res.arrayBuffer();
        } catch {
          /* ignore */
        }
        await sleep(wait);
      } catch {
        // Network/timeout error — different IP next attempt, backoff first.
        if (attempt < PROXY_ATTEMPTS) await sleep(jitter(900 * attempt));
      }
    }
  }

  // --- Last resort: direct fetch (resilience / no-proxy environments) -------
  if (!html) {
    try {
      const res = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const text = await res.text();
        html = text.slice(0, HTML_PREVIEW_BYTES);
        source = "direct";
      } else {
        try {
          await res.arrayBuffer();
        } catch {
          /* ignore */
        }
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
      source: "none",
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
      .replace(/&quot;/g, '"')
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
      source,
    };
  }

  // og:title is missing or generic. From the PROXY (a real residential view
  // of the page) this genuinely means revoked. From a DIRECT datacenter fetch
  // it more likely means WhatsApp served a block/captcha page → unknown.
  if (source === "direct") {
    return {
      status: "unknown",
      groupName: "",
      imageUrl: "",
      inviteCode: code,
      description: "",
      source,
    };
  }

  return {
    status: "revoked",
    groupName: "",
    imageUrl: "",
    inviteCode: code,
    description: "",
    source,
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
