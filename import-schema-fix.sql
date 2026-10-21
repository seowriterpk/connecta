-- ============================================================================
-- Grupos Hoy (gruposhoy.com) — import-schema-fix.sql
-- ============================================================================
-- CONDITIONAL SCHEMA PATCH (tiny companion to import.sql).
--
-- WHAT THIS DOES
--   • CREATE TABLE IF NOT EXISTS for every business table (structure only).
--   • ALTER TABLE ... ADD COLUMN IF NOT EXISTS for EVERY column — patches
--     older live tables that were created before a column existed.
--   • No data. No drops. No overwrites. Rows are never touched.
--
-- WHEN TO RUN
--   • Run this FIRST if import.sql aborted with "Unknown column 'x' in
--     'field list'" — it adds the missing column, then re-run import.sql.
--   • Or run it before the first import as cheap insurance.
--   • 100% NO-OP when the schema is already current (every statement is
--     guarded by IF NOT EXISTS) — safe to run any number of times.
--
-- ENGINE NOTE: ADD COLUMN IF NOT EXISTS requires MariaDB 10.2+ (Hostinger
-- shared hosting is MariaDB). On plain MySQL 8, skip this file — deploy the
-- app once instead: its SCHEMA GUARD (src/lib/db.ts) self-heals the schema
-- on boot, then run import.sql.
--
-- Generated: 2026-10-21T04:11:04.805Z
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Table: categories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `categories` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(64) NOT NULL DEFAULT '?',
  `color` varchar(64) NOT NULL DEFAULT 'emerald',
  `isAdult` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 1000,
  `source` varchar(32) NOT NULL DEFAULT 'admin',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `name` varchar(255) NOT NULL;
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `slug` varchar(191) NOT NULL;
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `description` text NOT NULL;
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `icon` varchar(64) NOT NULL DEFAULT '?';
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `color` varchar(64) NOT NULL DEFAULT 'emerald';
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `isAdult` tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `isActive` tinyint(1) NOT NULL DEFAULT 1;
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `sortOrder` int(11) NOT NULL DEFAULT 1000;
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `source` varchar(32) NOT NULL DEFAULT 'admin';
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: countries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `countries` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nameEs` varchar(255) DEFAULT NULL,
  `slug` varchar(191) NOT NULL,
  `code` varchar(8) NOT NULL,
  `flag` varchar(32) NOT NULL,
  `region` varchar(64) NOT NULL,
  `dialCode` varchar(16) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `name` varchar(255) NOT NULL;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `nameEs` varchar(255) DEFAULT NULL;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `slug` varchar(191) NOT NULL;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `code` varchar(8) NOT NULL;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `flag` varchar(32) NOT NULL;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `region` varchar(64) NOT NULL;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `dialCode` varchar(16) DEFAULT NULL;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `isActive` tinyint(1) NOT NULL DEFAULT 1;
ALTER TABLE `countries` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: uploaders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `uploaders` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `jobTitle` varchar(255) NOT NULL DEFAULT 'Curador de Comunidades',
  `description` text DEFAULT NULL,
  `facebookUrl` varchar(512) DEFAULT NULL,
  `twitterUrl` varchar(512) DEFAULT NULL,
  `linkedinUrl` varchar(512) DEFAULT NULL,
  `websiteUrl` varchar(512) DEFAULT NULL,
  `imageUrl` varchar(512) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `lastActiveAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `name` varchar(255) NOT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `slug` varchar(191) NOT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `jobTitle` varchar(255) NOT NULL DEFAULT 'Curador de Comunidades';
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `description` text DEFAULT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `facebookUrl` varchar(512) DEFAULT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `twitterUrl` varchar(512) DEFAULT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `linkedinUrl` varchar(512) DEFAULT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `websiteUrl` varchar(512) DEFAULT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `imageUrl` varchar(512) DEFAULT NULL;
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `uploaders` ADD COLUMN IF NOT EXISTS `lastActiveAt` datetime NOT NULL DEFAULT current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: groups
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `groups` (
  `id` varchar(191) NOT NULL,
  `groupName` varchar(255) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `joinLink` varchar(512) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(255) NOT NULL DEFAULT '',
  `categoryId` varchar(191) NOT NULL,
  `country` varchar(255) NOT NULL DEFAULT '',
  `countryId` varchar(191) NOT NULL,
  `city` varchar(255) DEFAULT NULL,
  `keywords` text NOT NULL,
  `tags` text NOT NULL,
  `profileImage` varchar(512) DEFAULT NULL,
  `language` varchar(64) NOT NULL DEFAULT 'Espanol',
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `linkStatus` varchar(32) NOT NULL DEFAULT 'active',
  `isAdult` tinyint(1) NOT NULL DEFAULT 0,
  `submitSource` varchar(32) NOT NULL DEFAULT 'staff',
  `clicks` int(11) NOT NULL DEFAULT 0,
  `joinCount` int(11) NOT NULL DEFAULT 0,
  `avgRating` float NOT NULL DEFAULT 0,
  `ratingCount` int(11) NOT NULL DEFAULT 0,
  `views` int(11) NOT NULL DEFAULT 0,
  `shares` int(11) NOT NULL DEFAULT 0,
  `uploaderId` varchar(191) DEFAULT NULL,
  `ugcSubmissionId` varchar(191) DEFAULT NULL,
  `ugcContributorId` varchar(191) DEFAULT NULL,
  `lastValidatedAt` datetime DEFAULT NULL,
  `imageRefreshedAt` datetime DEFAULT NULL,
  `lastActiveAt` datetime DEFAULT NULL,
  `popularityBadge` varchar(64) DEFAULT NULL,
  `contactName` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_groups_category` (`categoryId`),
  KEY `idx_groups_country` (`countryId`),
  KEY `idx_groups_status` (`status`),
  KEY `idx_groups_linkStatus` (`linkStatus`),
  KEY `idx_groups_isAdult` (`isAdult`),
  KEY `idx_groups_city` (`city`),
  KEY `idx_groups_clicks` (`clicks`),
  KEY `idx_groups_createdAt` (`createdAt`),
  KEY `idx_groups_pub_created` (`status`,`isAdult`,`createdAt`),
  KEY `idx_groups_pub_clicks` (`status`,`isAdult`,`clicks`),
  KEY `idx_groups_cat_pub` (`categoryId`,`status`,`isAdult`,`clicks`),
  KEY `idx_groups_country_pub` (`countryId`,`status`,`isAdult`,`clicks`),
  KEY `idx_groups_city_pub` (`city`(64),`status`,`isAdult`,`clicks`),
  KEY `idx_groups_joinLink` (`joinLink`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `groupName` varchar(255) NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `slug` varchar(191) NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `joinLink` varchar(512) NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `description` text NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `category` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `categoryId` varchar(191) NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `country` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `countryId` varchar(191) NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `city` varchar(255) DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `keywords` text NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `tags` text NOT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `profileImage` varchar(512) DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `language` varchar(64) NOT NULL DEFAULT 'Espanol';
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `status` varchar(32) NOT NULL DEFAULT 'pending';
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `linkStatus` varchar(32) NOT NULL DEFAULT 'active';
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `isAdult` tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `submitSource` varchar(32) NOT NULL DEFAULT 'staff';
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `clicks` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `joinCount` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `avgRating` float NOT NULL DEFAULT 0;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `ratingCount` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `views` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `shares` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `uploaderId` varchar(191) DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `ugcSubmissionId` varchar(191) DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `ugcContributorId` varchar(191) DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `lastValidatedAt` datetime DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `imageRefreshedAt` datetime DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `lastActiveAt` datetime DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `popularityBadge` varchar(64) DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `contactName` varchar(255) DEFAULT NULL;
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: groups_queue
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `groups_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `groupName` varchar(255) NOT NULL,
  `joinLink` varchar(512) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(255) NOT NULL DEFAULT '',
  `country` varchar(255) NOT NULL DEFAULT '',
  `city` varchar(255) DEFAULT NULL,
  `keywords` text NOT NULL,
  `tags` text NOT NULL,
  `profileImage` varchar(512) DEFAULT NULL,
  `uploaderId` varchar(191) DEFAULT NULL,
  `isAdult` tinyint(1) NOT NULL DEFAULT 0,
  `language` varchar(64) NOT NULL DEFAULT 'Espanol',
  `addedAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_gq_addedAt` (`addedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `groupName` varchar(255) NOT NULL;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `joinLink` varchar(512) NOT NULL;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `description` text NOT NULL;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `category` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `country` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `city` varchar(255) DEFAULT NULL;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `keywords` text NOT NULL;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `tags` text NOT NULL;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `profileImage` varchar(512) DEFAULT NULL;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `uploaderId` varchar(191) DEFAULT NULL;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `isAdult` tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `language` varchar(64) NOT NULL DEFAULT 'Espanol';
ALTER TABLE `groups_queue` ADD COLUMN IF NOT EXISTS `addedAt` datetime NOT NULL DEFAULT current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: blog_posts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` mediumtext NOT NULL,
  `coverEmoji` varchar(16) DEFAULT '?',
  `tags` varchar(500) DEFAULT NULL,
  `authorName` varchar(120) DEFAULT 'Equipo ConectaGrupos',
  `status` varchar(32) NOT NULL DEFAULT 'draft',
  `metaTitle` varchar(255) DEFAULT NULL,
  `metaDescription` varchar(500) DEFAULT NULL,
  `readingMinutes` int(11) NOT NULL DEFAULT 4,
  `views` int(11) NOT NULL DEFAULT 0,
  `publishedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_blog_status_published` (`status`,`publishedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `slug` varchar(191) NOT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `title` varchar(255) NOT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `excerpt` varchar(500) DEFAULT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `content` mediumtext NOT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `coverEmoji` varchar(16) DEFAULT '?';
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `tags` varchar(500) DEFAULT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `authorName` varchar(120) DEFAULT 'Equipo ConectaGrupos';
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `status` varchar(32) NOT NULL DEFAULT 'draft';
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `metaTitle` varchar(255) DEFAULT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `metaDescription` varchar(500) DEFAULT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `readingMinutes` int(11) NOT NULL DEFAULT 4;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `views` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `publishedAt` datetime DEFAULT NULL;
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `blog_posts` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: entity_intros
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `entity_intros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entityType` varchar(32) NOT NULL,
  `entityName` varchar(255) NOT NULL,
  `customTitle` varchar(512) DEFAULT NULL,
  `customHeroDesc` text DEFAULT NULL,
  `customIntro` text DEFAULT NULL,
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_intro_type_name` (`entityType`,`entityName`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `entity_intros` ADD COLUMN IF NOT EXISTS `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `entity_intros` ADD COLUMN IF NOT EXISTS `entityType` varchar(32) NOT NULL;
ALTER TABLE `entity_intros` ADD COLUMN IF NOT EXISTS `entityName` varchar(255) NOT NULL;
ALTER TABLE `entity_intros` ADD COLUMN IF NOT EXISTS `customTitle` varchar(512) DEFAULT NULL;
ALTER TABLE `entity_intros` ADD COLUMN IF NOT EXISTS `customHeroDesc` text DEFAULT NULL;
ALTER TABLE `entity_intros` ADD COLUMN IF NOT EXISTS `customIntro` text DEFAULT NULL;
ALTER TABLE `entity_intros` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: group_feedback
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `group_feedback` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `groupId` varchar(191) NOT NULL,
  `visitorHash` char(64) NOT NULL,
  `action` enum('like','dislike') NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_visitor_group` (`groupId`,`visitorHash`),
  KEY `idx_groupId` (`groupId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `group_feedback` ADD COLUMN IF NOT EXISTS `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `group_feedback` ADD COLUMN IF NOT EXISTS `groupId` varchar(191) NOT NULL;
ALTER TABLE `group_feedback` ADD COLUMN IF NOT EXISTS `visitorHash` char(64) NOT NULL;
ALTER TABLE `group_feedback` ADD COLUMN IF NOT EXISTS `action` enum('like','dislike') NOT NULL;
ALTER TABLE `group_feedback` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `group_feedback` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: group_reviews
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `group_reviews` (
  `id` varchar(191) NOT NULL,
  `groupId` varchar(191) NOT NULL,
  `rating` int(11) NOT NULL,
  `ipHash` varchar(191) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_review_group_ip` (`groupId`,`ipHash`),
  KEY `idx_reviews_group` (`groupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `group_reviews` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `group_reviews` ADD COLUMN IF NOT EXISTS `groupId` varchar(191) NOT NULL;
ALTER TABLE `group_reviews` ADD COLUMN IF NOT EXISTS `rating` int(11) NOT NULL;
ALTER TABLE `group_reviews` ADD COLUMN IF NOT EXISTS `ipHash` varchar(191) NOT NULL;
ALTER TABLE `group_reviews` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: group_reports
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `group_reports` (
  `id` varchar(191) NOT NULL,
  `groupId` varchar(191) NOT NULL,
  `reporterIp` varchar(64) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'OPEN',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_reports_group` (`groupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `group_reports` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `group_reports` ADD COLUMN IF NOT EXISTS `groupId` varchar(191) NOT NULL;
ALTER TABLE `group_reports` ADD COLUMN IF NOT EXISTS `reporterIp` varchar(64) NOT NULL;
ALTER TABLE `group_reports` ADD COLUMN IF NOT EXISTS `reason` text DEFAULT NULL;
ALTER TABLE `group_reports` ADD COLUMN IF NOT EXISTS `status` varchar(32) NOT NULL DEFAULT 'OPEN';
ALTER TABLE `group_reports` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: group_daily_stats
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `group_daily_stats` (
  `groupId` varchar(191) NOT NULL,
  `day` date NOT NULL,
  `views` int(11) NOT NULL DEFAULT 0,
  `clicks` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`groupId`,`day`),
  KEY `idx_gds_day` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `group_daily_stats` ADD COLUMN IF NOT EXISTS `groupId` varchar(191) NOT NULL;
ALTER TABLE `group_daily_stats` ADD COLUMN IF NOT EXISTS `day` date NOT NULL;
ALTER TABLE `group_daily_stats` ADD COLUMN IF NOT EXISTS `views` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `group_daily_stats` ADD COLUMN IF NOT EXISTS `clicks` int(11) NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Table: link_checks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `link_checks` (
  `id` varchar(191) NOT NULL,
  `groupId` varchar(191) NOT NULL,
  `ok` tinyint(1) NOT NULL DEFAULT 1,
  `inviteCodeLength` int(11) DEFAULT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'verify-page',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_link_checks_group` (`groupId`),
  KEY `idx_link_checks_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `link_checks` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `link_checks` ADD COLUMN IF NOT EXISTS `groupId` varchar(191) NOT NULL;
ALTER TABLE `link_checks` ADD COLUMN IF NOT EXISTS `ok` tinyint(1) NOT NULL DEFAULT 1;
ALTER TABLE `link_checks` ADD COLUMN IF NOT EXISTS `inviteCodeLength` int(11) DEFAULT NULL;
ALTER TABLE `link_checks` ADD COLUMN IF NOT EXISTS `detail` varchar(255) DEFAULT NULL;
ALTER TABLE `link_checks` ADD COLUMN IF NOT EXISTS `source` varchar(32) NOT NULL DEFAULT 'verify-page';
ALTER TABLE `link_checks` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: seo_overrides
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `seo_overrides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pageType` varchar(64) NOT NULL,
  `entityId` varchar(191) NOT NULL,
  `metaTitleOverride` varchar(512) DEFAULT NULL,
  `metaDescriptionOverride` text DEFAULT NULL,
  `robotsOverride` varchar(255) DEFAULT NULL,
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seo_page_entity` (`pageType`,`entityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `seo_overrides` ADD COLUMN IF NOT EXISTS `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `seo_overrides` ADD COLUMN IF NOT EXISTS `pageType` varchar(64) NOT NULL;
ALTER TABLE `seo_overrides` ADD COLUMN IF NOT EXISTS `entityId` varchar(191) NOT NULL;
ALTER TABLE `seo_overrides` ADD COLUMN IF NOT EXISTS `metaTitleOverride` varchar(512) DEFAULT NULL;
ALTER TABLE `seo_overrides` ADD COLUMN IF NOT EXISTS `metaDescriptionOverride` text DEFAULT NULL;
ALTER TABLE `seo_overrides` ADD COLUMN IF NOT EXISTS `robotsOverride` varchar(255) DEFAULT NULL;
ALTER TABLE `seo_overrides` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: ugc_contributors
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `ugc_contributors` (
  `id` varchar(191) NOT NULL,
  `contributorUid` varchar(191) NOT NULL,
  `displayName` varchar(255) NOT NULL,
  `displaySlug` varchar(191) NOT NULL,
  `internalUsernameKey` varchar(255) NOT NULL,
  `avatarUrl` varchar(512) NOT NULL DEFAULT '',
  `passkeyHash` varchar(255) NOT NULL,
  `deviceTokenHash` varchar(191) DEFAULT NULL,
  `ipHashFirst` varchar(191) DEFAULT NULL,
  `ipHashLast` varchar(191) DEFAULT NULL,
  `publishedCount` int(11) NOT NULL DEFAULT 0,
  `submittedCount` int(11) NOT NULL DEFAULT 0,
  `rejectedCount` int(11) NOT NULL DEFAULT 0,
  `reputationScore` int(11) NOT NULL DEFAULT 0,
  `lastSubmissionAt` datetime DEFAULT NULL,
  `isBlocked` tinyint(1) NOT NULL DEFAULT 0,
  `isRemoved` tinyint(1) NOT NULL DEFAULT 0,
  `blockedReason` varchar(512) NOT NULL DEFAULT '',
  `removeReason` varchar(512) NOT NULL DEFAULT '',
  `removedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `contributorUid` (`contributorUid`),
  UNIQUE KEY `displaySlug` (`displaySlug`),
  KEY `idx_ugcc_slug` (`displaySlug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `contributorUid` varchar(191) NOT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `displayName` varchar(255) NOT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `displaySlug` varchar(191) NOT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `internalUsernameKey` varchar(255) NOT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `avatarUrl` varchar(512) NOT NULL DEFAULT '';
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `passkeyHash` varchar(255) NOT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `deviceTokenHash` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `ipHashFirst` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `ipHashLast` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `publishedCount` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `submittedCount` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `rejectedCount` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `reputationScore` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `lastSubmissionAt` datetime DEFAULT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `isBlocked` tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `isRemoved` tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `blockedReason` varchar(512) NOT NULL DEFAULT '';
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `removeReason` varchar(512) NOT NULL DEFAULT '';
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `removedAt` datetime DEFAULT NULL;
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `ugc_contributors` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: ugc_submissions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `ugc_submissions` (
  `id` varchar(191) NOT NULL,
  `submissionUid` varchar(191) NOT NULL,
  `inviteUrl` varchar(512) NOT NULL,
  `inviteCode` varchar(255) NOT NULL,
  `fetchedGroupName` varchar(255) NOT NULL DEFAULT '',
  `editedGroupName` varchar(255) NOT NULL DEFAULT '',
  `fetchedImageUrl` varchar(512) NOT NULL DEFAULT '',
  `finalImageUrl` varchar(512) NOT NULL DEFAULT '',
  `categoryId` varchar(191) DEFAULT NULL,
  `categoryNameSnapshot` varchar(255) NOT NULL DEFAULT '',
  `isAdult` tinyint(1) NOT NULL DEFAULT 0,
  `country` varchar(255) NOT NULL DEFAULT '',
  `city` varchar(255) NOT NULL DEFAULT '',
  `selectedTagsJson` text NOT NULL,
  `keywordsJson` text NOT NULL,
  `detectedLanguage` varchar(64) NOT NULL DEFAULT '',
  `contributorId` varchar(191) DEFAULT NULL,
  `contributorDisplayNameSnap` varchar(255) NOT NULL DEFAULT '',
  `contributorImageSnap` varchar(512) NOT NULL DEFAULT '',
  `status` varchar(64) NOT NULL DEFAULT 'draft',
  `score` int(11) NOT NULL DEFAULT 0,
  `scoreBreakdownJson` text NOT NULL,
  `adminNotes` text DEFAULT NULL,
  `systemFlagsJson` text NOT NULL,
  `duplicateOfGroupId` varchar(191) DEFAULT NULL,
  `ipHash` varchar(191) DEFAULT NULL,
  `userAgentHash` varchar(191) DEFAULT NULL,
  `deviceTokenHash` varchar(191) DEFAULT NULL,
  `referrer` varchar(512) NOT NULL DEFAULT '',
  `submittedAt` datetime DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `publishedAt` datetime DEFAULT NULL,
  `publishedGroupId` varchar(191) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `submissionUid` (`submissionUid`),
  KEY `idx_ugcs_status` (`status`),
  KEY `idx_ugcs_inviteCode` (`inviteCode`),
  KEY `idx_ugcs_contributor` (`contributorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `submissionUid` varchar(191) NOT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `inviteUrl` varchar(512) NOT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `inviteCode` varchar(255) NOT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `fetchedGroupName` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `editedGroupName` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `fetchedImageUrl` varchar(512) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `finalImageUrl` varchar(512) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `categoryId` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `categoryNameSnapshot` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `isAdult` tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `country` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `city` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `selectedTagsJson` text NOT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `keywordsJson` text NOT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `detectedLanguage` varchar(64) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `contributorId` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `contributorDisplayNameSnap` varchar(255) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `contributorImageSnap` varchar(512) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `status` varchar(64) NOT NULL DEFAULT 'draft';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `score` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `scoreBreakdownJson` text NOT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `adminNotes` text DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `systemFlagsJson` text NOT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `duplicateOfGroupId` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `ipHash` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `userAgentHash` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `deviceTokenHash` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `referrer` varchar(512) NOT NULL DEFAULT '';
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `submittedAt` datetime DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `reviewedAt` datetime DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `publishedAt` datetime DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `publishedGroupId` varchar(191) DEFAULT NULL;
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `ugc_submissions` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: ugc_settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `ugc_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(191) NOT NULL,
  `value` text NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `ugc_settings` ADD COLUMN IF NOT EXISTS `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `ugc_settings` ADD COLUMN IF NOT EXISTS `key` varchar(191) NOT NULL;
ALTER TABLE `ugc_settings` ADD COLUMN IF NOT EXISTS `value` text NOT NULL;
ALTER TABLE `ugc_settings` ADD COLUMN IF NOT EXISTS `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- ---------------------------------------------------------------------------
-- Table: fav_lists
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `fav_lists` (
  `id` varchar(191) NOT NULL,
  `shareCode` varchar(24) NOT NULL,
  `title` varchar(120) DEFAULT NULL,
  `groupIdsJson` text NOT NULL,
  `viewCount` int(11) NOT NULL DEFAULT 0,
  `creatorIpHash` varchar(191) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `lastViewedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shareCode` (`shareCode`),
  KEY `idx_fav_lists_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `fav_lists` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `fav_lists` ADD COLUMN IF NOT EXISTS `shareCode` varchar(24) NOT NULL;
ALTER TABLE `fav_lists` ADD COLUMN IF NOT EXISTS `title` varchar(120) DEFAULT NULL;
ALTER TABLE `fav_lists` ADD COLUMN IF NOT EXISTS `groupIdsJson` text NOT NULL;
ALTER TABLE `fav_lists` ADD COLUMN IF NOT EXISTS `viewCount` int(11) NOT NULL DEFAULT 0;
ALTER TABLE `fav_lists` ADD COLUMN IF NOT EXISTS `creatorIpHash` varchar(191) DEFAULT NULL;
ALTER TABLE `fav_lists` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();
ALTER TABLE `fav_lists` ADD COLUMN IF NOT EXISTS `lastViewedAt` datetime DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- Table: newsletter
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `newsletter` (
  `id` varchar(191) NOT NULL,
  `email` varchar(255) NOT NULL,
  `source` varchar(64) NOT NULL DEFAULT 'footer',
  `status` varchar(32) NOT NULL DEFAULT 'SUBSCRIBED',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `newsletter` ADD COLUMN IF NOT EXISTS `id` varchar(191) NOT NULL;
ALTER TABLE `newsletter` ADD COLUMN IF NOT EXISTS `email` varchar(255) NOT NULL;
ALTER TABLE `newsletter` ADD COLUMN IF NOT EXISTS `source` varchar(64) NOT NULL DEFAULT 'footer';
ALTER TABLE `newsletter` ADD COLUMN IF NOT EXISTS `status` varchar(32) NOT NULL DEFAULT 'SUBSCRIBED';
ALTER TABLE `newsletter` ADD COLUMN IF NOT EXISTS `createdAt` datetime NOT NULL DEFAULT current_timestamp();

SET FOREIGN_KEY_CHECKS = 1;
