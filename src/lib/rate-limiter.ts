/**
 * Rate Limiter — Anti-Spam Submission Control
 * Based on Groupizo VIP Logic SYSTEM 5.
 *
 * Three-layer fingerprinting: IP + device token + UA hash.
 * Layers: burst (3/10min/device), device (10/day), IP (30/day).
 * Blocks last until the quota window naturally resets (no fixed 1h re-block loop).
 */

import { queryOne, query, exec, type Row } from "./db";
import crypto from "crypto";

export function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function getClientIp(req: {
  headers: Headers | Record<string, string | string[] | undefined>;
  ip?: string;
}): string {
  const h: any = req.headers;
  // Web Headers (NextRequest) or plain record — handle both.
  const xff = typeof h.get === "function" ? h.get("x-forwarded-for") : h["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff.length > 0) return String(xff[0]).trim();
  return req.ip ?? "127.0.0.1";
}

interface RateCheckResult {
  allowed: boolean;
  remaining: number;
  blockedUntil: Date | null;
}

export async function checkRateLimit(
  rateKey: string,
  action: string,
  maxAllowed: number,
  windowSeconds: number
): Promise<RateCheckResult> {
  const existing = (await queryOne<Row>(
    "SELECT `id`, `attempts`, `lastAttemptAt`, `blockedUntil` FROM `ugc_rate_limits` WHERE `rateKey` = ? AND `action` = ? LIMIT 1",
    [rateKey, action]
  )) as (Row & { attempts: number; lastAttemptAt: Date; blockedUntil: Date | null }) | null;

  if (!existing) {
    return { allowed: true, remaining: maxAllowed, blockedUntil: null };
  }

  // Check block
  if (existing.blockedUntil && existing.blockedUntil > new Date()) {
    return { allowed: false, remaining: 0, blockedUntil: existing.blockedUntil };
  }

  // Check window expiry
  const windowMs = windowSeconds * 1000;
  const elapsed = Date.now() - new Date(existing.lastAttemptAt).getTime();
  if (elapsed > windowMs) {
    // Window expired → quota fully resets. The next hit() re-baselines the
    // attempts counter (see the smart upsert below), so no stale residue.
    return { allowed: true, remaining: maxAllowed, blockedUntil: null };
  }

  // Check count
  if (existing.attempts >= maxAllowed) {
    // Out of quota: block until the window naturally resets. A fixed short
    // block would expire and immediately re-block on the next attempt,
    // trapping legitimate long-term users in a 429 loop.
    const remainingMs = Math.min(windowMs - elapsed, windowMs);
    const blockedUntil = new Date(Date.now() + remainingMs);
    await exec(
      "UPDATE `ugc_rate_limits` SET `blockedUntil` = ? WHERE `rateKey` = ? AND `action` = ?",
      [blockedUntil, rateKey, action]
    );
    return { allowed: false, remaining: 0, blockedUntil };
  }

  return { allowed: true, remaining: maxAllowed - existing.attempts, blockedUntil: null };
}

export async function hitRateLimit(
  rateKey: string,
  action: string,
  windowSeconds = 86400
): Promise<void> {
  // Atomic upsert on the (rateKey, action) unique key. When the previous
  // hit is older than the window, the counter re-baselines to 1 instead of
  // accumulating forever (fixes the "stuck blocked after N days of normal
  // usage" flaw — a counter that never reset could only ever go up).
  await exec(
    `INSERT INTO \`ugc_rate_limits\` (\`rateKey\`, \`action\`, \`attempts\`, \`lastAttemptAt\`)
     VALUES (?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE
       \`attempts\` = IF(\`lastAttemptAt\` < DATE_SUB(NOW(), INTERVAL ? SECOND), 1, \`attempts\` + 1),
       \`lastAttemptAt\` = NOW(),
       \`blockedUntil\` = NULL`,
    [rateKey, action, windowSeconds]
  );
}

export async function checkUgcRateLimits(ip: string, deviceToken: string): Promise<{ allowed: boolean; reason?: string }> {
  const ipHash = hashValue(ip);
  const deviceHash = hashValue(deviceToken);

  // Burst limit: 3 per 10 minutes per device — stops rapid-fire spam
  // long before the daily caps are relevant.
  const burstCheck = await checkRateLimit(`submit_burst:${deviceHash}`, "ugc_burst", 3, 600);
  if (!burstCheck.allowed) {
    return { allowed: false, reason: "Demasiados envíos seguidos. Espera unos minutos antes de volver a intentarlo." };
  }

  // Device limit: 10/day
  const deviceCheck = await checkRateLimit(`submit_device:${deviceHash}`, "ugc_submit", 10, 86400);
  if (!deviceCheck.allowed) {
    return { allowed: false, reason: "Límite de envíos por dispositivo alcanzado (10/día)." };
  }

  // IP limit: 30/day
  const ipCheck = await checkRateLimit(`submit_ip:${ipHash}`, "ugc_submit", 30, 86400);
  if (!ipCheck.allowed) {
    return { allowed: false, reason: "Límite de envíos por IP alcanzado (30/día)." };
  }

  return { allowed: true };
}

/** Record a successful UGC submission against all three limit layers. */
export async function hitUgcRateLimits(ip: string, deviceToken: string): Promise<void> {
  const ipHash = hashValue(ip);
  const deviceHash = hashValue(deviceToken);
  await Promise.all([
    hitRateLimit(`submit_burst:${deviceHash}`, "ugc_burst", 600),
    hitRateLimit(`submit_device:${deviceHash}`, "ugc_submit", 86400),
    hitRateLimit(`submit_ip:${ipHash}`, "ugc_submit", 86400),
  ]);
}
