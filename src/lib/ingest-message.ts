import { prisma } from "@/lib/prisma";
import type {
  MessageType,
  ConversationStage,
} from "@/generated/prisma/client";
import type { WhatsAppChangeValue } from "@/lib/whatsapp";
import { runAIEmployeeTurn } from "@/lib/ai-runtime";

// Workflow stages that mean "this conversation is done" — a new inbound
// message should start a fresh conversation rather than reopen one of these
// (PRD 5.11: every customer has exactly one *active* primary workflow).
const TERMINAL_STAGES: ConversationStage[] = [
  "SALE_COMPLETED",
  "LOST_LEAD",
  "RESOLVED",
];

/**
 * Channel Gateway responsibility (PRD Module 1 / ARCHITECTURE.md §8):
 * normalize one inbound WhatsApp message into a `messages` row and an
 * `events` row, resolving/creating the customer and conversation it
 * belongs to. Nothing here decides what to do about the message — that's
 * the AI Employee Runtime's job, not yet wired up.
 */
export async function ingestInboundMessage(
  value: WhatsAppChangeValue,
  message: NonNullable<WhatsAppChangeValue["messages"]>[number]
) {
  const business = await prisma.business.findFirst({
    where: { whatsappPhoneNumberId: value.metadata.phone_number_id },
  });

  if (!business) {
    console.warn(
      `No business configured for WhatsApp phone_number_id=${value.metadata.phone_number_id}; dropping message ${message.id}`
    );
    return;
  }

  const contactName = value.contacts?.find((c) => c.wa_id === message.from)
    ?.profile.name;

  const customer = await prisma.customer.upsert({
    where: {
      businessId_phoneNumber: {
        businessId: business.id,
        phoneNumber: message.from,
      },
    },
    create: {
      businessId: business.id,
      phoneNumber: message.from,
      name: contactName,
    },
    update: contactName ? { name: contactName } : {},
  });

  let conversation = await prisma.conversation.findFirst({
    where: {
      customerId: customer.id,
      NOT: { currentStage: { in: TERMINAL_STAGES } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const { messageType, content, mediaRef } = normalizeContent(message);

  await prisma.$transaction(async (tx) => {
    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          customerId: customer.id,
          currentStage: "NEW_LEAD",
          // Only present on the message that actually started this
          // conversation (a "click to WhatsApp" ad/post) — never
          // overwritten on later messages, so it stays a record of how
          // this specific conversation began.
          referral: message.referral ?? undefined,
        },
      });
    }

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        sender: "CUSTOMER",
        type: messageType,
        content,
        mediaUrl: mediaRef,
      },
    });

    await tx.event.create({
      data: {
        conversationId: conversation.id,
        type: message.type === "image" ? "RECEIPT_IMAGE_RECEIVED" : "MESSAGE_RECEIVED",
        payload: JSON.parse(JSON.stringify(message)),
      },
    });
  });

  // The Channel Gateway's job ends at normalization. Running the AI
  // Employee Runtime here (rather than via a queue) is a deliberate MVP
  // simplification — ARCHITECTURE.md §3 notes pg-boss isn't wired up yet,
  // so this is synchronous for now. A failure here must not roll back the
  // message/event that were already committed above.
  try {
    await runAIEmployeeTurn(conversation!.id);
  } catch (error) {
    console.error(`AI Employee Runtime failed for conversation ${conversation!.id}`, error);
  }
}

function normalizeContent(
  message: NonNullable<WhatsAppChangeValue["messages"]>[number]
): { messageType: MessageType; content: string | null; mediaRef: string | null } {
  switch (message.type) {
    case "text":
      return { messageType: "TEXT", content: message.text?.body ?? "", mediaRef: null };
    case "image":
      // Media download (Graph API media-id -> URL -> our object storage)
      // is not wired up yet — object storage isn't provisioned (see
      // ARCHITECTURE.md §12). We keep the WhatsApp media id so nothing is
      // lost; a follow-up pass fetches and re-hosts it.
      return {
        messageType: "IMAGE",
        content: message.image?.caption ?? null,
        mediaRef: `whatsapp-media:${message.image?.id}`,
      };
    case "document":
      return {
        messageType: "DOCUMENT",
        content: message.document?.filename ?? null,
        mediaRef: `whatsapp-media:${message.document?.id}`,
      };
    case "audio":
      return {
        messageType: "VOICE",
        content: null,
        mediaRef: `whatsapp-media:${message.audio?.id}`,
      };
    default:
      // Sticker, location, contacts, reaction, video, etc. — out of scope
      // per PRD 13.4. Store rather than drop, so nothing is silently lost.
      return {
        messageType: "TEXT",
        content: `[unsupported message type: ${message.type}]`,
        mediaRef: null,
      };
  }
}
