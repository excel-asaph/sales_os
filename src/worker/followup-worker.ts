import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { getBoss, FOLLOWUP_QUEUE, type FollowupJobData } from "@/lib/queue";
import { runAIEmployeeTurn } from "@/lib/ai-runtime";
import { sendWhatsAppText } from "@/lib/whatsapp-send";
import type { ConversationStage } from "@/generated/prisma/client";

// Stages where a scheduled follow-up no longer makes sense: the sale
// already completed one way or another, or a human already owns this
// conversation and the AI shouldn't jump back in on its own (ARCHITECTURE.md
// §9: "checks whether the order has since completed... or the follow-up
// was cancelled").
const BLOCKS_FOLLOWUP = new Set<ConversationStage>([
  "SALE_COMPLETED",
  "LOST_LEAD",
  "RESOLVED",
  "PRODUCT_DELIVERED",
  "PAYMENT_VERIFIED",
  "HUMAN_REVIEW_REQUIRED",
  "HUMAN_ASSIGNED",
]);

/**
 * The Follow-Up Engine worker (PRD 8.6, ARCHITECTURE.md §9, §11). A
 * separate long-running process (run via `npm run worker`) that consumes
 * pg-boss jobs scheduled by create_followup (src/lib/actions.ts) once
 * their delay elapses. Deliberately not folded into the Next.js process —
 * this is the "one worker process" ARCHITECTURE.md §11 calls for.
 */
async function handleFollowup(followupId: string) {
  const followup = await prisma.followup.findUnique({
    where: { id: followupId },
    include: { conversation: { include: { customer: true, orders: true } } },
  });

  // Already handled (e.g. a retried redelivery of the same job) or
  // explicitly cancelled elsewhere — nothing to do.
  if (!followup || followup.sent || followup.cancelled) return;

  const { conversation } = followup;
  const orderVerified = conversation.orders.some((order) => order.status === "VERIFIED");
  const stageBlocksFollowup = BLOCKS_FOLLOWUP.has(conversation.currentStage);

  if (orderVerified || stageBlocksFollowup) {
    await prisma.$transaction([
      prisma.followup.update({ where: { id: followup.id }, data: { cancelled: true } }),
      prisma.event.create({
        data: {
          conversationId: conversation.id,
          type: "FOLLOWUP_CANCELLED",
          payload: {
            followupId: followup.id,
            reason: orderVerified ? "order_already_verified" : `conversation_stage_${conversation.currentStage}`,
          },
        },
      }),
    ]);
    return;
  }

  const note = `[Scheduled follow-up firing now (step ${followup.step}). The customer has not completed their purchase since this was scheduled. You planned to say something like: "${followup.message}" — decide whether a follow-up is still appropriate given everything above; if so, send it naturally via send_message (you don't have to reuse this exact wording). If the situation has changed and no follow-up makes sense, do nothing.]`;

  try {
    await runAIEmployeeTurn(conversation.id, note);
  } catch (error) {
    // Template fallback if generation fails (ARCHITECTURE.md §9) — the
    // customer still gets the reminder even if the Claude call errors.
    console.error(`Follow-up ${followup.id}: AI runtime failed, sending fallback template`, error);
    await sendWhatsAppText(conversation.customer.phoneNumber, followup.message);
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        sender: "AI",
        type: "TEXT",
        content: followup.message,
      },
    });
  }

  await prisma.$transaction([
    prisma.followup.update({ where: { id: followup.id }, data: { sent: true } }),
    prisma.event.create({
      data: { conversationId: conversation.id, type: "FOLLOWUP_SENT", payload: { followupId: followup.id } },
    }),
  ]);
}

async function main() {
  const boss = await getBoss();
  await boss.work<FollowupJobData>(FOLLOWUP_QUEUE, async (jobs) => {
    for (const job of jobs) {
      await handleFollowup(job.data.followupId);
    }
  });
  console.log(`[followup-worker] listening on queue "${FOLLOWUP_QUEUE}"`);
}

main().catch((error) => {
  console.error("[followup-worker] fatal error", error);
  process.exit(1);
});
