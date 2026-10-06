import type { GroupDTO } from "@/lib/types";
import type { RatingMap } from "@/hooks/use-batch-ratings";

/**
 * Computes a 0-100 "health score" for a group based on:
 * - Members (0-30 pts, capped at 2000)
 * - Views (0-20 pts, capped at 200)
 * - Rating avg (0-20 pts, avg/5*20)
 * - Shares (0-15 pts, capped at 20)
 * - Recency (0-15 pts, lastActiveAt within 30 days)
 */
export function computeHealthScore(
  group: GroupDTO,
  rating?: { avg: number; count: number } | null
): number {
  // Members: 0-30 pts
  const memberScore = Math.min(30, (group.members / 2000) * 30);

  // Views: 0-20 pts
  const viewScore = Math.min(20, (group.views / 200) * 20);

  // Rating: 0-20 pts (only if rated)
  const ratingScore = rating && rating.count > 0 ? (rating.avg / 5) * 20 : 0;

  // Shares: 0-15 pts
  const shareScore = Math.min(15, group.shares * 0.75);

  // Recency: 0-15 pts (within 30 days = full, decays after)
  let recencyScore = 0;
  if (group.lastActiveAt) {
    const daysSince = (Date.now() - new Date(group.lastActiveAt).getTime()) / 86400000;
    if (daysSince <= 30) {
      recencyScore = 15 * (1 - daysSince / 30);
    }
  }

  const total = memberScore + viewScore + ratingScore + shareScore + recencyScore;
  return Math.round(Math.min(100, total));
}

export function healthScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-lime-600 dark:text-lime-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  if (score >= 20) return "text-orange-600 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}

export function healthScoreLabel(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Muy bueno";
  if (score >= 40) return "Bueno";
  if (score >= 20) return "Regular";
  return "Nuevo";
}
