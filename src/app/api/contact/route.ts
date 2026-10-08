import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const message = String(body.message ?? "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ ok: false, error: "Indica tu nombre." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "Introduce un correo válido." }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ ok: false, error: "Cuéntanos algo más (mínimo 10 caracteres)." }, { status: 400 });
    }
    if (name.length > 120 || email.length > 160 || message.length > 4000) {
      return NextResponse.json({ ok: false, error: "Algún campo es demasiado largo." }, { status: 400 });
    }

    // Log the contact message for the team to review.
    // (Production would forward to an inbox or ticketing system.)
    

    return NextResponse.json(
      {
        ok: true,
        message:
          "¡Mensaje recibido! Te responderemos a tu correo en menos de 48 horas laborables.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo enviar el mensaje." }, { status: 500 });
  }
}
