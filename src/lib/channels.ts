import { prisma } from "@/lib/prisma";

// v2 channels (docs/V2_BUILD_PLAN.md): one Channel row per WhatsApp number,
// saying which business it belongs to and which products it sells.

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface InboundRoute {
  businessId: string;
  /** Null only on the v1 fallback, before scripts/v2-backfill.ts has run. */
  channelId: string | null;
  /** The product a new conversation on this number is about, if the number says. */
  productId: string | null;
}

/**
 * Which business, channel and product an inbound message on this number
 * belongs to, or null to drop it.
 *
 * A number with a Channel row is decided by that row alone, so a
 * DISCONNECTED channel drops the message even though the v1 fields may
 * still list the number. The v1 fields are only consulted for a number
 * with no Channel row at all, which covers the minutes between deploying
 * v2 and running the backfill; after that every number has a row. Same
 * reasoning as the v1 login fallback in src/lib/workspaces.ts.
 */
export async function routeInbound(phoneNumberId: string): Promise<InboundRoute | null> {
  const channel = await prisma.channel.findUnique({
    where: { phoneNumberId },
    select: { id: true, businessId: true, status: true, products: { select: { productId: true } } },
  });

  if (channel) {
    if (channel.status !== "ACTIVE") return null;
    // One product means a dedicated number, which answers "what did they
    // come for" before the customer says anything. A shared number leaves
    // it open for the ad, the opening message or the AI to settle.
    const productId = channel.products.length === 1 ? channel.products[0].productId : null;
    return { businessId: channel.businessId, channelId: channel.id, productId };
  }

  const business = await prisma.business.findFirst({
    where: {
      OR: [{ whatsappPhoneNumberId: phoneNumberId }, { additionalWhatsappPhoneNumberIds: { has: phoneNumberId } }],
    },
    select: { id: true },
  });
  return business ? { businessId: business.id, channelId: null, productId: null } : null;
}

/**
 * Records a number a business has just connected, reactivating it if it was
 * connected before. If the business sells exactly one product the number
 * sells it, the same rule the backfill uses; otherwise products are chosen
 * in the app. Refuses a number already connected to another business:
 * inbound messages name only the number, so it can belong to one business.
 */
export async function registerChannel(tx: Tx, businessId: string, phoneNumberId: string): Promise<void> {
  const existing = await tx.channel.findUnique({ where: { phoneNumberId } });
  if (existing && existing.businessId !== businessId) {
    throw new Error("This WhatsApp number is already connected to another business on Antflow.");
  }
  if (existing) {
    if (existing.status !== "ACTIVE") {
      await tx.channel.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
    }
    return;
  }

  const products = await tx.product.findMany({ where: { businessId, available: true }, select: { id: true } });
  await tx.channel.create({
    data: {
      businessId,
      phoneNumberId,
      ...(products.length === 1 ? { products: { create: { productId: products[0].id } } } : {}),
    },
  });
}
