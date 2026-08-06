import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

// A relative Location header, not NextResponse.redirect(new URL(path,
// request.url)) — behind Railway's proxy, request.url reflects the
// container's internal address, not the public domain, so an absolute
// URL built from it redirects to a host the browser can't reach (same
// issue found and fixed in api/number-filter/route.ts). A relative
// Location is resolved by the browser against whatever origin it's
// actually on instead.
export async function GET() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return new Response(null, { status: 302, headers: { Location: "/login" } });
}
