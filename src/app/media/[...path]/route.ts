import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * GET /media/group_images/<file>
 *
 * Serves locally-stored WhatsApp group images from <project>/media/group_images.
 * Deliberately served through a route handler (NOT public/) so we control the
 * response headers — these images must NEVER be indexed by Google:
 *
 *   - X-Robots-Tag: noindex, noimageindex  (belt)
 *   - robots.txt:   Disallow /media/        (suspenders)
 *
 * Path traversal is impossible: the file name must match ^[a-z0-9-]+\.(jpg|jpeg|png|webp)$
 * and the resolved path must remain inside the media root.
 */

const MEDIA_ROOT = path.join(process.cwd(), "media", "group_images");

/** 404 responses must NEVER be cached: Cloudflare default-caches negative
 *  responses on image-extension URLs for several minutes, which would pin a
 *  "default icon" (img onError fallback) in visitors' browsers even AFTER
 *  the file later appears on disk (e.g. a re-run of the bulk image tool). */
const NOT_FOUND = () =>
  NextResponse.json(
    { error: "Not found" },
    { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } }
  );

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// a-z, 0-9, hyphen only + known image extension. No dots, no slashes,
// no unicode, no ".." — anything else never touches the filesystem.
const SAFE_FILE_RE = /^[a-z0-9-]{2,120}\.(jpg|jpeg|png|webp)$/;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await ctx.params;

  // Only /media/group_images/... is a valid media path here.
  if (segments.length < 2 || segments[0] !== "group_images") {
    return NOT_FOUND();
  }

  const fileName = segments[segments.length - 1];
  if (!SAFE_FILE_RE.test(fileName)) {
    return NOT_FOUND();
  }

  // Defense in depth: even though the regex blocks traversal, verify the
  // resolved absolute path stays inside the media root.
  const filePath = path.join(MEDIA_ROOT, fileName);
  const resolvedRoot = path.resolve(MEDIA_ROOT);
  const resolvedFile = path.resolve(filePath);
  if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
    return NOT_FOUND();
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
    const buffer = await readFile(filePath);
    const ext = fileName.split(".").pop()!.toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream",
        "Content-Length": String(info.size),
        "X-Content-Type-Options": "nosniff",
        // SEO policy: Google must never index these WhatsApp-sourced images.
        "X-Robots-Tag": "noindex, noimageindex, nosnippet, noarchive",
        // Names are unique and immutable → aggressive caching is safe.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NOT_FOUND();
  }
}
