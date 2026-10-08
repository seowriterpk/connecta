import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, exec } from "@/lib/db";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  isAdult: number;
  isActive: number;
  sortOrder: number;
}

interface Body {
  name?: string;
  slug?: string;
  icon?: string;
  color?: string;
  description?: string;
  isAdult?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  csrf?: string;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const existing = await queryOne<CategoryRow>(
    "SELECT `id`, `name`, `slug`, `icon`, `color`, `description`, `isAdult`, `isActive`, `sortOrder` FROM `categories` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Categoría no encontrada." }, { status: 404 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  let slug = body.slug !== undefined ? String(body.slug).trim() : existing.slug;
  if (!slug) slug = generateSlug(name);

  if (slug !== existing.slug) {
    const owner = await queryOne<{ id: string }>(
      "SELECT `id` FROM `categories` WHERE `slug` = ? LIMIT 1",
      [slug]
    );
    if (owner && owner.id !== id) {
      return NextResponse.json(
        { ok: false, error: `Slug "${slug}" ya está en uso.` },
        { status: 409 }
      );
    }
  }

  const icon = body.icon !== undefined ? String(body.icon) : existing.icon;
  const color = body.color !== undefined ? String(body.color) : existing.color;
  const description =
    body.description !== undefined
      ? String(body.description).slice(0, 300)
      : existing.description;
  const isAdult =
    body.isAdult !== undefined ? Boolean(body.isAdult) : !!existing.isAdult;
  const isActive =
    body.isActive !== undefined ? Boolean(body.isActive) : !!existing.isActive;
  const sortOrder =
    body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder;

  await exec(
    `UPDATE \`categories\`
     SET \`name\` = ?, \`slug\` = ?, \`icon\` = ?, \`color\` = ?, \`description\` = ?,
         \`isAdult\` = ?, \`isActive\` = ?, \`sortOrder\` = ?
     WHERE \`id\` = ?`,
    [name, slug, icon, color, description, isAdult ? 1 : 0, isActive ? 1 : 0, sortOrder, id]
  );

  // Sync denormalized category name on all groups if name changed
  if (name !== existing.name) {
    await exec("UPDATE `groups` SET `category` = ? WHERE `categoryId` = ?", [name, id]);
  }

  await logAdminAction("categoria.update", id, name);

  return NextResponse.json({ ok: true, slug });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: { csrf?: string } = {};
  try {
    body = await req.json();
  } catch { /* empty OK */ }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const existing = await queryOne<{ id: string; name: string }>(
    "SELECT `id`, `name` FROM `categories` WHERE `id` = ? LIMIT 1",
    [id]
  );
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Categoría no encontrada." }, { status: 404 });
  }

  // Count groups using this category
  const countRow = await queryOne<{ cnt: number }>(
    "SELECT COUNT(*) AS `cnt` FROM `groups` WHERE `categoryId` = ?",
    [id]
  );
  const count = Number(countRow?.cnt ?? 0);
  if (count > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `No se puede eliminar: ${count} grupo(s) usan esta categoría. Reasigna primero.`,
      },
      { status: 409 }
    );
  }

  await exec("DELETE FROM `categories` WHERE `id` = ?", [id]);

  await logAdminAction("categoria.delete", id, existing.name);

  return NextResponse.json({ ok: true });
}
