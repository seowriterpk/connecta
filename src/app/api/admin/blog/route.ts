import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import { createPost } from "@/lib/blog";

export const dynamic = "force-dynamic";

interface Body {
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

  const result = await createPost({
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

  await logAdminAction("blog.create", result.post!.id, result.post!.title);
  return NextResponse.json({ ok: true, post: result.post });
}
