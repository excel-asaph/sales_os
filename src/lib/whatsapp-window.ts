import { prisma } from "@/lib/prisma";

const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * WhatsApp Cloud API only allows free-form messages within 24 hours of
 * the customer's last inbound message — outside that, only a
 * Meta-approved Message Template (sendWhatsAppTemplate) can reach them.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
 *
 * Anything that might fire long after the customer last spoke — a
 * scheduled follow-up, a human replying to a conversation that's sat in
 * HUMAN_REVIEW_REQUIRED for a while — needs to check this before sending
 * free-form text, or the send silently fails against the real API.
 */
export async function isWithinCustomerServiceWindow(conversationId: string): Promise<boolean> {
  const lastInbound = await prisma.message.findFirst({
    where: { conversationId, direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!lastInbound) return false; // no inbound message ever — no window was ever opened
  return Date.now() - lastInbound.createdAt.getTime() < CUSTOMER_SERVICE_WINDOW_MS;
}
