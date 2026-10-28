/**
 * Shared runtime for Grupos Hoy cron scripts (.mjs — plain Node, no build step).
 * Hostinger hPanel cron jobs run these directly:
 *   node /path/to/scripts/crons/drip-feed.mjs
 *
 * DB credentials come from process.env (set them in the cron command or in hPanel).
 * Same mysql2/promise pool as the Next.js app — localhost MySQL, the fast way.
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..", "..");

// --- tiny .env loader (optional; production should use real env vars) -------
// Loads .env and then .env.local (matching Next.js priority: local overrides,
// but real process env vars always win). PROXY_URL may live in either
// file; both are git-ignored since Task 21.
export function loadEnvFile() {
  const fileLoaded = new Set();
  const loadFile = (envPath) => {
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key in process.env && !fileLoaded.has(key)) continue; // real env var wins
      process.env[key] = val;
      fileLoaded.add(key);
    }
  };
  loadFile(path.join(ROOT, ".env"));
  loadFile(path.join(ROOT, ".env.local"));
}

// --- proxied fetch (DataImpulse residential proxy) ---------------------------
// Same runtime strategy as src/lib/proxy-fetch.ts:
//   Bun  → native `proxy` option on global fetch
//   Node → npm undici package's OWN fetch + ProxyAgent (version-matched pair;
//          Node's built-in global fetch is an internal undici that rejects
//          dispatchers from the npm package)
// No PROXY_URL → direct fetch.
//
// IP ROTATION (Task 33 — false-revoke incident, owner 2026-10-29): the
// cached ProxyAgent keep-alives its CONNECT tunnels, so bursts of requests
// exit through the SAME residential IP until WhatsApp rate-limits it and
// everything sharing that IP fails together (the 80% false-"revoked" wave).
// proxiedFetchFresh() builds a ONE-SHOT agent per request (connections:1,
// keep-alive off) and closes it right after — with a rotating gateway
// (gw.dataimpulse.com) every request gets its OWN exit IP.
let _undiciPair;
let _undiciModPromise;
async function getUndiciMod() {
  if (!_undiciModPromise) {
    _undiciModPromise = import("undici").catch(() => null);
  }
  return _undiciModPromise;
}
async function getUndiciPair() {
  if (!process.env.PROXY_URL) return null;
  if (typeof globalThis.Bun !== "undefined") return null; // bun path handled natively
  if (_undiciPair !== undefined) return _undiciPair;
  try {
    const mod = await getUndiciMod();
    _undiciPair = mod ? { fetch: mod.fetch, agent: new mod.ProxyAgent(process.env.PROXY_URL) } : null;
  } catch {
    _undiciPair = null;
  }
  return _undiciPair;
}

async function proxiedFetch(url, init = {}) {
  const { timeoutMs = 8000, ...fetchInit } = init;
  const signal = fetchInit.signal ?? AbortSignal.timeout(timeoutMs);

  if (typeof globalThis.Bun !== "undefined" && process.env.PROXY_URL) {
    return fetch(url, { ...fetchInit, signal, proxy: process.env.PROXY_URL });
  }
  const pair = await getUndiciPair();
  if (pair) {
    return pair.fetch(url, { ...fetchInit, signal, dispatcher: pair.agent });
  }
  return fetch(url, { ...fetchInit, signal });
}

/** True for WhatsApp rate-limit / block statuses → rotate IP + retry. */
export function isRateLimitedStatus(status) {
  return status === 403 || status === 429 || (status >= 500 && status < 600);
}

/** One-shot proxied fetch: fresh ProxyAgent = NEW exit IP per call, closed right after. */
export async function proxiedFetchFresh(url, init = {}) {
  const { timeoutMs = 8000, ...fetchInit } = init;
  const signal = fetchInit.signal ?? AbortSignal.timeout(timeoutMs);

  if (typeof globalThis.Bun !== "undefined" && process.env.PROXY_URL) {
    // Bun dials per-request (no shared proxy pool) — new IP anyway.
    return fetch(url, { ...fetchInit, signal, proxy: process.env.PROXY_URL });
  }
  const mod = process.env.PROXY_URL ? await getUndiciMod() : null;
  if (!mod) return fetch(url, { ...fetchInit, signal });
  const agent = new mod.ProxyAgent({
    uri: process.env.PROXY_URL,
    connections: 1,
    pipelining: 1,
    keepAliveTimeout: 1,
    keepAliveMaxTimeout: 1,
  });
  try {
    return await mod.fetch(url, { ...fetchInit, signal, dispatcher: agent });
  } finally {
    // Graceful close: lets the in-flight body finish, then reaps the tunnel.
    Promise.resolve(agent.close()).catch(() => {});
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const jitter = (ms) => ms + Math.floor(Math.random() * Math.round(ms * 0.5));

/**
 * Bounded-concurrency worker pool (Task 33): runs `worker(item)` over `items`
 * with at most `limit` in flight and a small stagger between launches so
 * the target never sees a simultaneous burst. Preserves input order in the
 * output array. Never throws — worker errors land as null entries.
 */
export async function mapLimit(items, limit, worker, staggerMs = 0) {
  const results = new Array(items.length).fill(null);
  let next = 0;
  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async (_, runnerIdx) => {
    // Stagger the START of each worker so the first wave isn't simultaneous.
    if (staggerMs > 0 && runnerIdx > 0) await sleep(jitter(staggerMs) * runnerIdx);
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = await worker(items[i], i);
      } catch {
        results[i] = null;
      }
    }
  });
  await Promise.all(runners);
  return results;
}

// --- group image downloader (aligned with src/lib/image-downloader.ts) --------
// Policy: WhatsApp group images are persisted on OUR server at
// <project>/media/group_images/<group-name-slug>[-random].<ext> and served via
// the /media/group_images route (robots-blocked + X-Robots-Tag — Google must
// never index these WhatsApp-sourced images).
export const MEDIA_DIR = path.join(ROOT, "media", "group_images");
export const MEDIA_URL_PREFIX = "/media/group_images";

const IMG_EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMG_BYTES = 4 * 1024 * 1024;

export function isWhatsappCdnUrl(url) {
  return Boolean(
    url &&
      (String(url).startsWith("https://pps.whatsapp.net/") ||
        String(url).startsWith("https://mmg.whatsapp.net/") ||
        String(url).startsWith("https://static.whatsapp.net/"))
  );
}

export function isLocalMediaUrl(url) {
  return Boolean(url && String(url).startsWith(MEDIA_URL_PREFIX));
}

/**
 * Downloads a WhatsApp CDN image into media/group_images with a
 * group-name-based file name (random digits suffix on collision).
 * Returns the public URL (/media/group_images/…) or null on failure.
 * Never throws. compress=true → sharp 300x300 JPEG 80% when available.
 */
export async function downloadGroupImageFile(imageUrl, groupName, { compress = true } = {}) {
  try {
    if (!isWhatsappCdnUrl(imageUrl)) return null;

    const res = await proxiedFetchFresh(imageUrl, {
      headers: {
        Referer: "https://chat.whatsapp.com/",
        "User-Agent": IPHONE_UA,
        Accept: "image/avif,image/webp,image/jpeg,image/png,*/*",
      },
      timeoutMs: 8000,
    });
    if (!res.ok) return null;

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    let buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_IMG_BYTES) return null;

    let ext = IMG_EXT_BY_TYPE[contentType];
    if (!ext) return null;

    // Optional server-side compression (shared-hosting safe — falls back to raw).
    if (compress) {
      try {
        const sharp = (await import("sharp")).default;
        buffer = await sharp(buffer).resize(300, 300, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
        ext = "jpg";
      } catch {
        /* sharp unavailable — keep raw buffer */
      }
    }

    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    const baseSlug = generateSlug(groupName || "grupo");
    let fileName = `${baseSlug}.${ext}`;
    if (fs.existsSync(path.join(MEDIA_DIR, fileName))) {
      // Collision → random digits suffix (user directive).
      fileName = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
      if (fs.existsSync(path.join(MEDIA_DIR, fileName))) {
        fileName = `${baseSlug}-${Date.now().toString(36)}.${ext}`;
      }
    }
    fs.writeFileSync(path.join(MEDIA_DIR, fileName), buffer, { flag: "wx" });
    return `${MEDIA_URL_PREFIX}/${fileName}`;
  } catch {
    return null;
  }
}

// --- db pool ---------------------------------------------------------------
export function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gruposwhatsapp",
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0,
    connectTimeout: 10_000,
    charset: "utf8mb4",
    decimalNumbers: true,
  });
}

export async function q(pool, sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
export async function q1(pool, sql, params = []) {
  const rows = await q(pool, sql, params);
  return rows.length > 0 ? rows[0] : null;
}
export async function x(pool, sql, params = []) {
  const [res] = await pool.query(sql, params);
  return res;
}

// --- ids -------------------------------------------------------------------
export function newId() {
  const t = Date.now().toString(36).padStart(8, "0");
  const r = crypto.randomBytes(8).toString("hex");
  return `c${t}${r}`;
}

// --- slug helpers (same rules as src/lib/slug.ts) ---------------------------
const ACCENT_MAP = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u",
  Á: "a", É: "e", Í: "i", Ó: "o", Ú: "u",
  ñ: "n", Ñ: "n", ü: "u", Ü: "u", ç: "c", Ç: "c",
};

export function generateSlug(text) {
  if (!text) return "grupo";
  let s = text;
  for (const [from, to] of Object.entries(ACCENT_MAP)) s = s.split(from).join(to);
  s = s.toLowerCase();
  s = s.replace(/&/g, "y").replace(/%/g, "por").replace(/@/g, "en");
  s = s.replace(/\s+/g, "-");
  s = s.replace(/[^a-z0-9-]/g, "");
  s = s.replace(/-+/g, "-");
  s = s.replace(/^-+|-+$/g, "");
  if (s.length > 80) {
    s = s.slice(0, 80);
    const lastHyphen = s.lastIndexOf("-");
    if (lastHyphen > 40) s = s.slice(0, lastHyphen);
  }
  return s || "grupo";
}

export function makeUniqueSlug(baseSlug, existsFn, maxAttempts = 50) {
  let slug = baseSlug || "grupo";
  if (!existsFn(slug)) return slug;
  for (let i = 1; i <= maxAttempts; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!existsFn(candidate)) return candidate;
  }
  return `${baseSlug}-${Date.now().toString(36)}`;
}

export function citySlug(city) {
  return String(city)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- WhatsApp invite meta fetcher (same logic as src/lib/whatsapp-validator.ts)
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) " +
  "Version/17.5 Mobile/15E148 Safari/604.1";

export function extractInviteCode(url) {
  const match = String(url).match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function extractMetaTag(html, property) {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const match = html.match(regex);
  if (match) return match[1];
  const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, "i");
  const match2 = html.match(regex2);
  return match2 ? match2[1] : null;
}

export async function fetchWhatsAppMeta(inviteUrl) {
  const code = extractInviteCode(inviteUrl);
  if (!code) {
    return { status: "revoked", groupName: "", imageUrl: "", inviteCode: "", description: "", source: "none" };
  }
  const url = inviteUrl.startsWith("http") ? inviteUrl : `https://chat.whatsapp.com/${code}`;
  const headers = {
    "User-Agent": IPHONE_UA,
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "es-MX,es;q=0.9",
  };
  // 64KB preview (aligned with src/lib/whatsapp-validator.ts): og:title can
  // sit deep after big inline scripts; 8KB sometimes cut a numeric entity in
  // half ("&#x1d431;" → "&#x1"), producing broken group names.
  const HTML_PREVIEW_BYTES = 65536;
  const PROXY_ATTEMPTS = 3;
  const PROXY_TIMEOUT_MS = 4500; // Task 34: snappier batches (was 6s)

  // --- Attempts through the residential proxy, rotating the exit IP ---------
  // (Task 33 — false-revoke incident, owner 2026-10-29): EVERY attempt uses a
  // FRESH connection = a NEW exit IP from the rotating gateway. On 403/429
  // (rate-limited IP) rotate fast; on timeouts rotate with backoff.
  let html = "";
  let source = "none";
  if (process.env.PROXY_URL) {
    for (let attempt = 1; attempt <= PROXY_ATTEMPTS; attempt++) {
      try {
        const res = await proxiedFetchFresh(url, { headers, redirect: "follow", timeoutMs: PROXY_TIMEOUT_MS });
        if (res.ok) {
          html = (await res.text()).slice(0, HTML_PREVIEW_BYTES);
          source = "proxy";
          break;
        }
        const wait = isRateLimitedStatus(res.status) ? jitter(300) : jitter(400 * attempt);
        try { await res.arrayBuffer(); } catch { /* drain failed body */ }
        await sleep(wait);
      } catch {
        if (attempt < PROXY_ATTEMPTS) await sleep(jitter(400 * attempt));
      }
    }
  }
  // --- Last resort: direct fetch. Can only CONFIRM active — a direct
  // datacenter page without og:title is a WhatsApp block page, NOT a revoked
  // link (they look identical). Classify those as "unknown", never revoked.
  if (!html) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(3500),
        redirect: "follow",
      });
      if (res.ok) {
        html = (await res.text()).slice(0, HTML_PREVIEW_BYTES);
        source = "direct";
      }
    } catch {
      /* network fail → unknown, never revoked */
    }
  }
  if (!html) {
    return { status: "unknown", groupName: "", imageUrl: "", inviteCode: code, description: "", source: "none" };
  }
  const ogTitle = extractMetaTag(html, "og:title");
  const ogImage = extractMetaTag(html, "og:image");
  const ogDesc = extractMetaTag(html, "og:description");
  const decode = (s) =>
    s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
  if (ogTitle && ogTitle !== "WhatsApp Group Invite" && ogTitle.trim() !== "") {
    return {
      status: "active",
      groupName: decode(ogTitle),
      imageUrl: ogImage ? decode(ogImage) : "",
      inviteCode: code,
      description: ogDesc ? decode(ogDesc) : "",
      source,
    };
  }
  // No/generic og:title: only trustworthy when fetched through the proxy.
  if (source === "direct") {
    return { status: "unknown", groupName: "", imageUrl: "", inviteCode: code, description: "", source };
  }
  return { status: "revoked", groupName: "", imageUrl: "", inviteCode: code, description: "", source };
}

// --- standalone-aware public file writer -------------------------------------
// In production (Hostinger), the app runs `.next/standalone/server.js`, which
// serves public/ from `.next/standalone/public/` — NOT from the repo-root
// public/ (that copy only gets picked up by the NEXT build). A cron writing
// sitemaps only to <root>/public/ would be invisible to the running server
// until the next redeploy. Writing to BOTH keeps the live server and the next
// build in sync. In dev only the root public/ exists, so nothing changes.
export function publicDirs() {
  const dirs = [path.join(ROOT, "public")];
  const standalone = path.join(ROOT, ".next", "standalone", "public");
  try {
    if (fs.statSync(standalone).isDirectory()) dirs.push(standalone);
  } catch {
    /* no standalone build — dev mode */
  }
  return dirs;
}

/**
 * Writes a file into every public/ copy (root + standalone when present).
 * `relPath` is relative to public/, e.g. "sitemaps/grupos-1.xml".
 * Returns the list of absolute paths actually written.
 */
export function writePublicFile(relPath, content) {
  const written = [];
  for (const dir of publicDirs()) {
    const target = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    written.push(target);
  }
  return written;
}

/** True if a file exists in the SERVED public dir (standalone wins in prod). */
export function publicFileExists(relPath) {
  for (const dir of publicDirs()) {
    if (fs.existsSync(path.join(dir, relPath))) return true;
  }
  return false;
}

// --- lock + log helpers -----------------------------------------------------
export function makeLogger(name) {
  const logsDir = path.join(ROOT, "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const LOG_FILE = path.join(logsDir, `${name}.log`);
  return function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    try {
      fs.appendFileSync(LOG_FILE, line + "\n");
    } catch {
      /* read-only fs in some deployments */
    }
  };
}

export function makeLock(name, staleMinutes = 10) {
  const logsDir = path.join(ROOT, "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const LOCK_FILE = path.join(logsDir, `${name}.lock`);
  return {
    async acquire() {
      if (fs.existsSync(LOCK_FILE)) {
        const ts = parseInt(fs.readFileSync(LOCK_FILE, "utf8"));
        if (Date.now() - ts < staleMinutes * 60 * 1000) return false;
      }
      fs.writeFileSync(LOCK_FILE, Date.now().toString());
      return true;
    },
    release() {
      try {
        if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
      } catch {
        /* ignore */
      }
    },
  };
}
