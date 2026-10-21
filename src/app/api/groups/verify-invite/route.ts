/**
 * POST /api/groups/verify-invite
 *
 * Verifies a WhatsApp invite link by re-fetching og:title + og:image from
 * chat.whatsapp.com. Never trusts frontend claims — uses the shared
 * fetchWhatsAppMeta server-side helper (iPhone UA, 64KB preview, 3-state).
 *
 * HARD-BLOCK POLICY (user directive 2026-10-21): ONLY an "active" verdict
 * (og:title = real group name fetched from WhatsApp) lets the user
 * continue. "revoked" (expired / random / dead link) and "unknown"
 * (network hiccup) are BOTH rejected — the user can never proceed to
 * write the group name by hand.
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
    "No pudimos verificar el enlace con WhatsApp. Revisa que sea correcto e inténtalo de nuevo.",
  revoked:
    "Este enlace ha caducado (expirado) o no es válido. Copia un enlace de invitación activo y vuelve a intentarlo.",
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
      // Network error — can't reach WhatsApp, so we can't fetch the group
      // name either. HARD BLOCK (user directive: the name is always fetched
      // from WhatsApp and stored, never typed by the user).
      return NextResponse.json(
        { ok: false, error: SPANISH_ERRORS.unknown_state, status: "unknown" },
        { status: 422 }
      );
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
