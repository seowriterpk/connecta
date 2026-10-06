/**
 * Shared runtime for ConectaGrupos cron scripts (.mjs — plain Node, no build step).
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
export function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
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
    return { status: "revoked", groupName: "", imageUrl: "", inviteCode: "", description: "" };
  }
  const url = inviteUrl.startsWith("http") ? inviteUrl : `https://chat.whatsapp.com/${code}`;
  const headers = {
    "User-Agent": IPHONE_UA,
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "es-MX,es;q=0.9",
  };
  let html = "";
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (res.ok) html = (await res.text()).slice(0, 8192);
  } catch {
    /* network fail → unknown, never revoked */
  }
  if (!html) {
    return { status: "unknown", groupName: "", imageUrl: "", inviteCode: code, description: "" };
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
    };
  }
  return { status: "revoked", groupName: "", imageUrl: "", inviteCode: code, description: "" };
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
