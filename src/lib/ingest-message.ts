import { prisma } from "@/lib/prisma";
import type {
  MessageType,
  ConversationStage,
} from "@/generated/prisma/client";
import type { WhatsAppChangeValue } from "@/lib/whatsapp";
import { runAIEmployeeTurn } from "@/lib/ai-runtime";
import { downloadWhatsAppMedia, persistMediaFile } from "@/lib/media-storage";

// Media worth saving so a human reviewing the conversation later can
// actually see it, not just a WhatsApp media reference that expires.
const PERSISTABLE_MEDIA_TYPES: MessageType[] = ["IMAGE", "DOCUMENT", "VOICE"];

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
  // A reaction (an emoji tapped onto a prior message, not typed content) is
  // categorically different from every other "unsupported" type below —
  // it's not a reply and has nothing for the AI to act on. Left to run the
  // normal turn, the AI would see "[unsupported message type: reaction]" as
  // if the customer had typed it, and — as actually happened in testing —
  // spiral into repeatedly asking them to "just reply yes" to a thumbs-up.
  // It's still recorded as a message/event, just never handed to the AI or
  // treated as "the customer replied" (which would cancel a pending
  // follow-up over what's really silence with an emoji on top).
  const isReaction = message.type === "reaction";
  let inboundMessageId: string | null = null;

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

    const inboundMessage = await tx.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        sender: "CUSTOMER",
        type: messageType,
        content,
        mediaUrl: mediaRef,
      },
    });
    inboundMessageId = inboundMessage.id;

    await tx.event.create({
      data: {
        conversationId: conversation.id,
        type: message.type === "image" ? "RECEIPT_IMAGE_RECEIVED" : "MESSAGE_RECEIVED",
        payload: JSON.parse(JSON.stringify(message)),
      },
    });

    // The customer just spoke — any follow-up scheduled for their prior
    // silence is stale the moment they reply (the entire premise of a
    // follow-up is "they went quiet," and now they haven't). The worker
    // already checks `cancelled` before sending, so flagging it here is
    // enough; no need to also touch the already-queued pg-boss job. A
    // reaction doesn't count — it's not a real reply, so it shouldn't
    // cancel a check-in that's still owed.
    //
    // This is also the ONLY place that cancels a follow-up because the
    // customer replied — followup-worker.ts separately writes its own
    // FOLLOWUP_CANCELLED event when a scheduled check-in fires into a
    // stage that no longer needs one (payment verified, sale closed,
    // etc.), for a completely different reason. Both share the event
    // type; `reason` in the payload is what actually distinguishes them —
    // src/app/customers/page.tsx reads it to label the Customers list
    // correctly instead of assuming every FOLLOWUP_CANCELLED means "they
    // replied," which it doesn't.
    if (!isReaction) {
      const { count } = await tx.followup.updateMany({
        where: { conversationId: conversation.id, sent: false, cancelled: false },
        data: { cancelled: true },
      });
      if (count > 0) {
        await tx.event.create({
          data: {
            conversationId: conversation.id,
            type: "FOLLOWUP_CANCELLED",
            payload: { reason: "customer_replied" },
          },
        });
      }
    }
  });

  // Nothing further to do for a bare reaction — it's logged above for
  // anyone reviewing the transcript, but doesn't warrant re-engaging the
  // AI (there's no media to persist and no reply to generate).
  if (isReaction) return;

  // Download and re-host media now, not just when something later chooses
  // to inspect it (e.g. payment verification) — otherwise anything the AI
  // never verifies (a non-receipt photo, a voice note) is stuck as an
  // expiring WhatsApp media reference no human can ever actually view.
  // Runs before the AI turn below so request_payment_verification reuses
  // this instead of downloading the same asset from WhatsApp twice.
  if (inboundMessageId && mediaRef?.startsWith("whatsapp-media:") && PERSISTABLE_MEDIA_TYPES.includes(messageType)) {
    try {
      const mediaId = mediaRef.slice("whatsapp-media:".length);
      const downloaded = await downloadWhatsAppMedia(mediaId);
      if (downloaded) {
        const storedUrl = await persistMediaFile(downloaded.buffer, downloaded.mimeType, mediaId);
        await prisma.message.update({ where: { id: inboundMessageId }, data: { mediaUrl: storedUrl } });
      }
    } catch (error) {
      console.error(`Failed to persist inbound media for message ${inboundMessageId}`, error);
    }
  }

  // Cost-abuse guard: every inbound message triggers a real Claude API call
  // below, with nothing else in the pipeline bounding volume. A customer
  // (or spoofed/replayed traffic) sending messages in a tight burst would
  // otherwise mean an unbounded number of paid API calls. The threshold is
  // deliberately generous — normal rapid typing (several messages in a
  // row) should never come close — this exists to catch abuse/bugs, not to
  // police real customers. Scoped to the customer (not just this
  // conversation) since a new conversation only starts once the old one
  // reaches a terminal stage, not on demand.
  const RATE_LIMIT_WINDOW_MS = 60_000;
  const RATE_LIMIT_MAX_MESSAGES = 15;
  const recentInboundCount = await prisma.message.count({
    where: {
      conversation: { customerId: customer.id },
      direction: "INBOUND",
      createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    },
  });

  if (recentInboundCount > RATE_LIMIT_MAX_MESSAGES) {
    console.warn(
      `Rate limit hit for customer ${customer.id} (${recentInboundCount} inbound messages in the last minute) — skipping AI turn for message ${message.id}`
    );
    await prisma.event.create({
      data: {
        conversationId: conversation!.id,
        type: "RATE_LIMIT_SKIPPED_AI_TURN",
        payload: { messageCount: recentInboundCount, windowMs: RATE_LIMIT_WINDOW_MS },
      },
    });
    return;
  }

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
      // The raw WhatsApp media id, re-hosted to real storage right after
      // this function returns (see the persistence step below) — kept as
      // the placeholder here since normalizeContent itself has no async/IO.
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
