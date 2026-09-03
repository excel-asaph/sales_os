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

/**
 * The cookie's value resolved against the numbers this business actually
 * owns. Returns undefined for the unified ("all") view.
 *
 * The validation is the point: the cookie is per-browser and lives for a
 * year, but it holds a phone_number_id belonging to whichever business was
 * being viewed when it was set. Trusting it verbatim across a business
 * switch silently filtered every query down to zero rows (confirmed in
 * production, 2026-09-03: a phone still holding a number from a previous
 * business showed ₦0/0 orders/0 leads on a business with 79 live
 * conversations). Worse, a business with only one number doesn't render the
 * sidebar switcher at all (app-shell.tsx), so there was no way to see or
 * clear the stale selection from the UI. An unrecognized number is treated
 * as no selection rather than as a filter.
 */
export function resolveEffectiveNumber(
  numberFilter: string | undefined,
  business: { whatsappPhoneNumberId: string | null; additionalWhatsappPhoneNumberIds: string[] }
): string | undefined {
  if (numberFilter === "all") return undefined;
  const owned = [
    ...(business.whatsappPhoneNumberId ? [business.whatsappPhoneNumberId] : []),
    ...business.additionalWhatsappPhoneNumberIds,
  ];
  if (numberFilter && owned.includes(numberFilter)) return numberFilter;
  return business.whatsappPhoneNumberId ?? undefined;
}
