import { getMetaCredentials } from "@/lib/meta-credentials";

const GRAPH_API_VERSION = "v21.0";

export type NumberHealth =
  | {
      phoneNumberId: string;
      ok: true;
      qualityRating: "GREEN" | "YELLOW" | "RED" | "UNKNOWN" | null;
      messagingTier: string | null;
    }
  | { phoneNumberId: string; ok: false; reason: "not_configured" | "fetch_failed" };

const QUALITY_BADGES: Record<string, { label: string; className: string }> = {
  GREEN: { label: "Good", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  YELLOW: { label: "Fair", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  RED: { label: "Poor", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
};

// Reserved for missing/UNKNOWN — never reuses one of the three real states
// above for "we don't know," which would misrepresent an absence of data
// as an actual good/fair/poor reading.
const UNKNOWN_BADGE = { label: "Unknown", className: "bg-muted text-muted-foreground" };

export function qualityBadge(qualityRating: string | null): { label: string; className: string } {
  return (qualityRating && QUALITY_BADGES[qualityRating]) || UNKNOWN_BADGE;
}

/**
 * Reads a WhatsApp phone number's Meta-reported quality rating and
 * messaging tier — the one thing this app can't compute itself, only ask
 * Meta for. `messaging_limit_tier` is Meta's deprecated predecessor field;
 * `whatsapp_business_manager_messaging_limit` is the current one (confirmed
 * via Meta's own docs this session) — deliberately not building on the old
 * one for a brand-new panel.
 *
 * Swallows failures and returns a typed result rather than throwing —
 * matches meta-conversions.ts, not whatsapp-send.ts's throw-on-failure
 * style, since a Meta hiccup here shouldn't take down the whole Trends
 * page, only this one panel.
 */
export async function fetchNumberHealth(businessId: string, phoneNumberId: string): Promise<NumberHealth> {
  const credentials = await getMetaCredentials(businessId);
  if (!credentials) {
    console.log(`[whatsapp-number-health:dry-run] phoneNumberId=${phoneNumberId}`);
    return { phoneNumberId, ok: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}?fields=quality_rating,whatsapp_business_manager_messaging_limit`,
      { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
    );

    if (!response.ok) {
      console.error(`Number health fetch failed for ${phoneNumberId} (${response.status}): ${await response.text()}`);
      return { phoneNumberId, ok: false, reason: "fetch_failed" };
    }

    const data = (await response.json()) as {
      quality_rating?: string;
      whatsapp_business_manager_messaging_limit?: string;
    };

    return {
      phoneNumberId,
      ok: true,
      qualityRating: (data.quality_rating as "GREEN" | "YELLOW" | "RED" | "UNKNOWN" | undefined) ?? null,
      messagingTier: data.whatsapp_business_manager_messaging_limit ?? null,
    };
  } catch (error) {
    console.error(`Number health fetch threw for ${phoneNumberId}`, error);
    return { phoneNumberId, ok: false, reason: "fetch_failed" };
  }
}
