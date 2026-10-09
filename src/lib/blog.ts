/**
 * Blog data layer — CRUD for blog posts (public read + admin write).
 *
 * Design notes (SEO directive):
 * - Public queries only ever return `status = 'published'` posts.
 * - Slugs are unique and generated with the shared slug util.
 * - Reading time is computed from content length (Spanish reading speed ~200
 *   words/min) and stored on write.
 * - Views increment server-side on each article render (no client beacons —
 *   simple for crawlers and managers alike).
 */

import { query, queryOne, exec, newId } from "@/lib/db";
import { generateSlug } from "@/lib/slug";

export interface BlogPostDTO {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverEmoji: string;
  tags: string[];
  authorName: string;
  status: "draft" | "published";
  metaTitle: string | null;
  metaDescription: string | null;
  readingMinutes: number;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type PostRow = Record<string, unknown>;

function parseTags(raw: unknown): string[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((t) => typeof t === "string").slice(0, 10) : [];
  } catch {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);
  }
}

function toDTO(r: PostRow): BlogPostDTO {
  return {
    id: String(r.id ?? ""),
    slug: String(r.slug ?? ""),
    title: String(r.title ?? ""),
    excerpt: String(r.excerpt ?? ""),
    content: String(r.content ?? ""),
    coverEmoji: String(r.coverEmoji ?? "📝"),
    tags: parseTags(r.tags),
    authorName: String(r.authorName ?? "Equipo ConectaGrupos"),
    status: r.status === "published" ? "published" : "draft",
    metaTitle: (r.metaTitle as string) ?? null,
    metaDescription: (r.metaDescription as string) ?? null,
    readingMinutes: Number(r.readingMinutes ?? 4),
    views: Number(r.views ?? 0),
    publishedAt: (r.publishedAt as string) ?? null,
    createdAt: String(r.createdAt ?? ""),
    updatedAt: String(r.updatedAt ?? ""),
  };
}

const PUBLIC_FIELDS =
  "`id`, `slug`, `title`, `excerpt`, `content`, `coverEmoji`, `tags`, `authorName`, `status`, `metaTitle`, `metaDescription`, `readingMinutes`, `views`, `publishedAt`, `createdAt`, `updatedAt`";

/** All published posts, newest first (blog index / sitemap / RSS). */
export async function getPublishedPosts(limit = 50): Promise<BlogPostDTO[]> {
  const rows = await query<PostRow>(
    `SELECT ${PUBLIC_FIELDS} FROM \`blog_posts\` WHERE \`status\` = 'published' ORDER BY \`publishedAt\` DESC, \`createdAt\` DESC LIMIT ?`,
    [Math.min(Math.max(limit, 1), 100)]
  );
  return rows.map(toDTO);
}

/** One published post by slug (article page). */
export async function getPublishedPostBySlug(slug: string): Promise<BlogPostDTO | null> {
  const row = await queryOne<PostRow>(
    `SELECT ${PUBLIC_FIELDS} FROM \`blog_posts\` WHERE \`slug\` = ? AND \`status\` = 'published' LIMIT 1`,
    [slug]
  );
  return row ? toDTO(row) : null;
}

/** View counter — fire-and-forget on article render. */
export async function incrementPostViews(id: string): Promise<void> {
  try {
    await exec("UPDATE `blog_posts` SET `views` = `views` + 1 WHERE `id` = ?", [id]);
  } catch {
    /* ignore */
  }
}

/** Admin: all posts (drafts first? no — newest activity first). */
export async function getAllPostsForAdmin(): Promise<BlogPostDTO[]> {
  const rows = await query<PostRow>(
    `SELECT ${PUBLIC_FIELDS} FROM \`blog_posts\` ORDER BY \`updatedAt\` DESC`
  );
  return rows.map(toDTO);
}

/** Admin: one post by id (editor). */
export async function getPostById(id: string): Promise<BlogPostDTO | null> {
  const row = await queryOne<PostRow>(
    `SELECT ${PUBLIC_FIELDS} FROM \`blog_posts\` WHERE \`id\` = ? LIMIT 1`,
    [id]
  );
  return row ? toDTO(row) : null;
}

export interface PostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverEmoji?: string;
  tags?: string[];
  authorName?: string;
  status?: "draft" | "published";
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface PostInputResult {
  ok: boolean;
  error?: string;
  post?: BlogPostDTO | null;
}

function computeReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function ensureUniqueSlug(slug: string, ignoreId?: string): Promise<string> {
  let candidate = slug;
  let n = 2;
  while (true) {
    const row = ignoreId
      ? await queryOne("SELECT `id` FROM `blog_posts` WHERE `slug` = ? AND `id` <> ? LIMIT 1", [candidate, ignoreId])
      : await queryOne("SELECT `id` FROM `blog_posts` WHERE `slug` = ? LIMIT 1", [candidate]);
    if (!row) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

export async function createPost(input: PostInput): Promise<PostInputResult> {
  const title = input.title.trim();
  if (title.length < 3) return { ok: false, error: "El título debe tener al menos 3 caracteres." };
  const content = input.content.trim();
  if (content.length < 50) return { ok: false, error: "El contenido debe tener al menos 50 caracteres." };

  const baseSlug = generateSlug(input.slug?.trim() || title);
  const slug = await ensureUniqueSlug(baseSlug);
  const id = newId();
  const status = input.status === "published" ? "published" : "draft";

  await exec(
    `INSERT INTO \`blog_posts\`
      (\`id\`, \`slug\`, \`title\`, \`excerpt\`, \`content\`, \`coverEmoji\`, \`tags\`, \`authorName\`, \`status\`, \`metaTitle\`, \`metaDescription\`, \`readingMinutes\`, \`publishedAt\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      slug,
      title,
      (input.excerpt ?? "").trim().slice(0, 500) || content.slice(0, 200),
      content,
      (input.coverEmoji ?? "📝").slice(0, 8),
      JSON.stringify((input.tags ?? []).slice(0, 10)),
      (input.authorName ?? "Equipo ConectaGrupos").slice(0, 120),
      status,
      input.metaTitle?.trim().slice(0, 255) || null,
      input.metaDescription?.trim().slice(0, 500) || null,
      computeReadingMinutes(content),
      status === "published" ? new Date() : null,
    ]
  );

  const post = await getPostById(id);
  return { ok: true, post };
}

export async function updatePost(id: string, input: PostInput): Promise<PostInputResult> {
  const existing = await getPostById(id);
  if (!existing) return { ok: false, error: "Entrada no encontrada." };

  const title = input.title.trim();
  if (title.length < 3) return { ok: false, error: "El título debe tener al menos 3 caracteres." };
  const content = input.content.trim();
  if (content.length < 50) return { ok: false, error: "El contenido debe tener al menos 50 caracteres." };

  const baseSlug = generateSlug(input.slug?.trim() || title);
  const slug = baseSlug === existing.slug ? existing.slug : await ensureUniqueSlug(baseSlug, id);
  const status = input.status === "published" ? "published" : "draft";
  const wasPublished = existing.status === "published";
  const publishedAt =
    status === "published" ? (existing.publishedAt ? new Date(existing.publishedAt) : new Date()) : null;

  await exec(
    `UPDATE \`blog_posts\` SET
      \`slug\` = ?, \`title\` = ?, \`excerpt\` = ?, \`content\` = ?, \`coverEmoji\` = ?,
      \`tags\` = ?, \`authorName\` = ?, \`status\` = ?, \`metaTitle\` = ?, \`metaDescription\` = ?,
      \`readingMinutes\` = ?, \`publishedAt\` = ?
     WHERE \`id\` = ?`,
    [
      slug,
      title,
      (input.excerpt ?? "").trim().slice(0, 500) || content.slice(0, 200),
      content,
      (input.coverEmoji ?? existing.coverEmoji).slice(0, 8),
      JSON.stringify((input.tags ?? existing.tags).slice(0, 10)),
      (input.authorName ?? existing.authorName).slice(0, 120),
      status,
      input.metaTitle?.trim().slice(0, 255) || null,
      input.metaDescription?.trim().slice(0, 500) || null,
      computeReadingMinutes(content),
      publishedAt,
      id,
    ]
  );

  const post = await getPostById(id);
  return { ok: true, post: post ?? undefined };
}

export async function deletePost(id: string): Promise<boolean> {
  const res = await exec("DELETE FROM `blog_posts` WHERE `id` = ?", [id]);
  return res.affectedRows > 0;
}

export async function togglePostStatus(id: string): Promise<PostInputResult> {
  const existing = await getPostById(id);
  if (!existing) return { ok: false, error: "Entrada no encontrada." };
  const next = existing.status === "published" ? "draft" : "published";
  const publishedAt = next === "published" ? (existing.publishedAt ? new Date(existing.publishedAt) : new Date()) : null;
  await exec("UPDATE `blog_posts` SET `status` = ?, `publishedAt` = ? WHERE `id` = ?", [
    next,
    publishedAt,
    id,
  ]);
  const post = await getPostById(id);
  return { ok: true, post: post ?? undefined };
}
