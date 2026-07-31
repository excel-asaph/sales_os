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

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminOnly = ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminOnly && !session.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/manage/:path*"],
};
