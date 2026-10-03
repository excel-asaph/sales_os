import { prisma } from "@/lib/prisma";

// The "Ebook seller" starting template (docs/V2_ONBOARDING.md step 4b): the
// business-wide scripts a new ebook seller needs on day one. Each product's
// own pitch is drafted from its book on the product's page
// (src/lib/product-draft.ts), so the pitch keys aren't here.
//
// Written for Antflow in the house voice (docs/BOOK_VOICE.md), following
// the shape of VitalFix's flow. VitalFix's own wording lives only in its
// production database; to use it instead, copy it out with
// scripts/export-playbook.ts and replace the text below.

type Account = { bankName: string; accountNumber: string; accountName: string };

const accountLines = (a: Account) => `${a.bankName}\nAccount number: ${a.accountNumber}\nAccount name: ${a.accountName}`;

function ebookSellerScripts(businessName: string, accounts: Account[]): Record<string, string> {
  const [primary, alternate] = accounts;
  return {
    ...(primary
      ? {
          payment_instructions_primary:
            `You can pay into this account:\n\n${accountLines(primary)}\n\n` +
            "Once you've paid, send a screenshot of the receipt here and I'll send your book straight away.",
        }
      : {}),
    ...(alternate
      ? {
          payment_instructions_alternate:
            `If ${primary!.bankName} isn't convenient, you can pay into this one instead:\n\n${accountLines(alternate)}\n\n` +
            "Send the receipt here once it's done.",
        }
      : {}),
    ebook_delivery_note:
      "Here is your copy. Take your time with it, and when you're ready, pay into the account I sent so your purchase is complete. " +
      "If any part isn't clear, ask me here.",
    payment_confirmation: "Payment received, thank you! Here is your book.",
    thank_you_message:
      `Thank you for buying from ${businessName}. Enjoy it, and if anything in it isn't clear, message me here any time. I'm happy to explain.`,
    payment_followup:
      "Hello, just checking in. Once you've paid into the account I sent, send the receipt here and I'll confirm it for you.",
  };
}

/**
 * Loads the Ebook seller scripts into the business's playbook, filling only
 * scripts that are empty: anything the owner has written stays. Returns how
 * many were filled.
 */
export async function loadEbookSellerScripts(businessId: string): Promise<number> {
  const [business, accounts, config] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { name: true } }),
    prisma.paymentAccount.findMany({ where: { businessId, active: true }, orderBy: { id: "asc" } }),
    prisma.businessConfig.findUnique({ where: { businessId } }),
  ]);
  const current = (config?.playbook as Record<string, string> | null) ?? {};
  const additions = Object.fromEntries(
    Object.entries(ebookSellerScripts(business.name, accounts)).filter(([key]) => !current[key]?.trim())
  );
  if (Object.keys(additions).length === 0) return 0;

  const playbook = { ...current, ...additions };
  await prisma.businessConfig.upsert({
    where: { businessId },
    create: { businessId, playbook },
    update: { playbook },
  });
  return Object.keys(additions).length;
}
