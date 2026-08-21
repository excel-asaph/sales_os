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

export async function getFaqEntries(businessId: string) {
  return prisma.faqEntry.findMany({ where: { businessId }, orderBy: { order: "asc" } });
}

export async function getBusinessConfig(businessId: string) {
  const config = await prisma.businessConfig.findUnique({ where: { businessId } });
  // Defaults mirror the Prisma schema defaults — used if a business hasn't
  // been configured yet rather than crashing the runtime.
  return (
    config ?? {
      deliverBeforePayment: false,
      maxFollowups: 3,
      escalationConfidenceThreshold: 0.7,
      aiHandlesReceiptIssues: true,
      followupsEnabled: true,
      greetingTemplate: null,
      playbook: null,
    }
  );
}
