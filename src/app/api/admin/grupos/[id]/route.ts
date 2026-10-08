import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, exec } from "@/lib/db";
import { generateSlug, makeUniqueSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido." },
      { status: 400 }
    );
  }

  const csrfErr = await checkCsrfApi(body.csrf as string | undefined);
  if (csrfErr) return csrfErr;

  const existing = await queryOne<{ id: string; slug: string; groupName: string }>(
    "SELECT `id`, `slug`, `groupName` FROM `groups` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Grupo no encontrado." },
      { status: 404 }
    );
  }

  // Required fields
  const groupName = String(body.groupName || "").trim();
  const joinLink = String(body.joinLink || "").trim();
  if (!groupName || !joinLink) {
    return NextResponse.json(
      { ok: false, error: "Nombre y enlace son obligatorios." },
      { status: 400 }
    );
  }

  // Slug: regenerate if changed/empty, ensure unique
  let slug = String(body.slug || "").trim();
  if (!slug) slug = generateSlug(groupName);
  if (slug !== existing.slug) {
    const slugOwner = await queryOne<{ id: string }>(
      "SELECT `id` FROM `groups` WHERE `slug` = ? LIMIT 1",
      [slug]
    );
    if (slugOwner && slugOwner.id !== id) {
      slug = makeUniqueSlug(slug, (s) => {
        // sync check: not perfect, but we'll do an async one below
        return false;
      });
      // Async uniqueness check
      const conflicting = await queryOne<{ id: string }>(
        "SELECT `id` FROM `groups` WHERE `slug` = ? LIMIT 1",
        [slug]
      );
      if (conflicting && conflicting.id !== id) {
        // append short suffix
        slug = `${slug}-${id.slice(-4)}`;
      }
    }
  }

  // Resolve category + country names (denormalized fields)
  const categoryId = String(body.categoryId || "");
  const countryId = String(body.countryId || "");
  if (!categoryId || !countryId) {
    return NextResponse.json(
      { ok: false, error: "Categoría y país son obligatorios." },
      { status: 400 }
    );
  }
  const [category, country] = await Promise.all([
    queryOne<{ name: string; isAdult: number }>(
      "SELECT `name`, `isAdult` FROM `categories` WHERE `id` = ? LIMIT 1",
      [categoryId]
    ),
    queryOne<{ name: string }>(
      "SELECT `name` FROM `countries` WHERE `id` = ? LIMIT 1",
      [countryId]
    ),
  ]);
  if (!category) {
    return NextResponse.json({ ok: false, error: "Categoría no válida." }, { status: 400 });
  }
  if (!country) {
    return NextResponse.json({ ok: false, error: "País no válido." }, { status: 400 });
  }

  // Arrays
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).map(String).map((s) => s.trim()).filter(Boolean)
    : [];
  const keywords = Array.isArray(body.keywords)
    ? (body.keywords as unknown[]).map(String).map((s) => s.trim()).filter(Boolean)
    : [];

  // Validate enums
  const allowedStatus = ["live", "pending", "rejected", "flagged", "pruned"];
  const allowedLink = ["active", "revoked", "unknown"];
  const status = allowedStatus.includes(String(body.status)) ? String(body.status) : "pending";
  const linkStatus = allowedLink.includes(String(body.linkStatus)) ? String(body.linkStatus) : "active";

  const isAdult = Boolean(body.isAdult) || !!category.isAdult;

  await exec(
    `UPDATE \`groups\` SET
      \`groupName\` = ?,
      \`slug\` = ?,
      \`joinLink\` = ?,
      \`description\` = ?,
      \`categoryId\` = ?,
      \`category\` = ?,
      \`countryId\` = ?,
      \`country\` = ?,
      \`city\` = ?,
      \`tags\` = ?,
      \`keywords\` = ?,
      \`profileImage\` = ?,
      \`language\` = ?,
      \`status\` = ?,
      \`linkStatus\` = ?,
      \`isAdult\` = ?
    WHERE \`id\` = ?`,
    [
      groupName,
      slug,
      joinLink,
      String(body.description || "").slice(0, 1200),
      categoryId,
      category.name,
      countryId,
      country.name,
      body.city ? String(body.city).slice(0, 120) : null,
      JSON.stringify(tags),
      JSON.stringify(keywords),
      body.profileImage ? String(body.profileImage) : null,
      String(body.language || "Espanol"),
      status,
      linkStatus,
      isAdult ? 1 : 0,
      id,
    ]
  );

  await logAdminAction("grupos.update", id, groupName);

  // slug is deterministic — return the computed value
  return NextResponse.json({ ok: true, slug });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: { csrf?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body OK
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const existing = await queryOne<{ id: string; groupName: string; status: string }>(
    "SELECT `id`, `groupName`, `status` FROM `groups` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Grupo no encontrado." },
      { status: 404 }
    );
  }

  // Soft-delete: status → rejected
  await exec("UPDATE `groups` SET `status` = 'rejected' WHERE `id` = ?", [id]);

  await logAdminAction("grupos.delete", id, existing.groupName);

  return NextResponse.json({ ok: true });
}
