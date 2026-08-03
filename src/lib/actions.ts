import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, sendWhatsAppDocument } from "@/lib/whatsapp-send";
import { getPaymentAccounts, getBusinessConfig, searchProducts } from "@/lib/knowledge";
import { downloadWhatsAppMedia, persistMediaFile, readPersistedMedia } from "@/lib/media-storage";
import { verifyReceiptContent, type ReceiptExtraction, type PaymentAccountRef } from "@/lib/receipt-verification";
import { getBoss, FOLLOWUP_QUEUE } from "@/lib/queue";
import { addCustomerTag } from "@/lib/customer-tags";
import type { ConversationStage, FactKind, FollowupReason } from "@/generated/prisma/client";

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
    case "send_template_message":
      return sendTemplateMessage(ctx, input.template_key as string);
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
      return createFollowup(
        ctx,
        input.hours as number,
        input.message as string,
        (input.reason as FollowupReason | undefined) ?? "GENERAL"
      );
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

/**
 * The enforcement point for exact-wording templates (business_config.playbook):
 * the model only ever supplies a key, never the text itself, so a scripted
 * message can't drift through generation — this just looks up the stored
 * string and sends it through the same path as sendMessage, byte-for-byte.
 */
async function sendTemplateMessage(ctx: ActionContext, templateKey: string) {
  const config = await getBusinessConfig(ctx.businessId);
  const playbook = (config.playbook as Record<string, string> | null) ?? {};
  const text = playbook[templateKey];
  if (!text) {
    return { sent: false, reason: `No template found for key "${templateKey}".` };
  }
  return sendMessage(ctx, text);
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
// Cap on self-correction attempts (src/lib/system-prompt.ts's guidance,
// BusinessConfig.aiHandlesReceiptIssues) before a receipt mismatch always
// escalates to a human regardless of that setting — a repeated-failure
// pattern is itself a signal worth a human's eyes, and this is also the
// circuit breaker against someone trying many fake receipts hoping one
// slips past. Not business-configurable on purpose: raising it would blunt
// the one guardrail that isn't a business preference.
const RECEIPT_RETRY_LIMIT = 3;

// A customer's receipt "evidence" can arrive as any inbound message type —
// a screenshot, a forwarded PDF, or a pasted bank SMS/debit-alert as plain
// text. Whichever is most recent is what the customer is pointing at when
// the AI checks; VOICE is excluded since there's nothing to extract from
// audio without transcription (out of scope).
const RECEIPT_MESSAGE_TYPES = ["IMAGE", "DOCUMENT", "TEXT"] as const;

async function requestPaymentVerification(ctx: ActionContext, productId: string, expectedAmount: number) {
  const receiptMessage = await prisma.message.findFirst({
    where: {
      conversationId: ctx.conversationId,
      direction: "INBOUND",
      type: { in: [...RECEIPT_MESSAGE_TYPES] },
    },
    orderBy: { createdAt: "desc" },
  });

  const [config, paymentAccounts] = await Promise.all([
    getBusinessConfig(ctx.businessId),
    getPaymentAccounts(ctx.businessId),
  ]);

  if (!receiptMessage) {
    // Nothing to escalate — there's no evidence for a human to review
    // either. The right move is just asking the customer to send some.
    return {
      verified: false,
      status: "needs_correction" as const,
      reason: "No payment evidence has been sent in this conversation yet — ask the customer to send a screenshot, PDF, or the text of their bank alert.",
    };
  }

  let storedImageUrl: string | null = receiptMessage.type === "TEXT" ? null : receiptMessage.mediaUrl;
  let extractedAmount: number | null = null;
  let extractedBank: string | null = null;
  let confidence = 0;
  let looksAltered = false;
  let amountMatches = false;
  let accountMatches = false;
  let transactionSuccessful = false;
  // Distinguishes a technical/system fault (can't read the evidence at all
  // — never the customer's fault, always escalates, never counts toward
  // their retry cap) from a genuine content mismatch below.
  let technicalFailure = true;
  // A format we structurally can't parse (e.g. a non-PDF document) — the
  // customer's own choice, so it's correctable like a mismatch, but never
  // counts as a "technical" fault.
  let unsupportedFormat = false;
  let reason = "Could not read the payment evidence automatically — routed to a human for manual verification.";

  try {
    if (receiptMessage.type === "TEXT") {
      const extraction = await verifyReceiptContent({
        content: { kind: "text", text: receiptMessage.content ?? "" },
        expectedAmount,
        paymentAccounts,
      });
      technicalFailure = false;
      ({ extractedAmount, extractedBank, looksAltered, confidence, reason, amountMatches, accountMatches, transactionSuccessful } =
        applyExtraction(extraction, expectedAmount, paymentAccounts, reason));
    } else if (!receiptMessage.mediaUrl) {
      reason = "Could not read the payment evidence automatically — routed to a human for manual verification.";
    } else {
      const media = await resolveMediaBytes(receiptMessage.mediaUrl, receiptMessage.id);

      if (media) {
        storedImageUrl = media.storedUrl;

        if (receiptMessage.type === "IMAGE") {
          const extraction = await verifyReceiptContent({
            content: {
              kind: "image",
              base64: media.buffer.toString("base64"),
              mimeType: media.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            },
            expectedAmount,
            paymentAccounts,
          });
          technicalFailure = false;
          ({ extractedAmount, extractedBank, looksAltered, confidence, reason, amountMatches, accountMatches, transactionSuccessful } =
            applyExtraction(extraction, expectedAmount, paymentAccounts, reason));
        } else if (media.mimeType === "application/pdf") {
          const extraction = await verifyReceiptContent({
            content: { kind: "document", base64: media.buffer.toString("base64") },
            expectedAmount,
            paymentAccounts,
          });
          technicalFailure = false;
          ({ extractedAmount, extractedBank, looksAltered, confidence, reason, amountMatches, accountMatches, transactionSuccessful } =
            applyExtraction(extraction, expectedAmount, paymentAccounts, reason));
        } else {
          technicalFailure = false;
          unsupportedFormat = true;
          reason = "This file type isn't something I can read automatically.";
        }
      } else {
        reason =
          "WhatsApp media access isn't configured yet — routed to a human for manual verification.";
      }
    }
  } catch (error) {
    console.error(`Receipt verification failed for conversation ${ctx.conversationId}`, error);
    reason = "Automatic receipt verification failed — routed to a human for manual verification.";
  }

  // The platform enforces the hard match, not just the model's own
  // self-reported confidence — a receipt the model likes the look of but
  // with the wrong amount or account is never trusted. Anything flagged as
  // altered is never verified regardless of how well the numbers line up.
  const hardMatch = amountMatches && accountMatches && transactionSuccessful;
  const verified = !technicalFailure && !unsupportedFormat && !looksAltered && hardMatch && confidence >= config.escalationConfidenceThreshold;

  if (verified) {
    return finalizeVerifiedOrder(ctx, productId, expectedAmount, {
      receiptImageUrl: storedImageUrl,
      extractedAmount,
      extractedBank,
      confidence,
    });
  }

  // Tampering signs and technical faults always escalate — never something
  // to hand back to the customer as "please fix and resend," and never
  // subject to the retry cap (there's nothing correctable to count).
  if (technicalFailure || looksAltered) {
    return recordEscalatedOrder(ctx, productId, expectedAmount, {
      receiptImageUrl: storedImageUrl,
      confidence,
      threshold: config.escalationConfidenceThreshold,
      // Deliberately generic for anything the customer will see relayed —
      // never surface "looks altered" to them, which would either accuse an
      // honest customer or coach an actual fraudster on what to fix next.
      reason: looksAltered
        ? "This receipt needs manual review."
        : reason,
    });
  }

  // A correctable issue: wrong amount, wrong account, unclear evidence,
  // transaction not completed, or a format we can't parse (e.g. a non-PDF
  // document). Self-correct if this business has opted in and hasn't
  // burned its retry cap on this conversation yet; otherwise fall back to
  // escalating, same as before this feature existed.
  const priorRejections = await prisma.order.count({
    where: { conversationId: ctx.conversationId, status: "REJECTED" },
  });

  if (config.aiHandlesReceiptIssues && priorRejections < RECEIPT_RETRY_LIMIT) {
    return recordRejectedOrder(ctx, productId, expectedAmount, {
      receiptImageUrl: storedImageUrl,
      extractedAmount,
      extractedBank,
      confidence,
      reason: unsupportedFormat
        ? "I can't read that file automatically — could you send a screenshot, PDF, or the text of your bank alert instead?"
        : describeReceiptMismatch({
            extractedAmount,
            confidence,
            expectedAmount,
            amountMatches,
            accountMatches,
            transactionSuccessful,
          }),
    });
  }

  return recordEscalatedOrder(ctx, productId, expectedAmount, {
    receiptImageUrl: storedImageUrl,
    confidence,
    threshold: config.escalationConfidenceThreshold,
    reason,
  });
}

// Gets the bytes for whatever evidence the customer sent, reusing already-
// persisted media (ingest-message.ts downloads and re-hosts inbound media
// the moment it arrives) instead of hitting WhatsApp's API a second time.
// Falls back to a fresh WhatsApp download only if that eager persistence
// hasn't happened yet for some reason (e.g. it failed, or this is an older
// message from before that existed).
async function resolveMediaBytes(
  mediaUrl: string,
  messageId: string
): Promise<{ buffer: Buffer; mimeType: string; storedUrl: string } | null> {
  if (!mediaUrl.startsWith("whatsapp-media:")) {
    const media = await readPersistedMedia(mediaUrl);
    return media ? { ...media, storedUrl: mediaUrl } : null;
  }

  const mediaId = mediaUrl.slice("whatsapp-media:".length);
  const downloaded = await downloadWhatsAppMedia(mediaId);
  if (!downloaded) return null;

  const storedUrl = await persistMediaFile(downloaded.buffer, downloaded.mimeType, mediaId);
  await prisma.message.update({ where: { id: messageId }, data: { mediaUrl: storedUrl } });
  return { ...downloaded, storedUrl };
}

// Shared post-processing for any successful extraction (image, PDF, or
// text) — computes the hard-match signals the platform enforces itself,
// never trusting the model's own confidence alone.
function applyExtraction(
  extraction: ReceiptExtraction,
  expectedAmount: number,
  paymentAccounts: PaymentAccountRef[],
  fallbackReason: string
) {
  const amountMatches =
    extraction.extractedAmount !== null &&
    Math.abs(extraction.extractedAmount - expectedAmount) <= expectedAmount * 0.02;
  // Two ways to satisfy this: a real number match (tolerant of masking), or
  // — since plenty of genuine Nigerian bank debit alerts never show a
  // recipient account number at all, only the sender's own — the model's
  // own semantic judgment that whatever DOES identify the recipient (name,
  // description) plausibly matches. Requiring a number every time would
  // make verification impossible for a large share of real receipts.
  const accountMatches =
    (extraction.extractedAccountNumber !== null &&
      paymentAccounts.some((a) => accountNumberPlausiblyMatches(extraction.extractedAccountNumber!, a.accountNumber))) ||
    extraction.recipientIdentityPlausible;
  const transactionSuccessful = extraction.transactionStatus === "successful";

  return {
    extractedAmount: extraction.extractedAmount,
    extractedBank: extraction.extractedBank,
    looksAltered: extraction.looksAltered,
    confidence: extraction.modelConfidence,
    reason: extraction.reasoning || fallbackReason,
    amountMatches,
    accountMatches,
    transactionSuccessful,
  };
}

// Bank SMS/debit alerts mask account numbers in at least two different
// conventions seen in real messages: fixed-length positional masking
// ("142****141", same length as the real number, wildcards in place) and
// prefix-only masking with a revealed suffix ("**83793" — an unknown
// number of leading digits hidden, only the tail shown). An exact-string
// match would never pass either on a genuinely correct account.
function accountNumberPlausiblyMatches(extracted: string, configured: string): boolean {
  if (extracted === configured) return true;
  if (!/[*x]/i.test(extracted)) return false;

  if (extracted.length === configured.length) {
    let positionalMatch = true;
    for (let i = 0; i < extracted.length; i++) {
      const c = extracted[i];
      if (c === "*" || c.toLowerCase() === "x") continue;
      if (c !== configured[i]) {
        positionalMatch = false;
        break;
      }
    }
    if (positionalMatch) return true;
  }

  const visibleSuffix = extracted.replace(/^[*x]+/i, "");
  if (visibleSuffix.length >= 4 && !/[*x]/i.test(visibleSuffix) && configured.endsWith(visibleSuffix)) {
    return true;
  }

  return false;
}

// Customer-safe wording for a correctable mismatch — specific enough to act
// on, never accusatory, and ordered so the AI relays one clear thing rather
// than a checklist.
function describeReceiptMismatch(params: {
  extractedAmount: number | null;
  confidence: number;
  expectedAmount: number;
  amountMatches: boolean;
  accountMatches: boolean;
  transactionSuccessful: boolean;
}): string {
  const { extractedAmount, confidence, expectedAmount, amountMatches, accountMatches, transactionSuccessful } = params;
  if (extractedAmount === null || confidence < 0.5) {
    return "I couldn't find clear payment details there — could you send a screenshot, PDF, or the text of your bank alert?";
  }
  if (!accountMatches) {
    return "This receipt shows a different account than the one we shared — could you confirm you sent it to the account we gave you, and resend the receipt?";
  }
  if (!amountMatches) {
    return `The amount on this receipt shows ₦${extractedAmount.toLocaleString("en-NG")}, but we're expecting ₦${expectedAmount.toLocaleString("en-NG")} — could you double-check and resend the correct receipt?`;
  }
  if (!transactionSuccessful) {
    return "This receipt doesn't show a completed transaction yet — could you check and resend once the transfer has gone through?";
  }
  return "I wasn't able to verify this receipt — could you resend it, or send a clearer copy?";
}

async function finalizeVerifiedOrder(
  ctx: ActionContext,
  productId: string,
  expectedAmount: number,
  info: { receiptImageUrl: string | null; extractedAmount: number | null; extractedBank: string | null; confidence: number }
) {
  const order = await prisma.order.create({
    data: {
      conversationId: ctx.conversationId,
      productId,
      expectedAmount,
      receiptImageUrl: info.receiptImageUrl,
      extractedAmount: info.extractedAmount,
      extractedBank: info.extractedBank,
      verificationConfidence: info.confidence,
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  });

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { currentStage: "PAYMENT_VERIFIED", confidence: info.confidence },
    }),
    prisma.event.create({
      data: {
        conversationId: ctx.conversationId,
        type: "PAYMENT_VERIFIED",
        payload: { orderId: order.id, confidence: info.confidence },
      },
    }),
  ]);

  // Customer.lifetimePurchases/returningCustomer (read into the AI's brain —
  // conversation-brain.ts — and shown on the Customer Profile page) were
  // never actually written anywhere, so every customer looked first-time
  // forever. This is the one place a payment actually becomes verified.
  const updatedCustomer = await prisma.customer.update({
    where: { businessId_phoneNumber: { businessId: ctx.businessId, phoneNumber: ctx.customerPhoneNumber } },
    data: { lifetimePurchases: { increment: 1 } },
  });
  if (updatedCustomer.lifetimePurchases > 1 && !updatedCustomer.returningCustomer) {
    await prisma.customer.update({
      where: { id: updatedCustomer.id },
      data: { returningCustomer: true },
    });
  }

  return {
    verified: true,
    status: "verified" as const,
    confidence: info.confidence,
    extractedAmount: info.extractedAmount,
    extractedBank: info.extractedBank,
    reason: "Payment verified against the receipt image.",
  };
}

// A correctable mismatch the customer can fix themselves — logged for
// visibility (Customer Profile / conversation Review already render Order
// rows) but deliberately doesn't touch currentStage: the AI stays in the
// same back-and-forth it was already in, same as any other objection.
async function recordRejectedOrder(
  ctx: ActionContext,
  productId: string,
  expectedAmount: number,
  info: { receiptImageUrl: string | null; extractedAmount: number | null; extractedBank: string | null; confidence: number; reason: string }
) {
  const order = await prisma.order.create({
    data: {
      conversationId: ctx.conversationId,
      productId,
      expectedAmount,
      receiptImageUrl: info.receiptImageUrl,
      extractedAmount: info.extractedAmount,
      extractedBank: info.extractedBank,
      verificationConfidence: info.confidence,
      status: "REJECTED",
    },
  });

  await prisma.event.create({
    data: {
      conversationId: ctx.conversationId,
      type: "PAYMENT_REJECTED",
      payload: { orderId: order.id, confidence: info.confidence, reason: info.reason },
    },
  });

  return { verified: false, status: "needs_correction" as const, confidence: info.confidence, reason: info.reason };
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

  return {
    verified: false,
    status: "escalated" as const,
    confidence: info.confidence,
    reason: `${info.reason} A member of our team will confirm this shortly.`,
  };
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

// The AI only ever creates step 1 — a scheduled sequence auto-advances
// itself from there (the follow-up worker schedules step 2+ directly when
// each step fires with no reply, up to BusinessConfig.maxFollowups). This
// call is just the entry point: "start following up on this
// conversation," optionally at a specific time if the customer gave one
// (e.g. "I'll pay this evening").
//
// The system prompt now instructs the AI to call this any time a turn ends
// with the ball in the customer's court, not just on a stated deferral —
// so it will legitimately get called more than once across a conversation's
// life while a sequence is already running. Rather than relying on the
// model to track that itself (calling it again mid-sequence used to
// silently restart the sequence from step one, which is exactly what a
// wider mandate would otherwise do constantly), the platform makes a
// repeat call a no-op whenever one is already pending.
async function createFollowup(
  ctx: ActionContext,
  hours: number,
  message: string,
  reason: FollowupReason = "GENERAL"
) {
  const existing = await prisma.followup.findFirst({
    where: { conversationId: ctx.conversationId, sent: false, cancelled: false },
  });
  if (existing) {
    return { scheduled: false, alreadyActive: true, scheduledFor: existing.scheduledFor, step: existing.step };
  }

  const scheduledFor = new Date(Date.now() + hours * 60 * 60 * 1000);
  const followup = await prisma.followup.create({
    data: { conversationId: ctx.conversationId, step: 1, message, scheduledFor, reason },
  });

  const boss = await getBoss();
  await boss.send(FOLLOWUP_QUEUE, { followupId: followup.id }, { startAfter: scheduledFor });

  await prisma.event.create({
    data: {
      conversationId: ctx.conversationId,
      type: "FOLLOWUP_SCHEDULED",
      payload: { followupId: followup.id, scheduledFor, message, reason },
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
  const tags = await addCustomerTag(ctx.conversationId, tag);
  return { tagged: true, tags };
}
