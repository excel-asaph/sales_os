import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { getBoss, FOLLOWUP_QUEUE, type FollowupJobData } from "@/lib/queue";
import { runAIEmployeeTurn } from "@/lib/ai-runtime";
import { sendWhatsAppText, sendWhatsAppTemplate } from "@/lib/whatsapp-send";
import { isWithinCustomerServiceWindow } from "@/lib/whatsapp-window";
import { FOLLOWUP_SEQUENCE, stepDefinition, clampMaxFollowups } from "@/lib/followup-sequence";
import { addCustomerTag } from "@/lib/customer-tags";
import { formatSystemNote, describeTemplateFallback } from "@/lib/system-notes";
import type { ConversationStage } from "@/generated/prisma/client";

// The one Meta-approved re-engagement template — used when a follow-up
// needs to fire outside the 24-hour customer service window, where
// free-form text (including anything the AI would compose) is rejected
// by WhatsApp outright.
const FOLLOWUP_TEMPLATE_NAME = process.env.WHATSAPP_FOLLOWUP_TEMPLATE_NAME;
const FOLLOWUP_TEMPLATE_LANG = process.env.WHATSAPP_FOLLOWUP_TEMPLATE_LANG || "en_US";

const DEFAULT_FALLBACK_MESSAGE =
  "Hi! Just checking in — are you still interested? Let us know if you have any questions.";

// Stages where a scheduled follow-up no longer makes sense: the sale
// already completed one way or another, or a human already owns this
// conversation and the AI shouldn't jump back in on its own.
//
// PRODUCT_DELIVERED is deliberately NOT here, even though it sounds
// terminal: for a deliver-before-payment business (BusinessConfig.
// deliverBeforePayment), sendProduct() sets this stage the moment the file
// goes out, which is often BEFORE payment — the business.playbook's
// payment_followup template exists specifically for "delivered on trust,
// payment gone quiet." Blocking follow-ups here would silently defeat that
// entire flow. Only PAYMENT_VERIFIED (or later) actually means nothing is
// still owed.
const BLOCKS_FOLLOWUP = new Set<ConversationStage>([
  "SALE_COMPLETED",
  "LOST_LEAD",
  "RESOLVED",
  "PAYMENT_VERIFIED",
  "HUMAN_REVIEW_REQUIRED",
  "HUMAN_ASSIGNED",
]);

async function loadFollowup(followupId: string) {
  return prisma.followup.findUnique({
    where: { id: followupId },
    include: { conversation: { include: { customer: { include: { business: true } }, orders: true } } },
  });
}

type LoadedFollowup = NonNullable<Awaited<ReturnType<typeof loadFollowup>>>;

/**
 * The Follow-Up Engine worker (PRD 8.6, ARCHITECTURE.md §9, §11). A
 * separate long-running process (run via `npm run worker`) that consumes
 * pg-boss jobs. The AI only ever creates step 1 (src/lib/actions.ts,
 * create_followup) — everything past that is orchestrated here: each
 * step that fires with no reply schedules the next one itself, following
 * the fixed sequence in src/lib/followup-sequence.ts, up to this
 * business's configured `maxFollowups`. No AI judgment is needed to keep
 * a sequence going, only to start one.
 */
async function handleFollowup(followupId: string) {
  const followup = await loadFollowup(followupId);

  // Already handled (e.g. a retried redelivery of the same job) or
  // cancelled — a reply from the customer cancels every pending follow-up
  // for a conversation (ingest-message.ts), since the whole premise of a
  // follow-up is "they went quiet," and now they haven't.
  if (!followup || followup.sent || followup.cancelled) return;

  const { conversation } = followup;
  // Verified SINCE this follow-up was scheduled, not "ever" — conversations
  // now persist across multiple purchases, so an all-time check would let
  // a stale verified order from an earlier, completed purchase wrongly
  // cancel a follow-up for a genuinely new, still-unpaid one.
  const orderVerified = conversation.orders.some(
    (order) => order.status === "VERIFIED" && order.verifiedAt !== null && order.verifiedAt > followup.createdAt
  );
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

  const config = await prisma.businessConfig.findUnique({
    where: { businessId: conversation.customer.businessId },
  });
  const maxSteps = clampMaxFollowups(config?.maxFollowups ?? FOLLOWUP_SEQUENCE.length);

  // A step beyond the business's configured cap is a silent "did they
  // ever come back?" check scheduled a day after the real sequence's
  // last message — nothing to send, just decide whether to give up. If
  // we got here, nothing cancelled it via a reply in the meantime.
  if (followup.step > maxSteps) {
    // A customer who already claimed to have paid isn't "uninterested" just
    // because they stopped answering check-ins — silence there could mean a
    // real, unreconciled transfer sitting unclaimed, not a lost lead. That
    // ambiguity needs a human's eyes, not an automatic "Uninterested" tag.
    const awaitingPaymentEvidence = followup.reason === "AWAITING_PAYMENT_EVIDENCE";

    await prisma.$transaction([
      prisma.followup.update({ where: { id: followup.id }, data: { sent: true } }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: awaitingPaymentEvidence
          ? {
              currentStage: "HUMAN_REVIEW_REQUIRED",
              summary:
                "Customer said they had paid but never sent evidence, and didn't respond to repeated follow-up requests for it — needs manual reconciliation (check for an unmatched incoming transfer).",
            }
          : { currentStage: "LOST_LEAD" },
      }),
      prisma.event.create({
        data: {
          conversationId: conversation.id,
          type: awaitingPaymentEvidence ? "FOLLOWUP_SEQUENCE_EXHAUSTED_ESCALATED" : "FOLLOWUP_SEQUENCE_EXHAUSTED",
          payload: { afterStep: maxSteps, reason: followup.reason },
        },
      }),
    ]);
    await addCustomerTag(conversation.id, awaitingPaymentEvidence ? "Needs payment follow-up" : "Uninterested");
    return;
  }

  const delivery = await deliverFollowup(followup);
  if (delivery === "skipped") return; // stays unsent — retried whenever this job is next redelivered

  await prisma.$transaction([
    prisma.followup.update({ where: { id: followup.id }, data: { sent: true } }),
    prisma.event.create({
      data: {
        conversationId: conversation.id,
        type: "FOLLOWUP_SENT",
        payload: { followupId: followup.id, step: followup.step, viaTemplate: delivery === "template" },
      },
    }),
  ]);

  await scheduleNext(followup, maxSteps);
}

type DeliveryResult = "composed" | "template" | "skipped";

/**
 * Sends the current step: re-enters the AI runtime inside the 24-hour
 * customer service window (normal case — it composes fresh, using this
 * step's angle, rather than reusing any previously planned wording), or
 * falls back to the approved re-engagement template outside it, where
 * free-form text is rejected by WhatsApp regardless of what generated it.
 */
async function deliverFollowup(followup: LoadedFollowup): Promise<DeliveryResult> {
  const { conversation } = followup;
  const phoneNumberId = conversation.whatsappPhoneNumberId ?? conversation.customer.business.whatsappPhoneNumberId ?? "";

  if (!(await isWithinCustomerServiceWindow(conversation.id))) {
    if (!FOLLOWUP_TEMPLATE_NAME) {
      console.error(
        `Follow-up ${followup.id}: outside the 24h customer service window and WHATSAPP_FOLLOWUP_TEMPLATE_NAME isn't configured — cannot send anything yet.`
      );
      return "skipped";
    }
    await sendWhatsAppTemplate(conversation.customer.phoneNumber, FOLLOWUP_TEMPLATE_NAME, FOLLOWUP_TEMPLATE_LANG, phoneNumberId);
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        sender: "AI",
        type: "TEXT",
        content: formatSystemNote(describeTemplateFallback()),
      },
    });
    return "template";
  }

  const angle = stepDefinition(followup.step)?.angle ?? "A brief, low-pressure check-in.";
  const note = `[Scheduled follow-up firing now (step ${followup.step} of this sequence). The customer has not replied since this was scheduled. This step's intent: ${angle} Compose it fresh via send_message — you don't have to reuse any previously planned wording. If the situation has genuinely changed (they already replied, paid, or a follow-up no longer fits), do nothing instead.]`;

  try {
    await runAIEmployeeTurn(conversation.id, note);
  } catch (error) {
    // Template fallback if generation fails — the customer still gets a
    // reminder even if the Claude call errors.
    console.error(`Follow-up ${followup.id}: AI runtime failed, sending fallback message`, error);
    await sendWhatsAppText(conversation.customer.phoneNumber, followup.message, phoneNumberId);
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
  return "composed";
}

/**
 * Schedules the next step in the sequence, or — once the business's
 * configured limit is reached — a final silent check a day later before
 * actually giving up (rather than declaring the lead lost the instant
 * the last message is sent; they might reply ten minutes later).
 */
async function scheduleNext(followup: LoadedFollowup, maxSteps: number) {
  const { conversation } = followup;
  const nextStep = followup.step + 1;
  const boss = await getBoss();

  if (nextStep <= maxSteps) {
    const nextStepDef = stepDefinition(nextStep) ?? FOLLOWUP_SEQUENCE[FOLLOWUP_SEQUENCE.length - 1];
    const scheduledFor = new Date(Date.now() + nextStepDef.deltaHours * 60 * 60 * 1000);

    const config = await prisma.businessConfig.findUnique({
      where: { businessId: conversation.customer.businessId },
    });
    const playbook = (config?.playbook as Record<string, string> | null) ?? {};
    const fallbackMessage = playbook.payment_followup || DEFAULT_FALLBACK_MESSAGE;

    const next = await prisma.followup.create({
      data: { conversationId: conversation.id, step: nextStep, message: fallbackMessage, scheduledFor, reason: followup.reason },
    });
    await boss.send(FOLLOWUP_QUEUE, { followupId: next.id }, { startAfter: scheduledFor });
    await prisma.event.create({
      data: {
        conversationId: conversation.id,
        type: "FOLLOWUP_SCHEDULED",
        payload: { followupId: next.id, step: nextStep, scheduledFor },
      },
    });
    return;
  }

  const checkAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const check = await prisma.followup.create({
    data: { conversationId: conversation.id, step: nextStep, message: "", scheduledFor: checkAt, reason: followup.reason },
  });
  await boss.send(FOLLOWUP_QUEUE, { followupId: check.id }, { startAfter: checkAt });
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
