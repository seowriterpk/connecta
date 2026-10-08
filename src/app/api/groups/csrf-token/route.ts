/**
 * Public CSRF token endpoint for the UGC submission form.
 *
 * Strategy: cookie-based double-submit.
 * - Server generates a random 32-byte token.
 * - Sets it as an httpOnly cookie `cg_ugc_csrf` (1h, SameSite=Lax).
 * - Returns the same token in JSON so the client can include it in the form payload.
 * - On POST /api/groups/submit-ugc, the server compares the cookie value
 *   against the body value using crypto.timingSafeEqual.
 *
 * Why not iron-session? Public UGC users have no session — iron-session needs
 * a session cookie, which would be wasted here. The double-submit pattern
 * is enough because the cookie is httpOnly (JS cannot read it, so an
 * attacker site cannot replay the user's token) and bound to the same origin.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

const CSRF_COOKIE = "cg_ugc_csrf";
const TTL_SECONDS = 60 * 60; // 1h

export async function GET() {
  const token = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });

  return NextResponse.json({
    ok: true,
    token,
    expiresIn: TTL_SECONDS,
  });
}
