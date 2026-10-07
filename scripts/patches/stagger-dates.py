#!/usr/bin/env python3
"""
stagger-dates.py — make demo seed data launch-realistic.

Problems it fixes (all 38 groups share one timestamp after seed.sql):
  1. `orden=recientes` is non-deterministic (all createdAt identical).
  2. `group_daily_stats` is empty → "En ascenso" movers on /populares
     and the group-detail "Actividad reciente" card never render.
  3. `lastActiveAt` identical everywhere → activity-based sorting meaningless.

What it does (deterministic, idempotent — safe to re-run):
  - createdAt: spread over the last ~85 days (varied hours/minutes).
    Newer for lower-numbered demo ids (g-demo-001 = newest) so the
    "recientes" feed has a stable, sensible order.
  - lastActiveAt: within the last 72h (activity signal).
  - group_daily_stats: 14 days of views/clicks history for the top-12
    groups by `views` (trend factors 3.2→0.55 — same shape as the
    original production seed; risers/decliners stable).

Run:  python3 scripts/patches/stagger-dates.py | mariadb ... gruposwhatsapp
"""
import sys

# id → (days_ago_created, hours_ago_active)
# Lower demo numbers = more recently created (recientes feed looks alive).
CREATED_DAYS_AGO = {
    "g-demo-001": 1, "g-demo-002": 2, "g-demo-003": 3, "g-demo-004": 4,
    "g-demo-005": 2, "g-demo-006": 6, "g-demo-007": 5, "g-demo-008": 7,
    "g-demo-009": 4, "g-demo-010": 9, "g-demo-011": 8, "g-demo-012": 11,
    "g-demo-013": 10, "g-demo-014": 12, "g-demo-015": 6, "g-demo-016": 14,
    "g-demo-017": 13, "g-demo-018": 16, "g-demo-019": 15, "g-demo-020": 18,
    "g-demo-021": 17, "g-demo-022": 20, "g-demo-023": 19, "g-demo-024": 22,
    "g-demo-025": 21, "g-demo-026": 24, "g-demo-027": 23, "g-demo-028": 26,
    "g-demo-029": 25, "g-demo-030": 28, "g-demo-031": 27, "g-demo-032": 30,
    "g-demo-033": 29, "g-demo-034": 32, "g-demo-035": 31, "g-demo-036": 34,
    "g-demo-037": 33, "g-demo-038": 36,
    # Adult groups (g-adult-0XX): created 10-60 days ago (varied, never
    # dominating the "recientes" feed).
    "g-adult-001": 40, "g-adult-002": 52, "g-adult-003": 44,
    "g-adult-004": 61, "g-adult-005": 47, "g-adult-006": 55,
}

# Trend factor per demo id for daily-stats seeding (top-12 by views get rows).
# >1 = riser (week views >> prev week), <1 = decliner.
TREND = {
    "g-demo-007": 3.2,   # Fe y Reflexión — top riser (matches old prod seed)
    "g-demo-002": 2.6,   # Memes diario
    "g-demo-012": 2.1,
    "g-demo-019": 1.8,
    "g-demo-028": 1.55,
    "g-demo-005": 1.15,
    "g-demo-001": 1.0,   # featured, flat
    "g-demo-016": 0.9,
    "g-demo-023": 0.75,
    "g-demo-031": 0.65,
    "g-demo-009": 0.6,
    "g-demo-036": 0.55,  # steepest decliner
}

BASE_VIEWS = 30  # baseline daily views 14 days ago


def esc(s: str) -> str:
    return s.replace("'", "''")


def main() -> None:
    out = ["SET NAMES utf8mb4;", "USE `gruposwhatsapp`;"]
    out.append("START TRANSACTION;")

    # 1. Stagger createdAt + lastActiveAt.
    #    (id % 7) hours + (id % 11) minutes offsets → varied times of day.
    for gid, days in CREATED_DAYS_AGO.items():
        n = int(gid.split("-")[-1])
        hours_active = 1 + (n % 41)          # 1..41h ago
        out.append(
            "UPDATE `groups` SET "
            f"`createdAt` = DATE_SUB(NOW(), INTERVAL {days} DAY) "
            f"+ INTERVAL {(n * 3) % 24} HOUR + INTERVAL {(n * 7) % 60} MINUTE, "
            f"`lastActiveAt` = DATE_SUB(NOW(), INTERVAL {hours_active} HOUR) "
            f"WHERE `id` = '{esc(gid)}';"
        )

    # 2. Daily stats for the 12 trend groups (last 14 days incl. today).
    out.append("DELETE FROM `group_daily_stats` WHERE `groupId` IN ("
               + ",".join(f"'{esc(g)}'" for g in TREND) + ");")
    for gid, factor in TREND.items():
        for d in range(13, -1, -1):  # 13 days ago → today
            # growth from factor: day 13 base → today base * factor
            # exponential interpolation, clamped to sane values
            t = (13 - d) / 13.0
            mult = 1.0 + (factor - 1.0) * t
            views = max(2, int(round(BASE_VIEWS * mult)))
            clicks = max(1, int(round(views * 0.22)))
            out.append(
                "INSERT INTO `group_daily_stats` (`groupId`,`day`,`views`,`clicks`) "
                f"VALUES ('{esc(gid)}', DATE_SUB(CURDATE(), INTERVAL {d} DAY), "
                f"{views}, {clicks}) "
                "ON DUPLICATE KEY UPDATE `views`=VALUES(`views`), `clicks`=VALUES(`clicks`);"
            )

    out.append("COMMIT;")
    print("\n".join(out))


if __name__ == "__main__":
    main()
