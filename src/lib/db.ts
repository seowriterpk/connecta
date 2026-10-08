/**
 * ConectaGrupos — database layer.
 *
 * mysql2/promise + connection pool. The fast, standard way.
 *
 * - Hostinger production: DB_HOST=localhost (app + MySQL on the same server,
 *   same hosting — no remote connections, no latency).
 * - Dev sandbox: DB_HOST=127.0.0.1 (local MariaDB, same code path).
 *
 * SCHEMA GUARD: the database initializes itself on the first query.
 * CREATE TABLE IF NOT EXISTS + ALTER TABLE guards (try/catch) mean
 * no terminal access, no `npx prisma migrate`, nothing manual —
 * exactly what shared hosting requires.
 */

import mysql from "mysql2/promise";
import { randomBytes } from "crypto";

export type Row = mysql.RowDataPacket;
export type ExecResult = mysql.ResultSetHeader;

/**
 * Generate a Prisma-cuid-like id (25 chars, URL-safe, sortable-ish).
 * Used as PRIMARY KEY for tables with VARCHAR ids.
 */
export function newId(): string {
  const t = Date.now().toString(36).padStart(8, "0");
  const r = randomBytes(8).toString("hex"); // 16 chars
  return `c${t}${r}`; // 25 chars
}

// ---------------------------------------------------------------------------
// Pool — created once per process (global-cached to survive Next.js HMR)
// ---------------------------------------------------------------------------

const globalForDb = globalThis as unknown as {
  __mysqlPool?: mysql.Pool;
  __schemaInit?: Promise<void>;
};

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "grupos",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gruposwhatsapp",
    // Aggressive idle recycling — prevents connection saturation on shared
    // hosting (ECONNREFUSED / 500s). Few idle connections held, freed fast.
    waitForConnections: true,
    connectionLimit: 8,
    maxIdle: 2,           // recycle idle conns almost immediately
    idleTimeout: 30_000,  // 30s idle → close (was 60s)
    queueLimit: 0,
    connectTimeout: 10_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 15_000, // detect dead peers sooner (was 30s)
    charset: "utf8mb4",
    decimalNumbers: true,
    timezone: "Z", // store/interpret DATETIME as UTC
  });
}

export const pool: mysql.Pool = globalForDb.__mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__mysqlPool = pool;

// ---------------------------------------------------------------------------
// Schema Guard — idempotent, self-healing
// ---------------------------------------------------------------------------

const CREATE_TABLES: Array<{ name: string; sql: string }> = [
  {
    name: "groups",
    sql: `CREATE TABLE IF NOT EXISTS \`groups\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`groupName\` VARCHAR(255) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL UNIQUE,
      \`joinLink\` VARCHAR(512) NOT NULL,
      \`description\` TEXT NOT NULL,
      \`category\` VARCHAR(255) NOT NULL DEFAULT '',
      \`categoryId\` VARCHAR(191) NOT NULL,
      \`country\` VARCHAR(255) NOT NULL DEFAULT '',
      \`countryId\` VARCHAR(191) NOT NULL,
      \`city\` VARCHAR(255) DEFAULT NULL,
      \`keywords\` TEXT NOT NULL,
      \`tags\` TEXT NOT NULL,
      \`profileImage\` VARCHAR(512) DEFAULT NULL,
      \`language\` VARCHAR(64) NOT NULL DEFAULT 'Espanol',
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'pending',
      \`linkStatus\` VARCHAR(32) NOT NULL DEFAULT 'active',
      \`isAdult\` TINYINT(1) NOT NULL DEFAULT 0,
      \`submitSource\` VARCHAR(32) NOT NULL DEFAULT 'staff',
      \`clicks\` INT NOT NULL DEFAULT 0,
      \`joinCount\` INT NOT NULL DEFAULT 0,
      \`avgRating\` FLOAT NOT NULL DEFAULT 0,
      \`ratingCount\` INT NOT NULL DEFAULT 0,
      \`views\` INT NOT NULL DEFAULT 0,
      \`shares\` INT NOT NULL DEFAULT 0,
      \`uploaderId\` VARCHAR(191) DEFAULT NULL,
      \`ugcSubmissionId\` VARCHAR(191) DEFAULT NULL,
      \`ugcContributorId\` VARCHAR(191) DEFAULT NULL,
      \`lastValidatedAt\` DATETIME DEFAULT NULL,
      \`imageRefreshedAt\` DATETIME DEFAULT NULL,
      \`lastActiveAt\` DATETIME DEFAULT NULL,
      \`popularityBadge\` VARCHAR(64) DEFAULT NULL,
      \`contactName\` VARCHAR(255) DEFAULT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_groups_category\` (\`categoryId\`),
      KEY \`idx_groups_country\` (\`countryId\`),
      KEY \`idx_groups_status\` (\`status\`),
      KEY \`idx_groups_linkStatus\` (\`linkStatus\`),
      KEY \`idx_groups_isAdult\` (\`isAdult\`),
      KEY \`idx_groups_city\` (\`city\`),
      KEY \`idx_groups_clicks\` (\`clicks\`),
      KEY \`idx_groups_createdAt\` (\`createdAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "groups_queue",
    sql: `CREATE TABLE IF NOT EXISTS \`groups_queue\` (
      \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`groupName\` VARCHAR(255) NOT NULL,
      \`joinLink\` VARCHAR(512) NOT NULL,
      \`description\` TEXT NOT NULL,
      \`category\` VARCHAR(255) NOT NULL DEFAULT '',
      \`country\` VARCHAR(255) NOT NULL DEFAULT '',
      \`city\` VARCHAR(255) DEFAULT NULL,
      \`keywords\` TEXT NOT NULL,
      \`tags\` TEXT NOT NULL,
      \`profileImage\` VARCHAR(512) DEFAULT NULL,
      \`uploaderId\` VARCHAR(191) DEFAULT NULL,
      \`isAdult\` TINYINT(1) NOT NULL DEFAULT 0,
      \`language\` VARCHAR(64) NOT NULL DEFAULT 'Espanol',
      \`addedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY \`idx_gq_addedAt\` (\`addedAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "ugc_submissions",
    sql: `CREATE TABLE IF NOT EXISTS \`ugc_submissions\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`submissionUid\` VARCHAR(191) NOT NULL UNIQUE,
      \`inviteUrl\` VARCHAR(512) NOT NULL,
      \`inviteCode\` VARCHAR(255) NOT NULL,
      \`fetchedGroupName\` VARCHAR(255) NOT NULL DEFAULT '',
      \`editedGroupName\` VARCHAR(255) NOT NULL DEFAULT '',
      \`fetchedImageUrl\` VARCHAR(512) NOT NULL DEFAULT '',
      \`finalImageUrl\` VARCHAR(512) NOT NULL DEFAULT '',
      \`categoryId\` VARCHAR(191) DEFAULT NULL,
      \`categoryNameSnapshot\` VARCHAR(255) NOT NULL DEFAULT '',
      \`isAdult\` TINYINT(1) NOT NULL DEFAULT 0,
      \`country\` VARCHAR(255) NOT NULL DEFAULT '',
      \`city\` VARCHAR(255) NOT NULL DEFAULT '',
      \`selectedTagsJson\` TEXT NOT NULL,
      \`keywordsJson\` TEXT NOT NULL,
      \`detectedLanguage\` VARCHAR(64) NOT NULL DEFAULT '',
      \`contributorId\` VARCHAR(191) DEFAULT NULL,
      \`contributorDisplayNameSnap\` VARCHAR(255) NOT NULL DEFAULT '',
      \`contributorImageSnap\` VARCHAR(512) NOT NULL DEFAULT '',
      \`status\` VARCHAR(64) NOT NULL DEFAULT 'draft',
      \`score\` INT NOT NULL DEFAULT 0,
      \`scoreBreakdownJson\` TEXT NOT NULL,
      \`adminNotes\` TEXT DEFAULT NULL,
      \`systemFlagsJson\` TEXT NOT NULL,
      \`duplicateOfGroupId\` VARCHAR(191) DEFAULT NULL,
      \`ipHash\` VARCHAR(191) DEFAULT NULL,
      \`userAgentHash\` VARCHAR(191) DEFAULT NULL,
      \`deviceTokenHash\` VARCHAR(191) DEFAULT NULL,
      \`referrer\` VARCHAR(512) NOT NULL DEFAULT '',
      \`submittedAt\` DATETIME DEFAULT NULL,
      \`reviewedAt\` DATETIME DEFAULT NULL,
      \`publishedAt\` DATETIME DEFAULT NULL,
      \`publishedGroupId\` VARCHAR(191) DEFAULT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_ugcs_status\` (\`status\`),
      KEY \`idx_ugcs_inviteCode\` (\`inviteCode\`),
      KEY \`idx_ugcs_contributor\` (\`contributorId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "ugc_contributors",
    sql: `CREATE TABLE IF NOT EXISTS \`ugc_contributors\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`contributorUid\` VARCHAR(191) NOT NULL UNIQUE,
      \`displayName\` VARCHAR(255) NOT NULL,
      \`displaySlug\` VARCHAR(191) NOT NULL UNIQUE,
      \`internalUsernameKey\` VARCHAR(255) NOT NULL,
      \`avatarUrl\` VARCHAR(512) NOT NULL DEFAULT '',
      \`passkeyHash\` VARCHAR(255) NOT NULL,
      \`deviceTokenHash\` VARCHAR(191) DEFAULT NULL,
      \`ipHashFirst\` VARCHAR(191) DEFAULT NULL,
      \`ipHashLast\` VARCHAR(191) DEFAULT NULL,
      \`publishedCount\` INT NOT NULL DEFAULT 0,
      \`submittedCount\` INT NOT NULL DEFAULT 0,
      \`rejectedCount\` INT NOT NULL DEFAULT 0,
      \`reputationScore\` INT NOT NULL DEFAULT 0,
      \`lastSubmissionAt\` DATETIME DEFAULT NULL,
      \`isBlocked\` TINYINT(1) NOT NULL DEFAULT 0,
      \`isRemoved\` TINYINT(1) NOT NULL DEFAULT 0,
      \`blockedReason\` VARCHAR(512) NOT NULL DEFAULT '',
      \`removeReason\` VARCHAR(512) NOT NULL DEFAULT '',
      \`removedAt\` DATETIME DEFAULT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_ugcc_slug\` (\`displaySlug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "uploaders",
    sql: `CREATE TABLE IF NOT EXISTS \`uploaders\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL UNIQUE,
      \`jobTitle\` VARCHAR(255) NOT NULL DEFAULT 'Curador de Comunidades',
      \`description\` TEXT DEFAULT NULL,
      \`facebookUrl\` VARCHAR(512) DEFAULT NULL,
      \`twitterUrl\` VARCHAR(512) DEFAULT NULL,
      \`linkedinUrl\` VARCHAR(512) DEFAULT NULL,
      \`websiteUrl\` VARCHAR(512) DEFAULT NULL,
      \`imageUrl\` VARCHAR(512) DEFAULT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`lastActiveAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "categories",
    sql: `CREATE TABLE IF NOT EXISTS \`categories\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL UNIQUE,
      \`description\` TEXT NOT NULL,
      \`icon\` VARCHAR(64) NOT NULL DEFAULT '💬',
      \`color\` VARCHAR(64) NOT NULL DEFAULT 'emerald',
      \`isAdult\` TINYINT(1) NOT NULL DEFAULT 0,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`sortOrder\` INT NOT NULL DEFAULT 1000,
      \`source\` VARCHAR(32) NOT NULL DEFAULT 'admin',
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "countries",
    sql: `CREATE TABLE IF NOT EXISTS \`countries\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL UNIQUE,
      \`nameEs\` VARCHAR(255) DEFAULT NULL,
      \`slug\` VARCHAR(191) NOT NULL UNIQUE,
      \`code\` VARCHAR(8) NOT NULL UNIQUE,
      \`flag\` VARCHAR(32) NOT NULL,
      \`region\` VARCHAR(64) NOT NULL,
      \`dialCode\` VARCHAR(16) DEFAULT NULL,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "group_reports",
    sql: `CREATE TABLE IF NOT EXISTS \`group_reports\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`groupId\` VARCHAR(191) NOT NULL,
      \`reporterIp\` VARCHAR(64) NOT NULL,
      \`reason\` TEXT DEFAULT NULL,
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'OPEN',
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY \`idx_reports_group\` (\`groupId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "group_reviews",
    sql: `CREATE TABLE IF NOT EXISTS \`group_reviews\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`groupId\` VARCHAR(191) NOT NULL,
      \`rating\` INT NOT NULL,
      \`ipHash\` VARCHAR(191) NOT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY \`uq_review_group_ip\` (\`groupId\`, \`ipHash\`),
      KEY \`idx_reviews_group\` (\`groupId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "ugc_rate_limits",
    sql: `CREATE TABLE IF NOT EXISTS \`ugc_rate_limits\` (
      \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`rateKey\` VARCHAR(191) NOT NULL,
      \`action\` VARCHAR(64) NOT NULL,
      \`attempts\` INT NOT NULL DEFAULT 0,
      \`lastAttemptAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`blockedUntil\` DATETIME DEFAULT NULL,
      UNIQUE KEY \`uq_rate_key_action\` (\`rateKey\`, \`action\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "ugc_settings",
    sql: `CREATE TABLE IF NOT EXISTS \`ugc_settings\` (
      \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(191) NOT NULL UNIQUE,
      \`value\` TEXT NOT NULL,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "seo_overrides",
    sql: `CREATE TABLE IF NOT EXISTS \`seo_overrides\` (
      \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`pageType\` VARCHAR(64) NOT NULL,
      \`entityId\` VARCHAR(191) NOT NULL,
      \`metaTitleOverride\` VARCHAR(512) DEFAULT NULL,
      \`metaDescriptionOverride\` TEXT DEFAULT NULL,
      \`robotsOverride\` VARCHAR(255) DEFAULT NULL,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY \`uq_seo_page_entity\` (\`pageType\`, \`entityId\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "entity_intros",
    sql: `CREATE TABLE IF NOT EXISTS \`entity_intros\` (
      \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`entityType\` VARCHAR(32) NOT NULL,
      \`entityName\` VARCHAR(255) NOT NULL,
      \`customTitle\` VARCHAR(512) DEFAULT NULL,
      \`customHeroDesc\` TEXT DEFAULT NULL,
      \`customIntro\` TEXT DEFAULT NULL,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY \`uq_intro_type_name\` (\`entityType\`, \`entityName\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "admin_activity_log",
    sql: `CREATE TABLE IF NOT EXISTS \`admin_activity_log\` (
      \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`adminUser\` VARCHAR(191) NOT NULL DEFAULT 'admin',
      \`actionLabel\` VARCHAR(512) NOT NULL,
      \`targetId\` VARCHAR(191) DEFAULT NULL,
      \`targetName\` VARCHAR(512) DEFAULT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "newsletter",
    sql: `CREATE TABLE IF NOT EXISTS \`newsletter\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`source\` VARCHAR(64) NOT NULL DEFAULT 'footer',
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'SUBSCRIBED',
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "fav_lists",
    sql: `CREATE TABLE IF NOT EXISTS \`fav_lists\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`shareCode\` VARCHAR(24) NOT NULL UNIQUE,
      \`title\` VARCHAR(120) DEFAULT NULL,
      \`groupIdsJson\` TEXT NOT NULL,
      \`viewCount\` INT NOT NULL DEFAULT 0,
      \`creatorIpHash\` VARCHAR(191) DEFAULT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`lastViewedAt\` DATETIME DEFAULT NULL,
      KEY \`idx_fav_lists_createdAt\` (\`createdAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "group_daily_stats",
    sql: `CREATE TABLE IF NOT EXISTS \`group_daily_stats\` (
      \`groupId\` VARCHAR(191) NOT NULL,
      \`day\` DATE NOT NULL,
      \`views\` INT NOT NULL DEFAULT 0,
      \`clicks\` INT NOT NULL DEFAULT 0,
      PRIMARY KEY (\`groupId\`, \`day\`),
      KEY \`idx_gds_day\` (\`day\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "blog_posts",
    sql: `CREATE TABLE IF NOT EXISTS \`blog_posts\` (
      \`id\` VARCHAR(191) NOT NULL PRIMARY KEY,
      \`slug\` VARCHAR(191) NOT NULL UNIQUE,
      \`title\` VARCHAR(255) NOT NULL,
      \`excerpt\` VARCHAR(500) DEFAULT NULL,
      \`content\` MEDIUMTEXT NOT NULL,
      \`coverEmoji\` VARCHAR(16) DEFAULT '📝',
      \`tags\` VARCHAR(500) DEFAULT NULL,
      \`authorName\` VARCHAR(120) DEFAULT 'Equipo ConectaGrupos',
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'draft',
      \`metaTitle\` VARCHAR(255) DEFAULT NULL,
      \`metaDescription\` VARCHAR(500) DEFAULT NULL,
      \`readingMinutes\` INT NOT NULL DEFAULT 4,
      \`views\` INT NOT NULL DEFAULT 0,
      \`publishedAt\` DATETIME DEFAULT NULL,
      \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY \`idx_blog_status_published\` (\`status\`, \`publishedAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
];

/**
 * ALTER guards — patch older production tables that were created before a
 * column existed. Each runs in try/catch: "Duplicate column name" errors are
 * swallowed, so this is safe to run on every boot.
 */
const ALTER_GUARDS: string[] = [
  // groups — columns added over time
  "ALTER TABLE `groups` ADD COLUMN `contactName` VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE `groups` ADD COLUMN `popularityBadge` VARCHAR(64) DEFAULT NULL",
  "ALTER TABLE `groups` ADD COLUMN `language` VARCHAR(64) NOT NULL DEFAULT 'Espanol'",
  "ALTER TABLE `groups` ADD COLUMN `submitSource` VARCHAR(32) NOT NULL DEFAULT 'staff'",
  "ALTER TABLE `groups` ADD COLUMN `ugcSubmissionId` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE `groups` ADD COLUMN `ugcContributorId` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE `groups` ADD COLUMN `avgRating` FLOAT NOT NULL DEFAULT 0",
  "ALTER TABLE `groups` ADD COLUMN `ratingCount` INT NOT NULL DEFAULT 0",
  "ALTER TABLE `groups` ADD COLUMN `shares` INT NOT NULL DEFAULT 0",
  "ALTER TABLE `groups` ADD COLUMN `views` INT NOT NULL DEFAULT 0",
  "ALTER TABLE `groups` ADD COLUMN `lastValidatedAt` DATETIME DEFAULT NULL",
  "ALTER TABLE `groups` ADD COLUMN `imageRefreshedAt` DATETIME DEFAULT NULL",
  "ALTER TABLE `groups` ADD COLUMN `lastActiveAt` DATETIME DEFAULT NULL",
];

async function runSchemaGuard(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    for (const t of CREATE_TABLES) {
      await conn.query(t.sql);
    }
    for (const alter of ALTER_GUARDS) {
      try {
        await conn.query(alter);
      } catch {
        // Column already exists (or table layout differs) — safe to ignore.
      }
    }
  } finally {
    conn.release();
  }
}

/**
 * Await this before the first query. Runs the schema guard exactly once per
 * process. If it fails (DB briefly unreachable at boot), the cached promise
 * is cleared so the next request retries instead of staying broken.
 */
export function dbReady(): Promise<void> {
  if (!globalForDb.__schemaInit) {
    globalForDb.__schemaInit = runSchemaGuard().catch((err) => {
      globalForDb.__schemaInit = undefined; // allow retry on next request
      throw err;
    });
  }
  return globalForDb.__schemaInit;
}

// ---------------------------------------------------------------------------
// Query helpers — thin, typed, no magic
// ---------------------------------------------------------------------------

/** SELECT → rows array. */
export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  await dbReady();
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** SELECT → first row or null. */
export async function queryOne<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/** INSERT / UPDATE / DELETE / DDL → affected rows + insertId. */
export async function exec(sql: string, params: unknown[] = []): Promise<ExecResult> {
  await dbReady();
  const [result] = await pool.query(sql, params);
  return result as ExecResult;
}

/** Run several statements atomically on one connection. */
export async function tx<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  await dbReady();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    conn.release();
  }
}

/** Quick connectivity + schema check. Used by /api/health. */
export async function dbHealth(): Promise<{ ok: boolean; error?: string; serverInfo?: string }> {
  try {
    const rows = await query<Row & { v: string }>("SELECT VERSION() AS v");
    return { ok: true, serverInfo: String(rows[0]?.v ?? "unknown") };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
