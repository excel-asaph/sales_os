/**
 * Exercises cohortProgression (src/lib/trends.ts) against hand-built cases.
 * No database, no network — run with `npx tsx scripts/check-cohort-progression.ts`.
 *
 * The cases that matter are the ones the old snapshot-based funnel got wrong:
 * a conversation escalated or opted out mid-pipeline still has to count at the
 * depth it actually reached, and the output has to stay monotonic so the
 * ratios between steps are real conversion rates.
 */
import type { ConversationStage } from "../src/generated/prisma/client";
import { cohortProgression } from "../src/lib/trends";

type Conv = { id: string; currentStage: ConversationStage };
type Ev = { conversationId: string | null; payload: unknown };

const stage = (id: string, s: ConversationStage): Conv => ({ id, currentStage: s });
const ev = (id: string, s: ConversationStage): Ev => ({ conversationId: id, payload: { newStage: s } });

let failures = 0;
function check(name: string, actual: number[], expected: number[]) {
  const ok = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) console.log(`        expected [${expected}]  got [${actual}]`);
}

const counts = (convs: Conv[], evs: Ev[] = []) => cohortProgression(convs, evs).map((s) => s.count);

// Order of the reported steps: product, payment, delivered, completed.

check("empty cohort", counts([]), [0, 0, 0, 0]);

check("a lead that never progressed counts at no milestone", counts([stage("a", "NEW_LEAD")]), [0, 0, 0, 0]);

check(
  "a completed sale counts at every milestone below it",
  counts([stage("a", "SALE_COMPLETED")]),
  [1, 1, 1, 1]
);

check(
  "current stage alone places a mid-pipeline conversation correctly",
  counts([stage("a", "WAITING_FOR_PAYMENT")]),
  [1, 1, 0, 0]
);

// The case the snapshot funnel could not represent at all.
check(
  "an escalated conversation is credited with the depth it reached",
  counts([stage("a", "HUMAN_ASSIGNED")], [ev("a", "PRODUCT_SELECTED"), ev("a", "WAITING_FOR_PAYMENT")]),
  [1, 1, 0, 0]
);

check(
  "an opted-out lead that had reached payment still counts there",
  counts([stage("a", "LOST_LEAD")], [ev("a", "WAITING_FOR_PAYMENT")]),
  [1, 1, 0, 0]
);

check(
  "a lost lead with no stage history counts at no milestone",
  counts([stage("a", "LOST_LEAD")]),
  [0, 0, 0, 0]
);

check(
  "events never drag a conversation backwards",
  counts([stage("a", "SALE_COMPLETED")], [ev("a", "NEW_LEAD"), ev("a", "PRODUCT_SELECTED")]),
  [1, 1, 1, 1]
);

check(
  "events for conversations outside the cohort are ignored",
  counts([stage("a", "NEW_LEAD")], [ev("b", "SALE_COMPLETED")]),
  [0, 0, 0, 0]
);

check("malformed and null event payloads are skipped", counts([stage("a", "NEW_LEAD")], [
  { conversationId: "a", payload: null },
  { conversationId: "a", payload: {} },
  { conversationId: "a", payload: { newStage: "NOT_A_REAL_STAGE" } },
  { conversationId: null, payload: { newStage: "SALE_COMPLETED" } },
]), [0, 0, 0, 0]);

const mixed = counts(
  [
    stage("a", "SALE_COMPLETED"),
    stage("b", "PRODUCT_DELIVERED"),
    stage("c", "WAITING_FOR_PAYMENT"),
    stage("d", "HUMAN_ASSIGNED"),
    stage("e", "NEW_LEAD"),
    stage("f", "LOST_LEAD"),
  ],
  [ev("d", "PRODUCT_SELECTED")]
);
check("mixed cohort", mixed, [4, 3, 2, 1]);

const monotonic = mixed.every((v, i) => i === 0 || v <= mixed[i - 1]);
check("output is monotonically non-increasing", [monotonic ? 1 : 0], [1]);

console.log(failures === 0 ? "\nAll cohort progression checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
