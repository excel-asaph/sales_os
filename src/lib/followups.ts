import { prisma } from "@/lib/prisma";

/**
 * Cancels every pending, unsent follow-up for a conversation and logs why.
 * Needed anywhere a conversation moves into a stage the follow-up worker
 * itself would refuse to act on (BLOCKS_FOLLOWUP,
 * src/worker/followup-worker.ts) but outside the normal "customer replied"
 * path (ingest-message.ts already handles that one inline, in the same
 * transaction as recording the inbound message). Without this, the
 * Followup row sits looking "active" — a live countdown on the
 * Customers/Dashboard UI — until its scheduled job fires and lazily
 * discovers it's stale, even though the worker's own stage check means it
 * was never actually going to send anything.
 */
/**
 * A follow-up's stored `message` is the fallback used only when composing
 * fresh fails at send time. The model sometimes fills it with a playbook
 * KEY ("payment_followup") rather than the text — an understandable
 * generalisation, since `send_template_message` genuinely does take a key —
 * which would then be sent to a customer verbatim as the entire message.
 *
 * Found in production 2026-09-03: 26 rows stored a bare key. None had
 * reached a customer, but only because the compose step hadn't failed on
 * one yet — and every AI call did fail for hours that same day on an
 * expired API key. Resolved at send time rather than only at write time so
 * rows already in the database are covered too.
 */
export function resolveFallbackMessage(
  message: string,
  playbook: Record<string, string> | null | undefined
): string {
  const text = playbook?.[message.trim()];
  return text?.trim() ? text : message;
}

export async function cancelPendingFollowups(conversationId: string, reason: string) {
  const { count } = await prisma.followup.updateMany({
    where: { conversationId, sent: false, cancelled: false },
    data: { cancelled: true },
  });
  if (count > 0) {
    await prisma.event.create({
      data: { conversationId, type: "FOLLOWUP_CANCELLED", payload: { reason } },
    });
  }
}

/**
 * The business-wide equivalent of cancelPendingFollowups above — used when
 * BusinessConfig.followupsEnabled flips to false (Settings), rather than
 * one conversation reaching a stage that blocks follow-ups on its own.
 * Cancels outright rather than deferring: a follow-up that would otherwise
 * fire mid-pause and get "caught up" later reads as a stale, oddly-timed
 * message once it finally sends, the same failure mode already fixed
 * elsewhere this session — better to just not send it.
 */
export async function cancelAllPendingFollowupsForBusiness(businessId: string, reason: string) {
  const pending = await prisma.followup.findMany({
    where: { sent: false, cancelled: false, conversation: { customer: { businessId } } },
    select: { conversationId: true },
    distinct: ["conversationId"],
  });
  if (pending.length === 0) return;

  await prisma.followup.updateMany({
    where: { sent: false, cancelled: false, conversation: { customer: { businessId } } },
    data: { cancelled: true },
  });
  await prisma.event.createMany({
    data: pending.map(({ conversationId }) => ({
      conversationId,
      type: "FOLLOWUP_CANCELLED",
      payload: { reason },
    })),
  });
}
