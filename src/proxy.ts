import { NextRequest, NextResponse } from "next/server";

/**
 * Pathname bridge for server components (Next.js 16 "proxy" convention —
 * the renamed middleware).
 *
 * Owner directive (2026-10-21): adult category and adult group pages must
 * emit ZERO structured data — not even the site-wide WebSite/Organization
 * JSON-LD that every clean page carries. Only the page itself knows whether
 * its content is adult, but the ROOT LAYOUT owns those global schemas, so
 * the layout needs the pathname to ask the database. The proxy is the one
 * documented way to expose it (headers() can't read the request URL path).
 *
 * Scope: only the two dynamic routes whose content can be adult. Every
 * other request never pays the proxy cost at all.
 */
export default function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/categoria/:slug*", "/grupo/:slug*"],
};
