import { NextRequest, NextResponse } from "next/server";
import { queryOne, upsertGroupFeedback, getGroupFeedbackCounts, type Row } from "@/lib/db";
import { hashValue, checkRateLimit, hitRateLimit } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * POST /api/groups/feedback — like / dislike for a group.
 *
 * Body: { slug: string, action: "like" | "dislike" }
 *
 * - Group must exist and be live (404 otherwise).
 * - One vote per visitor per group, switchable: the visitor is identified by
 *   sha256(client IP + User-Agent + fixed salt) and the table's UNIQUE key
 *   (groupId, visitorHash) turns a repeat vote into an in-place update.
 * - Response carries the post-write recount: { likes, dislikes } — honest
 *   numbers straight from GROUP BY, never incremented client-side.
 */
const FEEDBACK_SALT = "gh-feedback-v1";

function visitorHashOf(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0].trim() || "local";
  const ua = req.headers.get("user-agent") ?? "";
  return hashValue(`${ip}|${ua}|${FEEDBACK_SALT}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
    }
    const slug = String(body.slug ?? "").trim();
    const action = String(body.action ?? "");
    if (!slug) {
      return NextResponse.json({ ok: false, error: "Falta slug." }, { status: 400 });
    }
    if (action !== "like" && action !== "dislike") {
      return NextResponse.json(
        { ok: false, error: "La acción debe ser «like» o «dislike»." },
        { status: 400 }
      );
    }

    const group = await queryOne<Row & { id: string }>(
      "SELECT `id` FROM `groups` WHERE `slug` = ? AND `status` = 'live' LIMIT 1",
      [slug]
    );
    if (!group) {
      return NextResponse.json({ ok: false, error: "Grupo no encontrado." }, { status: 404 });
    }

    // Light anti-hammer guard (the unique visitor key already caps votes per
    // group; this limits write traffic per visitor across all groups).
    const visitorHash = visitorHashOf(req);
    const rateKey = `feedback:${visitorHash}`;
    const burst = await checkRateLimit(rateKey, "group_feedback", 30, 3600);
    if (!burst.allowed) {
      return NextResponse.json(
        { ok: false, error: "Demasiados votos seguidos. Inténtalo más tarde." },
        { status: 429 }
      );
    }

    await upsertGroupFeedback(group.id, visitorHash, action);
    await hitRateLimit(rateKey, "group_feedback", 3600);

    const counts = await getGroupFeedbackCounts(group.id);
    return NextResponse.json({ ok: true, data: counts });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar tu voto." }, { status: 500 });
  }
}
