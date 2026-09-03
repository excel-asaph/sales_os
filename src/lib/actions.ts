import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, sendWhatsAppDocument } from "@/lib/whatsapp-send";
import { getPaymentAccounts, getBusinessConfig, searchProducts } from "@/lib/knowledge";
import { downloadWhatsAppMedia, persistMediaFile, readPersistedMedia } from "@/lib/media-storage";
import { verifyReceiptContent, type ReceiptExtraction, type PaymentAccountRef } from "@/lib/receipt-verification";
import { getBoss, FOLLOWUP_QUEUE } from "@/lib/queue";
import { addCustomerTag } from "@/lib/customer-tags";
import { cancelPendingFollowups, resolveFallbackMessage } from "@/lib/followups";
import { OPTED_OUT_TAG } from "@/lib/opt-out";
import { reportPurchaseConversion } from "@/lib/meta-conversions";
import type { ConversationStage, FactKind, FollowupReason, Prisma } from "@/generated/prisma/client";

export interface ActionContext {
  conversationId: string;
  businessId: string;
  customerPhoneNumber: string;
  whatsappPhoneNumberId: string;
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
      return sendPaymentDetails(ctx);
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
    case "no_reply_needed":
      return noReplyNeeded(ctx);
    case "escalate_to_human":
      return escalateToHuman(ctx, input.reason as string, input.summary as string);
    case "tag_customer":
      return tagCustomer(ctx, input.tag as string);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function sendMessage(ctx: ActionContext, text: string) {
  await sendWhatsAppText(ctx.businessId, ctx.customerPhoneNumber, text, ctx.whatsappPhoneNumberId);
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
    // The most recent order for this product, not "does a verified one
    // exist anywhere, ever" — conversations now persist across multiple
    // purchases (they no longer fork a new one on SALE_COMPLETED), so an
    // unordered existence check would let a second, unpaid purchase of the
    // same product ride through on the first purchase's old verified order.
    const latestOrderForProduct = await prisma.order.findFirst({
      where: { conversationId: ctx.conversationId, productId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    if (!latestOrderForProduct || latestOrderForProduct.status !== "VERIFIED") {
      return { delivered: false, reason: "payment has not been verified for this product yet" };
    }
  }

  if (!product.fileUrl) {
    return { delivered: false, reason: "product has no file/link configured" };
  }

  const filename = `${product.name}.pdf`;
  await sendWhatsAppDocument(ctx.businessId, ctx.customerPhoneNumber, product.fileUrl, filename, ctx.whatsappPhoneNumberId);
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

// The tool's own name and description ("Retrieve and send...") always said
// this sends the account details to the customer — the implementation just
// didn't, returning the account rows straight to the model instead of
// actually messaging anyone. A model that calls this and gets data back has
// no way to know it wasn't relayed, and ends its turn believing it answered
// — a real, confirmed way a customer was left without a reply (2026-08-12).
// Every other send_* tool in the contract genuinely sends; this brings it
// in line with them rather than the model.
async function sendPaymentDetails(ctx: ActionContext) {
  const accounts = await getPaymentAccounts(ctx.businessId);
  if (accounts.length === 0) {
    return { sent: false, reason: "No active payment account is configured for this business." };
  }
  const text = accounts
    .map((account) => `Bank: ${account.bankName}\nAccount number: ${account.accountNumber}\nAccount name: ${account.accountName}`)
    .join("\n\n");
  return sendMessage(ctx, text);
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
// text. VOICE is excluded since there's nothing to extract from audio
// without transcription (out of scope).
//
// A short trailing acknowledgment typed right after the real attachment
// ("Sent", "Here it is", "Done") must never outrank the attachment itself
// just for being more recent — found via a real customer test where typing
// "Sent" two seconds after a receipt PDF caused verification to run
// against the word "Sent" instead of the PDF, and fail for no real reason.
// Real Nigerian bank debit alerts run well over 100 characters (amount,
// account, narration, date); this floor only needs to clear a short
// acknowledgment, not identify genuine alert text precisely.
const MIN_PLAUSIBLE_RECEIPT_TEXT_LENGTH = 40;

async function requestPaymentVerification(ctx: ActionContext, productId: string, expectedAmount: number) {
  const [attachmentMessage, textMessage] = await Promise.all([
    prisma.message.findFirst({
      where: { conversationId: ctx.conversationId, direction: "INBOUND", type: { in: ["IMAGE", "DOCUMENT"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findFirst({
      where: { conversationId: ctx.conversationId, direction: "INBOUND", type: "TEXT" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Prefer the attachment unless a later text message is substantial
  // enough to plausibly be pasted alert content itself (or there's no
  // attachment to prefer in the first place) — see comment above.
  let receiptMessage = attachmentMessage;
  const textIsMoreRecent = textMessage && (!attachmentMessage || textMessage.createdAt > attachmentMessage.createdAt);
  if (textIsMoreRecent) {
    const looksSubstantial = (textMessage.content?.trim().length ?? 0) >= MIN_PLAUSIBLE_RECEIPT_TEXT_LENGTH;
    if (looksSubstantial || !attachmentMessage) {
      receiptMessage = textMessage;
    }
  }

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
      const media = await resolveMediaBytes(ctx.businessId, receiptMessage.mediaUrl, receiptMessage.id);

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
  //
  // Scoped to this product AND to attempts since the last verified order
  // on this conversation — conversations now persist across multiple
  // purchases, so an unscoped all-time count would let rejections from a
  // completed, unrelated earlier purchase burn this purchase's retry
  // budget (or a different product's rejections burn this product's).
  const lastVerifiedOrder = await prisma.order.findFirst({
    where: { conversationId: ctx.conversationId, status: "VERIFIED" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const priorRejections = await prisma.order.count({
    where: {
      conversationId: ctx.conversationId,
      productId,
      status: "REJECTED",
      ...(lastVerifiedOrder ? { createdAt: { gt: lastVerifiedOrder.createdAt } } : {}),
    },
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
  businessId: string,
  mediaUrl: string,
  messageId: string
): Promise<{ buffer: Buffer; mimeType: string; storedUrl: string } | null> {
  if (!mediaUrl.startsWith("whatsapp-media:")) {
    const media = await readPersistedMedia(mediaUrl);
    return media ? { ...media, storedUrl: mediaUrl } : null;
  }

  const mediaId = mediaUrl.slice("whatsapp-media:".length);
  const downloaded = await downloadWhatsAppMedia(businessId, mediaId);
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

/**
 * Everything that follows from an Order actually becoming VERIFIED, shared
 * between the AI's own verification (finalizeVerifiedOrder, below — creates
 * the Order itself first) and a human manually verifying one the AI never
 * got to (src/app/dashboard/[id]/actions.ts's verifyOrderManually, which
 * updates an existing ESCALATED/REJECTED Order rather than creating a new
 * one). Both need the identical downstream effects — conversation stage,
 * the customer's purchase count, and Meta conversion reporting — so this is
 * the one place that logic lives rather than drifting apart across two
 * call sites. Takes the caller's own event (type/payload) rather than
 * hard-coding one, since a human-driven verification is worth distinguishing
 * in the audit trail from the AI's own.
 */
export async function applyOrderVerifiedEffects(
  ctx: ActionContext,
  params: {
    orderId: string;
    expectedAmount: number;
    confidence: number | null;
    event: { type: string; payload: Prisma.InputJsonValue };
    // Only ever true for a human-triggered verification that's about to
    // hand the conversation back to the AI right after (dashboard/[id]'s
    // verifyOrderManually/createAndVerifyOrder) — the AI's own
    // finalizeVerifiedOrder never sets this, since it only ever runs from a
    // turn that was already unassigned to begin with (ai-runtime.ts's guard
    // wouldn't have let it run otherwise).
    clearHumanAssignment?: boolean;
  }
) {
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: {
        currentStage: "PAYMENT_VERIFIED",
        ...(params.confidence !== null ? { confidence: params.confidence } : {}),
        ...(params.clearHumanAssignment ? { assignedHumanId: null } : {}),
      },
    }),
    prisma.event.create({
      data: { conversationId: ctx.conversationId, type: params.event.type, payload: params.event.payload },
    }),
  ]);
  // PAYMENT_VERIFIED is one of the follow-up worker's own BLOCKS_FOLLOWUP
  // stages — this just stops any already-scheduled follow-up (e.g. one
  // created with reason AWAITING_PAYMENT_EVIDENCE) from sitting around
  // looking "active" until its job fires and discovers the payment's
  // already in.
  await cancelPendingFollowups(ctx.conversationId, "order_verified");

  // Nothing else ever resolves a TASK fact (conversation-brain.ts renders
  // every unresolved one as "Outstanding tasks" on every future turn,
  // forever) — a "Product delivered before payment... Awaiting payment of
  // NGN X" TASK fact from the deliver-before-payment flow would otherwise
  // sit there permanently, and a later, unrelated customer message (a
  // product question, anything) would have the AI reading real payment as
  // still outstanding and reflexively re-opening a "still waiting for your
  // payment" follow-up on an already-paid sale (confirmed in production,
  // 2026-08-14/19 — see conversation cmsstrjaa01m71mryqvo5vupv). A verified
  // payment is strong evidence any task tracking "get this paid" is done,
  // so clear all of them here rather than trying to match the one that
  // caused it.
  await prisma.conversationFact.updateMany({
    where: { conversationId: ctx.conversationId, kind: "TASK", resolved: false },
    data: { resolved: true },
  });

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

  // Never blocks or fails the sale itself — this is a side-channel signal
  // to Meta's ad algorithm, not something the customer-facing flow depends
  // on. Logged either way (Non-Negotiable 14.5) so it's visible why a given
  // sale did or didn't reach Meta, not just whether it was internally
  // verified.
  const conversionResult = await reportPurchaseConversion({
    businessId: ctx.businessId,
    conversationId: ctx.conversationId,
    value: params.expectedAmount,
    currency: "NGN",
  });
  await prisma.$transaction([
    prisma.order.update({
      where: { id: params.orderId },
      data: {
        metaConversionReportReason: conversionResult.reported ? "reported" : conversionResult.reason,
        ...(conversionResult.reported ? { metaConversionReportedAt: new Date() } : {}),
      },
    }),
    prisma.event.create({
      data: {
        conversationId: ctx.conversationId,
        type: "META_CONVERSION_REPORTED",
        payload: { orderId: params.orderId, ...conversionResult },
      },
    }),
  ]);
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

  await applyOrderVerifiedEffects(ctx, {
    orderId: order.id,
    expectedAmount,
    confidence: info.confidence,
    event: { type: "PAYMENT_VERIFIED", payload: { orderId: order.id, confidence: info.confidence } },
  });

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
  // Business-wide kill switch (Settings) — refuse to start a new sequence
  // at all while paused, so nothing accumulates that the worker would just
  // have to cancel again on its own once it fires.
  const config = await getBusinessConfig(ctx.businessId);
  if (!config.followupsEnabled) {
    return { scheduled: false, paused: true };
  }

  // A customer already tagged "Uninterested" (an explicit past decline, or
  // a fully exhausted sequence — both apply the same tag) gets no automatic
  // follow-up on a fresh conversation unless *this* conversation has
  // already shown real renewed interest — evidenced by the stage having
  // moved off NEW_LEAD, which only happens when the AI reasoned its way
  // there off something the customer actually said, not just "they
  // messaged in again." Nudging someone who already declined, on nothing
  // but an ambiguous message, is exactly the pattern that risks WhatsApp
  // spam/opt-out complaints and damages the number's quality rating
  // (Trends → Number health) — enforced here rather than only in the
  // system prompt, since a compliance-sensitive rule shouldn't depend on
  // the model remembering it every turn.
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: ctx.conversationId },
    include: { customer: { select: { tags: true } } },
  });
  const customerTags = Array.isArray(conversation.customer.tags) ? (conversation.customer.tags as string[]) : [];

  // An explicit opt-out is unconditional, unlike the soft-decline case
  // below: no stage, and nothing the customer says later, re-enables
  // automatic nudging. WhatsApp's Business Messaging Policy requires
  // respecting a request to discontinue outright, and the check can't be
  // stage-scoped — an opted-out customer's conversation sits at LOST_LEAD,
  // not NEW_LEAD, so the guard below would never fire for them.
  if (customerTags.includes(OPTED_OUT_TAG)) {
    return { scheduled: false, optedOut: true };
  }

  if (customerTags.includes("Uninterested") && conversation.currentStage === "NEW_LEAD") {
    return { scheduled: false, returningDeclinedCustomer: true };
  }

  const existing = await prisma.followup.findFirst({
    where: { conversationId: ctx.conversationId, sent: false, cancelled: false },
  });
  if (existing) {
    return { scheduled: false, alreadyActive: true, scheduledFor: existing.scheduledFor, step: existing.step };
  }

  // Stored as real text even when the model passes a playbook key instead —
  // this field is sent verbatim if composing fresh fails at send time, so a
  // bare key would reach the customer as the entire message (followups.ts).
  // The worker resolves it again on the way out, covering rows written
  // before this did.
  const fallbackMessage = resolveFallbackMessage(message, config.playbook as Record<string, string> | null);

  const scheduledFor = new Date(Date.now() + hours * 60 * 60 * 1000);
  const followup = await prisma.followup.create({
    data: { conversationId: ctx.conversationId, step: 1, message: fallbackMessage, scheduledFor, reason },
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

async function noReplyNeeded(ctx: ActionContext) {
  await prisma.event.create({
    data: { conversationId: ctx.conversationId, type: "NO_REPLY_NEEDED", payload: {} },
  });
  return { acknowledged: true };
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
  // The follow-up worker itself would refuse to act once a conversation is
  // on a human stage (BLOCKS_FOLLOWUP) — this just stops any already-
  // scheduled one from sitting around looking "active" until it fires and
  // discovers that.
  await cancelPendingFollowups(ctx.conversationId, "escalated_to_human");
  return { escalated: true };
}

async function tagCustomer(ctx: ActionContext, tag: string) {
  const tags = await addCustomerTag(ctx.conversationId, tag);
  return { tagged: true, tags };
}
