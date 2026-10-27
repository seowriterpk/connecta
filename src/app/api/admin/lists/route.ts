/**
 * GET /api/admin/lists — paginated shared-favorites-lists listing for the
 * admin table (Task 29-b). Read-only: session auth, no CSRF (GET pattern).
 * The SQL lives in src/lib/admin-listings.ts (shared with the server page).
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-guard";
import { fetchAdminListsPage } from "@/lib/admin-listings";
import { parseAdminListsFilters } from "@/lib/admin-listing-params";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = await checkAdminApi();
  if (authErr) return authErr;

  try {
    const sp = req.nextUrl.searchParams;
    const { filter, q, page, pageSize } = parseAdminListsFilters((key) => sp.get(key));
    const data = await fetchAdminListsPage(filter, q, page, pageSize);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[admin/lists GET] error", err);
    return NextResponse.json(
      { ok: false, error: "Error al cargar las listas." },
      { status: 500 }
    );
  }
}
