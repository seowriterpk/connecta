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
 *
 * IP ROTATION (Task 33 — false-revoke incident, owner 2026-10-29): the cached
 * undici ProxyAgent keep-alives its CONNECT tunnels, so many requests exit
 * through the SAME residential IP until WhatsApp rate-limits it (403/429) and
 * everything sharing that IP fails together — the cause of the 80% false
 * "revoked" wave. `freshConnection: true` builds a one-shot ProxyAgent per
 * request (connections:1, keep-alive off) and closes it right after: with a
 * rotating gateway (gw.dataimpulse.com) every request then gets its OWN exit
 * IP. Use it for ALL WhatsApp traffic (meta fetches + image downloads).
 */

const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";

// Cached { fetch, agent } pair from the npm undici package (Node runtime).
let undiciPair:
  | { fetch: typeof fetch; agent: unknown }
  | null
  | undefined = undefined; // undefined = not built yet, null = unavailable

let undiciMod: Promise<{ fetch: typeof fetch; ProxyAgent: new (uri: unknown) => { close: () => Promise<void> } } | null> | null =
  null;

async function getUndici(): Promise<Awaited<typeof undiciMod>> {
  if (undiciMod) return undiciMod;
  undiciMod = import("undici")
    .then((mod) => mod as unknown as Awaited<typeof undiciMod>)
    .catch(() => null);
  return undiciMod;
}

async function getUndiciPair(): Promise<{ fetch: typeof fetch; agent: unknown } | null> {
  if (!process.env.PROXY_URL || isBun) return null;
  if (undiciPair !== undefined) return undiciPair;
  try {
    // Dynamic import: keeps undici out of the client bundle and out of
    // environments where it isn't installed. (Double assertion: the npm
    // undici module shape intentionally differs from the DOM lib types.)
    const mod = await getUndici();
    if (!mod) {
      undiciPair = null;
      return undiciPair;
    }
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
  /**
   * True → dial a brand-new proxy connection for THIS request (rotating
   * gateway = new exit IP) and tear it down afterwards. Default false keeps
   * the shared keep-alive agent (fine for non-WhatsApp traffic).
   */
  freshConnection?: boolean;
}

/**
 * One-shot proxied fetch: fresh ProxyAgent → guaranteed new exit IP on a
 * rotating gateway → closed immediately after. Never throws proxy-specific
 * errors (surfaces as normal fetch rejections).
 */
async function freshProxiedFetch(
  url: string,
  fetchInit: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const signal = fetchInit.signal ?? AbortSignal.timeout(timeoutMs);
  if (isBun) {
    // Bun's fetch dials per-request (no shared proxy pool) — new IP anyway.
    return fetch(url, {
      ...fetchInit,
      signal,
      // @ts-expect-error — `proxy` is Bun-specific, not in standard types
      proxy: process.env.PROXY_URL,
    });
  }
  const mod = await getUndici();
  if (!mod) return fetch(url, { ...fetchInit, signal }); // no undici → direct
  const agent = new mod.ProxyAgent({
    uri: process.env.PROXY_URL,
    connections: 1,
    pipelining: 1,
    // Reap the tunnel immediately after the response — no keep-alive reuse.
    keepAliveTimeout: 1,
    keepAliveMaxTimeout: 1,
  });
  try {
    return (await mod.fetch(url, {
      ...fetchInit,
      signal,
      // @ts-expect-error — `dispatcher` is undici-specific, not in standard types
      dispatcher: agent,
    })) as unknown as Response;
  } finally {
    // Drop the tunnel as soon as the body-stream is handed back; the socket
    // is not reused for anything else either way (connections: 1, no pool).
    void Promise.resolve(agent.close()).catch(() => {});
  }
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
  const { timeoutMs = 8000, freshConnection, ...fetchInit } = init;

  if (!process.env.PROXY_URL) {
    // No proxy configured (or undici unavailable) — direct.
    const signal = fetchInit.signal ?? AbortSignal.timeout(timeoutMs);
    return fetch(url, { ...fetchInit, signal });
  }

  if (freshConnection) {
    return freshProxiedFetch(url, fetchInit, timeoutMs);
  }

  if (isBun) {
    const signal = fetchInit.signal ?? AbortSignal.timeout(timeoutMs);
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
    const signal = fetchInit.signal ?? AbortSignal.timeout(timeoutMs);
    return pair.fetch(url, {
      ...fetchInit,
      signal,
      // @ts-expect-error — `dispatcher` is undici-specific, not in standard types
      dispatcher: pair.agent,
    }) as unknown as Response;
  }

  const signal = fetchInit.signal ?? AbortSignal.timeout(timeoutMs);
  return fetch(url, { ...fetchInit, signal });
}

/** True for WhatsApp rate-limit / block responses → caller rotates IP + retries. */
export function isRateLimitedStatus(status: number): boolean {
  return status === 403 || status === 429 || (status >= 500 && status < 600);
}
