/**
 * GET /api/admin/grupos — paginated, filterable groups listing for the
 * admin data-table (Task 29-b).
 *
 * Read-only: session auth (checkAdminApi) with no CSRF, exactly like the
 * other admin GET routes (seo/search). The SQL/parse logic lives in
 * src/lib/admin-listings.ts so the server-rendered first page and this
 * endpoint share one source of truth.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-guard";
import { fetchAdminGroupsPage } from "@/lib/admin-listings";
import { parseAdminGroupsFilters } from "@/lib/admin-listing-params";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  try {
    const sp = req.nextUrl.searchParams;
    const filters = parseAdminGroupsFilters((key) => sp.get(key));
    const data = await fetchAdminGroupsPage(filters);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[admin/grupos GET] error", err);
    return NextResponse.json(
      { ok: false, error: "Error al cargar los grupos." },
      { status: 500 }
    );
  }
}
