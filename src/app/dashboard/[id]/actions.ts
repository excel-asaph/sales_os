"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendWhatsAppText, sendWhatsAppTemplate, sendWhatsAppDocument } from "@/lib/whatsapp-send";
import { isWithinCustomerServiceWindow } from "@/lib/whatsapp-window";
import { revalidatePath } from "next/cache";
import { requireSession, requireAdminSession } from "@/lib/auth";
import { applyOrderVerifiedEffects, type ActionContext } from "@/lib/actions";
import { addCustomerTag } from "@/lib/customer-tags";
import { cancelPendingFollowups } from "@/lib/followups";
import { runAIEmployeeTurn } from "@/lib/ai-runtime";
import { HUMAN_STAGES } from "@/lib/stage-display";
import { formatSystemNote, describeTemplateFallback } from "@/lib/system-notes";
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
          : formatSystemNote(`${describeTemplateFallback()} Your intended reply wasn't sent: "${text}"`),
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

// The AI's own send_product tool (src/lib/actions.ts) is unreachable while
// a conversation is on a human stage (ai-runtime.ts's guard) — but a human
// handling an escalation may still need to get the product to the customer
// themselves (e.g. the original delivery failed, or the customer's asking
// for it again mid-conversation). Deliberately doesn't check
// deliverBeforePayment/order-verified the way the AI's own sendProduct
// does — a human looking at the actual conversation is trusted to judge
// that themselves, the same way they're trusted with the free-text reply
// box right above this. Mirrors sendProduct's own message/event shape so
// this shows up identically in the transcript and Orders history either
// way, and moves the stage to PRODUCT_DELIVERED for the same reason
// sendProduct does — it's just factually true now, regardless of who sent
// it — but deliberately doesn't touch assignedHumanId or trigger an AI
// turn the way returnToAI/verifyOrderManually do: sending a file is a
// supplementary action a human might take while still actively handling
// the rest of the conversation themselves.
//
// Confirmed in production (2026-08-13): unconditionally overwriting
// currentStage did exactly that even when the conversation was sitting in
// HUMAN_REVIEW_REQUIRED/HUMAN_ASSIGNED — PRODUCT_DELIVERED isn't a human
// stage, so it silently kicked the conversation out of human-review mode
// as a side effect of just resending a file, hiding ReturnToAIButton and
// CreateOrderButton (both gated on being in that state) without the human
// ever choosing to hand anything back. Preserving the human stage when
// it's already there — rather than clobbering it — is what actually keeps
// this action "supplementary" instead of an accidental hand-back.
export async function sendProductAsHuman(formData: FormData) {
  const session = await requireSession();
  const conversationId = String(formData.get("conversationId"));
  const productId = String(formData.get("productId"));

  const conversation = await loadOwnedConversation(conversationId, session.businessId);
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  if (product.businessId !== session.businessId) {
    throw new Error("Product does not belong to this business");
  }
  if (!product.fileUrl) {
    throw new Error("This product has no file configured yet — add one under Settings → Products first.");
  }

  const agent = await prisma.humanAgent.findUniqueOrThrow({ where: { id: session.agentId } });
  const phoneNumberId = conversation.whatsappPhoneNumberId ?? conversation.customer.business.whatsappPhoneNumberId ?? "";
  const filename = `${product.name}.pdf`;

  await sendWhatsAppDocument(conversation.customer.phoneNumber, product.fileUrl, filename, phoneNumberId);

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        direction: "OUTBOUND",
        sender: "HUMAN",
        type: "DOCUMENT",
        content: filename,
        mediaUrl: product.fileUrl,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: HUMAN_STAGES.includes(conversation.currentStage) ? {} : { currentStage: "PRODUCT_DELIVERED" },
    }),
    prisma.event.create({
      data: {
        conversationId,
        type: "PRODUCT_DELIVERED",
        payload: { productId, sentBy: "human", humanAgentId: agent.id, humanAgentName: agent.name },
      },
    }),
  ]);

  revalidatePath(`/dashboard/${conversationId}`);
  revalidatePath("/dashboard");
}

// Shared by every human-driven action below that wants the AI to take the
// next step immediately afterward — returnToAI, and the two order-
// verification actions — rather than leaving the conversation to sit
// unlocked-but-untouched until the customer's next message. Same last-line-
// of-defense pattern as ingest-message.ts: if the AI turn itself throws,
// hand it straight back to a human rather than leaving it in an ambiguous
// state with no trace of why.
async function runAIAfterHumanAction(conversationId: string, note: string) {
  try {
    await runAIEmployeeTurn(conversationId, note);
  } catch (error) {
    console.error(`AI Employee Runtime failed for conversation ${conversationId} after a human action`, error);
    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          currentStage: "HUMAN_REVIEW_REQUIRED",
          summary: "The AI ran into a technical error right after a human action — needs a human to pick this up.",
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

  await runAIAfterHumanAction(
    conversationId,
    "[A human just finished handling this conversation and is handing it back to you. Review the recent messages and current state, then take whatever action is actually appropriate — record any facts you learn, update the stage, schedule a follow-up if something's genuinely still pending, or do nothing further if there's nothing to do. Don't assume anything is wrong just because a human was involved.]"
  );

  revalidatePath(`/dashboard/${conversationId}`);
  revalidatePath("/dashboard");
}

// A payment the AI never got to check at all has no Order row yet — the
// only code that ever creates one lives inside requestPaymentVerification
// (src/lib/actions.ts). verifyOrderManually below only covers the case
// where the AI already tried and an Order already exists (ESCALATED or
// REJECTED); this covers the more common case behind today's escalations —
// the AI never got that far — by creating the record from scratch. A human
// who has personally confirmed the payment picks which product and amount
// it was for (there's no existing Order to read that from), and the
// platform links whatever receipt the customer most recently sent, same
// "latest attachment" convention requestPaymentVerification itself uses.
export async function createAndVerifyOrder(formData: FormData) {
  const session = await requireSession();
  const conversationId = String(formData.get("conversationId"));
  const productId = String(formData.get("productId"));
  const expectedAmount = Number(formData.get("expectedAmount"));

  if (!productId || !Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    throw new Error("Choose a product and enter a valid amount.");
  }

  const conversation = await loadOwnedConversation(conversationId, session.businessId);
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  if (product.businessId !== session.businessId) {
    throw new Error("Product does not belong to this business");
  }

  const agent = await prisma.humanAgent.findUniqueOrThrow({ where: { id: session.agentId } });

  const receiptMessage = await prisma.message.findFirst({
    where: { conversationId, direction: "INBOUND", type: { in: ["IMAGE", "DOCUMENT"] } },
    orderBy: { createdAt: "desc" },
  });

  const order = await prisma.order.create({
    data: {
      conversationId,
      productId,
      expectedAmount,
      receiptImageUrl: receiptMessage?.mediaUrl ?? null,
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  });

  const ctx: ActionContext = {
    conversationId,
    businessId: session.businessId,
    customerPhoneNumber: conversation.customer.phoneNumber,
    whatsappPhoneNumberId: conversation.whatsappPhoneNumberId ?? conversation.customer.business.whatsappPhoneNumberId ?? "",
  };

  await applyOrderVerifiedEffects(ctx, {
    orderId: order.id,
    expectedAmount,
    confidence: null,
    clearHumanAssignment: true,
    event: {
      type: "ORDER_MANUALLY_VERIFIED",
      payload: { orderId: order.id, humanAgentId: agent.id, humanAgentName: agent.name, createdManually: true },
    },
  });

  await addCustomerTag(conversationId, "Paid");

  await runAIAfterHumanAction(
    conversationId,
    `[A human just manually recorded and verified a payment of ${expectedAmount} for ${product.name} on this conversation — the AI never got to check the receipt itself. Review the current state and take whatever's actually appropriate next: send a payment confirmation if one hasn't gone out, deliver the product if it hasn't been sent yet, update the stage (including marking the sale complete if nothing else is pending), or schedule a follow-up if something's still outstanding.]`
  );

  revalidatePath(`/dashboard/${conversationId}`);
  revalidatePath("/dashboard");
  revalidatePath("/home");
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
    clearHumanAssignment: true,
    event: {
      type: "ORDER_MANUALLY_VERIFIED",
      payload: { orderId: order.id, humanAgentId: agent.id, humanAgentName: agent.name, previousStatus },
    },
  });

  await addCustomerTag(conversationId, "Paid");

  await runAIAfterHumanAction(
    conversationId,
    `[A human just manually verified this conversation's payment (previously ${previousStatus.toLowerCase()}) — the AI's own attempt had flagged it, but a human has now personally confirmed it's genuine. Review the current state and take whatever's actually appropriate next: send a payment confirmation if one hasn't gone out, deliver the product if it hasn't been sent yet, update the stage (including marking the sale complete if nothing else is pending), or schedule a follow-up if something's still outstanding.]`
  );

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
  // The follow-up worker itself would refuse to act once a conversation is
  // RESOLVED (BLOCKS_FOLLOWUP, src/worker/followup-worker.ts) — this just
  // stops any already-scheduled one from sitting around looking "active"
  // (a live countdown on the Customers/Dashboard UI) until its job fires
  // and discovers that.
  await cancelPendingFollowups(conversationId, "resolved");

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
