import { prisma } from "@/lib/prisma";

// How many recent messages to show verbatim, as a cheap safety net
// alongside the explicit record_fact tool — not a substitute for it. The
// AI is still expected to persist anything it needs beyond this window
// via record_fact/update_stage, per PRD 6.6 (reason over structured
// state, not by re-reading a growing transcript).
const RECENT_MESSAGE_WINDOW = 8;

/**
 * Conversation Brain (PRD Ch 6): the structured state the AI reasons over,
 * not the raw transcript. A short recent-message window plus this
 * structured summary go to the model — see ARCHITECTURE.md §7.1.
 */
export async function loadConversationBrain(conversationId: string) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      customer: true,
      facts: { orderBy: { createdAt: "desc" }, take: 20 },
      messages: { orderBy: { createdAt: "desc" }, take: RECENT_MESSAGE_WINDOW },
    },
  });

  const unresolvedObjections = conversation.facts.filter(
    (f) => f.kind === "OBJECTION" && !f.resolved
  );
  const outstandingTasks = conversation.facts.filter((f) => f.kind === "TASK" && !f.resolved);
  const entities = conversation.facts.filter((f) => f.kind === "ENTITY");

  return {
    customer: {
      name: conversation.customer.name,
      phoneNumber: conversation.customer.phoneNumber,
      returningCustomer: conversation.customer.returningCustomer,
      lifetimePurchases: conversation.customer.lifetimePurchases,
      preferredLanguage: conversation.customer.preferredLanguage,
    },
    currentStage: conversation.currentStage,
    currentObjective: conversation.currentObjective,
    confidence: conversation.confidence,
    unresolvedObjections: unresolvedObjections.map((f) => f.payload),
    outstandingTasks: outstandingTasks.map((f) => f.payload),
    extractedEntities: entities.map((f) => f.payload),
    // messages were fetched newest-first; reverse for chronological display
    recentMessages: [...conversation.messages].reverse(),
  };
}

/** Renders the Conversation Brain as a compact text block for the prompt. */
export function renderConversationBrain(
  brain: Awaited<ReturnType<typeof loadConversationBrain>>
): string {
  const lines: string[] = [];
  lines.push(`Customer: ${brain.customer.name ?? "unknown name"} (${brain.customer.phoneNumber})`);
  lines.push(
    `Returning customer: ${brain.customer.returningCustomer ? "yes" : "no"} (${brain.customer.lifetimePurchases} previous purchases)`
  );
  if (brain.customer.preferredLanguage) {
    lines.push(`Preferred language: ${brain.customer.preferredLanguage}`);
  }
  lines.push(`Current stage: ${brain.currentStage}`);
  if (brain.currentObjective) lines.push(`Current objective: ${brain.currentObjective}`);
  if (brain.unresolvedObjections.length > 0) {
    lines.push(`Unresolved objections: ${JSON.stringify(brain.unresolvedObjections)}`);
  }
  if (brain.outstandingTasks.length > 0) {
    lines.push(`Outstanding tasks: ${JSON.stringify(brain.outstandingTasks)}`);
  }
  if (brain.extractedEntities.length > 0) {
    lines.push(`Known facts: ${JSON.stringify(brain.extractedEntities)}`);
  }
  if (brain.recentMessages.length > 0) {
    lines.push("");
    lines.push(`Recent messages (oldest first; use record_fact/update_stage to persist anything beyond this window):`);
    for (const m of brain.recentMessages) {
      const speaker = m.sender === "CUSTOMER" ? "Customer" : m.sender === "AI" ? "You (AI)" : "Human agent";
      lines.push(`${speaker} (${m.type}): ${m.content ?? "(no text content)"}`);
    }
  }
  return lines.join("\n");
}
