import { cookies } from "next/headers";

// The active WhatsApp number selection — a business-owner display
// preference, not per-page state, so it has to survive normal navigation
// between tabs. A cookie (not a URL param) is what makes that possible:
// every server-rendered page reads the same value regardless of which URL
// got you there. "all" is the explicit unified view; anything else is a
// phone_number_id. No cookie at all (first visit) means "use the primary
// number" — resolved by callers via getBusinessNumbers, not here.
export const NUMBER_FILTER_COOKIE = "wa_number_filter";

export async function getNumberFilterCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(NUMBER_FILTER_COOKIE)?.value;
}
