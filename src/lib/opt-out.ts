import { prisma } from "@/lib/prisma";
import { addCustomerTag } from "@/lib/customer-tags";
import { cancelPendingFollowups } from "@/lib/followups";

/**
 * The tag an explicit opt-out writes. Deliberately NOT "Uninterested":
 * that one means "went quiet, or softly declined", and the system prompt
 * treats a later message from such a customer as them reopening the
 * conversation themselves. An explicit "stop" is categorically stronger —
 * WhatsApp's Business Messaging Policy requires respecting it outright
 * ("You must respect all requests... to block, discontinue, or otherwise
 * opt out of communications from you") — so it gets its own tag and its own
 * unconditional guard in createFollowup (src/lib/actions.ts).
 */
export const OPTED_OUT_TAG = "Opted out";

// Only a message that is essentially NOTHING BUT the opt-out counts.
//
// Substring matching is not safe here, and production proved it: of 467
// real inbound messages, a naive /\bstop\b/ matched exactly one —
// "…I am normally urinating frequently can it stop lf am using your
// dia[betes fix]" — an interested customer asking whether the product helps
// with a symptom. Treating that as an opt-out would have silently tagged a
// live lead and stopped ever messaging them. The same 467 messages produce
// zero matches against the list below.
const OPT_OUT_PHRASES = new Set([
  "stop",
  "stop it",
  "stop messaging",
  "stop messaging me",
  "stop sending",
  "stop sending messages",
  "stop sending me messages",
  "stop texting me",
  "unsubscribe",
  "opt out",
  "optout",
  "remove me",
  "remove me from your list",
  "delete my number",
  "leave me alone",
  "dont message me",
  "do not message me",
  "dont message me again",
  "do not message me again",
  "no more messages",
]);

/**
 * True only when the whole message is an opt-out instruction. Tolerates
 * case, surrounding punctuation/whitespace, a leading or trailing "please",
 * and the curly apostrophe WhatsApp inserts — but never matches the phrase
 * buried inside a longer sentence.
 */
export function isOptOutRequest(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/'/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^please\s+/, "")
    .replace(/\s+please$/, "")
    .trim();
  return OPT_OUT_PHRASES.has(normalized);
}

/**
 * Records the opt-out in code, before and independently of any AI turn.
 *
 * The AI is already told to treat "stop messaging me" as an outright
 * decline (system-prompt.ts), and on a good day it does. But that depends
 * on the model running and reading it correctly — and it does nothing when
 * the model is unavailable (an expired ANTHROPIC_API_KEY took every turn
 * down for hours on 2026-09-03), when the conversation is parked on a human
 * stage where the runtime no-ops, or when it simply misreads a terse
 * "stop". Since the re-engagement template invites customers to reply STOP,
 * missing one is worse than never offering it.
 *
 * Same principle createFollowup already applies to its own guard: a
 * compliance-sensitive rule shouldn't depend on the model remembering it.
 */
export async function applyOptOut(conversationId: string): Promise<void> {
  await cancelPendingFollowups(conversationId, "customer_opted_out");

  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversationId },
      data: { currentStage: "LOST_LEAD" },
    }),
    prisma.event.create({
      data: { conversationId, type: "OPT_OUT_RECEIVED", payload: { source: "inbound_message" } },
    }),
  ]);

  await addCustomerTag(conversationId, OPTED_OUT_TAG);
}
