import { prisma } from "@/lib/prisma";

// The new-business setup checklist on Home (docs/V2_ONBOARDING.md step 4),
// aimed at a first sale on day one. Every step's state is worked out from
// what the business has actually done, so it can't drift: nothing is ticked
// by hand, and the owner can leave and come back.

export interface ChecklistStep {
  key: string;
  title: string;
  hint: string;
  done: boolean;
  href: string;
  action: string;
}

export async function getSetupChecklist(businessId: string): Promise<{ hidden: boolean; steps: ChecklistStep[] } | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { setupChecklistHiddenAt: true, testChatUsedAt: true },
  });
  if (!business) return null;

  const [products, accounts, config, connection, channels, realConversations] = await Promise.all([
    prisma.product.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        contentText: true,
        description: true,
        whatsappOpeningText: true,
        _count: { select: { channels: true } },
      },
    }),
    prisma.paymentAccount.count({ where: { businessId, active: true } }),
    prisma.businessConfig.findUnique({ where: { businessId }, select: { playbook: true } }),
    prisma.businessMetaConnection.findUnique({ where: { businessId }, select: { lastWebhookAt: true } }),
    prisma.channel.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.conversation.count({ where: { customer: { businessId, isTest: false } } }),
  ]);

  const first = products[0];
  const productHref = first ? `/manage/products/${first.id}` : "/manage/products";
  const playbook = (config?.playbook as Record<string, string> | null) ?? {};

  const steps: ChecklistStep[] = [
    {
      key: "product",
      title: "Add your first product",
      hint: "Its name and price.",
      done: products.length > 0,
      href: "/manage/products",
      action: "Add a product",
    },
    {
      key: "file",
      title: "Upload the ebook",
      hint: "The PDF customers receive. The AI reads it, so it can answer questions about the book.",
      done: products.some((p) => p.contentText?.trim()),
      href: productHref,
      action: "Upload the PDF",
    },
    {
      key: "copy",
      title: "Let the AI draft your sales copy",
      hint: "A description, likely customer questions and a WhatsApp pitch, written from the book. You approve it.",
      done: products.some((p) => p.description?.trim()),
      href: productHref,
      action: "Draft with AI",
    },
    {
      key: "bank",
      title: "Add the bank account customers pay into",
      hint: "The AI gives customers these details when they're ready to pay.",
      done: accounts > 0,
      href: "/manage/payment-accounts",
      action: "Add an account",
    },
    {
      key: "scripts",
      title: "Load the sales scripts",
      hint: "Proven messages for payment, delivery and thank-you, filled in with your bank details. Edit them any time.",
      done: Boolean(playbook.payment_instructions_primary?.trim() && playbook.payment_confirmation?.trim()),
      href: "/settings",
      action: "Load the Ebook seller scripts",
    },
    {
      key: "whatsapp",
      title: "Connect WhatsApp",
      hint: "Your own number, through your own Meta account. We do this with you on the setup call.",
      done: Boolean(connection?.lastWebhookAt) || (channels > 0 && realConversations > 0),
      href: "/settings/whatsapp/connect",
      action: "Open the connection wizard",
    },
    {
      key: "test",
      title: "Test your AI",
      hint: "Chat with it as a customer would, before anyone real does.",
      done: Boolean(business.testChatUsedAt),
      href: "/manage/test-chat",
      action: "Open the test chat",
    },
    {
      key: "live",
      title: "Share your link and get your first customer",
      hint: "Each product has a WhatsApp link for your Status, bio and adverts.",
      done: realConversations > 0,
      href: productHref,
      action: products.some((p) => p.whatsappOpeningText && p._count.channels > 0) ? "Get your link" : "Set up your link",
    },
  ];

  return { hidden: Boolean(business.setupChecklistHiddenAt), steps };
}
