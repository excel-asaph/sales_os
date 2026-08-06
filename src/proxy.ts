import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const ADMIN_ONLY_PREFIXES = ["/settings", "/manage"];

// Gatekeeper for the internal-only pages (ARCHITECTURE.md §10). Deliberately
// does no database work — sessions are a signed, self-contained cookie
// (src/lib/auth.ts) so this stays a pure crypto check per Next's own
// guidance not to lean on shared state/globals in proxy files. Every
// Server Action behind these paths re-checks the session itself too (see
// auth.ts's requireSession/requireAdminSession) since a matcher change here
// could otherwise silently stop protecting them.
// request.url's host reflects Railway's internal container address, not
// the public domain it's actually reached at, so NextResponse.redirect(new
// URL(path, request.url)) sends browsers to an address they can't reach.
// A raw Response with a relative Location header (the fix used in
// api/number-filter/route.ts and logout/route.ts) isn't an option here —
// Proxy's runtime requires an actual NextResponse and 500s on a bare
// Response. So instead: trust X-Forwarded-Host/X-Forwarded-Proto, which
// Railway's edge sets to the real public host, and build the absolute URL
// from that instead of request.url.
function publicOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const origin = publicOrigin(request);

  if (!session) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminOnly = ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminOnly && !session.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/dashboard/:path*", "/settings/:path*", "/manage/:path*"],
};
