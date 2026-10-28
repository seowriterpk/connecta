/**
 * admin-settings.ts — dashboard-configurable policies (Task 22).
 *
 * Stored in the `admin_settings` key-value table (auto-created by the
 * db.ts schema guard, so a Hostinger deploy bootstraps it safely).
 * Read path is TTL-cached (30s) for zero CPU cost on the hot submit
 * flow; every save invalidates the cache instantly.
 */

import { exec, query } from "@/lib/db";

export interface AdminSettings {
  /** Master switch: score-qualified submissions publish instantly. */
  autoPublishEnabled: boolean;
  /** Score ≥ this → auto_publish (default 70). */
  autoPublishScoreMin: number;
  /** Score ≥ this → human review queue (default 40). */
  reviewScoreMin: number;
  /** UGC submissions allowed per device per day (default 10). */
  maxSubmissionsPerDeviceDay: number;
  /** UGC submissions allowed per IP per day (default 30). */
  maxSubmissionsPerIpDay: number;
  /** Rows per batch in the manual bulk link checker (default 20). */
  linkCheckBatchSize: number;
  /** Rows per batch in the manual bulk image updater (default 50, max 200 —
   *  Task 34: 8k-group redownloads need big, fast batches). */
  imageBatchSize: number;
  /** Link-checker cron: rows examined per 6h run (default 150). */
  linkCheckCronBatch: number;
  /** Drip-feed cron: groups published per 15 min run (default 5). */
  dripFeedPerRun: number;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  autoPublishEnabled: true,
  autoPublishScoreMin: 70,
  reviewScoreMin: 40,
  maxSubmissionsPerDeviceDay: 10,
  maxSubmissionsPerIpDay: 30,
  linkCheckBatchSize: 20,
  imageBatchSize: 50,
  linkCheckCronBatch: 150,
  dripFeedPerRun: 5,
};

/** Numeric settings bounds — the dashboard can never save nonsense. */
export const SETTINGS_BOUNDS: Record<
  keyof Pick<
    AdminSettings,
    | "autoPublishScoreMin"
    | "reviewScoreMin"
    | "maxSubmissionsPerDeviceDay"
    | "maxSubmissionsPerIpDay"
    | "linkCheckBatchSize"
    | "imageBatchSize"
    | "linkCheckCronBatch"
    | "dripFeedPerRun"
  >,
  { min: number; max: number }
> = {
  autoPublishScoreMin: { min: 40, max: 100 },
  reviewScoreMin: { min: 20, max: 90 },
  maxSubmissionsPerDeviceDay: { min: 1, max: 200 },
  maxSubmissionsPerIpDay: { min: 1, max: 1000 },
  linkCheckBatchSize: { min: 5, max: 100 },
  imageBatchSize: { min: 5, max: 200 },
  linkCheckCronBatch: { min: 20, max: 2000 },
  dripFeedPerRun: { min: 1, max: 100 },
};

const NUMERIC_KEYS = new Set<keyof AdminSettings>([
  "autoPublishScoreMin",
  "reviewScoreMin",
  "maxSubmissionsPerDeviceDay",
  "maxSubmissionsPerIpDay",
  "linkCheckBatchSize",
  "imageBatchSize",
  "linkCheckCronBatch",
  "dripFeedPerRun",
]);

type SettingsCacheShape = { data: AdminSettings; expires: number } | null;
const CACHE_TTL_MS = 30_000;

const globalForSettings = globalThis as unknown as {
  __adminSettingsCache?: SettingsCacheShape;
};

/** Clamp helper shared by the reader and the writer. */
function clampSetting(key: keyof typeof SETTINGS_BOUNDS, value: number): number {
  const b = SETTINGS_BOUNDS[key];
  return Math.min(b.max, Math.max(b.min, Math.round(value)));
}

/**
 * All current settings merged over defaults. Cached 30s (single-flight via
 * the shared cache stampede helper is overkill here — the query is one
 * SELECT of ≤9 rows; the TTL just keeps the submit path at ~zero cost).
 */
export async function getAdminSettings(): Promise<AdminSettings> {
  const cached = globalForSettings.__adminSettingsCache;
  if (cached && cached.expires > Date.now()) return cached.data;

  const merged: AdminSettings = { ...DEFAULT_ADMIN_SETTINGS };
  try {
    const rows = await query<{ key: string; value: string }>(
      "SELECT `key`, `value` FROM `admin_settings`"
    );
    for (const row of rows) {
      if (!(row.key in merged)) continue;
      if (NUMERIC_KEYS.has(row.key as keyof AdminSettings)) {
        const n = Number(row.value);
        if (Number.isFinite(n)) {
          (merged as unknown as Record<string, number>)[row.key] = clampSetting(
            row.key as keyof typeof SETTINGS_BOUNDS,
            n
          );
        }
      } else {
        (merged as unknown as Record<string, boolean>)[row.key] =
          row.value === "1" || row.value.toLowerCase() === "true";
      }
    }
  } catch {
    // Table missing (first boot races) → defaults are always safe.
  }

  globalForSettings.__adminSettingsCache = {
    data: merged,
    expires: Date.now() + CACHE_TTL_MS,
  };
  return merged;
}

/** Persist a partial settings patch (upsert per key) + bust the cache. */
export async function saveAdminSettings(
  patch: Partial<AdminSettings>
): Promise<AdminSettings> {
  const entries: Array<[string, string]> = [];
  for (const [key, raw] of Object.entries(patch)) {
    if (!(key in DEFAULT_ADMIN_SETTINGS)) continue;
    if (NUMERIC_KEYS.has(key as keyof AdminSettings)) {
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      entries.push([key, String(clampSetting(key as keyof typeof SETTINGS_BOUNDS, n))]);
    } else {
      entries.push([key, raw ? "1" : "0"]);
    }
  }
  if (entries.length > 0) {
    const values = entries.map(([k, v]) => `(${JSON.stringify(k)}, ${JSON.stringify(v)})`).join(", ");
    // JSON.stringify output is JSON-valid → safe to interpolate; single
    // idempotent upsert, max 9 rows — cheap on the low-end server.
    await exec(
      `INSERT INTO \`admin_settings\` (\`key\`, \`value\`) VALUES ${values} ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`
    );
  }
  globalForSettings.__adminSettingsCache = null;
  return getAdminSettings();
}
