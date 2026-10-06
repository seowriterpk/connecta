/**
 * POST /api/groups/verify-invite
 *
 * Verifies a WhatsApp invite link by re-fetching og:title + og:image from
 * chat.whatsapp.com. Never trusts frontend claims — uses the shared
 * fetchWhatsAppMeta server-side helper (iPhone UA, 8KB preview, 3-state).
 *
 * Body: { url: string }
 * Response: { ok: true, data: { status, groupName, imageUrl, inviteCode } }
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchWhatsAppMeta, isValidWhatsAppInvite } from "@/lib/whatsapp-validator";

export const dynamic = "force-dynamic";

const SPANISH_ERRORS: Record<string, string> = {
  invalid_format:
    "El enlace no es válido. Debe ser de WhatsApp (https://chat.whatsapp.com/…).",
  unknown_state:
    "No hemos podido comprobar el enlace. Inténtalo de nuevo en unos segundos.",
  revoked:
    "El enlace parece estar revocado o caducado. Genera uno nuevo en WhatsApp e inténtalo otra vez.",
  fetch_failed:
    "No se pudo contactar con WhatsApp para verificar el enlace. Inténtalo de nuevo.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: SPANISH_ERRORS.invalid_format },
        { status: 400 }
      );
    }

    const url = String(body.url ?? "").trim();
    if (!url || !isValidWhatsAppInvite(url)) {
      return NextResponse.json(
        { ok: false, error: SPANISH_ERRORS.invalid_format },
        { status: 400 }
      );
    }

    const meta = await fetchWhatsAppMeta(url);

    if (meta.status === "revoked") {
      return NextResponse.json(
        { ok: false, error: SPANISH_ERRORS.revoked, status: "revoked" },
        { status: 422 }
      );
    }

    if (meta.status === "unknown") {
      // Network error — can't reach WhatsApp. Allow user to proceed with
      // what they typed. They'll enter group name manually.
      return NextResponse.json({
        ok: true,
        data: {
          status: "unknown",
          groupName: "",
          imageUrl: "",
          inviteCode: meta.inviteCode,
          description: "",
          warning: "No se pudo verificar el enlace automáticamente. Puedes continuar, pero introduce el nombre del grupo manualmente en el siguiente paso.",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        status: meta.status,
        groupName: meta.groupName,
        imageUrl: meta.imageUrl,
        inviteCode: meta.inviteCode,
        description: meta.description,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: SPANISH_ERRORS.fetch_failed },
      { status: 500 }
    );
  }
}
