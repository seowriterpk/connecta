import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { exec, newId, query, queryOne, type Row } from "@/lib/db";
import { generateSlug, makeUniqueSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type UgcAction = "approve" | "reject" | "spam";

const ACTION_TO_STATUS: Record<UgcAction, string> = {
  approve: "approved",
  reject: "rejected",
  spam: "spam",
};

type SubmissionRow = Row & {
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
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: { action?: UgcAction; csrf?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido." },
      { status: 400 }
    );
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  if (!body.action || !ACTION_TO_STATUS[body.action]) {
    return NextResponse.json(
      { ok: false, error: "Acción no válida." },
      { status: 400 }
    );
  }

  const sub = await queryOne<SubmissionRow>(
    "SELECT * FROM `ugc_submissions` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!sub) {
    return NextResponse.json(
      { ok: false, error: "Envío no encontrado." },
      { status: 404 }
    );
  }

  const newStatus = ACTION_TO_STATUS[body.action];
  const now = new Date();

  // For "approve" — promote the submission to a live group (status=live)
  let publishedGroupId: string | null = null;
  let publishedSlug: string | null = null;

  if (body.action === "approve") {
    // Resolve category + country
    let categoryId = sub.categoryId;
    let categoryName = sub.categoryNameSnapshot;
    let countryName = sub.country;

    if (!categoryId) {
      // Try to look up by name
      const cat = await queryOne<Row>(
        "SELECT `id`, `name` FROM `categories` WHERE `name` = ? LIMIT 1",
        [sub.categoryNameSnapshot]
      );
      if (!cat) {
        return NextResponse.json(
          { ok: false, error: "Categoría no resuelta. Edita el envío antes de aprobar." },
          { status: 400 }
        );
      }
      categoryId = String((cat as { id: string }).id);
      categoryName = String((cat as { name: string }).name);
    }
    const country = await queryOne<Row>(
      "SELECT `id`, `name` FROM `countries` WHERE `name` = ? LIMIT 1",
      [sub.country]
    );
    if (!country) {
      return NextResponse.json(
        { ok: false, error: "País no válido. Edita el envío antes de aprobar." },
        { status: 400 }
      );
    }
    countryName = String((country as { name: string }).name);

    // Generate unique slug (check existing slugs, append suffix if needed)
    const groupName = sub.editedGroupName || sub.fetchedGroupName;
    if (!groupName) {
      return NextResponse.json(
        { ok: false, error: "El envío no tiene nombre." },
        { status: 400 }
      );
    }
    const baseSlug = generateSlug(groupName);
    const slugRows = await query<Row>(
      "SELECT `slug` FROM `groups` WHERE `slug` LIKE ?",
      [`${baseSlug}%`]
    );
    const slugSet = new Set(slugRows.map((r) => String((r as { slug: string }).slug)));
    const finalSlug = makeUniqueSlug(baseSlug, (s) => slugSet.has(s));

    // Parse tags/keywords JSON
    let tags: string[] = [];
    let keywords: string[] = [];
    try {
      tags = JSON.parse(sub.selectedTagsJson || "[]");
    } catch { /* ignore */ }
    try {
      keywords = JSON.parse(sub.keywordsJson || "[]");
    } catch { /* ignore */ }

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

    // Bump contributor stats
    if (sub.contributorId) {
      await exec(
        "UPDATE `ugc_contributors` SET `publishedCount` = `publishedCount` + 1, `reputationScore` = `reputationScore` + 5, `lastSubmissionAt` = ? WHERE `id` = ?",
        [now, sub.contributorId]
      );
    }
  } else if (body.action === "reject") {
    if (sub.contributorId) {
      await exec(
        "UPDATE `ugc_contributors` SET `rejectedCount` = `rejectedCount` + 1 WHERE `id` = ?",
        [sub.contributorId]
      );
    }
  }

  // Update submission status
  await exec(
    "UPDATE `ugc_submissions` SET `status` = ?, `reviewedAt` = ?, `publishedAt` = ?, `publishedGroupId` = ? WHERE `id` = ?",
    [newStatus, now, body.action === "approve" ? now : null, publishedGroupId, id]
  );

  await logAdminAction(
    `ugc.${body.action}`,
    id,
    sub.editedGroupName || sub.fetchedGroupName || sub.submissionUid
  );

  return NextResponse.json({
    ok: true,
    status: newStatus,
    publishedGroupId,
    publishedSlug,
  });
}
