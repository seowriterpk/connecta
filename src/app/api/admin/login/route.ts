import { NextRequest, NextResponse } from "next/server";
import { loginSession } from "@/lib/admin-auth";
import { exec } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string; next?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de petición inválido." },
      { status: 400 }
    );
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const nextRaw = String(body.next || "/admin");
  // Whitelist redirect target (must be relative, must start with /admin or be /admin)
  const safeNext = nextRaw.startsWith("/admin") ? nextRaw : "/admin";

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "Usuario y contraseña son obligatorios." },
      { status: 400 }
    );
  }

  const result = await loginSession(username, password);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error || "Credenciales inválidas." },
      { status: 401 }
    );
  }

  // Audit log
  try {
    await exec(
      "INSERT INTO `admin_activity_log` (`adminUser`, `actionLabel`, `targetId`, `targetName`) VALUES (?, ?, ?, ?)",
      [username, "admin.login", null, username]
    );
  } catch (e) {
    console.error("[admin/login] audit log failed", e);
  }

  return NextResponse.json({ ok: true, redirect: safeNext });
}
