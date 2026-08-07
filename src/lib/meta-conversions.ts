import { prisma } from "@/lib/prisma";

const GRAPH_API_VERSION = "v21.0";

interface ReferralShape {
  ctwa_clid?: string;
}

export type ConversionReportResult =
  | { reported: true }
  | { reported: false; reason: "not_configured" | "not_ad_attributed" | "send_failed" };

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
  conversationId: string;
  value: number;
  currency: string;
}): Promise<ConversionReportResult> {
  const datasetId = process.env.META_CONVERSIONS_DATASET_ID;
  const wabaId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

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
