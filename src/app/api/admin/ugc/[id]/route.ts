import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { refreshSitemapsAfterPublish } from "@/lib/sitemap";
import { applyUgcAction, updateUgcSubmission, type UgcEditPatch } from "@/lib/ugc-admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type UgcAction = "approve" | "reject" | "spam";

/**
 * POST — single approve / reject / spam (unchanged behavior, now shared
 * with the bulk route through src/lib/ugc-admin.ts).
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: { action?: UgcAction; csrf?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  if (!body.action || !["approve", "reject", "spam"].includes(body.action)) {
    return NextResponse.json({ ok: false, error: "Acción no válida." }, { status: 400 });
  }

  const res = await applyUgcAction(id, body.action);

  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: res.code });
  }

  await logAdminAction(`ugc.${body.action}`, id, res.name);

  // Approve publishes a new live group → refresh the sitemap (debounced).
  if (body.action === "approve") refreshSitemapsAfterPublish();

  return NextResponse.json({
    ok: true,
    status: res.status,
    publishedGroupId: res.publishedGroupId,
    publishedSlug: res.publishedSlug,
    name: res.name,
  });
}

/**
 * PUT — inline edit of a submission (no reload): name, category, country,
 * city, tags, keywords, adult flag, admin notes. Status changes are
 * deliberately NOT allowed here — approve/reject/spam have side effects
 * (group insert, contributor counters) and must go through POST.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const { id } = await params;

  let body: { patch?: UgcEditPatch; csrf?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  if (!body.patch || typeof body.patch !== "object") {
    return NextResponse.json({ ok: false, error: "Sin cambios." }, { status: 400 });
  }

  const patch: UgcEditPatch = {};
  const p = body.patch;
  if (typeof p.editedGroupName === "string") patch.editedGroupName = p.editedGroupName;
  if (typeof p.categoryId === "string") patch.categoryId = p.categoryId;
  if (typeof p.country === "string") patch.country = p.country;
  if (typeof p.city === "string") patch.city = p.city;
  if (Array.isArray(p.selectedTags)) patch.selectedTags = p.selectedTags.map(String);
  if (Array.isArray(p.keywords)) patch.keywords = p.keywords.map(String);
  if (typeof p.isAdult === "boolean") patch.isAdult = p.isAdult;
  if (typeof p.adminNotes === "string") patch.adminNotes = p.adminNotes;

  const res = await updateUgcSubmission(id, patch);

  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: res.code });
  }

  await logAdminAction("ugc.edit", id, res.name);

  return NextResponse.json({ ok: true, name: res.name });
}
