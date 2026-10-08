import { NextRequest, NextResponse } from "next/server";
import { subscribeNewsletter } from "@/lib/data";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
    }
    const email = String(body.email ?? "").trim().toLowerCase();
    const source = body.source ? String(body.source) : "footer";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "Introduce un correo válido." }, { status: 400 });
    }
    if (email.length > 160) {
      return NextResponse.json({ ok: false, error: "Correo demasiado largo." }, { status: 400 });
    }

    const result = await subscribeNewsletter(email, source);
    return NextResponse.json(
      {
        ok: true,
        data: result,
        message: result.existed
          ? "Ya estabas suscrito. ¡Gracias por seguir con nosotros!"
          : "¡Suscripción confirmada! Te avisaremos de los mejores grupos.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo completar la suscripción." }, { status: 500 });
  }
}
