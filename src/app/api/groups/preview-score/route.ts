/**
 * POST /api/groups/preview-score
 *
 * Live quality-score preview for the Add-Group form.
 * Mirrors the server-side scoring logic so the user sees a real progress bar.
 *
 * Body: {
 *   hasInviteCode, hasGroupName, hasCategory, hasCountry, hasCity,
 *   tagsCount, keywordsCount, hasImage, hasLanguage, isContributor,
 *   text: string  // group name + tags + keywords combined, for hunterScan
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { calculateScore } from "@/lib/quality-score";
import { hunterScan } from "@/lib/content-hunter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos." },
        { status: 400 }
      );
    }

    const text = String(body.text ?? "");
    const hunterResult = hunterScan(text);

    const result = calculateScore({
      hasInviteCode: Boolean(body.hasInviteCode),
      hasGroupName: Boolean(body.hasGroupName),
      hasCategory: Boolean(body.hasCategory),
      hasCountry: Boolean(body.hasCountry),
      hasCity: Boolean(body.hasCity),
      tagsCount: Number(body.tagsCount ?? 0),
      keywordsCount: Number(body.keywordsCount ?? 0),
      hasImage: Boolean(body.hasImage),
      hasLanguage: Boolean(body.hasLanguage),
      isContributor: Boolean(body.isContributor),
      isDuplicate: false, // can't check duplicate in preview without invite code in DB
      hunterResult,
      isAdultDeclared: Boolean(body.isAdultDeclared),
      submissionTimeSec: 30, // assume non-bot for preview
    });

    return NextResponse.json({
      ok: true,
      data: {
        score: result.score,
        label: result.label,
        decision: result.decision,
        flags: result.flags,
        breakdown: result.breakdown,
        hunterHits: hunterResult.hits,
        hunterSevere: hunterResult.severeHits,
        hunterAdult: hunterResult.adultHits,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo calcular la puntuación." },
      { status: 500 }
    );
  }
}
