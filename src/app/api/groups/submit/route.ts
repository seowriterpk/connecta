import { NextRequest, NextResponse } from "next/server";
import { submitGroup } from "@/lib/data";
import { getCategories, getCountries } from "@/lib/data";

export const dynamic = "force-dynamic";

const WHATSAPP_INVITE_RE = /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\/[A-Za-z0-9\-_]+/i;

// Code-point based limit: styled Unicode names (math bold "𝐀𝐃𝐈𝐋") count as
// 1 char per glyph here, not 2 UTF-16 units.
const TITLE_MAX_CP = 120;
const INVISIBLE_RE = /[\u200b-\u200f\u202a-\u202e\u2060\ufeff\u00ad]/g;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos." },
        { status: 400 }
      );
    }

    const title = String(body.title ?? "").replace(INVISIBLE_RE, "").trim();
    const description = String(body.description ?? "").trim();
    const inviteLink = String(body.inviteLink ?? "").trim();
    const categoryId = String(body.categoryId ?? "").trim();
    const countryId = String(body.countryId ?? "").trim();
    const contactName = body.contactName ? String(body.contactName).trim() : "";
    const city = body.city ? String(body.city).trim() : "";
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : "";
    const tags = Array.isArray(body.tags) ? body.tags.map(String).slice(0, 8) : [];

    // Validaciones (longitud por PUNTOS DE CÓDIGO — los nombres con fuentes
    // estilizadas usan glifos SMP que valen 2 unidades UTF-16 cada uno)
    if ([...title].length < 5 || [...title].length > TITLE_MAX_CP) {
      return NextResponse.json(
        { ok: false, error: `El título debe tener entre 5 y ${TITLE_MAX_CP} caracteres.` },
        { status: 400 }
      );
    }
    if (description.length < 20 || description.length > 600) {
      return NextResponse.json(
        { ok: false, error: "La descripción debe tener entre 20 y 600 caracteres." },
        { status: 400 }
      );
    }
    if (!WHATSAPP_INVITE_RE.test(inviteLink)) {
      return NextResponse.json(
        {
          ok: false,
          error: "El enlace debe ser de WhatsApp (chat.whatsapp.com o wa.me).",
        },
        { status: 400 }
      );
    }

    const [categories, countries] = await Promise.all([getCategories(), getCountries()]);
    if (!categories.some((c) => c.id === categoryId)) {
      return NextResponse.json(
        { ok: false, error: "Categoría no válida." },
        { status: 400 }
      );
    }
    if (!countries.some((c) => c.id === countryId)) {
      return NextResponse.json(
        { ok: false, error: "País no válido." },
        { status: 400 }
      );
    }

    const created = await submitGroup({
      title,
      description,
      inviteLink,
      imageUrl: imageUrl || undefined,
      categoryId,
      countryId,
      city: city || undefined,
      contactName: contactName || undefined,
      tags,
    });

    return NextResponse.json(
      {
        ok: true,
        data: created,
        message:
          "¡Grupo enviado! Quedará pendiente de revisión antes de publicarse.",
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "No se pudo enviar el grupo. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
