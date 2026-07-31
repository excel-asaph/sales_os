import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, sendWhatsAppDocument } from "@/lib/whatsapp-send";
import { getPaymentAccounts, getBusinessConfig, searchProducts } from "@/lib/knowledge";
import { downloadWhatsAppMedia, persistReceiptImage } from "@/lib/media-storage";
import { verifyReceiptImage } from "@/lib/receipt-verification";
import { getBoss, FOLLOWUP_QUEUE } from "@/lib/queue";
import type { ConversationStage, FactKind } from "@/generated/prisma/client";

export interface ActionContext {
  conversationId: string;
  businessId: string;
  customerPhoneNumber: string;
}

/**
 * Executes one Action Contract tool call (ARCHITECTURE.md §7.2). This is
 * the platform half of "the AI reasons, the platform executes" (PRD
 * Philosophy 3) — the model never touches the database or WhatsApp
 * directly. Every state-changing branch writes an `events` row alongside
 * the state mutation (Non-Negotiable 14.5/14.6).
 */
export async function executeAction(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ActionContext
): Promise<unknown> {
  switch (toolName) {
    case "send_message":
      return sendMessage(ctx, input.text as string);
    case "search_products":
      return searchProducts(ctx.businessId, input.query as string);
    case "send_product":
      return sendProduct(ctx, input.product_id as string);
    case "send_payment_details":
      return getPaymentAccounts(ctx.businessId);
    case "request_payment_verification":
      return requestPaymentVerification(ctx, input.product_id as string, input.expected_amount as number);
    case "update_stage":
      return updateStage(ctx, input.new_stage as ConversationStage, input.objective as string | undefined);
    case "record_fact":
      return recordFact(ctx, input.kind as FactKind, input.key as string, input.value as string);
    case "create_followup":
      return createFollowup(ctx, input.days as number, input.message as string);
    case "escalate_to_human":
      return escalateToHuman(ctx, input.reason as string, input.summary as string);
    case "tag_customer":
      return tagCustomer(ctx, input.tag as string);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function sendMessage(ctx: ActionContext, text: string) {
  await sendWhatsAppText(ctx.customerPhoneNumber, text);
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: ctx.conversationId,
        direction: "OUTBOUND",
        sender: "AI",
        type: "TEXT",
        content: text,
      },
    }),
    prisma.event.create({
      data: { conversationId: ctx.conversationId, type: "AI_RESPONSE_GENERATED", payload: { text } },
    }),
  ]);
  return { sent: true };
}

async function sendProduct(ctx: ActionContext, productId: string) {
  const [product, config] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    getBusinessConfig(ctx.businessId),
  ]);
  if (!product) return { delivered: false, reason: "product not found" };

  if (!config.deliverBeforePayment) {
    const verifiedOrder = await prisma.order.findFirst({
      where: { conversationId: ctx.conversationId, productId, status: "VERIFIED" },
    });
    if (!verifiedOrder) {
      return { delivered: false, reason: "payment has not been verified for this product yet" };
    }
  }

  if (!product.fileUrl) {
    return { delivered: false, reason: "product has no file/link configured" };
  }

  const filename = `${product.name}.pdf`;
  await sendWhatsAppDocument(ctx.customerPhoneNumber, product.fileUrl, filename);
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: ctx.conversationId,
        direction: "OUTBOUND",
        sender: "AI",
        type: "DOCUMENT",
        content: filename,
        mediaUrl: product.fileUrl,
      },
    }),
    prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { currentStage: "PRODUCT_DELIVERED" },
    }),
    prisma.event.create({
      data: { conversationId: ctx.conversationId, type: "PRODUCT_DELIVERED", payload: { productId } },
    }),
  ]);
  return { delivered: true };
}

/**
 * Payment verification (PRD 13.3). The model only asks for verification —
 * the actual judgment happens here: download the receipt image, have
 * Claude's vision read it (src/lib/receipt-verification.ts), then cross-
 * check the extraction against the expected amount and this business's own
 * configured accounts before deciding anything is "verified". A receipt
 * the model merely feels confident about is not enough on its own — the
 * hard fields (amount, account) must actually match, or this escalates to
 * a human regardless of the model's stated confidence (Non-Negotiable
 * 14.2: never fabricate a verified payment).
 */
async function requestPaymentVerification(ctx: ActionContext, productId: string, expectedAmount: number) {
  const receiptMessage = await prisma.message.findFirst({
    where: { conversationId: ctx.conversationId, type: "IMAGE", direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
  });

  const [config, paymentAccounts] = await Promise.all([
    getBusinessConfig(ctx.businessId),
    getPaymentAccounts(ctx.businessId),
  ]);

  if (!receiptMessage?.mediaUrl) {
    return recordEscalatedOrder(ctx, productId, expectedAmount, {
      receiptImageUrl: null,
      confidence: 0,
      threshold: config.escalationConfidenceThreshold,
      reason: "No receipt image found in this conversation yet.",
    });
  }

  let storedImageUrl = receiptMessage.mediaUrl;
  let extractedAmount: number | null = null;
  let extractedBank: string | null = null;
  let confidence = 0;
  let reason = "Could not read the receipt image automatically — routed to a human for manual verification.";

  try {
    const mediaId = receiptMessage.mediaUrl.startsWith("whatsapp-media:")
      ? receiptMessage.mediaUrl.slice("whatsapp-media:".length)
      : null;

    if (mediaId) {
      const downloaded = await downloadWhatsAppMedia(mediaId);
      if (downloaded) {
        storedImageUrl = await persistReceiptImage(downloaded.buffer, downloaded.mimeType, mediaId);
        await prisma.message.update({ where: { id: receiptMessage.id }, data: { mediaUrl: storedImageUrl } });

        const extraction = await verifyReceiptImage({
          imageBase64: downloaded.buffer.toString("base64"),
          mimeType: downloaded.mimeType,
          expectedAmount,
          paymentAccounts,
        });

        extractedAmount = extraction.extractedAmount;
        extractedBank = extraction.extractedBank;

        const amountMatches =
          extraction.extractedAmount !== null &&
          Math.abs(extraction.extractedAmount - expectedAmount) <= expectedAmount * 0.02;
        const accountMatches =
          extraction.extractedAccountNumber !== null &&
          paymentAccounts.some((a) => a.accountNumber === extraction.extractedAccountNumber);

        // The platform enforces the hard match, not just the model's own
        // self-reported confidence — a receipt the model likes the look of
        // but with the wrong amount or account is never trusted.
        confidence =
          amountMatches && accountMatches && extraction.transactionStatus === "successful"
            ? extraction.modelConfidence
            : Math.min(extraction.modelConfidence, 0.3);

        reason = extraction.reasoning || reason;
      } else {
        reason =
          "WhatsApp media access isn't configured yet — routed to a human for manual verification.";
      }
    }
  } catch (error) {
    console.error(`Receipt verification failed for conversation ${ctx.conversationId}`, error);
    reason = "Automatic receipt verification failed — routed to a human for manual verification.";
  }

  const verified = confidence >= config.escalationConfidenceThreshold;

  const order = await prisma.order.create({
    data: {
      conversationId: ctx.conversationId,
      productId,
      expectedAmount,
      receiptImageUrl: storedImageUrl,
      extractedAmount,
      extractedBank,
      verificationConfidence: confidence,
      status: verified ? "VERIFIED" : "ESCALATED",
      verifiedAt: verified ? new Date() : null,
    },
  });

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: verified
        ? { currentStage: "PAYMENT_VERIFIED", confidence }
        : { currentStage: "HUMAN_REVIEW_REQUIRED", confidence },
    }),
    prisma.event.create({
      data: {
        conversationId: ctx.conversationId,
        type: verified ? "PAYMENT_VERIFIED" : "PAYMENT_ESCALATED",
        payload: {
          orderId: order.id,
          confidence,
          threshold: config.escalationConfidenceThreshold,
          extractedAmount,
          extractedBank,
        },
      },
    }),
  ]);

  return {
    verified,
    confidence,
    extractedAmount,
    extractedBank,
    reason: verified
      ? "Payment verified against the receipt image."
      : `${reason} A human will confirm this payment.`,
  };
}

async function recordEscalatedOrder(
  ctx: ActionContext,
  productId: string,
  expectedAmount: number,
  info: { receiptImageUrl: string | null; confidence: number; threshold: number; reason: string }
) {
  const order = await prisma.order.create({
    data: {
      conversationId: ctx.conversationId,
      productId,
      expectedAmount,
      receiptImageUrl: info.receiptImageUrl,
      verificationConfidence: info.confidence,
      status: "ESCALATED",
    },
  });

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { currentStage: "HUMAN_REVIEW_REQUIRED", confidence: info.confidence },
    }),
    prisma.event.create({
      data: {
        conversationId: ctx.conversationId,
        type: "PAYMENT_ESCALATED",
        payload: { orderId: order.id, confidence: info.confidence, threshold: info.threshold },
      },
    }),
  ]);

  return { verified: false, confidence: info.confidence, reason: info.reason };
}

async function updateStage(ctx: ActionContext, newStage: ConversationStage, objective?: string) {
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { currentStage: newStage, ...(objective ? { currentObjective: objective } : {}) },
    }),
    prisma.event.create({
      data: { conversationId: ctx.conversationId, type: "STAGE_CHANGED", payload: { newStage, objective } },
    }),
  ]);
  return { stage: newStage, objective: objective ?? null };
}

/**
 * The Conversation Brain's write path (PRD Ch 6.3 — Goals, Objections,
 * Extracted Entities, Outstanding Tasks). Without this, the AI has no way
 * to persist what it learns between turns, since only the latest message
 * plus this structured state is fed back in (not the full transcript) —
 * see conversation-brain.ts.
 */
async function recordFact(ctx: ActionContext, kind: FactKind, key: string, value: string) {
  await prisma.$transaction([
    prisma.conversationFact.create({
      data: { conversationId: ctx.conversationId, kind, payload: { key, value }, resolved: false },
    }),
    prisma.event.create({
      data: { conversationId: ctx.conversationId, type: "FACT_RECORDED", payload: { kind, key, value } },
    }),
  ]);
  return { recorded: true };
}

async function createFollowup(ctx: ActionContext, days: number, message: string) {
  const existingCount = await prisma.followup.count({ where: { conversationId: ctx.conversationId } });
  const scheduledFor = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const followup = await prisma.followup.create({
    data: { conversationId: ctx.conversationId, step: existingCount + 1, message, scheduledFor },
  });

  const boss = await getBoss();
  await boss.send(FOLLOWUP_QUEUE, { followupId: followup.id }, { startAfter: scheduledFor });

  await prisma.event.create({
    data: {
      conversationId: ctx.conversationId,
      type: "FOLLOWUP_SCHEDULED",
      payload: { followupId: followup.id, scheduledFor, message },
    },
  });
  return { scheduled: true, scheduledFor };
}

async function escalateToHuman(ctx: ActionContext, reason: string, summary: string) {
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { currentStage: "HUMAN_REVIEW_REQUIRED", summary },
    }),
    prisma.event.create({
      data: { conversationId: ctx.conversationId, type: "HUMAN_ASSIGNED", payload: { reason, summary } },
    }),
  ]);
  return { escalated: true };
}

async function tagCustomer(ctx: ActionContext, tag: string) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: ctx.conversationId },
    select: { customerId: true },
  });
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: conversation.customerId } });
  const existingTags = Array.isArray(customer.tags) ? (customer.tags as string[]) : [];
  const tags = existingTags.includes(tag) ? existingTags : [...existingTags, tag];
  await prisma.$transaction([
    prisma.customer.update({ where: { id: customer.id }, data: { tags } }),
    prisma.event.create({
      data: { conversationId: ctx.conversationId, type: "TAG_APPLIED", payload: { tag } },
    }),
  ]);
  return { tagged: true, tags };
}
