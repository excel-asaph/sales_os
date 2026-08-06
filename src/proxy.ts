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
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  // Relative Location headers, not NextResponse.redirect(new URL(path,
  // request.url)) — Proxy runs on the Node.js runtime by default in this
  // Next.js version (same as Route Handlers), and behind Railway's proxy
  // request.url reflects the container's internal address, not the
  // public domain, so an absolute URL built from it redirects to a host
  // the browser can't reach (same issue found and fixed in
  // api/number-filter/route.ts and logout/route.ts). A relative Location
  // is resolved by the browser against whatever origin it's actually on
  // instead.
  if (!session) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?next=${encodeURIComponent(pathname)}` },
    });
  }

  const isAdminOnly = ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminOnly && !session.isAdmin) {
    return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/dashboard/:path*", "/settings/:path*", "/manage/:path*"],
};
