/**
 * Member Display Formula
 * Based on Groupizo manual: NEVER use WhatsApp member_count (not exposed).
 * Use clicks/joins count (real, tracked by us).
 *
 * Formula: displayed = max(clicks, joinCount) * multiplier + base
 * The multiplier makes the number look natural for a group directory.
 */

const MULTIPLIER = 3; // 1 click ≈ 3 members (typical join-to-engagement ratio)
const BASE = 5; // Minimum believable count
const VARIANCE = 0.15; // ±15% deterministic jitter

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

export function computeDisplayedMembers(clicks: number, joinCount: number, seed: string): number {
  const real = Math.max(clicks, joinCount);
  if (real <= 0) return 0;

  const base = Math.round(real * MULTIPLIER + BASE);
  const r = seededRandom(seed);
  const jitter = base * VARIANCE * 2;
  const offset = r * jitter - base * VARIANCE;

  return Math.max(1, Math.round(base + offset));
}
