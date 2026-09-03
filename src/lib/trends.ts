import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { Prisma, type ConversationStage } from "@/generated/prisma/client";
import { PIPELINE_MILESTONES, milestoneIndexForStage, milestoneIndexOrNull } from "@/lib/stage-display";
import { claude, CLAUDE_MODEL } from "@/lib/claude";

// Trends is the one page with enough real aggregation logic across several
// panels to be worth its own lib file, unlike Dashboard/Home which compute
// inline in the page — a deliberate, small deviation from that convention,
// not an oversight.

export interface FunnelBucket {
  key: string;
  label: string;
  count: number;
}

export interface FunnelData {
  milestones: FunnelBucket[];
  // LOST_LEAD / HUMAN_REVIEW_REQUIRED / HUMAN_ASSIGNED — deliberately kept
  // out of the milestone bars, same reasoning as PIPELINE_MILESTONES itself
  // (stage-display.ts): escalating overwrites currentStage directly, so
  // there's no reliable "how far did they get" position to plot these at.
  exceptions: FunnelBucket[];
  total: number;
}

const EXCEPTION_LABELS: Partial<Record<ConversationStage, string>> = {
  LOST_LEAD: "Lost lead",
  HUMAN_REVIEW_REQUIRED: "Needs a human",
  HUMAN_ASSIGNED: "Assigned to a human",
};

export async function getFunnelBreakdown(businessId: string, effectiveNumber?: string): Promise<FunnelData> {
  const grouped = await prisma.conversation.groupBy({
    by: ["currentStage"],
    where: {
      customer: { businessId },
      ...(effectiveNumber ? { whatsappPhoneNumberId: effectiveNumber } : {}),
    },
    _count: true,
  });

  const milestones: FunnelBucket[] = PIPELINE_MILESTONES.map((m) => ({ key: m.key, label: m.label, count: 0 }));
  const exceptions: FunnelBucket[] = Object.entries(EXCEPTION_LABELS).map(([key, label]) => ({
    key,
    label: label!,
    count: 0,
  }));

  let total = 0;
  for (const row of grouped) {
    total += row._count;
    const exceptionBucket = exceptions.find((e) => e.key === row.currentStage);
    if (exceptionBucket) {
      exceptionBucket.count += row._count;
      continue;
    }
    milestones[milestoneIndexForStage(row.currentStage)].count += row._count;
  }

  return { milestones, exceptions, total };
}

export interface FollowupStepPerformance {
  step: number;
  sent: number;
  gotReply: number;
  replyRate: number;
}

// A correlated EXISTS per step isn't expressible through Prisma's query
// builder — same shape as the ad-hoc audit query used earlier this session
// to find the real reply rate per step, now scoped and parameterized
// properly rather than a one-off. businessId/effectiveNumber are both
// server-derived (session + cookie), never user input, but tagged-template
// binding is used regardless — never string-interpolated SQL.
export async function getFollowupStepPerformance(
  businessId: string,
  effectiveNumber?: string
): Promise<FollowupStepPerformance[]> {
  const rows = await prisma.$queryRaw<Array<{ step: number; sent: bigint; got_reply: bigint }>>`
    SELECT
      f.step,
      COUNT(*) AS sent,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM messages m
          WHERE m.conversation_id = f.conversation_id
          AND m.direction = 'INBOUND'
          AND m.created_at > f.scheduled_for
        )
      ) AS got_reply
    FROM followups f
    JOIN conversations c ON c.id = f.conversation_id
    JOIN customers cu ON cu.id = c.customer_id
    WHERE cu.business_id = ${businessId}
    AND f.sent = true
    ${effectiveNumber ? Prisma.sql`AND c.whatsapp_phone_number_id = ${effectiveNumber}` : Prisma.empty}
    GROUP BY f.step
    ORDER BY f.step
  `;

  return rows.map((r) => {
    const sent = Number(r.sent);
    const gotReply = Number(r.got_reply);
    return { step: r.step, sent, gotReply, replyRate: sent > 0 ? (gotReply / sent) * 100 : 0 };
  });
}

export interface AttributionBucket {
  key: string;
  label: string;
  count: number;
}

export interface AttributionData {
  buckets: AttributionBucket[];
  total: number;
}

const CONVERTED_STAGES: ConversationStage[] = ["PAYMENT_VERIFIED", "PRODUCT_DELIVERED", "SALE_COMPLETED"];

// Three categories, not the four used mid-audit this session — the fourth
// ("engine bug", a followup firing after the sale already closed) was a
// one-time historical artifact from before this session's payment-fact
// fix, not an ongoing state worth reproducing as a standing metric.
export async function getConversionAttribution(businessId: string, effectiveNumber?: string): Promise<AttributionData> {
  const converted = {
    customer: { businessId },
    ...(effectiveNumber ? { whatsappPhoneNumberId: effectiveNumber } : {}),
    currentStage: { in: CONVERTED_STAGES },
  };

  const [organic, recovered, unpaidDelivered] = await Promise.all([
    prisma.conversation.count({ where: { ...converted, followups: { none: { sent: true } } } }),
    prisma.conversation.count({ where: { ...converted, followups: { some: { sent: true } } } }),
    prisma.conversation.count({
      where: {
        customer: { businessId },
        ...(effectiveNumber ? { whatsappPhoneNumberId: effectiveNumber } : {}),
        currentStage: { in: ["PRODUCT_DELIVERED", "SALE_COMPLETED"] },
        orders: { none: { status: "VERIFIED" } },
      },
    }),
  ]);

  return {
    buckets: [
      { key: "organic", label: "Organic", count: organic },
      { key: "recovered", label: "Recovered by follow-up", count: recovered },
      { key: "unpaid", label: "Delivered, unpaid", count: unpaidDelivered },
    ],
    total: organic + recovered,
  };
}

// ---------------------------------------------------------------------------
// Period-over-period cohort progression
// ---------------------------------------------------------------------------

// getFunnelBreakdown above is a *stock*: where each conversation sits right
// now, one bucket each. That's the right thing to draw as bars, but it can't
// answer "what share of leads convert" — a customer who completed is counted
// only under Completed, never also under the stages they passed through on
// the way. Reading a stage-to-stage conversion rate off those bars is
// arithmetic across unrelated piles, and the Insights panel was doing exactly
// that: it opened with "48% loss from Lead to Product selected", a number
// that doesn't describe anything (reported 2026-09-04).
//
// This is the *flow* counterpart: take the conversations that STARTED inside
// a window and ask how far each one ever got. Monotonic by construction, so
// the ratios between steps are real conversion rates — and comparable
// against the window before it, which is the question a funnel is actually
// for ("is this getting better or worse", not "what does it look like").

export interface CohortStep {
  key: string;
  label: string;
  count: number;
}

export interface PeriodSnapshot {
  started: number;
  /// Milestones 1..4 (Product selected through Completed). Milestone 0
  /// (Lead) is omitted deliberately — every conversation in the cohort was
  /// one, so the bucket would just restate `started`.
  reached: CohortStep[];
  lostLead: number;
  /// Escalations that actually *fired* in the window, counted from
  /// HUMAN_ASSIGNED events rather than from how many conversations sit in a
  /// human stage right now. The stock version reads zero as soon as the last
  /// handoff is resolved, which the AI previously reported as "your
  /// escalation path is never triggering (possible bug)".
  escalations: number;
  followupsSent: number;
  followupReplies: number;
}

export interface PeriodComparison {
  days: number;
  current: PeriodSnapshot;
  previous: PeriodSnapshot;
}

export const COMPARISON_WINDOW_DAYS = 30;

/**
 * How far each conversation in a cohort ever got, rolled up into cumulative
 * per-milestone counts. Pure and exported so it can be exercised directly
 * (`scripts/check-cohort-progression.ts`) without a database.
 *
 * `currentStage` alone can't answer this. escalate_to_human and the opt-out
 * handler overwrite it in place, so someone who reached Payment and was then
 * escalated shows no pipeline position at all — which is exactly why
 * stage-display.ts refuses to plot those stages. STAGE_CHANGED events
 * (actions.ts's updateStage) are the durable record of where a conversation
 * actually got to, so the two sources are combined and the deepest wins.
 *
 * Milestone 0 (Lead) is not reported: every conversation in the cohort was
 * one, so the bucket would only restate the cohort size.
 */
export function cohortProgression(
  conversations: Array<{ id: string; currentStage: ConversationStage }>,
  stageEvents: Array<{ conversationId: string | null; payload: unknown }>
): CohortStep[] {
  const furthest = new Map<string, number>();
  for (const c of conversations) {
    furthest.set(c.id, milestoneIndexOrNull(c.currentStage) ?? -1);
  }

  for (const e of stageEvents) {
    if (!e.conversationId || !furthest.has(e.conversationId)) continue;
    const newStage = (e.payload as { newStage?: string } | null)?.newStage;
    if (!newStage) continue;
    const idx = milestoneIndexOrNull(newStage as ConversationStage);
    if (idx === null) continue;
    furthest.set(e.conversationId, Math.max(furthest.get(e.conversationId)!, idx));
  }

  const depths = [...furthest.values()];
  return PIPELINE_MILESTONES.slice(1).map((m, i) => ({
    key: m.key,
    label: m.label,
    count: depths.filter((d) => d >= i + 1).length,
  }));
}

async function cohortSnapshot(
  businessId: string,
  effectiveNumber: string | undefined,
  start: Date,
  end: Date
): Promise<PeriodSnapshot> {
  const scope = {
    customer: { businessId },
    ...(effectiveNumber ? { whatsappPhoneNumberId: effectiveNumber } : {}),
  };

  const [conversations, escalations, followupRows] = await Promise.all([
    prisma.conversation.findMany({
      where: { ...scope, createdAt: { gte: start, lt: end } },
      select: { id: true, currentStage: true },
    }),
    prisma.event.count({
      where: { type: "HUMAN_ASSIGNED", createdAt: { gte: start, lt: end }, conversation: scope },
    }),
    // scheduledFor, not createdAt: the worker fires at the scheduled time,
    // so that's when the customer actually heard from us. Same reference
    // point getFollowupStepPerformance already uses to decide what counts
    // as a reply.
    prisma.$queryRaw<Array<{ sent: bigint; got_reply: bigint }>>`
      SELECT
        COUNT(*) AS sent,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM messages m
            WHERE m.conversation_id = f.conversation_id
            AND m.direction = 'INBOUND'
            AND m.created_at > f.scheduled_for
          )
        ) AS got_reply
      FROM followups f
      JOIN conversations c ON c.id = f.conversation_id
      JOIN customers cu ON cu.id = c.customer_id
      WHERE cu.business_id = ${businessId}
      AND f.sent = true
      AND f.scheduled_for >= ${start}
      AND f.scheduled_for < ${end}
      ${effectiveNumber ? Prisma.sql`AND c.whatsapp_phone_number_id = ${effectiveNumber}` : Prisma.empty}
    `,
  ]);

  const ids = conversations.map((c) => c.id);
  const stageEvents =
    ids.length > 0
      ? await prisma.event.findMany({
          where: { conversationId: { in: ids }, type: "STAGE_CHANGED" },
          select: { conversationId: true, payload: true },
        })
      : [];

  const reached = cohortProgression(conversations, stageEvents);

  return {
    started: conversations.length,
    reached,
    lostLead: conversations.filter((c) => c.currentStage === "LOST_LEAD").length,
    escalations,
    followupsSent: Number(followupRows[0]?.sent ?? 0),
    followupReplies: Number(followupRows[0]?.got_reply ?? 0),
  };
}

export async function getPeriodComparison(
  businessId: string,
  effectiveNumber?: string,
  days: number = COMPARISON_WINDOW_DAYS
): Promise<PeriodComparison> {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const currentStart = new Date(now.getTime() - days * dayMs);
  const previousStart = new Date(now.getTime() - 2 * days * dayMs);

  const [current, previous] = await Promise.all([
    cohortSnapshot(businessId, effectiveNumber, currentStart, now),
    cohortSnapshot(businessId, effectiveNumber, previousStart, currentStart),
  ]);

  return { days, current, previous };
}

export interface TrendsSnapshot {
  funnel: FunnelData;
  followupSteps: FollowupStepPerformance[];
  attribution: AttributionData;
  comparison: PeriodComparison;
  /// What the business owner has actually configured. Without this the model
  /// can't tell "no Step 2 data because you switched it off" from "no Step 2
  /// data because you forgot", and it confidently recommended adding a
  /// follow-up step the owner had deliberately removed.
  config: { maxFollowups: number; followupsEnabled: boolean };
}

export type FindingSeverity = "good" | "watch" | "risk";

export interface InsightFinding {
  title: string;
  detail: string;
  severity: FindingSeverity;
}

export interface TrendsInsights {
  headline: string;
  findings: InsightFinding[];
  recommendation: string;
}

// Structured output rather than prose, for the same reason
// receipt-verification.ts forces a tool call: the caller needs fields it can
// render, not a paragraph it has to parse. It also removes a whole class of
// display bug — the model used to emit markdown that the panel printed
// literally, so readers saw "**Where it's leaking:**" with the asterisks in
// it (reported 2026-09-04). No markdown can survive a typed schema.
const INSIGHTS_TOOL: Anthropic.Tool = {
  name: "report_insights",
  description: "Report the sales analysis as structured findings for display in a dashboard panel.",
  input_schema: {
    type: "object",
    properties: {
      headline: {
        type: "string",
        description:
          "One plain sentence naming the single most important thing about this period. Plain text, no markdown, no formatting characters.",
      },
      findings: {
        type: "array",
        description: "Two to four findings, most important first.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Three to six words. Plain text." },
            detail: {
              type: "string",
              description:
                "One or two sentences citing the actual numbers given. Plain text, no markdown, no formatting characters.",
            },
            severity: {
              type: "string",
              enum: ["good", "watch", "risk"],
              description:
                "'good' = working and worth keeping. 'watch' = worth monitoring but not urgent. 'risk' = losing money or breaking now.",
            },
          },
          required: ["title", "detail", "severity"],
        },
      },
      recommendation: {
        type: "string",
        description:
          "One concrete action to take next, tied to a number above. Plain text. Never recommend a setting the business owner has already deliberately configured.",
      },
    },
    required: ["headline", "findings", "recommendation"],
  },
};

function describePeriod(p: PeriodSnapshot): string {
  const steps = p.reached.map((r) => `  ever reached ${r.label}: ${r.count}`).join("\n");
  const replyRate = p.followupsSent > 0 ? ((p.followupReplies / p.followupsSent) * 100).toFixed(1) : "n/a";
  return [
    `  conversations started: ${p.started}`,
    steps,
    `  ended as lost lead: ${p.lostLead}`,
    `  escalations to a human that fired: ${p.escalations}`,
    `  follow-ups sent: ${p.followupsSent}, replies after them: ${p.followupReplies} (${replyRate}%)`,
  ].join("\n");
}

export async function generateTrendsInsights(snapshot: TrendsSnapshot): Promise<TrendsInsights | null> {
  const { comparison, config } = snapshot;

  const prompt = `You are analyzing sales performance for a small business that sells digital products entirely through WhatsApp conversations. There is no website, no app, no checkout page and no signup form — every step happens in a chat thread, so never recommend changes to "UX", "landing pages", "checkout flow" or "onboarding screens".

# Cohort progression — use ONLY this for conversion rates
Of the conversations that STARTED inside each window, how many ever reached each milestone. These counts are cumulative and monotonic, so the ratio between any two steps is a real conversion rate, and the two windows are directly comparable.

Last ${comparison.days} days:
${describePeriod(comparison.current)}

Previous ${comparison.days} days:
${describePeriod(comparison.previous)}

# Current pipeline snapshot — NOT a funnel, do not compute rates from it
Where open conversations sit right now, one bucket each. A conversation that completed is counted ONLY under Completed, never also under the stages it passed through on the way. Subtracting one bucket from another does not measure drop-off and does not mean anything. Use this only to describe what is currently in flight.
${snapshot.funnel.milestones.map((m) => `  ${m.label}: ${m.count}`).join("\n")}
${snapshot.funnel.exceptions.map((e) => `  ${e.label}: ${e.count}`).join("\n")}
  total open and closed conversations, all time: ${snapshot.funnel.total}

A zero in "Needs a human" or "Assigned to a human" means nobody is waiting on a human at this instant. It does NOT mean escalation never fires — the cohort section above reports how many escalations actually fired.

# Follow-up performance by step, all time
${
  snapshot.followupSteps.length > 0
    ? snapshot.followupSteps
        .map((s) => `  Step ${s.step}: ${s.sent} sent, ${s.gotReply} replies (${s.replyRate.toFixed(1)}%)`)
        .join("\n")
    : "  No follow-ups sent yet."
}

# Conversion attribution, all time
${snapshot.attribution.buckets.map((b) => `  ${b.label}: ${b.count}`).join("\n")}
  total converted: ${snapshot.attribution.total}

# The owner's current configuration — already chosen deliberately
Follow-up steps configured: ${config.maxFollowups}
Follow-up engine enabled: ${config.followupsEnabled ? "yes" : "no"}

Steps beyond ${config.maxFollowups} have no data because the owner set the limit there, not because anything is broken. Do not recommend raising it back to a default, and do not describe a step that was never configured as missing data.

Now report your analysis with the report_insights tool. Anchor every claim to a number above. Lead with what CHANGED between the two windows, since a single snapshot cannot say whether things are improving. If a window has too little data to support a comparison, say that plainly instead of computing a percentage from two or three conversations. Do not speculate about how the software works or ask the reader to go verify the data.`;

  // max_tokens is a hard cap on *total* output, thinking included, and
  // Sonnet 5 runs adaptive thinking by default at `high` effort — a change
  // from Sonnet 4.6, where an identical request ran without thinking. The
  // original 1024 was sized for "a few sentences with no thinking", so in
  // production the model spent the whole budget reasoning and got cut off
  // before emitting anything at all: stop_reason max_tokens, and the panel
  // showing its fallback string on every click (reported 2026-09-03).
  //
  // No output_config.effort here, deliberately. It would be the second
  // documented lever against that, but this call now forces a specific tool,
  // and forced tool_choice has its own historical interaction with thinking.
  // receipt-verification.ts proves forced tool_choice alone works against
  // this model in production; effort combined with it is unverified from
  // here, and 4096 is the same budget ai-runtime.ts already runs tools on
  // successfully. Not worth risking a 400 on the feature to save a few
  // thinking tokens on a button clicked by hand.
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    tools: [INSIGHTS_TOOL],
    tool_choice: { type: "tool", name: "report_insights" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    // Don't swallow this again. A response with no tool call is a budget or
    // config problem, not a transient one, and it was invisible without the
    // stop_reason and the block types that actually came back.
    console.error(
      `[trends-insights] no tool_use block. stop_reason=${response.stop_reason} ` +
        `blocks=[${response.content.map((b) => b.type).join(",")}] ` +
        `output=${response.usage.output_tokens} thinking=${response.usage.output_tokens_details?.thinking_tokens ?? "n/a"}`
    );
    return null;
  }

  return toolUse.input as unknown as TrendsInsights;
}
