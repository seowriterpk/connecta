import { NextResponse } from "next/server";
import { dbHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Health check — returns 200 fast when the app is up.
 * `db.ok` tells you whether MySQL answered (localhost pool).
 * Useful on Hostinger to distinguish 503 (app down) from DB issues.
 */
export async function GET() {
  const db = await dbHealth();
  return NextResponse.json({
    ok: true,
    db,
    version: "3.0.0-mysql2",
    time: new Date().toISOString(),
  });
}
