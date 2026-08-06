import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { NUMBER_FILTER_COOKIE } from "@/lib/number-filter";

// Sets the active WhatsApp number as a cookie, then redirects back —
// GET-with-a-side-effect rather than a Server Action specifically so the
// sidebar switcher (app-shell.tsx) can trigger it with a plain <Link>,
// the same click mechanism already used for every other nav item, instead
// of a <form> nested inside a Base UI Menu.Item (whose own click handling
// isn't guaranteed not to swallow a nested native form submission).
export async function GET(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const value = searchParams.get("value");
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  if (!session || !value) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.set(NUMBER_FILTER_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
