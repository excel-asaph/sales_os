import { prisma } from "@/lib/prisma";

/**
 * Deterministic check on outbound message text for the health-claim vocabulary
 * Meta's Health & Wellness advertising standard names explicitly
 * (docs/META_WHATSAPP_COMPLIANCE.md).
 *
 * Exists because the system prompt alone is not a control. The same argument
 * createFollowup makes about opt-out applies here: a compliance-sensitive rule
 * shouldn't depend on the model remembering it every turn — and this one gets
 * harder to remember the moment the product's own text is in the prompt, since
 * that text contains 39 instances of exactly this vocabulary.
 *
 * SHADOW MODE (the default, and how this ships). A hit is recorded and the
 * message is sent anyway. Nothing about the customer's experience changes.
 * That is deliberate: the one-off audit of 719 real outbound messages found
 * four matches and **all four were the AI refusing to make a claim** —
 *
 *     "I can't promise a '100%' medical guarantee — no ebook can replace
 *      personal medical advice"
 *
 * — so a filter that blocks on a bare word list would suppress precisely the
 * messages that prove the system is behaving. The negation check below is
 * meant to catch that, but "meant to" is not evidence. Shadow mode produces
 * the evidence, the same way the opt-out matcher was validated against 469
 * real inbound messages before it was allowed to cancel anything.
 *
 * Flip CLAIM_FILTER_ENFORCE to true only once the logged hits show the
 * negation handling actually holds on this business's real traffic.
 */
export const CLAIM_FILTER_ENFORCE = false;

/**
 * Verbatim from the Health & Wellness standard plus the ad-copy post-mortem:
 * curing/reversing a named condition, detox language, permanence, and
 * guarantees. Matched on word boundaries — never substring, which is the
 * mistake that made a naive opt-out matcher fire on "can it stop".
 */
const CLAIM_TERMS = [
  "cure", "cures", "cured",
  "reverse", "reverses", "reversed", "reversing", "reversal", "reversible",
  "heal", "heals", "healed", "healing",
  "eliminate", "eliminates", "eliminated",
  "permanent", "permanently",
  "guarantee", "guarantees", "guaranteed",
  "detox", "detoxes", "detoxify",
  "cleanse", "cleanses", "cleansing",
  "flush", "flushes",
  "miracle", "miraculous",
];

/**
 * A claim word inside a refusal is the opposite of a violation. These are the
 * shapes the audited refusals actually took, plus the obvious negations.
 */
const NEGATORS = [
  "can't", "cannot", "can not", "won't", "will not", "don't", "do not",
  "doesn't", "does not", "never", "no ebook", "not a", "isn't", "is not",
  "unable to", "shouldn't", "should not", "rather than", "instead of",
];

const NEGATION_WINDOW = 60; // characters before the hit

export interface ClaimHit {
  term: string;
  snippet: string;
}

function windowBefore(text: string, at: number): string {
  return text.slice(Math.max(0, at - NEGATION_WINDOW), at).toLowerCase();
}

/**
 * Returns every claim term present that is NOT inside a refusal. Empty array
 * means the message is clean.
 */
export function findClaims(text: string): ClaimHit[] {
  const hits: ClaimHit[] = [];
  const seen = new Set<string>();

  for (const term of CLAIM_TERMS) {
    const re = new RegExp(`\\b${term}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const before = windowBefore(text, match.index);
      if (NEGATORS.some((n) => before.includes(n))) continue;
      if (seen.has(term)) break;
      seen.add(term);
      hits.push({
        term,
        snippet: text
          .slice(Math.max(0, match.index - 70), match.index + term.length + 70)
          .replace(/\s+/g, " ")
          .trim(),
      });
      break;
    }
  }
  return hits;
}

/**
 * Records a hit so it can be reviewed on Trends. Never throws: a logging
 * failure must not stop a customer's message going out.
 */
export async function recordClaimHits(
  conversationId: string,
  hits: ClaimHit[],
  sent: boolean
): Promise<void> {
  if (hits.length === 0) return;
  try {
    await prisma.event.create({
      data: {
        conversationId,
        type: "CLAIM_FILTER_HIT",
        payload: {
          terms: hits.map((h) => h.term),
          snippets: hits.map((h) => h.snippet),
          // false once CLAIM_FILTER_ENFORCE flips — that difference is the
          // whole point of the Trends card.
          sentAnyway: sent,
          enforcing: CLAIM_FILTER_ENFORCE,
        },
      },
    });
  } catch (error) {
    console.error("[claim-filter] could not record hit", error);
  }
}
