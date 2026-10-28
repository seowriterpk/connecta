/**
 * Group Image Downloader — persists WhatsApp group images on OUR server.
 *
 * Directory layout (served via /media/group_images/[...path] route handler):
 *   <project>/media/group_images/<group-name-slug>.jpg
 *   <project>/media/group_images/<group-name-slug>-4821.jpg   (collision → random digits)
 *
 * Security:
 *  - Host allowlist: only *.whatsapp.net / *.whatsapp.com CDNs by default
 *    (blocks SSRF against internal networks from the public UGC flow).
 *  - Content-Type must be image/* and match the extension we write.
 *  - Hard 4MB size cap.
 *  - File names are slug-safed — no user-controlled path segments ever.
 *
 * Delivery / SEO policy: /media/ is robots-disallowed AND every image
 * response carries X-Robots-Tag: noindex, noimageindex — Google must never
 * index these WhatsApp-sourced images.
 */

import { mkdir, writeFile, access, unlink } from "node:fs/promises";
import path from "node:path";
import { generateSlug } from "@/lib/slug";
import { proxiedFetch } from "@/lib/proxy-fetch";

/** Physical folder (project root, NOT public/ — served via the /media route). */
export const MEDIA_DIR = path.join(process.cwd(), "media", "group_images");
/** Public URL prefix used in DB profileImage columns. */
export const MEDIA_URL_PREFIX = "/media/group_images";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB hard cap
// Task 34: 5s keeps a full 100-row batch (12 workers) snappy even when the
// CDN is slow — the rotating gateway gives every download its own IP, so
// timeouts just mean "retry this row", not "the pipe is dead".
const DOWNLOAD_TIMEOUT_MS = 5000;

/** Extension by content-type (whitelist — anything else is rejected). */
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Hosts we are willing to download from in the public UGC flow. */
function isAllowedHost(hostname: string): boolean {
  return (
    hostname === "pps.whatsapp.net" ||
    hostname === "mmg.whatsapp.net" ||
    hostname === "static.whatsapp.net" ||
    hostname.endsWith(".whatsapp.net") ||
    hostname.endsWith(".whatsapp.com")
  );
}

/** Safe, unique file name: group-name slug (+ random digits on collision). */
async function resolveFileName(
  baseSlug: string,
  ext: string
): Promise<string> {
  let name = `${baseSlug || "grupo"}.${ext}`;
  try {
    await access(path.join(MEDIA_DIR, name));
    // Collision → append 4 random digits (per user directive).
    name = `${baseSlug || "grupo"}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
    // Astronomically rare second collision — retry once with more digits.
    try {
      await access(path.join(MEDIA_DIR, name));
      name = `${baseSlug || "grupo"}-${Math.floor(10000 + Math.random() * 90000)}.${ext}`;
    } catch {
      /* free — keep it */
    }
  } catch {
    /* free — keep the clean name */
  }
  return name;
}

export interface DownloadResult {
  /** Local public URL (/media/group_images/x.jpg) or null on failure. */
  localUrl: string | null;
  /** Bytes written (0 when failed). */
  bytes: number;
  /** Failure reason, for logs. */
  error?: string;
}

/**
 * Downloads a WhatsApp CDN image to media/group_images and returns the local
 * public URL. NEVER throws — on any failure returns { localUrl: null } so
 * callers can gracefully fall back to the original CDN URL.
 *
 * @param imageUrl  WhatsApp CDN (or allowlisted) https URL.
 * @param groupName Group name used for the file name (slug-safed).
 */
export async function downloadGroupImage(
  imageUrl: string,
  groupName: string
): Promise<DownloadResult> {
  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol !== "https:" || !isAllowedHost(parsed.hostname)) {
      return { localUrl: null, bytes: 0, error: "host not allowed" };
    }

    // Download through the residential proxy (WhatsApp CDN blocks datacenter
    // IPs the same way chat.whatsapp.com does). freshConnection → a NEW
    // rotating-gateway exit IP per image (Task 33: shared keep-alive tunnels
    // concentrated many downloads on one IP → rate-limit cascade).
    const res = await proxiedFetch(imageUrl, {
      headers: {
        Referer: "https://chat.whatsapp.com/",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        Accept: "image/avif,image/webp,image/jpeg,image/png,*/*",
      },
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
      freshConnection: true,
    });

    if (!res.ok) {
      return { localUrl: null, bytes: 0, error: `HTTP ${res.status}` };
    }

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const ext = EXT_BY_TYPE[contentType];
    if (!ext) {
      return { localUrl: null, bytes: 0, error: `bad content-type ${contentType}` };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      return { localUrl: null, bytes: 0, error: `size ${buffer.length}` };
    }

    // File name from the group name (slug-safed), with a random-digits
    // suffix when the same name already exists (user directive).
    const baseSlug = generateSlug(groupName || "grupo");
    let fileName = await resolveFileName(baseSlug, ext);

    await mkdir(MEDIA_DIR, { recursive: true });
    let dest = path.join(MEDIA_DIR, fileName);
    try {
      // 'wx' = fail if the file appeared in the microseconds between
      // resolveFileName() and now (two concurrent same-name submissions).
      await writeFile(dest, buffer, { flag: "wx" });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "EEXIST") {
        fileName = `${baseSlug}-${Date.now().toString(36)}-${Math.floor(
          1000 + Math.random() * 9000
        )}.${ext}`;
        dest = path.join(MEDIA_DIR, fileName);
        await writeFile(dest, buffer, { flag: "wx" });
      } else {
        throw e;
      }
    }

    return { localUrl: `${MEDIA_URL_PREFIX}/${fileName}`, bytes: buffer.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return { localUrl: null, bytes: 0, error: msg };
  }
}

/** True when a stored profileImage URL points at our local media store. */
export function isLocalMediaUrl(url: string | null | undefined): boolean {
  return Boolean(url && url.startsWith(MEDIA_URL_PREFIX));
}

/**
 * Best-effort deletion of a group's PREVIOUS local image file (Task 34):
 * when overwrite/replace saves a new file, the old one must not linger as an
 * orphan — 8k redownload runs would otherwise double the media folder.
 * Only ever touches files inside MEDIA_DIR. Never throws.
 */
export async function deleteLocalImageByUrl(profileImageUrl: string | null | undefined): Promise<void> {
  try {
    if (!profileImageUrl || !profileImageUrl.startsWith(MEDIA_URL_PREFIX)) return;
    const fileName = path.basename(profileImageUrl);
    // basename() already strips any ../ tricks; belt-and-suspenders check:
    if (!fileName || fileName.includes("/") || fileName.includes("..")) return;
    await unlink(path.join(MEDIA_DIR, fileName));
  } catch {
    /* file already gone / read-only fs — ignore */
  }
}

/** True when a stored profileImage URL is a WhatsApp CDN URL. */
export function isWhatsappCdnUrl(url: string | null | undefined): boolean {
  return Boolean(
    url &&
      (url.startsWith("https://pps.whatsapp.net/") ||
        url.startsWith("https://mmg.whatsapp.net/") ||
        url.startsWith("https://static.whatsapp.net/"))
  );
}
