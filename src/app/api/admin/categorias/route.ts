import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { queryOne, exec, newId } from "@/lib/db";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "Nombre obligatorio." }, { status: 400 });
  }

  let slug = String(body.slug || "").trim();
  if (!slug) slug = generateSlug(name);

  // ensure slug unique
  const existing = await queryOne(
    "SELECT `id` FROM `categories` WHERE `slug` = ? LIMIT 1",
    [slug]
  );
  if (existing) {
    return NextResponse.json(
      { ok: false, error: `Ya existe una categoría con slug "${slug}".` },
      { status: 409 }
    );
  }

  const id = newId();
  await exec(
    `INSERT INTO \`categories\`
      (\`id\`, \`name\`, \`slug\`, \`icon\`, \`color\`, \`description\`, \`isAdult\`, \`isActive\`, \`sortOrder\`, \`source\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')`,
    [
      id,
      name,
      slug,
      String(body.icon || "💬"),
      String(body.color || "emerald"),
      String(body.description || "").slice(0, 300),
      body.isAdult ? 1 : 0,
      body.isActive !== false ? 1 : 0,
      Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 1000,
    ]
  );

  await logAdminAction("categoria.create", id, name);

  return NextResponse.json({ ok: true, id, slug });
}
