"use server";

import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/whatsapp-send";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";

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

  await sendWhatsAppText(conversation.customer.phoneNumber, text);
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        direction: "OUTBOUND",
        sender: "HUMAN",
        type: "TEXT",
        content: text,
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
        payload: { text, humanAgentId: agent.id, humanAgentName: agent.name },
      },
    }),
  ]);

  revalidatePath(`/dashboard/${conversationId}`);
  revalidatePath("/dashboard");
}

// Closes out the conversation (PRD 5.11: exactly one active workflow). The
// next inbound message from this customer starts a fresh conversation
// (ingest-message.ts's TERMINAL_STAGES) rather than reopening this one.
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
