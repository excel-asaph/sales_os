import { prisma } from "@/lib/prisma";
import { executeAction, type ActionContext } from "@/lib/actions";
import { getBusinessConfig } from "@/lib/knowledge";

// The opening turn is the one turn where the AI has no information to
// reason about: the customer has just arrived, nothing is known about them,
// and the reply is this business's standard pitch either way. Measured
// against production on 2026-09-03 (155 conversations): 152 opening
// messages — 98.1% — were byte-identical, and 95.6% of opening turns took
// one of two identical action shapes (pitch + product fact + stage +
// follow-up, or the same minus the fact).
//
// So this doesn't reimplement anything the AI does; it calls the SAME four
// Action Contract handlers (src/lib/actions.ts) the model would have
// called, with the arguments it reliably picks anyway. Every rule embedded
// in those handlers still applies untouched — createFollowup's paused-
// business kill switch, its refusal to nudge a customer already tagged
// "Uninterested", its no-op when a follow-up is already active.
//
// Deliberately NOT extended to follow-ups: the same audit found follow-up
// text genuinely varied (49 distinct texts across 99 sends, the most common
// only 13.1%), referencing what each customer actually said. Those stay
// AI-composed at send time. See docs/GREETING_SHORTCUT.md.

/** Stage/step names kept in one place so the revert is a single deletion. */
const GREETING_STAGE = "GREETING_SENT" as const;
const FIRST_FOLLOWUP_HOURS = 1;

/**
 * True only for a message type carrying nothing the pitch can answer. An
 * image or PDF opener is exactly where the standard pitch is wrong (one
 * real customer opened by sending a "10 Days Diabetes Routine" PDF, which
 * needed a real reply), so anything non-text falls through to the model.
 */
function isPlainTextOpener(type: string): boolean {
  return type === "TEXT";
}

/**
 * Returns true if it fully handled the turn — the caller should then skip
 * the AI entirely. Returns false for anything it isn't certain about, in
 * which case the normal AI turn runs and behaviour is unchanged.
 */
export async function tryGreetingShortcut(conversationId: string): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      customer: {
        select: {
          id: true,
          businessId: true,
          phoneNumber: true,
          _count: { select: { conversations: true } },
        },
      },
      messages: { orderBy: { createdAt: "asc" }, select: { direction: true, type: true } },
    },
  });
  if (!conversation) return false;

  // Only a genuinely first-time lead. Someone with earlier conversations
  // arrives with history the cold pitch ignores — one real customer opened
  // a second conversation with "I'm sorry for not going ahead", where the
  // model correctly answered as though to someone returning rather than
  // re-pitching from scratch.
  if (conversation.customer._count.conversations > 1) return false;

  // Only the true opening turn: still NEW_LEAD, and nothing has ever been
  // sent back. Anything else has history the pitch can't account for.
  if (conversation.currentStage !== "NEW_LEAD") return false;
  if (conversation.messages.some((m) => m.direction === "OUTBOUND")) return false;

  // Attachments and voice notes go to the model — see isPlainTextOpener.
  const inbound = conversation.messages.filter((m) => m.direction === "INBOUND");
  if (inbound.length === 0) return false;
  if (!inbound.every((m) => isPlainTextOpener(m.type))) return false;

  const businessId = conversation.customer.businessId;
  const config = await getBusinessConfig(businessId);
  const playbook = (config.playbook as Record<string, string> | null) ?? {};

  // Whichever pitch matches this business's payment flow — the same key the
  // model is told to send verbatim rather than retype (system-prompt.ts
  // rule 5), so the customer receives exactly what they receive today.
  const pitchKey = config.deliverBeforePayment ? "delivery_first_pitch" : "payment_first_pitch";
  if (!playbook[pitchKey]?.trim()) return false;

  // Recording "they want product X" is only deterministic while there's one
  // thing to want. With a catalogue that's a real judgment about what the
  // customer asked for, and belongs to the model.
  const products = await prisma.product.findMany({
    where: { businessId, available: true },
    select: { id: true, name: true, price: true, currency: true },
  });
  if (products.length !== 1) return false;
  const product = products[0];

  const ctx: ActionContext = {
    conversationId,
    businessId,
    customerPhoneNumber: conversation.customer.phoneNumber,
    whatsappPhoneNumberId: conversation.whatsappPhoneNumberId ?? "",
  };

  // Reply first, bookkeeping after — same order the model's own turns show,
  // and it keeps the customer's wait as short as possible.
  const sent = (await executeAction("send_template_message", { template_key: pitchKey }, ctx)) as {
    sent?: boolean;
  };
  if (!sent?.sent) {
    // Nothing went out. Fall through so the model gets its normal attempt
    // rather than leaving the customer in silence on a failed send.
    console.warn(`[greeting-shortcut] template send failed on ${conversationId}; falling back to the AI`);
    return false;
  }

  await executeAction(
    "record_fact",
    {
      kind: "ENTITY",
      key: "selected_product",
      value: `${product.name}, price ${product.price} ${product.currency}, product_id ${product.id}`,
    },
    ctx
  );

  await executeAction(
    "update_stage",
    {
      new_stage: GREETING_STAGE,
      objective: `Awaiting the customer's go-ahead to proceed with ${product.name}`,
    },
    ctx
  );

  // The stored text is only ever a fallback for when composing fresh fails
  // at send time (followup-worker.ts's catch) — the real check-in is still
  // written by the AI when it fires. Real text, not a playbook key: 25 rows
  // in production stored the bare key "payment_followup", which that catch
  // would have sent to a customer verbatim.
  await executeAction(
    "create_followup",
    {
      hours: FIRST_FOLLOWUP_HOURS,
      message: `Hi, just checking in — would you like us to go ahead and send the ${product.name}?`,
      reason: "GENERAL",
    },
    ctx
  );

  console.log(`[greeting-shortcut] handled opening turn on ${conversationId} with no AI call`);
  return true;
}
