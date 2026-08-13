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
