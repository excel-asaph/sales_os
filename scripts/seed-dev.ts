import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// Made-up data for building and testing v2 on this computer
// (docs/V2_LOCAL_DEV.md). Nothing here is a real customer: every phone
// number starts 2340000, which no Nigerian network issues, so even a
// follow-up the worker tries to send can never reach a real person.
//
//   npm run seed:dev            add the demo business (once)
//   npm run seed:dev -- --reset delete the demo business and add it again
//
// Refuses to run against anything but a database on this machine, so it
// can never write into production by accident.

const DEMO_NAME = "Demo Ebooks (test data)";
const ADMIN_LOGIN = "admin@antflow.test";
const ADMIN_PASSWORD = "antflow-dev";

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.match(/@([^:/?]+)/)?.[1] ?? "";
  if (!["localhost", "127.0.0.1"].includes(host)) {
    console.error(`Refusing to seed: DATABASE_URL points at "${host || "nothing"}", not this computer.`);
    process.exit(1);
  }
}

const hours = (h: number) => new Date(Date.now() + h * 3600_000);

async function main() {
  assertLocalDatabase();

  const existing = await prisma.business.findFirst({ where: { name: DEMO_NAME } });
  if (existing && !process.argv.includes("--reset")) {
    console.log(`"${DEMO_NAME}" already exists (${existing.id}). Use --reset to rebuild it.`);
    return;
  }
  if (existing) await prisma.business.delete({ where: { id: existing.id } });

  const business = await prisma.business.create({
    data: {
      name: DEMO_NAME,
      // The test Meta App's number, if it has been set up locally.
      whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
      config: {
        create: {
          deliverBeforePayment: false,
          maxFollowups: 5,
          greetingTemplate: "Hello! Thanks for reaching out. Which of our books are you interested in?",
          playbook: {
            payment_instructions_primary:
              "You can pay into the account below, then send a screenshot of the receipt here and I'll send your book straight away.",
            payment_confirmation: "Payment received, thank you! Here is your book.",
            thank_you_message: "Enjoy the book, and message me here any time you have a question.",
          },
        },
      },
      paymentAccounts: {
        create: [{ bankName: "Demo Bank", accountNumber: "0000000000", accountName: "Demo Ebooks Ltd" }],
      },
      faqEntries: {
        create: [
          { order: 1, question: "How do I get the book after paying?", answer: "It's sent to you here on WhatsApp as a PDF as soon as your payment is confirmed." },
          { order: 2, question: "Can I read it on my phone?", answer: "Yes. It's a PDF, so it opens on any phone." },
          { order: 3, question: "Is this a replacement for my medicine?", answer: "No. Keep taking what your doctor prescribed; the book works alongside it." },
          { order: 4, question: "Do you have other books?", answer: "Yes, we have two. Tell me what you're looking for and I'll point you to the right one." },
        ],
      },
    },
  });

  const [diabetes, fatSwitch] = await Promise.all([
    prisma.product.create({
      data: {
        businessId: business.id, name: "Diabetes Fix (demo)", price: 10000, currency: "NGN",
        description: "A demo ebook about managing blood sugar with Nigerian food.", format: "PDF", category: "Health",
      },
    }),
    prisma.product.create({
      data: {
        businessId: business.id, name: "The 10X Fat-Burning Switch (demo)", price: 10000, currency: "NGN",
        description: "A demo ebook: ten food swaps and a 90-day weight-loss plan.", format: "PDF", category: "Health",
      },
    }),
  ]);
  const account = await prisma.paymentAccount.findFirstOrThrow({ where: { businessId: business.id } });

  await prisma.humanAgent.create({
    data: {
      businessId: business.id, name: "Demo Admin", contact: ADMIN_LOGIN,
      passwordHash: await hashPassword(ADMIN_PASSWORD), isAdmin: true,
    },
  });

  // Six customers, one at each interesting point in the sales flow.
  const people = [
    { name: "Ada (demo)", stage: "NEW_LEAD", product: diabetes },
    { name: "Bola (demo)", stage: "WAITING_FOR_PAYMENT", product: diabetes },
    { name: "Chidi (demo)", stage: "RECEIPT_RECEIVED", product: fatSwitch },
    { name: "Dayo (demo)", stage: "SALE_COMPLETED", product: diabetes },
    { name: "Efe (demo)", stage: "FOLLOWUP_DAY_3", product: fatSwitch },
    { name: "Funmi (demo)", stage: "HUMAN_REVIEW_REQUIRED", product: diabetes },
  ] as const;

  for (const [i, p] of people.entries()) {
    const customer = await prisma.customer.create({
      data: { businessId: business.id, phoneNumber: `23400000000${i + 1}`, name: p.name, country: "NG" },
    });
    const conversation = await prisma.conversation.create({
      data: {
        customerId: customer.id,
        currentStage: p.stage,
        whatsappPhoneNumberId: business.whatsappPhoneNumberId,
        summary: `Demo conversation about ${p.product.name}.`,
      },
    });
    const say = (sender: "CUSTOMER" | "AI", content: string) =>
      prisma.message.create({
        data: {
          conversationId: conversation.id, content, sender,
          direction: sender === "CUSTOMER" ? "INBOUND" : "OUTBOUND",
        },
      });

    await say("CUSTOMER", `Hello, I saw your ad for ${p.product.name}. How much is it?`);
    if (p.stage === "NEW_LEAD") continue;
    await say("AI", `It's ₦10,000, and you get the PDF here on WhatsApp as soon as you pay.`);
    await prisma.conversationFact.create({
      data: { conversationId: conversation.id, kind: "INTENT", payload: { product: p.product.name }, confidence: 0.9 },
    });

    if (p.stage === "FOLLOWUP_DAY_3") {
      await prisma.conversationFact.create({
        data: { conversationId: conversation.id, kind: "OBJECTION", payload: { text: "Too expensive right now" }, confidence: 0.8 },
      });
      await prisma.followup.create({
        data: { conversationId: conversation.id, step: 3, message: "Just checking in about the book.", scheduledFor: hours(72) },
      });
      continue;
    }
    if (p.stage === "HUMAN_REVIEW_REQUIRED") {
      await say("CUSTOMER", "I paid yesterday but I haven't received anything. I want a refund.");
      continue;
    }

    await say("CUSTOMER", "Okay, send me the account details.");
    await say("AI", "Demo Bank, 0000000000, Demo Ebooks Ltd. Send the receipt here when you've paid.");
    if (p.stage === "WAITING_FOR_PAYMENT") continue;

    const verified = p.stage === "SALE_COMPLETED";
    await prisma.order.create({
      data: {
        conversationId: conversation.id, productId: p.product.id, paymentAccountId: account.id,
        expectedAmount: 10000, extractedAmount: 10000, extractedBank: "Demo Bank",
        verificationConfidence: verified ? 0.97 : null,
        status: verified ? "VERIFIED" : "PENDING", verifiedAt: verified ? new Date() : null,
      },
    });
    if (verified) await say("AI", "Payment received, thank you! Here is your book.");
  }

  console.log(`Seeded "${DEMO_NAME}" (${business.id}): 2 products, ${people.length} customers.`);
  console.log(`  Log in with ${ADMIN_LOGIN} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
