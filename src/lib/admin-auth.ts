/**
 * Admin authentication + CSRF utilities.
 *
 * Session-based, no JWT/OAuth (per Groupizo manual ADMIN_PANEL section).
 * Uses iron-session (encrypted cookie, server-only).
 * Password compare uses crypto.timingSafeEqual (avoids timing attacks).
 *
 * Cookie: httpOnly, secure in production, sameSite=strict, maxAge=24h.
 */

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminSessionData {
  adminLoggedIn: boolean;
  adminUser: string;
  csrfToken: string;
}

export type AdminSession = Awaited<ReturnType<typeof getIronSession<AdminSessionData>>>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SESSION_NAME = "cg_admin_session";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

// 32+ char secret. Fallback only for dev; production MUST set SESSION_SECRET.
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "conectagrupos-dev-only-session-secret-please-override-in-production-32+";

// ---------------------------------------------------------------------------
// Session config
// ---------------------------------------------------------------------------

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: SESSION_NAME,
  cookieOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  },
  ttl: 60 * 60 * 24, // 24h in seconds
};

// ---------------------------------------------------------------------------
// Session accessors
// ---------------------------------------------------------------------------

/**
 * Get the admin session bound to the incoming request.
 * Must be called inside a server component / route handler / server action.
 */
export async function getSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions);
}

/**
 * Attempt to login with username + password.
 * Returns { ok, error? }.
 * Uses timingSafeEqual on both user and password to avoid user-enumeration via timing.
 */
export async function loginSession(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();

  const userBuf = Buffer.from(String(username || ""));
  const expectedUserBuf = Buffer.from(ADMIN_USER);
  const passBuf = Buffer.from(String(password || ""));
  const expectedPassBuf = Buffer.from(ADMIN_PASS);

  // Equal-length check + timingSafeEqual
  const userOk =
    userBuf.length === expectedUserBuf.length &&
    crypto.timingSafeEqual(userBuf, expectedUserBuf);
  const passOk =
    passBuf.length === expectedPassBuf.length &&
    crypto.timingSafeEqual(passBuf, expectedPassBuf);

  if (!userOk || !passOk) {
    return { ok: false, error: "Usuario o contraseña incorrectos." };
  }

  session.adminLoggedIn = true;
  session.adminUser = ADMIN_USER;
  session.csrfToken = generateCsrfToken();
  await session.save();

  return { ok: true };
}

/**
 * Destroy the admin session (logout).
 */
export async function logoutSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

// ---------------------------------------------------------------------------
// CSRF
// ---------------------------------------------------------------------------

/**
 * Generate a fresh CSRF token (32 bytes hex).
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate a CSRF token against the one stored in the current session.
 * Uses timingSafeEqual.
 */
export async function validateCsrf(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const session = await getSession();
  if (!session.csrfToken || !session.adminLoggedIn) return false;

  const a = Buffer.from(String(token));
  const b = Buffer.from(session.csrfToken);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Refresh the CSRF token if missing (used when rendering forms).
 * Returns the current token (regenerates if empty).
 */
export async function ensureCsrfToken(): Promise<string> {
  const session = await getSession();
  if (!session.csrfToken) {
    session.csrfToken = generateCsrfToken();
    await session.save();
  }
  return session.csrfToken;
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function isLoggedIn(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session.adminLoggedIn);
}

export async function getAdminUser(): Promise<string | null> {
  const session = await getSession();
  return session.adminLoggedIn ? session.adminUser : null;
}
