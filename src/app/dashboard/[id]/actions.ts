"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendWhatsAppText, sendWhatsAppTemplate } from "@/lib/whatsapp-send";
import { isWithinCustomerServiceWindow } from "@/lib/whatsapp-window";
import { revalidatePath } from "next/cache";
import { requireSession, requireAdminSession } from "@/lib/auth";
import { applyOrderVerifiedEffects, type ActionContext } from "@/lib/actions";
import { addCustomerTag } from "@/lib/customer-tags";
import { runAIEmployeeTurn } from "@/lib/ai-runtime";
import type { ConversationStage } from "@/generated/prisma/client";

async function loadOwnedConversation(conversationId: string, businessId: string) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { customer: { include: { business: true } } },
  });
  if (conversation.customer.businessId !== businessId) {
    throw new Error("Conversation does not belong to this business");
  }
  return conversation;
}

export async function sendHumanReply(formData: FormData) {
  const session = await requireSession();
  const conversationId = String(formData.get("conversationId"));
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const conversation = await loadOwnedConversation(conversationId, session.businessId);
  const agent = await prisma.humanAgent.findUniqueOrThrow({ where: { id: session.agentId } });

  const withinWindow = await isWithinCustomerServiceWindow(conversationId);
  const phoneNumberId = conversation.whatsappPhoneNumberId ?? conversation.customer.business.whatsappPhoneNumberId ?? "";

  if (withinWindow) {
    await sendWhatsAppText(conversation.customer.phoneNumber, text, phoneNumberId);
  } else {
    // Free-form text — including a human's own typed reply — is rejected
    // by WhatsApp outside the 24-hour customer service window. The exact
    // wording can't be forced through a fixed template, so send the
    // approved re-engagement template to keep the door open instead of
    // losing contact entirely; the human is told clearly afterward
    // (thrown error below) rather than this silently pretending their
    // typed reply went out.
    const templateName = process.env.WHATSAPP_FOLLOWUP_TEMPLATE_NAME;
    if (!templateName) {
      throw new Error(
        "This customer hasn't messaged in over 24 hours — WhatsApp only allows a pre-approved template to reach them now, and none is configured (WHATSAPP_FOLLOWUP_TEMPLATE_NAME). Nothing was sent."
      );
    }
    await sendWhatsAppTemplate(
      conversation.customer.phoneNumber,
      templateName,
      process.env.WHATSAPP_FOLLOWUP_TEMPLATE_LANG || "en_US",
      phoneNumberId
    );
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        direction: "OUTBOUND",
        sender: "HUMAN",
        type: "TEXT",
        content: withinWindow
          ? text
          : `[Re-engagement template sent — this customer hasn't messaged in over 24 hours, so WhatsApp only allowed the approved template through, not this text. Intended reply: "${text}"]`,
      },
    }),
    // Picking up a HUMAN_REVIEW_REQUIRED conversation by replying to it is
    // what "assigned" means here — no separate claim button needed.
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedHumanId: session.agentId,
        ...(conversation.currentStage === "HUMAN_REVIEW_REQUIRED" ? { currentStage: "HUMAN_ASSIGNED" } : {}),
      },
    }),
    prisma.event.create({
      data: {
        conversationId,
        type: "HUMAN_REPLY_SENT",
        payload: { text, humanAgentId: agent.id, humanAgentName: agent.name, viaTemplate: !withinWindow },
      },
    }),
  ]);

  revalidatePath(`/dashboard/${conversationId}`);
  revalidatePath("/dashboard");

  if (!withinWindow) {
    throw new Error(
      "This customer hasn't messaged in over 24 hours, so WhatsApp only allowed a pre-approved re-engagement template through — not your typed message. That template was sent instead; you'll be able to send your actual reply once they respond."
    );
  }
}

// HUMAN_REVIEW_REQUIRED/HUMAN_ASSIGNED is otherwise a one-way door:
// ai-runtime.ts's guard no-ops the AI on both stages forever, and nothing
// in this file ever clears assignedHumanId — once a human touches a
// conversation, it's theirs for good, and everything the AI would
// otherwise keep doing (tagging, follow-ups, stage progression) silently
// stops unless a human keeps doing it by hand. This clears the assignment
// and immediately runs one real AI turn (the same followupNote mechanism
// the follow-up worker uses to fire a turn outside a fresh inbound
// message) so the AI reassesses the actual conversation state itself,
// rather than this guessing the "correct" stage on the human's behalf.
export async function returnToAI(formData: FormData) {
  const session = await requireSession();
  const conversationId = String(formData.get("conversationId"));
  const conversation = await loadOwnedConversation(conversationId, session.businessId);

  if (conversation.currentStage !== "HUMAN_REVIEW_REQUIRED" && conversation.currentStage !== "HUMAN_ASSIGNED") {
    return;
  }

  const agent = await prisma.humanAgent.findUniqueOrThrow({ where: { id: session.agentId } });

  // The only signal that reliably distinguishes "money's already confirmed"
  // from everything else without guessing at the rest of the funnel — the
  // AI's own update_stage call in the turn below corrects this within
  // moments regardless, so it only needs to be a reasonable starting point,
  // not the actually-correct stage.
  const latestOrder = await prisma.order.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
  const handoffStage: ConversationStage =
    latestOrder?.status === "VERIFIED" ? "PAYMENT_VERIFIED" : "WAITING_FOR_DECISION";

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedHumanId: null, currentStage: handoffStage },
    }),
    prisma.event.create({
      data: {
        conversationId,
        type: "RETURNED_TO_AI",
        payload: { humanAgentId: agent.id, humanAgentName: agent.name, previousStage: conversation.currentStage },
      },
    }),
  ]);

  try {
    await runAIEmployeeTurn(
      conversationId,
      "[A human just finished handling this conversation and is handing it back to you. Review the recent messages and current state, then take whatever action is actually appropriate — record any facts you learn, update the stage, schedule a follow-up if something's genuinely still pending, or do nothing further if there's nothing to do. Don't assume anything is wrong just because a human was involved.]"
    );
  } catch (error) {
    // Same last-line-of-defense pattern as ingest-message.ts: if the AI
    // turn itself throws, hand it straight back to a human rather than
    // leaving it in an unlocked-but-unhandled state with no trace of why.
    console.error(`AI Employee Runtime failed for conversation ${conversationId} right after being handed back`, error);
    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          currentStage: "HUMAN_REVIEW_REQUIRED",
          summary: "The AI ran into a technical error right after being handed back — needs a human to pick this up.",
        },
      }),
      prisma.event.create({
        data: {
          conversationId,
          type: "HUMAN_ASSIGNED",
          payload: { reason: "ai_runtime_error", error: (error as Error).message },
        },
      }),
    ]);
  }

  revalidatePath(`/dashboard/${conversationId}`);
  revalidatePath("/dashboard");
}

// A human who has personally confirmed a payment outside the normal AI
// flow — most often because the conversation escalated to a human before
// the AI ever got to check the receipt itself (e.g. ai-runtime.ts's
// no_reply_sent escalation firing on an unrelated earlier message) — had no
// way to reflect that here: the Order stayed ESCALATED/REJECTED forever, so
// it never counted toward revenue (src/app/home/page.tsx sums
// Order.status === "VERIFIED"), the customer never got tagged Paid, and
// their purchase count never incremented. This runs the exact same
// downstream effects the AI's own verification does
// (applyOrderVerifiedEffects, src/lib/actions.ts) — just triggered by a
// human instead of a Claude tool call, and tagged distinctly in the event
// log so it's clear which one happened.
export async function verifyOrderManually(formData: FormData) {
  const session = await requireSession();
  const conversationId = String(formData.get("conversationId"));
  const orderId = String(formData.get("orderId"));

  const conversation = await loadOwnedConversation(conversationId, session.businessId);
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.conversationId !== conversationId) {
    throw new Error("Order does not belong to this conversation");
  }
  // Idempotent: a double click/submit shouldn't double-count the sale
  // (lifetimePurchases, Meta conversion) or overwrite the original
  // verification timestamp.
  if (order.status === "VERIFIED") return;

  const agent = await prisma.humanAgent.findUniqueOrThrow({ where: { id: session.agentId } });
  const previousStatus = order.status;

  await prisma.order.update({ where: { id: orderId }, data: { status: "VERIFIED", verifiedAt: new Date() } });

  const ctx: ActionContext = {
    conversationId,
    businessId: session.businessId,
    customerPhoneNumber: conversation.customer.phoneNumber,
    whatsappPhoneNumberId: conversation.whatsappPhoneNumberId ?? conversation.customer.business.whatsappPhoneNumberId ?? "",
  };

  await applyOrderVerifiedEffects(ctx, {
    orderId: order.id,
    expectedAmount: Number(order.expectedAmount),
    confidence: null,
    event: {
      type: "ORDER_MANUALLY_VERIFIED",
      payload: { orderId: order.id, humanAgentId: agent.id, humanAgentName: agent.name, previousStatus },
    },
  });

  await addCustomerTag(conversationId, "Paid");

  revalidatePath(`/dashboard/${conversationId}`);
  revalidatePath("/dashboard");
  revalidatePath("/home");
}

// Closes out the conversation (PRD 5.11: exactly one active workflow). The
// next inbound message from this customer starts a fresh conversation
// (ingest-message.ts's CONVERSATION_ENDING_STAGES) rather than reopening
// this one — RESOLVED is a deliberate human decision to end the thread.
export async function resolveConversation(formData: FormData) {
  const session = await requireSession();
  const conversationId = String(formData.get("conversationId"));
  await loadOwnedConversation(conversationId, session.businessId);

  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversationId }, data: { currentStage: "RESOLVED" } }),
    prisma.event.create({
      data: { conversationId, type: "HUMAN_RESOLVED", payload: { humanAgentId: session.agentId } },
    }),
  ]);

  revalidatePath(`/dashboard/${conversationId}`);
  revalidatePath("/dashboard");
}

// Deliberately narrow: only a conversation with zero orders can ever be
// deleted here. An Order is a financial/payment-verification record —
// Conversation cascades to delete Order rows (prisma/schema.prisma), so an
// unrestricted delete would silently destroy real transaction history. For
// a conversation with genuine order history, resolveConversation (above)
// is the right tool — this is only for spam, wrong numbers, and test leads
// that never went anywhere.
export async function deleteConversation(formData: FormData) {
  const session = await requireAdminSession();
  const conversationId = String(formData.get("conversationId"));
  await loadOwnedConversation(conversationId, session.businessId);

  const orderCount = await prisma.order.count({ where: { conversationId } });
  if (orderCount > 0) {
    throw new Error(
      "This conversation has order/payment history and can't be deleted — mark it resolved instead to keep the record."
    );
  }

  await prisma.conversation.delete({ where: { id: conversationId } });
  redirect("/dashboard");
}
