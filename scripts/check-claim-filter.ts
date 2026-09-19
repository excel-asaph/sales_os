import { findClaims } from "@/lib/claim-filter";

/**
 * Exercises the claim filter before it is ever allowed to block anything.
 *
 * The cases that matter are the false positives. A one-off audit of 719 real
 * outbound messages found four claim-vocabulary matches and every one was the
 * AI *refusing* to make a claim. A filter that suppresses those would hide the
 * evidence that the system is behaving, so those exact messages are the first
 * fixtures here.
 *
 * Run with: npx tsx scripts/check-claim-filter.ts
 */
const MUST_PASS: [string, string][] = [
  // Verbatim from the production audit — all four were refusals.
  ["audit refusal 1", "I can't promise a '100%' medical guarantee — no ebook can replace personal medical advice"],
  ["audit refusal 2", "it's best to discuss that with your doctor or health provider"],
  ["audit refusal 3", "for your health it's best to also confirm with your doctor"],
  ["audit refusal 4", "I cannot guarantee it will cure anything — please speak to your doctor"],
  // Flagged in production on 2026-09-15, one day after shipping. A refusal,
  // and the reason the fixed 60-character lookback had to become
  // sentence-scoped: "cannot" sits 66 characters before "eliminate".
  ["production false positive", "However, we cannot guarantee that it will completely cure or permanently eliminate high blood sugar. If you have high blood sugar or are currently on medication, please speak with your doctor."],
  ["long compound refusal", "We do not claim this will heal, reverse, permanently eliminate or in any way cure your condition."],
  // Ordinary sales and support traffic that happens to brush the vocabulary.
  ["plain pitch", "The ebook costs ₦10,000 and is delivered to your WhatsApp immediately."],
  ["support answer", "On Day 3 take cucumber, half a cup sliced, between your main meals."],
  ["negated claim", "This is not a cure and it will not reverse anything on its own."],
  ["polite decline", "I don't want to guarantee results — everyone's body responds differently."],
  ["payment chase", "We are still waiting for your payment. Kindly complete it when you see this."],
  // The standing answer to "can I take my drugs along the recipes?" (hard rule
  // 9 in system-prompt.ts). It goes out on every medication question, so if
  // anyone ever rewords it into something the filter would withhold, that has
  // to fail here rather than in front of a customer.
  ["medication answer", "Please don't stop or change any medication your doctor prescribed. The plan is food, not a replacement for your treatment. Since your doctor knows exactly what you're taking, mention the routine to them before you start."],
];

const MUST_FLAG: [string, string][] = [
  // Straight from the ebook's own text — the sentences the AI must not repeat.
  ["ebook: reversible", "Nerve damage from diabetes is reversible in early stages."],
  ["ebook: the cure", "Consistency is the cure."],
  ["ebook: flush", "This combination flushes toxins from the kidneys."],
  ["ebook: day title", "Day 8 is the Deep Cellular Cleanse and Kidney Protection day."],
  // The shapes a model drifts into under pressure from a customer.
  ["drift: promise", "Yes, this will heal your diabetes completely within 10 days."],
  ["drift: permanence", "The results are permanent once you finish the routine."],
  // A negation earlier in the sentence must not shield a claim after "but".
  ["drift: negation then but", "I can't promise much, but this will completely cure your diabetes."],
];

let failures = 0;

console.log("MUST NOT FLAG (false positives are the real risk)\n");
for (const [name, text] of MUST_PASS) {
  const hits = findClaims(text);
  const ok = hits.length === 0;
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) console.log(`          flagged: ${hits.map((h) => h.term).join(", ")}`);
}

console.log("\nMUST FLAG (real claims, straight from the book)\n");
for (const [name, text] of MUST_FLAG) {
  const hits = findClaims(text);
  const ok = hits.length > 0;
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok ? `  → ${hits.map((h) => h.term).join(", ")}` : ""}`);
}

console.log(
  failures === 0
    ? "\nAll checks passed. Still ships in shadow mode — fixtures are not real traffic."
    : `\n${failures} check(s) FAILED.`
);
process.exit(failures === 0 ? 0 : 1);
