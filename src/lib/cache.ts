/**
 * Grupos Hoy — in-process TTL micro-cache.
 * -----------------------------------------------------------------------------
 * Built for a cheap low-end production server with real traffic:
 *
 *  - All DB-backed pages are `force-dynamic` on purpose (the Hostinger build
 *    container has NO database access, so nothing can be prerendered at
 *    build time). That means every page view used to hit MySQL directly.
 *    This module keeps the pages dynamic but caches the READ layer in the
 *    Node process for a short TTL — the hot queries (home directory, header
 *    taxonomies, stats, tag chips, paginated listings) run once per TTL
 *    window instead of once per visitor.
 *
 *  - Single-flight stampede protection: when a hot key expires, a burst of
 *    N concurrent requests produces exactly ONE database load (they share the
 *    same in-flight promise). Without this, every TTL expiry would send a
 *    synchronized query spike — the opposite of what a low-CPU server wants.
 *
 *  - Epoch-guarded invalidation: `clearDataCache()` is called from every
 *    write path (admin mutations, bulk import, UGC publish). It bumps an
 *    epoch counter so a loader that started BEFORE the mutation can never
 *    repopulate the cache with pre-mutation data after finishing.
 *
 *  - State lives on globalThis so Next.js HMR / module re-evaluation in dev
 *    does not create duplicate stores (same pattern as the db pool).
 *
 * Everything stored here is short-TTL public directory data, so a full clear
 * on any write is cheap and can never leave the cache partially stale.
 */

type CacheEntry = { v: unknown; exp: number };
type InflightEntry = { epoch: number; p: Promise<unknown> };

type CacheGlobal = {
  __ghCacheStore?: Map<string, CacheEntry>;
  __ghCacheInflight?: Map<string, InflightEntry>;
  __ghCacheEpoch?: number;
};

const g = globalThis as unknown as CacheGlobal;

/** Shared across the whole process; survives HMR. */
const store: Map<string, CacheEntry> = (g.__ghCacheStore ??= new Map());
const inflight: Map<string, InflightEntry> = (g.__ghCacheInflight ??= new Map());
let epoch: number = (g.__ghCacheEpoch ??= 0);

/** Hard cap so pathological key spaces (never expected — searches bypass)
 *  can't grow the process memory on a small server. Pruned to PRUNE_TO. */
const MAX_ENTRIES = 400;
const PRUNE_TO = 300;

/** TTLs in milliseconds — keep every value short: this is a micro-cache, not
 *  a source of truth. Correctness comes from clearDataCache() on writes. */
export const TTL = {
  /** 30s — near-realtime reads. */
  short: 30_000,
  /** 45s — directory listings (home feed, paginated pages). */
  list: 45_000,
  /** 60s — taxonomies, stats, widgets. */
  med: 60_000,
  /** 120s — aggregations derived from full scans (tags, cities, authors). */
  long: 120_000,
  /** 300s — daily-rotation content (grupo del día). */
  xl: 300_000,
} as const;

function prune(): void {
  if (store.size <= MAX_ENTRIES) return;
  let toDrop = store.size - PRUNE_TO;
  // Map iterates in insertion order — oldest entries first. This is a good
  // enough LRU approximation for a short-TTL cache.
  for (const key of store.keys()) {
    store.delete(key);
    if (--toDrop <= 0) break;
  }
}

/**
 * Read-through cache with single-flight coalescing.
 *
 * `ttlMs <= 0` bypasses the cache entirely (used for personal/unbounded
 * queries like search).
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  if (ttlMs <= 0) return loader();

  const hit = store.get(key);
  if (hit) {
    if (hit.exp > Date.now()) return hit.v as T;
    store.delete(key); // expired
  }

  const currentEpoch = epoch;

  // Join an in-flight load from the same epoch (stampede coalescing).
  const running = inflight.get(key);
  if (running && running.epoch === currentEpoch) {
    return running.p as Promise<T>;
  }

  const p = (async () => {
    try {
      const v = await loader();
      // Only repopulate if no invalidation happened while loading.
      if (epoch === currentEpoch) {
        store.set(key, { v, exp: Date.now() + ttlMs });
        prune();
      }
      return v;
    } finally {
      // Only clear our own slot: if an invalidation + newer load happened
      // while we were running, the slot holds a different epoch — leave it.
      const slot = inflight.get(key);
      if (slot && slot.epoch === currentEpoch) inflight.delete(key);
    }
  })();

  inflight.set(key, { epoch: currentEpoch, p });
  return p;
}

/**
 * Invalidate ALL cached directory data. Called after every successful write
 * (admin group/category mutations, bulk import, UGC auto-publish, ...).
 *
 * Whole-map clear + epoch bump: cheap (a few hundred entries at most) and
 * guarantees no stale data survives, including in-flight pre-mutation loads.
 */
export function clearDataCache(): void {
  epoch = g.__ghCacheEpoch = epoch + 1;
  store.clear();
}
