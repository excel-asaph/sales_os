import { prisma } from "@/lib/prisma";

/**
 * Knowledge Engine (PRD Ch 11), MVP-scoped per PRD 13.3: products and
 * payment accounts only, plain SQL lookups — no embeddings, no retrieval
 * pipeline. The catalog is expected to be single digits to low dozens of
 * SKUs (PRD 13.3), so a simple name/description match is sufficient.
 */
export async function searchProducts(businessId: string, query: string) {
  const products = await prisma.product.findMany({
    where: {
      businessId,
      available: true,
      OR: query
        ? [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ]
        : undefined,
    },
    take: 10,
  });

  // Empty query (or no match) still returns the catalog rather than
  // nothing — the MVP catalog is small enough that showing everything
  // beats a false "we don't have that."
  if (products.length === 0 && query) {
    return prisma.product.findMany({ where: { businessId, available: true }, take: 10 });
  }
  return products;
}

export async function getPaymentAccounts(businessId: string) {
  return prisma.paymentAccount.findMany({ where: { businessId, active: true } });
}

/**
 * The FAQ the AI sees: every business-wide entry, plus this product's own
 * when the conversation's product is known. Business-wide first, each
 * group in the owner's order.
 */
export async function getFaqEntries(businessId: string, productId?: string | null) {
  const entries = await prisma.faqEntry.findMany({
    where: { businessId, OR: [{ productId: null }, ...(productId ? [{ productId }] : [])] },
    orderBy: { order: "asc" },
  });
  return [...entries.filter((e) => !e.productId), ...entries.filter((e) => e.productId)];
}

export interface EffectiveConfig {
  deliverBeforePayment: boolean;
  maxFollowups: number;
  escalationConfidenceThreshold: number;
  aiHandlesReceiptIssues: boolean;
  followupsEnabled: boolean;
  productContentEnabled: boolean;
  playbook: Record<string, string> | null;
}

/**
 * The settings a sale actually runs on: the business's BusinessConfig, with
 * the product's own ProductSettings laid over it (v2, docs/V2_BUILD_PLAN.md
 * Phase 2). The only place that merge happens.
 *
 * - An empty product field uses the business's value.
 * - The playbook merges script by script: a product script replaces the
 *   business script with the same key, and the rest still come through.
 * - followupsEnabled: the business switch is a pause on everything, so a
 *   product can only add an "off", never override the business's "off".
 * - No product (a shared number before the customer has said what they
 *   want) means the business's settings, which is all v1 ever used.
 */
export async function getEffectiveConfig(businessId: string, productId?: string | null): Promise<EffectiveConfig> {
  const [config, productSettings] = await Promise.all([
    prisma.businessConfig.findUnique({ where: { businessId } }),
    productId ? prisma.productSettings.findUnique({ where: { productId } }) : null,
  ]);

  // Defaults mirror the Prisma schema defaults — used if a business hasn't
  // been configured yet rather than crashing the runtime.
  const business: EffectiveConfig = {
    deliverBeforePayment: config?.deliverBeforePayment ?? false,
    maxFollowups: config?.maxFollowups ?? 5,
    escalationConfidenceThreshold: config?.escalationConfidenceThreshold ?? 0.7,
    aiHandlesReceiptIssues: config?.aiHandlesReceiptIssues ?? true,
    followupsEnabled: config?.followupsEnabled ?? true,
    productContentEnabled: config?.productContentEnabled ?? true,
    playbook: (config?.playbook as Record<string, string> | null) ?? null,
  };
  if (!productSettings) return business;

  // A blank script means "use the business's", never "send nothing".
  const productPlaybook = Object.fromEntries(
    Object.entries((productSettings.playbook as Record<string, string> | null) ?? {}).filter(([, text]) => text?.trim())
  );
  return {
    ...business,
    deliverBeforePayment: productSettings.deliverBeforePayment ?? business.deliverBeforePayment,
    maxFollowups: productSettings.maxFollowups ?? business.maxFollowups,
    aiHandlesReceiptIssues: productSettings.aiHandlesReceiptIssues ?? business.aiHandlesReceiptIssues,
    followupsEnabled: business.followupsEnabled && (productSettings.followupsEnabled ?? true),
    productContentEnabled: productSettings.productContentEnabled ?? business.productContentEnabled,
    playbook: Object.keys(productPlaybook).length ? { ...business.playbook, ...productPlaybook } : business.playbook,
  };
}

/** getEffectiveConfig for whatever product a conversation is about right now. */
export async function getConversationConfig(conversationId: string): Promise<EffectiveConfig> {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    select: { productId: true, customer: { select: { businessId: true } } },
  });
  return getEffectiveConfig(conversation.customer.businessId, conversation.productId);
}
