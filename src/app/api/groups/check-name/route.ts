/**
 * GET /api/groups/check-name?name=Display+Name
 *
 * Checks if a contributor display name is available for use.
 * Looks up UgcContributor by displaySlug (the unique key).
 *
 * Response: { ok: true, available: boolean, slug: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { queryOne, type Row } from "@/lib/db";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const MIN_LEN = 3;
const MAX_LEN = 32;
// Allow letters (with accents), numbers, spaces, hyphens, underscores.
const VALID_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _-]+$/;

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";

  if (name.length < MIN_LEN) {
    return NextResponse.json({
      ok: true,
      available: false,
      slug: "",
      reason: `Mínimo ${MIN_LEN} caracteres.`,
    });
  }
  if (name.length > MAX_LEN) {
    return NextResponse.json({
      ok: true,
      available: false,
      slug: "",
      reason: `Máximo ${MAX_LEN} caracteres.`,
    });
  }
  if (!VALID_PATTERN.test(name)) {
    return NextResponse.json({
      ok: true,
      available: false,
      slug: "",
      reason: "Solo se permiten letras, números, espacios y guiones.",
    });
  }

  const slug = generateSlug(name);
  if (!slug || slug === "grupo") {
    return NextResponse.json({
      ok: true,
      available: false,
      slug: "",
      reason: "Elige otro nombre.",
    });
  }

  const existing = await queryOne<Row>(
    "SELECT `id` FROM `ugc_contributors` WHERE `displaySlug` = ? LIMIT 1",
    [slug]
  );

  if (existing) {
    return NextResponse.json({
      ok: true,
      available: false,
      slug,
      reason: "Ese nombre ya está en uso.",
    });
  }

  return NextResponse.json({ ok: true, available: true, slug });
}
