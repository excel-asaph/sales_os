import { prisma } from "@/lib/prisma";

// Which product a brand-new conversation is about (v2, docs/V2_REVAMP.md
// "One number, several products"). Decided once, when the conversation
// starts, from the most specific signal to the least:
//
//   1. the ad they clicked, if the business has said which product it sells
//   2. the product's own WhatsApp link: its opening message in their first one
//   3. a number that sells only one product
//
// If none of these says, the product stays unknown and the AI asks, then
// records the answer with its choose_product tool (src/lib/actions.ts).
// The ad and the opening message come before the number because they say
// what this customer came for; the number only says what it usually sells.

export type RoutedVia = "ad" | "opening_message" | "channel";

/**
 * Opening messages shorter than this, once normalised, are ignored: one like
 * "Hi" would match nearly every first message.
 */
const MIN_OPENING_LENGTH = 10;

/** Lowercase, letters and digits only, single spaces: people edit pre-filled text. */
export function normaliseForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export async function routeNewConversation(input: {
  businessId: string;
  /** The product a dedicated number sells (src/lib/channels.ts), or null. */
  channelProductId: string | null;
  referral?: { source_type?: string; source_id?: string } | null;
  firstMessageText?: string | null;
}): Promise<{ productId: string; via: RoutedVia } | null> {
  const { businessId, channelProductId, referral, firstMessageText } = input;

  if (referral?.source_type === "ad" && referral.source_id) {
    const mapped = await prisma.adProduct.findUnique({
      where: { businessId_adId: { businessId, adId: referral.source_id } },
      select: { productId: true, product: { select: { available: true } } },
    });
    if (mapped?.product.available) return { productId: mapped.productId, via: "ad" };
  }

  if (firstMessageText?.trim()) {
    const message = normaliseForMatch(firstMessageText);
    const products = await prisma.product.findMany({
      where: { businessId, available: true, whatsappOpeningText: { not: null } },
      select: { id: true, whatsappOpeningText: true },
    });
    // Longest first, so "the 10X Fat-Burning Switch workbook" beats
    // "the 10X Fat-Burning Switch" when both are in the message.
    const match = products
      .map((p) => ({ id: p.id, opening: normaliseForMatch(p.whatsappOpeningText!) }))
      .filter((p) => p.opening.length >= MIN_OPENING_LENGTH && message.includes(p.opening))
      .sort((a, b) => b.opening.length - a.opening.length)[0];
    if (match) return { productId: match.id, via: "opening_message" };
  }

  return channelProductId ? { productId: channelProductId, via: "channel" } : null;
}

/**
 * True when the AI has to find out which product the customer wants: the
 * conversation has none yet, and the business sells more than one. A
 * business with one product, like VitalFix, never needs to ask, so its
 * prompt and tools stay exactly as they were.
 */
export async function needsProductChoice(businessId: string, productId: string | null): Promise<boolean> {
  if (productId) return false;
  return (await prisma.product.count({ where: { businessId, available: true } })) > 1;
}

/** What the AI is told in a turn where needsProductChoice is true. */
export const PRODUCT_CHOICE_NOTE =
  "Platform note: this business sells more than one product, and which one this customer wants isn't known yet. " +
  "Find out the way a shop assistant would (use search_products to see what is on offer), and as soon as the customer " +
  "has made clear which product they mean, call choose_product with its id before pitching or quoting it. " +
  "From then on this conversation uses that product's own scripts.";
