import { prisma } from "@/lib/prisma";
import type { ConversationStage } from "@/generated/prisma/client";
import { runAIEmployeeTurn } from "@/lib/ai-runtime";
import { tryGreetingShortcut } from "@/lib/greeting-shortcut";
import { withCustomerLock } from "@/lib/customer-lock";
import { routeNewConversation } from "@/lib/product-routing";

// The test chat (v2, docs/V2_BUILD_PLAN.md Phase 2): a team member talks to
// their own AI as a customer would, before going live. Each member has one
// test customer per business, marked Customer.isTest, whose conversation
// runs through the real AI with the real settings, scripts and FAQ. What
// keeps it from reaching anyone: the "test-" number, which every WhatsApp
// sender refuses (src/lib/whatsapp-send.ts), and ActionContext.isTest, which
// stops follow-ups being queued (src/lib/actions.ts). Dashboard lists,
// counts and trends all filter isTest out.

const ENDED: ConversationStage[] = ["LOST_LEAD", "RESOLVED"];

const testPhone = (agentId: string) => `test-${agentId}`;

export async function getTestChat(businessId: string, agentId: string) {
  const customer = await prisma.customer.findUnique({
    where: { businessId_phoneNumber: { businessId, phoneNumber: testPhone(agentId) } },
  });
  if (!customer) return null;
  return prisma.conversation.findFirst({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
      events: {
        where: { type: { in: ["PRODUCT_ROUTED", "FOLLOWUP_SCHEDULED", "HUMAN_ASSIGNED", "PRODUCT_DELIVERED", "PAYMENT_ESCALATED"] } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * One customer message in the test chat, and the AI's whole reply to it.
 * `productId` only matters for the first message: it plays a customer
 * arriving on a number dedicated to that product. Without it the
 * conversation is routed the way a real one would be, from the opening
 * message, or left for the AI to find out.
 */
export async function sendTestMessage(input: {
  businessId: string;
  agentId: string;
  agentName: string;
  text: string;
  productId?: string | null;
}): Promise<void> {
  const { businessId, agentId, agentName, text } = input;

  const customer = await prisma.customer.upsert({
    where: { businessId_phoneNumber: { businessId, phoneNumber: testPhone(agentId) } },
    create: { businessId, phoneNumber: testPhone(agentId), name: `Test chat (${agentName})`, isTest: true },
    update: {},
  });
  // A real customer's row can never be taken over: only ever a test one.
  if (!customer.isTest) throw new Error("Test chat customer is not marked as a test");

  await withCustomerLock(customer.id, async () => {
    let conversation = await prisma.conversation.findFirst({
      where: { customerId: customer.id, NOT: { currentStage: { in: ENDED } } },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      const chosen = input.productId
        ? await prisma.product.findFirst({ where: { id: input.productId, businessId }, select: { id: true } })
        : null;
      const routed = await routeNewConversation({
        businessId,
        channelProductId: chosen?.id ?? null,
        firstMessageText: text,
      });
      conversation = await prisma.conversation.create({
        data: { customerId: customer.id, currentStage: "NEW_LEAD", productId: routed?.productId ?? null },
      });
      if (routed) {
        await prisma.event.create({ data: { conversationId: conversation.id, type: "PRODUCT_ROUTED", payload: routed } });
      }
    }

    await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: conversation.id, direction: "INBOUND", sender: "CUSTOMER", type: "TEXT", content: text },
      }),
      prisma.event.create({ data: { conversationId: conversation.id, type: "MESSAGE_RECEIVED", payload: { text, testChat: true } } }),
    ]);

    // As in ingest-message.ts, minus the debounce: the tester is waiting.
    if (await tryGreetingShortcut(conversation.id)) return;
    await runAIEmployeeTurn(conversation.id);
  });
}

/** Throws the test conversation away, so the next message starts a new lead. */
export async function resetTestChat(businessId: string, agentId: string): Promise<void> {
  await prisma.customer.deleteMany({ where: { businessId, phoneNumber: testPhone(agentId), isTest: true } });
}
