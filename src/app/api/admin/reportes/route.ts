/**
 * GET /api/admin/reportes — paginated reports listing for the admin table
 * (Task 29-b). Read-only: session auth, no CSRF (GET pattern). The SQL
 * lives in src/lib/admin-listings.ts (shared with the server page).
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-guard";
import { fetchAdminReportsPage } from "@/lib/admin-listings";
import { parseAdminReportsFilters } from "@/lib/admin-listing-params";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  try {
    const sp = req.nextUrl.searchParams;
    const { status, page, pageSize } = parseAdminReportsFilters((key) => sp.get(key));
    const data = await fetchAdminReportsPage(status, page, pageSize);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[admin/reportes GET] error", err);
    return NextResponse.json(
      { ok: false, error: "Error al cargar los reportes." },
      { status: 500 }
    );
  }
}
