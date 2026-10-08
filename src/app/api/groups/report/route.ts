import { NextRequest, NextResponse } from "next/server";
import { exec, newId, queryOne, type Row } from "@/lib/db";
import { getGroupById } from "@/lib/data";
import { REPORT_REASONS } from "@/lib/constants";
import { getClientIp } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

const VALID_REASONS = new Set<string>(REPORT_REASONS.map((r) => r.value));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
    }
    const groupId = String(body.groupId ?? "").trim();
    const reason = String(body.reason ?? "").trim();

    if (!groupId) {
      return NextResponse.json({ ok: false, error: "Falta el identificador del grupo." }, { status: 400 });
    }
    if (!VALID_REASONS.has(reason)) {
      return NextResponse.json({ ok: false, error: "Motivo de reporte no válido." }, { status: 400 });
    }

    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json({ ok: false, error: "El grupo no existe." }, { status: 404 });
    }

    const reporterIp = getClientIp({
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Check if already reported by this IP for this group
    const existing = await queryOne<Row>(
      "SELECT `id` FROM `group_reports` WHERE `groupId` = ? AND `reporterIp` = ? LIMIT 1",
      [groupId, reporterIp]
    );
    if (existing) {
      return NextResponse.json({ ok: false, error: "Ya has reportado este grupo." }, { status: 409 });
    }

    const reportId = newId();
    await exec(
      "INSERT INTO `group_reports` (`id`, `groupId`, `reporterIp`, `reason`, `status`) VALUES (?, ?, ?, ?, ?)",
      [reportId, groupId, reporterIp, reason, "OPEN"]
    );

    return NextResponse.json(
      { ok: true, data: { id: reportId }, message: "Reporte recibido. Lo revisaremos lo antes posible." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo enviar el reporte." }, { status: 500 });
  }
}
