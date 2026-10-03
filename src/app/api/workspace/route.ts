import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { switchWorkspace } from "@/lib/workspaces";

// Switches the session into another of the person's businesses, then lands
// on /home. A GET with a side effect, linked from a plain <a> in the
// sidebar, for the same reasons as api/number-filter/route.ts: it works
// inside the Base UI menu, and a full page load is the only way the new
// cookie is seen on the first click. A link from elsewhere can at worst
// move someone into a business they already belong to.
//
// Always /home, never back to the current page: a conversation or
// customer open now belongs to the business being left.
export async function GET(request: NextRequest) {
  const session = await getSession();
  const businessId = request.nextUrl.searchParams.get("id");

  if (!session) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  if (businessId && businessId !== session.businessId) {
    await switchWorkspace(session, businessId);
  }
  return new Response(null, { status: 302, headers: { Location: "/home" } });
}
