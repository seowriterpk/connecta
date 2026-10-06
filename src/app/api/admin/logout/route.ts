import { NextResponse } from "next/server";
import { logoutSession } from "@/lib/admin-auth";
import { exec } from "@/lib/db";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getAdminUser();
  await logoutSession();
  try {
    if (user) {
      await exec(
        "INSERT INTO `admin_activity_log` (`adminUser`, `actionLabel`, `targetId`, `targetName`) VALUES (?, ?, ?, ?)",
        [user, "admin.logout", null, user]
      );
    }
  } catch (e) {
    console.error("[admin/logout] audit log failed", e);
  }
  return NextResponse.json({ ok: true, redirect: "/admin/login" });
}

export async function GET() {
  // Convenience GET for link-based logout (less safe for GET-state-change,
  // but acceptable for a logout action with CSRF cookie-only session).
  const user = await getAdminUser();
  await logoutSession();
  try {
    if (user) {
      await exec(
        "INSERT INTO `admin_activity_log` (`adminUser`, `actionLabel`, `targetId`, `targetName`) VALUES (?, ?, ?, ?)",
        [user, "admin.logout", null, user]
      );
    }
  } catch (e) {
    console.error("[admin/logout] audit log failed", e);
  }
  return NextResponse.redirect(new URL("/admin/login", "http://localhost:3000"));
}
