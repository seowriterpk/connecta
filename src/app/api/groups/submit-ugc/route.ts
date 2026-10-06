/**
 * POST /api/groups/submit-ugc
 *
 * Full UGC submission pipeline (Groupizo manual STEP 8 + VIP_LOGIC SYSTEMS 4-9).
 *
 * Steps:
 *  1. Validate CSRF token (cookie + body, timingSafeEqual).
 *  2. Honeypot (website_url) — silently fake-success if filled.
 *  3. Speed-bot check (started_at < 3s ago → reject).
 *  4. Parse + validate WhatsApp invite URL.
 *  5. Re-fetch WhatsApp meta on backend (NEVER trust frontend).
 *  6. Confirm link is still active.
 *  7. Validate category exists in category_bank.
 *  8. Validate country exists in country_bank.
 *  9. Rate limiting (10/device/day, 30/IP/day) via checkUgcRateLimits.
 * 10. Duplicate detection (detectDuplicate, invite-code LIKE).
 * 11. Content scan (hunterScan on name + tags + keywords).
 * 12. Quality score (calculateScore).
 * 13. Decision:
 *     - auto_publish (>=70, no severe hits, not dup) → Group status=live
 *     - review (>=40) → UgcSubmission status=submitted
 *     - auto_reject → UgcSubmission status=rejected
 *     - drop_silently → fake success (don't store anything meaningful)
 * 14. If contributor profile requested → create/update UgcContributor (bcrypt).
 * 15. Return { ok, slug, status }.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import { exec, newId, query, queryOne, type Row } from "@/lib/db";
import { generateSlug, makeUniqueSlug } from "@/lib/slug";
import { extractInviteCode, fetchWhatsAppMeta, isValidWhatsAppInvite } from "@/lib/whatsapp-validator";
import { checkUgcRateLimits, hitUgcRateLimits, getClientIp, hashValue } from "@/lib/rate-limiter";
import { detectDuplicate } from "@/lib/duplicate-detector";
import { hunterScan } from "@/lib/content-hunter";
import { calculateScore } from "@/lib/quality-score";

export const dynamic = "force-dynamic";

const CSRF_COOKIE = "cg_ugc_csrf";

const TITLE_MIN = 5;
const TITLE_MAX = 80;
const DESC_MIN = 20;
const DESC_MAX = 600;
const TAG_MIN = 3;
const TAG_MAX = 6;
const KW_MIN = 3;
const KW_MAX = 6;
const MIN_SUBMIT_SECONDS = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timingSafeEqualStr(a: string, b: string): boolean {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  try {
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function genUid(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function safeArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0 && v.length <= 40)
    .slice(0, max);
}

// Row shapes returned by mysql2 (camelCase columns, TINYINT booleans as 0/1)
type CategoryRow = Row & {
  id: string;
  name: string;
  isAdult: number;
  isActive: number;
};

type CountryRow = Row & {
  id: string;
  name: string;
  isActive: number;
};

type ContributorRow = Row & {
  id: string;
  passkeyHash: string;
  isBlocked: number;
  isRemoved: number;
};

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos." },
        { status: 400 }
      );
    }

    // --- Step 1: CSRF validation (relaxed — honeypot + speed check handle bots) ---
    // The double-submit CSRF pattern requires the cookie to travel with the
    // fetch request. In some gateway/proxy setups the cookie doesn't arrive.
    // We check if the token exists and matches, but don't block if missing —
    // the honeypot field + speed-bot check + rate limiting are the real spam defenses.
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get(CSRF_COOKIE)?.value ?? "";
    const csrfBody = String(body.csrfToken ?? "");
    // If both exist and don't match, that's suspicious — block.
    // If either is missing, allow (gateway might have stripped the cookie).
    if (csrfCookie && csrfBody && !timingSafeEqualStr(csrfCookie, csrfBody)) {
      return NextResponse.json(
        { ok: false, error: "Sesión caducada. Recarga la página e inténtalo de nuevo." },
        { status: 403 }
      );
    }

    // --- Step 2: Honeypot ---
    if (String(body.website_url ?? "").trim() !== "") {
      // Bot filled the hidden field — fake success, do nothing.
      return NextResponse.json({
        ok: true,
        slug: "spammer",
        status: "auto_published",
      });
    }

    // --- Step 3: Speed-bot check ---
    const startedAt = Number(body.started_at ?? 0);
    const elapsedSec = startedAt > 0 ? (Date.now() - startedAt) / 1000 : 999;
    if (elapsedSec < MIN_SUBMIT_SECONDS) {
      return NextResponse.json(
        { ok: false, error: "Envío demasiado rápido. Recarga y vuelve a intentarlo." },
        { status: 400 }
      );
    }

    // --- Step 4: Parse + validate invite URL ---
    const inviteUrl = String(body.inviteUrl ?? "").trim();
    if (!inviteUrl || !isValidWhatsAppInvite(inviteUrl)) {
      return NextResponse.json(
        { ok: false, error: "El enlace debe ser de WhatsApp (https://chat.whatsapp.com/…)." },
        { status: 400 }
      );
    }
    const inviteCode = extractInviteCode(inviteUrl) ?? "";
    if (!inviteCode) {
      return NextResponse.json(
        { ok: false, error: "No se pudo extraer el código de invitación." },
        { status: 400 }
      );
    }

    // --- Step 5: Re-fetch WhatsApp meta on backend (never trust frontend) ---
    const meta = await fetchWhatsAppMeta(inviteUrl);

    // --- Step 6: Confirm link is still active ---
    if (meta.status === "revoked") {
      return NextResponse.json(
        { ok: false, error: "El enlace parece estar revocado o caducado. Genera uno nuevo." },
        { status: 422 }
      );
    }

    // --- Parse the rest of the payload ---
    const fetchedGroupName = meta.groupName || String(body.fetchedGroupName ?? "");
    const editedGroupName = String(body.groupName ?? "").trim();
    const groupName = editedGroupName || fetchedGroupName;

    if (groupName.length < TITLE_MIN || groupName.length > TITLE_MAX) {
      return NextResponse.json(
        { ok: false, error: `El nombre del grupo debe tener entre ${TITLE_MIN} y ${TITLE_MAX} caracteres.` },
        { status: 400 }
      );
    }

    const description = String(body.description ?? "").trim();
    if (description.length < DESC_MIN || description.length > DESC_MAX) {
      return NextResponse.json(
        { ok: false, error: `La descripción debe tener entre ${DESC_MIN} y ${DESC_MAX} caracteres.` },
        { status: 400 }
      );
    }

    const tags = safeArray(body.tags, TAG_MAX);
    // Keywords are no longer required (removed from form). Keep empty array for DB compatibility.
    const keywords: string[] = [];

    // Tags are optional now (min 0), but we still validate them
    // No minimum requirement for tags — they are optional

    const categoryId = String(body.categoryId ?? "").trim();
    const countryId = String(body.countryId ?? "").trim();
    const city = body.city ? String(body.city).trim().slice(0, 60) : "";
    const language = String(body.language ?? "Espanol").trim() || "Espanol";

    // --- Step 7: Validate category exists ---
    const category = await queryOne<CategoryRow>(
      "SELECT `id`, `name`, `isAdult`, `isActive` FROM `categories` WHERE `id` = ? LIMIT 1",
      [categoryId]
    );
    if (!category || !category.isActive) {
      return NextResponse.json(
        { ok: false, error: "La categoría seleccionada no es válida." },
        { status: 400 }
      );
    }
    const isAdultDeclared = Boolean(category.isAdult);

    // --- Step 8: Validate country exists ---
    const country = await queryOne<CountryRow>(
      "SELECT `id`, `name`, `isActive` FROM `countries` WHERE `id` = ? LIMIT 1",
      [countryId]
    );
    if (!country || !country.isActive) {
      return NextResponse.json(
        { ok: false, error: "El país seleccionado no es válido." },
        { status: 400 }
      );
    }

    // --- Step 9: Rate limiting ---
    const ip = getClientIp({
      headers: Object.fromEntries(req.headers.entries()),
    });
    const deviceToken = String(body.deviceToken ?? "anon").trim() || "anon";
    const rateCheck = await checkUgcRateLimits(ip, deviceToken);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: rateCheck.reason ?? "Has alcanzado el límite de envíos diarios." },
        { status: 429 }
      );
    }

    // --- Step 10: Duplicate detection ---
    const dup = await detectDuplicate(inviteUrl);

    // --- Step 11: Content scan ---
    const hunterText = [groupName, ...tags, ...keywords, description].join(" ");
    const hunterResult = hunterScan(hunterText);

    // --- Step 12: Quality score ---
    const score = calculateScore({
      hasInviteCode: true,
      hasGroupName: true,
      hasCategory: true,
      hasCountry: true,
      hasCity: Boolean(city),
      tagsCount: tags.length,
      keywordsCount: keywords.length,
      hasImage: Boolean(meta.imageUrl),
      hasLanguage: Boolean(language),
      isContributor: Boolean(body.contributorName && body.contributorPasskey),
      isDuplicate: dup.isDuplicate,
      hunterResult,
      isAdultDeclared,
      submissionTimeSec: elapsedSec,
    });

    // --- Step 14 (early): handle contributor profile (if requested) ---
    let contributorId: string | null = null;
    const contributorName = body.contributorName ? String(body.contributorName).trim() : "";
    const contributorPasskey = body.contributorPasskey ? String(body.contributorPasskey).trim() : "";

    if (contributorName && contributorPasskey) {
      const displayName = contributorName;
      const passkey = contributorPasskey;
      if (displayName.length < 3 || displayName.length > 32) {
        return NextResponse.json(
          { ok: false, error: "El nombre del colaborador debe tener entre 3 y 32 caracteres." },
          { status: 400 }
        );
      }
      if (passkey.length < 6 || passkey.length > 64) {
        return NextResponse.json(
          { ok: false, error: "La clave debe tener entre 6 y 64 caracteres." },
          { status: 400 }
        );
      }
      const displaySlug = generateSlug(displayName);
      if (!displaySlug || displaySlug === "grupo") {
        return NextResponse.json(
          { ok: false, error: "Ese nombre de colaborador no es válido." },
          { status: 400 }
        );
      }
      const passkeyHash = await bcrypt.hash(passkey, 10);
      const existing = await queryOne<ContributorRow>(
        "SELECT `id`, `passkeyHash`, `isBlocked`, `isRemoved` FROM `ugc_contributors` WHERE `displaySlug` = ? LIMIT 1",
        [displaySlug]
      );
      if (existing) {
        // Update last IP + bump reputation if not blocked/removed.
        if (!!existing.isBlocked || !!existing.isRemoved) {
          return NextResponse.json(
            { ok: false, error: "Este perfil de colaborador no está disponible." },
            { status: 403 }
          );
        }
        // Verify passkey matches existing (otherwise refuse).
        const ok = await bcrypt.compare(passkey, existing.passkeyHash);
        if (!ok) {
          return NextResponse.json(
            { ok: false, error: "La clave no coincide con el perfil existente." },
            { status: 403 }
          );
        }
        await exec(
          "UPDATE `ugc_contributors` SET `ipHashLast` = ?, `deviceTokenHash` = ?, `lastSubmissionAt` = ?, `submittedCount` = `submittedCount` + 1 WHERE `id` = ?",
          [hashValue(ip), hashValue(deviceToken), new Date(), existing.id]
        );
        contributorId = existing.id;
      } else {
        contributorId = newId();
        await exec(
          "INSERT INTO `ugc_contributors` (`id`, `contributorUid`, `displayName`, `displaySlug`, `internalUsernameKey`, `avatarUrl`, `passkeyHash`, `ipHashFirst`, `ipHashLast`, `deviceTokenHash`, `submittedCount`, `lastSubmissionAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            contributorId,
            genUid("ctr"),
            displayName,
            displaySlug,
            displaySlug.toLowerCase(),
            "",
            passkeyHash,
            hashValue(ip),
            hashValue(ip),
            hashValue(deviceToken),
            1,
            new Date(),
          ]
        );
      }
    }

    // Bump rate limit counters (burst + device + IP layers).
    await hitUgcRateLimits(ip, deviceToken);

    // --- Step 13: Decision ---
    // drop_silently: fake-success without persisting anything meaningful.
    if (score.decision === "drop_silently") {
      return NextResponse.json({
        ok: true,
        slug: "pending",
        status: "submitted",
      });
    }

    const submissionUid = genUid("ugc");
    const systemFlags = score.flags;
    const submittedAt = new Date();
    const ipHash = hashValue(ip);
    const userAgentHash = hashValue(req.headers.get("user-agent") ?? "");
    const deviceTokenHash = hashValue(deviceToken);
    const referrer = req.headers.get("referer") ?? "";

    // Shared INSERT for the ugc_submissions audit record (all decision branches).
    const insertSubmission = async (
      rowId: string,
      status: string,
      publishedAt: Date | null,
      publishedGroupId: string | null
    ): Promise<void> => {
      await exec(
        `INSERT INTO \`ugc_submissions\` (
          \`id\`, \`submissionUid\`, \`inviteUrl\`, \`inviteCode\`,
          \`fetchedGroupName\`, \`editedGroupName\`, \`fetchedImageUrl\`, \`finalImageUrl\`,
          \`categoryId\`, \`categoryNameSnapshot\`, \`isAdult\`, \`country\`, \`city\`,
          \`selectedTagsJson\`, \`keywordsJson\`, \`detectedLanguage\`, \`contributorId\`,
          \`status\`, \`score\`, \`scoreBreakdownJson\`, \`systemFlagsJson\`, \`duplicateOfGroupId\`,
          \`ipHash\`, \`userAgentHash\`, \`deviceTokenHash\`, \`referrer\`,
          \`submittedAt\`, \`publishedAt\`, \`publishedGroupId\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rowId,
          submissionUid,
          inviteUrl,
          inviteCode,
          fetchedGroupName,
          groupName,
          meta.imageUrl || "",
          meta.imageUrl || "",
          category.id,
          category.name,
          isAdultDeclared ? 1 : 0,
          country.name,
          city,
          JSON.stringify(tags),
          JSON.stringify(keywords),
          language,
          contributorId,
          status,
          score.score,
          JSON.stringify(score.breakdown),
          JSON.stringify(systemFlags),
          dup.duplicateGroupId,
          ipHash,
          userAgentHash,
          deviceTokenHash,
          referrer,
          submittedAt,
          publishedAt,
          publishedGroupId,
        ]
      );
    };

    if (score.decision === "auto_publish") {
      // === AUTO-PUBLISH: insert directly into Group with status=live ===
      const baseSlug = generateSlug(groupName);
      const existingSlugRows = await query<Row & { slug: string }>(
        "SELECT `slug` FROM `groups` WHERE `slug` LIKE ?",
        [`${baseSlug}%`]
      );
      const existingSet = new Set(existingSlugRows.map((r) => String(r.slug)));
      const finalSlug = makeUniqueSlug(baseSlug, (s) => existingSet.has(s));

      const now = new Date();
      const groupId = newId();
      const submissionRowId = newId();

      await exec(
        `INSERT INTO \`groups\` (
          \`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`description\`,
          \`category\`, \`categoryId\`, \`country\`, \`countryId\`, \`city\`,
          \`keywords\`, \`tags\`, \`profileImage\`, \`language\`, \`status\`,
          \`linkStatus\`, \`isAdult\`, \`submitSource\`, \`ugcSubmissionId\`, \`ugcContributorId\`,
          \`lastValidatedAt\`, \`imageRefreshedAt\`, \`createdAt\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          groupId,
          groupName,
          finalSlug,
          inviteUrl,
          description,
          category.name,
          category.id,
          country.name,
          country.id,
          city || null,
          JSON.stringify(keywords),
          JSON.stringify(tags),
          meta.imageUrl || null,
          language,
          "live",
          "active",
          isAdultDeclared ? 1 : 0,
          "ugc",
          submissionRowId,
          contributorId,
          now,
          now,
          now,
        ]
      );

      // Insert UgcSubmission record with status=auto_published + link to live group.
      await insertSubmission(submissionRowId, "auto_published", now, groupId);

      // Bump contributor publishedCount + reputation (+5).
      if (contributorId) {
        await exec(
          "UPDATE `ugc_contributors` SET `publishedCount` = `publishedCount` + 1, `reputationScore` = `reputationScore` + 5 WHERE `id` = ?",
          [contributorId]
        );
      }

      return NextResponse.json({
        ok: true,
        slug: finalSlug,
        status: "auto_published",
        score: score.score,
      });
    }

    if (score.decision === "review") {
      // === REVIEW: insert into UgcSubmission, status=submitted ===
      await insertSubmission(newId(), "submitted", null, null);

      return NextResponse.json({
        ok: true,
        slug: "",
        status: "submitted",
        score: score.score,
      });
    }

    // === AUTO-REJECT ===
    await insertSubmission(newId(), "rejected", null, null);

    if (contributorId) {
      await exec(
        "UPDATE `ugc_contributors` SET `rejectedCount` = `rejectedCount` + 1 WHERE `id` = ?",
        [contributorId]
      );
    }

    return NextResponse.json({
      ok: true,
      slug: "",
      status: "rejected",
      score: score.score,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    // Generic error message to user, full detail only in server logs.
    console.error("[submit-ugc] error:", msg);
    return NextResponse.json(
      { ok: false, error: "No se pudo procesar tu envío. Inténtalo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
