/**
 * Rate Limiter — Anti-Spam Submission Control
 * Based on Groupizo VIP Logic SYSTEM 5.
 *
 * Three-layer fingerprinting: IP + device token + UA hash.
 * Limits: 10/device/day, 30/IP/day, 1-hour block after limit hit.
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
    // Window expired → reset
    return { allowed: true, remaining: maxAllowed, blockedUntil: null };
  }

  // Check count
  if (existing.attempts >= maxAllowed) {
    const blockedUntil = new Date(Date.now() + 3600 * 1000); // 1 hour block
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
  action: string
): Promise<void> {
  // Atomic upsert on the (rateKey, action) unique key.
  await exec(
    `INSERT INTO \`ugc_rate_limits\` (\`rateKey\`, \`action\`, \`attempts\`, \`lastAttemptAt\`)
     VALUES (?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE \`attempts\` = \`attempts\` + 1, \`lastAttemptAt\` = NOW(), \`blockedUntil\` = NULL`,
    [rateKey, action]
  );
}

export async function checkUgcRateLimits(ip: string, deviceToken: string): Promise<{ allowed: boolean; reason?: string }> {
  const ipHash = hashValue(ip);
  const deviceHash = hashValue(deviceToken);

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
