const GRAPH_API_VERSION = "v21.0";

// Meta's own values for this field (confirmed present: "verified" — the
// others are the documented possible states of a review, not directly
// observed, so anything unrecognized falls back to "PENDING" rather than
// crashing the wizard on an unexpected string).
export type BusinessVerificationStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";

function normalizeStatus(raw: string | undefined): BusinessVerificationStatus {
  switch (raw?.toLowerCase()) {
    case "verified":
      return "VERIFIED";
    case "rejected":
    case "failed":
      return "REJECTED";
    case "pending":
    case "pending_submission":
    case "pending_need_more_info":
      return "PENDING";
    default:
      return "NOT_STARTED";
  }
}

/**
 * Reads a WABA's live Business Verification status from Meta — required
 * before any template message can send (docs/META_WHATSAPP_COMPLIANCE.md).
 * BusinessMetaConnection.businessVerificationStatus mirrors the last-known
 * value so the wizard/settings page doesn't need a live call on every
 * render; this is what refreshes it.
 */
export async function fetchBusinessVerificationStatus(
  wabaId: string,
  accessToken: string
): Promise<BusinessVerificationStatus | null> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}?fields=business_verification_status`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    console.error(`Business verification status fetch failed for WABA ${wabaId} (${response.status}): ${await response.text()}`);
    return null;
  }
  const data = (await response.json()) as { business_verification_status?: string };
  return normalizeStatus(data.business_verification_status);
}
