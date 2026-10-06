/**
 * Server-side admin guard.
 * Use in admin pages / API routes: redirect or reject if not logged in.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/admin-auth";
import { exec } from "@/lib/db";

/**
 * Check admin session for a server component page.
 * Redirects to /admin/login if not authenticated.
 * Returns the CSRF token + admin username for the page to use.
 */
export async function checkAdmin(): Promise<{ csrfToken: string; adminUser: string }> {
  const session = await getSession();
  if (!session.adminLoggedIn) {
    redirect("/admin/login");
  }
  if (!session.csrfToken) {
    // Should not happen if logged in, but ensure token exists
    session.csrfToken = (await import("crypto")).randomBytes(32).toString("hex");
    await session.save();
  }
  return { csrfToken: session.csrfToken, adminUser: session.adminUser };
}

/**
 * Check admin session for a route handler / server action.
 * Returns null if authenticated, or a NextResponse-like { error } object.
 * Usage:
 *   const guard = await checkAdminApi();
 *   if (guard) return guard; // 401
 */
export async function checkAdminApi(): Promise<Response | null> {
  const session = await getSession();
  if (!session.adminLoggedIn) {
    return new Response(
      JSON.stringify({ ok: false, error: "No autorizado." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}

/**
 * Validate CSRF for an API request.
 * Returns null if valid, else a 403 Response.
 */
export async function checkCsrfApi(
  token: string | null | undefined
): Promise<Response | null> {
  const { validateCsrf } = await import("@/lib/admin-auth");
  const ok = await validateCsrf(token);
  if (!ok) {
    return new Response(
      JSON.stringify({ ok: false, error: "Token CSRF inválido." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}

/**
 * Append an entry to the admin audit trail.
 * Non-fatal: logs errors but does not throw.
 */
export async function logAdminAction(
  actionLabel: string,
  targetId?: string,
  targetName?: string
): Promise<void> {
  try {
    const session = await getSession();
    const adminUser = session.adminLoggedIn ? session.adminUser : "system";
    await exec(
      "INSERT INTO `admin_activity_log` (`adminUser`, `actionLabel`, `targetId`, `targetName`) VALUES (?, ?, ?, ?)",
      [adminUser, actionLabel, targetId ?? null, targetName ?? null]
    );
  } catch (err) {
    console.error("[admin-guard] logAdminAction failed:", err);
  }
}
