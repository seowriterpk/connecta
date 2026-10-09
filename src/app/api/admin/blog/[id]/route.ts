import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { getPostById, updatePost, deletePost, togglePostStatus } from "@/lib/blog";

export const dynamic = "force-dynamic";

interface Body {
  action?: "toggle" | "save";
  csrf?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverEmoji?: string;
  tags?: string[];
  authorName?: string;
  status?: "draft" | "published";
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return NextResponse.json({ ok: false, error: "No encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true, post });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Publish / unpublish quick action from the list page.
  if (body.action === "toggle") {
    const result = await togglePostStatus(id);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    await logAdminAction("blog.toggle", id, `${result.post!.status} · ${result.post!.title}`);
    return NextResponse.json({ ok: true, post: result.post });
  }

  const result = await updatePost(id, {
    title: body.title ?? "",
    slug: body.slug,
    excerpt: body.excerpt,
    content: body.content ?? "",
    coverEmoji: body.coverEmoji,
    tags: Array.isArray(body.tags) ? body.tags : [],
    authorName: body.authorName,
    status: body.status === "published" ? "published" : "draft",
    metaTitle: body.metaTitle ?? null,
    metaDescription: body.metaDescription ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  await logAdminAction("blog.update", id, result.post!.title);
  return NextResponse.json({ ok: true, post: result.post });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;
  const { id } = await params;

  const csrfToken = req.nextUrl.searchParams.get("csrf");
  const csrfErr = await checkCsrfApi(csrfToken);
  if (csrfErr) return csrfErr;

  const post = await getPostById(id);
  const ok = await deletePost(id);
  if (!ok) return NextResponse.json({ ok: false, error: "No encontrada." }, { status: 404 });

  await logAdminAction("blog.delete", id, post?.title ?? id);
  return NextResponse.json({ ok: true });
}
