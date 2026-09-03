import type { ConversationStage } from "@/generated/prisma/client";

export const HUMAN_STAGES: ConversationStage[] = ["HUMAN_REVIEW_REQUIRED", "HUMAN_ASSIGNED"];
export const TERMINAL_STAGES: ConversationStage[] = ["SALE_COMPLETED", "LOST_LEAD", "RESOLVED"];
export const EXCEPTION_STAGES: ConversationStage[] = [...HUMAN_STAGES, "LOST_LEAD"];

const STAGE_STYLES: Partial<Record<ConversationStage, string>> = {
  HUMAN_REVIEW_REQUIRED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  HUMAN_ASSIGNED: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  WAITING_FOR_PAYMENT: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  RECEIPT_RECEIVED: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  FOLLOWUP_DAY_1: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  FOLLOWUP_DAY_3: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  FOLLOWUP_DAY_7: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  SALE_COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  PRODUCT_DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  PAYMENT_VERIFIED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  LOST_LEAD: "bg-muted text-muted-foreground",
};

export function stageStyle(stage: ConversationStage): string {
  return STAGE_STYLES[stage] ?? "bg-secondary text-secondary-foreground";
}

// Milestones for the Review page's visual pipeline tracker. The raw
// ConversationStage enum has 18 values (see prisma/schema.prisma) — far
// too granular for a linear tracker — so many stages collapse into one
// milestone here. HUMAN_REVIEW_REQUIRED/HUMAN_ASSIGNED/LOST_LEAD are
// deliberately excluded: escalating overwrites currentStage directly (see
// src/lib/actions.ts's escalate_to_human), so there's no reliable way to
// know how far a conversation actually got before being escalated — those
// states are rendered as a status banner instead of forced into a
// pipeline position that might be fabricated.
export const PIPELINE_MILESTONES = [
  {
    key: "lead",
    label: "Lead",
    stages: ["NEW_LEAD", "GREETING_SENT", "INTRODUCTION_COMPLETED", "INTEREST_CONFIRMED"],
  },
  {
    key: "product",
    label: "Product selected",
    stages: ["PRODUCT_SELECTED", "WAITING_FOR_DECISION"],
  },
  {
    key: "payment",
    label: "Payment",
    stages: [
      "WAITING_FOR_PAYMENT",
      "RECEIPT_RECEIVED",
      "FOLLOWUP_DAY_1",
      "FOLLOWUP_DAY_3",
      "FOLLOWUP_DAY_7",
    ],
  },
  {
    key: "delivered",
    label: "Delivered",
    stages: ["PAYMENT_VERIFIED", "PRODUCT_DELIVERED"],
  },
  {
    key: "completed",
    label: "Completed",
    stages: ["SALE_COMPLETED", "RESOLVED"],
  },
] as const satisfies ReadonlyArray<{ key: string; label: string; stages: readonly string[] }>;

// null for stages that aren't on the pipeline at all (LOST_LEAD,
// HUMAN_REVIEW_REQUIRED, HUMAN_ASSIGNED). milestoneIndexForStage below
// collapses those to 0, which is the right default for a tracker that has
// to render *something*, but reads as "reached Lead" to anything doing
// arithmetic — see getCohortProgression in trends.ts, which needs to tell
// "never got past Lead" apart from "was escalated out of the pipeline".
export function milestoneIndexOrNull(stage: ConversationStage): number | null {
  const idx = PIPELINE_MILESTONES.findIndex((m) => (m.stages as readonly string[]).includes(stage));
  return idx === -1 ? null : idx;
}

export function milestoneIndexForStage(stage: ConversationStage): number {
  return milestoneIndexOrNull(stage) ?? 0;
}
