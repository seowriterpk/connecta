/**
 * ugc-admin.ts — shared UGC submission admin logic (Task 22).
 *
 * Used by BOTH the single-action route (POST /api/admin/ugc/[id]) and the
 * new bulk-action route (POST /api/admin/ugc/bulk) so approve/reject/spam
 * behave identically everywhere. Also holds the inline-edit whitelist for
 * PUT /api/admin/ugc/[id] (edit without page reload).
 */

import { clearDataCache } from "@/lib/cache";
import { exec, newId, query, queryOne, type Row } from "@/lib/db";
import { generateSlug, makeUniqueSlug } from "@/lib/slug";

export type UgcAction = "approve" | "reject" | "spam";

export const UGC_ACTION_TO_STATUS: Record<UgcAction, string> = {
  approve: "approved",
  reject: "rejected",
  spam: "spam",
};

export interface SubmissionRow extends Row {
  id: string;
  submissionUid: string;
  inviteUrl: string;
  fetchedGroupName: string;
  editedGroupName: string;
  fetchedImageUrl: string;
  finalImageUrl: string;
  categoryId: string | null;
  categoryNameSnapshot: string;
  country: string;
  city: string;
  selectedTagsJson: string;
  keywordsJson: string;
  detectedLanguage: string;
  contributorId: string | null;
  status: string;
  isAdult: number;
}

export type UgcActionResult =
  | {
      ok: true;
      status: string;
      publishedGroupId: string | null;
      publishedSlug: string | null;
      name: string;
    }
  | { ok: false; code: 404 | 400; error: string };

/**
 * Apply approve / reject / spam to ONE submission (used single + bulk).
 * Never throws — callers map {ok:false} results to row-level failures.
 */
export async function applyUgcAction(
  id: string,
  action: UgcAction
): Promise<UgcActionResult> {
  const sub = await queryOne<SubmissionRow>(
    "SELECT * FROM `ugc_submissions` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!sub) {
    return { ok: false, code: 404, error: "Envío no encontrado." };
  }

  const newStatus = UGC_ACTION_TO_STATUS[action];
  const now = new Date();

  let publishedGroupId: string | null = null;
  let publishedSlug: string | null = null;

  if (action === "approve") {
    let categoryId = sub.categoryId;
    let categoryName = sub.categoryNameSnapshot;

    if (!categoryId) {
      const cat = await queryOne<Row>(
        "SELECT `id`, `name` FROM `categories` WHERE `name` = ? LIMIT 1",
        [sub.categoryNameSnapshot]
      );
      if (!cat) {
        return {
          ok: false,
          code: 400,
          error: "Categoría no resuelta. Edita el envío antes de aprobar.",
        };
      }
      categoryId = String((cat as { id: string }).id);
      categoryName = String((cat as { name: string }).name);
    }

    const country = await queryOne<Row>(
      "SELECT `id`, `name` FROM `countries` WHERE `name` = ? LIMIT 1",
      [sub.country]
    );
    if (!country) {
      return {
        ok: false,
        code: 400,
        error: "País no válido. Edita el envío antes de aprobar.",
      };
    }
    const countryName = String((country as { name: string }).name);

    const groupName = sub.editedGroupName || sub.fetchedGroupName;
    if (!groupName) {
      return { ok: false, code: 400, error: "El envío no tiene nombre." };
    }

    const baseSlug = generateSlug(groupName);
    const slugRows = await query<Row>(
      "SELECT `slug` FROM `groups` WHERE `slug` LIKE ?",
      [`${baseSlug}%`]
    );
    const slugSet = new Set(slugRows.map((r) => String((r as { slug: string }).slug)));
    const finalSlug = makeUniqueSlug(baseSlug, (s) => slugSet.has(s));

    let tags: string[] = [];
    let keywords: string[] = [];
    try {
      tags = JSON.parse(sub.selectedTagsJson || "[]");
    } catch {
      /* ignore */
    }
    try {
      keywords = JSON.parse(sub.keywordsJson || "[]");
    } catch {
      /* ignore */
    }

    publishedGroupId = newId();
    const countryId = String((country as { id: string }).id);

    await exec(
      `INSERT INTO \`groups\` (
        \`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`description\`,
        \`category\`, \`categoryId\`, \`country\`, \`countryId\`, \`city\`,
        \`keywords\`, \`tags\`, \`profileImage\`, \`language\`, \`status\`,
        \`linkStatus\`, \`isAdult\`, \`submitSource\`, \`ugcSubmissionId\`, \`ugcContributorId\`,
        \`createdAt\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        publishedGroupId,
        groupName,
        finalSlug,
        sub.inviteUrl,
        "",
        categoryName,
        categoryId,
        countryName,
        countryId,
        sub.city || null,
        JSON.stringify(keywords),
        JSON.stringify(tags),
        sub.finalImageUrl || sub.fetchedImageUrl || null,
        sub.detectedLanguage || "Espanol",
        "live",
        "active",
        sub.isAdult ? 1 : 0,
        "ugc",
        sub.id,
        sub.contributorId ?? null,
        now,
      ]
    );

    publishedSlug = finalSlug;

    if (sub.contributorId) {
      await exec(
        "UPDATE `ugc_contributors` SET `publishedCount` = `publishedCount` + 1, `reputationScore` = `reputationScore` + 5, `lastSubmissionAt` = ? WHERE `id` = ?",
        [now, sub.contributorId]
      );
    }
  } else if (action === "reject") {
    if (sub.contributorId) {
      await exec(
        "UPDATE `ugc_contributors` SET `rejectedCount` = `rejectedCount` + 1 WHERE `id` = ?",
        [sub.contributorId]
      );
    }
  }

  await exec(
    "UPDATE `ugc_submissions` SET `status` = ?, `reviewedAt` = ?, `publishedAt` = ?, `publishedGroupId` = ? WHERE `id` = ?",
    [newStatus, now, action === "approve" ? now : null, publishedGroupId, id]
  );

  clearDataCache();

  return {
    ok: true,
    status: newStatus,
    publishedGroupId,
    publishedSlug,
    name: sub.editedGroupName || sub.fetchedGroupName || sub.submissionUid,
  };
}

export interface UgcEditPatch {
  editedGroupName?: string;
  categoryId?: string;
  country?: string;
  city?: string;
  selectedTags?: string[];
  keywords?: string[];
  isAdult?: boolean;
  adminNotes?: string;
}

/**
 * Inline edit (no reload): update the mutable fields of a submission.
 * Category is synced into `categoryNameSnapshot` (and `isAdult` is forced
 * on when the chosen category is adult-only) so approve keeps working.
 */
export async function updateUgcSubmission(
  id: string,
  patch: UgcEditPatch
): Promise<UgcActionResult> {
  const sub = await queryOne<SubmissionRow>(
    "SELECT * FROM `ugc_submissions` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!sub) {
    return { ok: false, code: 404, error: "Envío no encontrado." };
  }

  const sets: string[] = [];
  const values: unknown[] = [];

  if (typeof patch.editedGroupName === "string") {
    const name = patch.editedGroupName.trim().slice(0, 255);
    if (!name) {
      return { ok: false, code: 400, error: "El nombre no puede estar vacío." };
    }
    sets.push("`editedGroupName` = ?");
    values.push(name);
  }

  if (typeof patch.categoryId === "string" && patch.categoryId) {
    const cat = await queryOne<Row>(
      "SELECT `id`, `name`, `isAdult` FROM `categories` WHERE `id` = ? LIMIT 1",
      [patch.categoryId]
    );
    if (!cat) {
      return { ok: false, code: 400, error: "Categoría no válida." };
    }
    sets.push("`categoryId` = ?", "`categoryNameSnapshot` = ?");
    values.push(String((cat as { id: string }).id), String((cat as { name: string }).name));
    // An adult category forces the adult flag on (safety invariant).
    if ((cat as { isAdult: number | boolean }).isAdult) {
      patch.isAdult = true;
    }
  }

  if (typeof patch.country === "string") {
    const countryName = patch.country.trim();
    const country = countryName
      ? await queryOne<Row>(
          "SELECT `id`, `name` FROM `countries` WHERE `name` = ? LIMIT 1",
          [countryName]
        )
      : null;
    if (countryName && !country) {
      return { ok: false, code: 400, error: "País no válido." };
    }
    sets.push("`country` = ?");
    values.push(countryName);
  }

  if (typeof patch.city === "string") {
    sets.push("`city` = ?");
    values.push(patch.city.trim().slice(0, 255));
  }

  if (Array.isArray(patch.selectedTags)) {
    const tags = patch.selectedTags
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 30);
    sets.push("`selectedTagsJson` = ?");
    values.push(JSON.stringify(tags));
  }

  if (Array.isArray(patch.keywords)) {
    const kw = patch.keywords
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 30);
    sets.push("`keywordsJson` = ?");
    values.push(JSON.stringify(kw));
  }

  if (typeof patch.isAdult === "boolean") {
    sets.push("`isAdult` = ?");
    values.push(patch.isAdult ? 1 : 0);
  }

  if (typeof patch.adminNotes === "string") {
    sets.push("`adminNotes` = ?");
    values.push(patch.adminNotes.trim().slice(0, 2000));
  }

  if (sets.length === 0) {
    return { ok: true, status: sub.status, publishedGroupId: null, publishedSlug: null, name: sub.editedGroupName || sub.fetchedGroupName || sub.submissionUid };
  }

  values.push(id);
  await exec(`UPDATE \`ugc_submissions\` SET ${sets.join(", ")} WHERE \`id\` = ?`, values);
  clearDataCache();

  return {
    ok: true,
    status: sub.status,
    publishedGroupId: null,
    publishedSlug: null,
    name: sub.editedGroupName || sub.fetchedGroupName || sub.submissionUid,
  };
}
