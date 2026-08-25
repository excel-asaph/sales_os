import { prisma } from "@/lib/prisma";
import { getMetaCredentials } from "@/lib/meta-credentials";

const GRAPH_API_VERSION = "v21.0";

interface ReferralShape {
  ctwa_clid?: string;
}

/**
 * Creates (or, since this call is idempotent, retrieves the existing)
 * Conversions API dataset for a WABA — the exact call documented by hand in
 * docs/META_CONVERSIONS_SETUP.md, now run automatically as step 2 of the
 * Connect WhatsApp wizard (src/app/settings/whatsapp) right after Embedded
 * Signup completes, using the token it just returned.
 */
export async function createOrGetConversionsDataset(wabaId: string, accessToken: string): Promise<string> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/dataset`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create/retrieve Conversions dataset for WABA ${wabaId} (${response.status}): ${body}`);
  }
  const data = (await response.json()) as { id?: string; dataset_id?: string };
  const datasetId = data.id ?? data.dataset_id;
  if (!datasetId) {
    throw new Error(`Dataset creation for WABA ${wabaId} succeeded but returned no dataset id: ${JSON.stringify(data)}`);
  }
  return datasetId;
}

export type ConversionReportResult =
  | { reported: true }
  | { reported: false; reason: "not_configured" | "not_ad_attributed" | "send_failed" };

// Order.metaConversionReportReason stores exactly this string: "reported"
// on success, or the failure `reason` verbatim — see finalizeVerifiedOrder
// (src/lib/actions.ts), the only writer.
const CONVERSION_BADGES: Record<string, { label: string; className: string }> = {
  reported: {
    label: "Reported to Meta",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  not_ad_attributed: {
    label: "Not ad-attributed",
    className: "bg-muted text-muted-foreground",
  },
  send_failed: {
    label: "Meta report failed",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
  not_configured: {
    label: "Meta not configured",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
};

// Null (no badge) means no report was ever attempted for this order — e.g.
// it predates this feature — rather than implying an outcome that never
// actually happened.
export function conversionBadge(reason: string | null): { label: string; className: string } | null {
  return reason ? (CONVERSION_BADGES[reason] ?? null) : null;
}

/**
 * Reports a completed sale to Meta's Conversions API for Business Messaging
 * (docs.developers.facebook.com/docs/marketing-api/conversions-api/business-messaging)
 * so the ad that drove the conversation gets credit for the actual sale, not
 * just the chat starting — without this, Meta's ad algorithm only ever sees
 * "someone messaged," never "and they paid."
 *
 * Only fires for conversations that started from a Click-to-WhatsApp ad —
 * Meta attaches a `ctwa_clid` to the referral object on the first inbound
 * message (already captured verbatim onto Conversation.referral by
 * ingest-message.ts), which is what ties this event back to the specific ad.
 * An organic conversation has no referral at all, so there's nothing to
 * attribute and this is a deliberate no-op, not a failure.
 *
 * Falls back to logging (never throws) when the dataset/token aren't
 * configured yet, matching every other external-credential call in this
 * codebase (see whatsapp-send.ts) — and never blocks or fails the actual
 * sale it's reporting on, since this is a side-channel signal to Meta, not
 * something the customer-facing flow depends on.
 */
export async function reportPurchaseConversion(params: {
  businessId: string;
  conversationId: string;
  value: number;
  currency: string;
}): Promise<ConversionReportResult> {
  const credentials = await getMetaCredentials(params.businessId);
  const datasetId = credentials?.conversionsDatasetId;
  const wabaId = credentials?.wabaId;
  const accessToken = credentials?.accessToken;

  if (!datasetId || !wabaId || !accessToken) {
    console.log(
      `[meta-conversions:dry-run] conversation=${params.conversationId} value=${params.value} ${params.currency}`
    );
    return { reported: false, reason: "not_configured" };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
    select: { referral: true },
  });
  const referral = conversation?.referral as ReferralShape | null;
  const ctwaClid = referral?.ctwa_clid;

  if (!ctwaClid) {
    return { reported: false, reason: "not_ad_attributed" };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${datasetId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              action_source: "business_messaging",
              messaging_channel: "whatsapp",
              user_data: {
                whatsapp_business_account_id: wabaId,
                ctwa_clid: ctwaClid,
              },
              custom_data: {
                currency: params.currency,
                value: params.value,
              },
            },
          ],
          partner_agent: "antflow-sales-os",
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Meta conversion report failed (${response.status}) for conversation ${params.conversationId}: ${body}`);
      return { reported: false, reason: "send_failed" };
    }

    return { reported: true };
  } catch (error) {
    console.error(`Meta conversion report failed for conversation ${params.conversationId}`, error);
    return { reported: false, reason: "send_failed" };
  }
}
