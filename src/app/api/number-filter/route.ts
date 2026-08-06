import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { NUMBER_FILTER_COOKIE } from "@/lib/number-filter";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Sets the active WhatsApp number as a cookie, then redirects back —
// GET-with-a-side-effect rather than a Server Action specifically so the
// sidebar switcher (app-shell.tsx) can trigger it with a plain <Link>,
// the same click mechanism already used for every other nav item, instead
// of a <form> nested inside a Base UI Menu.Item (whose own click handling
// isn't guaranteed not to swallow a nested native form submission).
//
// Deliberately a relative `Location` header via a raw Response, not
// `NextResponse.redirect(new URL(path, request.url))` — behind Railway's
// proxy, `request.url` reflects the container's internal address
// (localhost:<port>), not the public domain, so an absolute URL built
// from it redirects to a host the browser can't reach. A relative
// Location is resolved by the browser against whatever origin it's
// actually on (same pattern login/actions.ts already uses via
// next/navigation's redirect()), which works regardless of what the
// server-side request object thinks its own host is.
export async function GET(request: NextRequest) {
  const session = await getSession();
  const value = request.nextUrl.searchParams.get("value");
  const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard";

  if (!session || !value) {
    return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${NUMBER_FILTER_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": cookie,
    },
  });
}
