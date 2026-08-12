import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { DATE_RANGE_FILTER_COOKIES, type DateRangeScope } from "@/lib/date-range-filter";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Sets the active date-range filter as a cookie, then redirects back — the
// same GET-with-a-side-effect + relative Location header pattern as
// api/number-filter/route.ts, for the same reasons (works from a plain
// <a>, and a relative Location resolves correctly behind Railway's proxy
// where request.url reflects the container's internal address). `value`
// is either a preset key ("today", "yesterday", "last7", "last30",
// "thismonth", "all") or "custom:<from>:<to>" (both YYYY-MM-DD) from the
// calendar picker. `scope` picks WHICH page's cookie this sets — validated
// against a fixed allowlist rather than trusting a raw cookie name from
// the query string, since this route only checks that a session exists,
// not that it owns the cookie name being written; an unvalidated name
// would let a crafted link try to clobber an unrelated cookie (in the
// worst case, the session cookie itself) for anyone who clicks it while
// logged in.
export async function GET(request: NextRequest) {
  const session = await getSession();
  const value = request.nextUrl.searchParams.get("value");
  const scope = request.nextUrl.searchParams.get("scope") as DateRangeScope | null;
  const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard";

  if (!session || !value || !scope || !(scope in DATE_RANGE_FILTER_COOKIES)) {
    return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${DATE_RANGE_FILTER_COOKIES[scope]}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": cookie,
    },
  });
}
