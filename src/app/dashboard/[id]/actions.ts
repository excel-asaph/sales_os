"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendWhatsAppText, sendWhatsAppTemplate } from "@/lib/whatsapp-send";
import { isWithinCustomerServiceWindow } from "@/lib/whatsapp-window";
import { revalidatePath } from "next/cache";
import { requireSession, requireAdminSession } from "@/lib/auth";

async function loadOwnedConversation(conversationId: string, businessId: string) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { customer: true },
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

  if (withinWindow) {
    await sendWhatsAppText(conversation.customer.phoneNumber, text);
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
      process.env.WHATSAPP_FOLLOWUP_TEMPLATE_LANG || "en_US"
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
