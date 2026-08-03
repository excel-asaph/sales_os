import { prisma } from "@/lib/prisma";

// Shared by both the AI's tag_customer tool (src/lib/actions.ts) and
// platform-driven tagging (the follow-up worker auto-tagging
// "Uninterested" on sequence exhaustion) — one place writing
// Customer.tags so both paths can't drift apart on how it's done.
export async function addCustomerTag(conversationId: string, tag: string): Promise<string[]> {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    select: { customerId: true },
  });
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: conversation.customerId } });
  const existingTags = Array.isArray(customer.tags) ? (customer.tags as string[]) : [];
  if (existingTags.includes(tag)) return existingTags;

  const tags = [...existingTags, tag];
  await prisma.$transaction([
    prisma.customer.update({ where: { id: customer.id }, data: { tags } }),
    prisma.event.create({ data: { conversationId, type: "TAG_APPLIED", payload: { tag } } }),
  ]);
  return tags;
}
