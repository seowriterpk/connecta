import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, checkCsrfApi, logAdminAction } from "@/lib/admin-guard";
import {
  getAdminSettings,
  saveAdminSettings,
  DEFAULT_ADMIN_SETTINGS,
  type AdminSettings,
} from "@/lib/admin-settings";

export const dynamic = "force-dynamic";

/** GET — current policy values (merged over defaults). */
export async function GET() {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  const settings = await getAdminSettings();
  return NextResponse.json({ ok: true, settings, defaults: DEFAULT_ADMIN_SETTINGS });
}

/** PUT — persist a partial settings patch. */
export async function PUT(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  let body: { settings?: Partial<AdminSettings>; csrf?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const csrfErr = await checkCsrfApi(body.csrf);
  if (csrfErr) return csrfErr;

  if (!body.settings || typeof body.settings !== "object") {
    return NextResponse.json({ ok: false, error: "Sin cambios." }, { status: 400 });
  }

  const settings = await saveAdminSettings(body.settings);
  await logAdminAction("settings.update", "admin_settings", Object.keys(body.settings).join(","));
  return NextResponse.json({ ok: true, settings });
}
