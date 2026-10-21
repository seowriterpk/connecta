/**
 * proxiedFetch — outbound fetch through the DataImpulse residential proxy.
 *
 * Why: WhatsApp (chat.whatsapp.com + pps.whatsapp.net CDN) blocks requests
 * from datacenter IPs (this sandbox, Hostinger shared hosting). All WhatsApp
 * link-validation and group-image traffic must exit via the residential proxy
 * configured in the PROXY_URL environment variable (.env / .env.local /
 * hPanel env vars — every .env* file is git-ignored since Task 21).
 *
 * Runtime awareness:
 *  - Bun (local dev)      → native `proxy` option on the global fetch()
 *  - Node 18+ (Hostinger) → npm undici package's OWN fetch + ProxyAgent
 *                           (version-matched pair — Node's built-in global
 *                           fetch is an INTERNAL undici that rejects
 *                           dispatchers from the npm package).
 *  - No PROXY_URL set     → plain direct global fetch (proxy optional)
 *
 * Fail-open by design: if the proxy errors, callers fall back to a direct
 * attempt (see whatsapp-validator / image-downloader).
 */

const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";

// Cached { fetch, agent } pair from the npm undici package (Node runtime).
let undiciPair:
  | { fetch: typeof fetch; agent: unknown }
  | null
  | undefined = undefined; // undefined = not built yet, null = unavailable

async function getUndiciPair(): Promise<{ fetch: typeof fetch; agent: unknown } | null> {
  if (!process.env.PROXY_URL || isBun) return null;
  if (undiciPair !== undefined) return undiciPair;
  try {
    // Dynamic import: keeps undici out of the client bundle and out of
    // environments where it isn't installed. (Double assertion: the npm
    // undici module shape intentionally differs from the DOM lib types.)
    const mod = (await import("undici")) as unknown as {
      fetch: typeof fetch;
      ProxyAgent: new (uri: string) => unknown;
    };
    undiciPair = {
      fetch: mod.fetch,
      agent: new mod.ProxyAgent(process.env.PROXY_URL),
    };
  } catch {
    // undici unavailable — proxy disabled, direct fetch will be attempted.
    undiciPair = null;
  }
  return undiciPair;
}

export interface ProxyFetchInit extends RequestInit {
  /** Total time budget for the request (default 8s). */
  timeoutMs?: number;
}

/**
 * fetch() through the residential proxy when PROXY_URL is set,
 * otherwise a plain fetch. Never throws proxy-specific errors:
 * network failures surface as normal fetch rejections that callers
 * already handle (fail-safe "unknown" / fallback paths).
 */
export async function proxiedFetch(
  url: string,
  init: ProxyFetchInit = {}
): Promise<Response> {
  const { timeoutMs = 8000, ...fetchInit } = init;
  const signal = fetchInit.signal ?? AbortSignal.timeout(timeoutMs);

  if (isBun && process.env.PROXY_URL) {
    // Bun's global fetch supports a native `proxy` option.
    return fetch(url, {
      ...fetchInit,
      signal,
      // @ts-expect-error — `proxy` is Bun-specific, not in standard types
      proxy: process.env.PROXY_URL,
    });
  }

  const pair = await getUndiciPair();
  if (pair) {
    // Node runtime: npm undici's own fetch + its version-matched ProxyAgent.
    return pair.fetch(url, {
      ...fetchInit,
      signal,
      // @ts-expect-error — `dispatcher` is undici-specific, not in standard types
      dispatcher: pair.agent,
    }) as unknown as Response;
  }

  // No proxy configured (or undici unavailable) — direct.
  return fetch(url, { ...fetchInit, signal });
}
