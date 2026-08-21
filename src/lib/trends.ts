import { prisma } from "@/lib/prisma";
import { Prisma, type ConversationStage } from "@/generated/prisma/client";
import { PIPELINE_MILESTONES, milestoneIndexForStage } from "@/lib/stage-display";
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

export interface TrendsSnapshot {
  funnel: FunnelData;
  followupSteps: FollowupStepPerformance[];
  attribution: AttributionData;
}

// Pure — takes already-computed numbers, makes one plain text call. Reuses
// the app's one shared Anthropic client/model (src/lib/claude.ts) rather
// than a second client or a different model; on-demand only, not cached —
// at Sonnet 5 pricing this is a couple of cents per click, cheap enough
// that click-to-generate is simpler than adding storage for a cached copy.
export async function generateTrendsInsights(snapshot: TrendsSnapshot): Promise<string> {
  const prompt = `You are analyzing WhatsApp sales funnel data for a small business selling digital products. Write a short, direct analysis (4-6 sentences) covering: where the funnel is actually leaking, whether follow-ups are working, and one concrete recommendation. Use the real numbers given, don't restate generic advice. Flag anything that looks like a real risk (e.g. a step producing zero replies, a large "delivered, unpaid" bucket) plainly, not softened. If a category has zero data, say so rather than speculating.

Funnel (by stage group):
${snapshot.funnel.milestones.map((m) => `${m.label}: ${m.count}`).join("\n")}
Exceptions: ${snapshot.funnel.exceptions.map((e) => `${e.label}: ${e.count}`).join(", ")}
Total conversations: ${snapshot.funnel.total}

Follow-up step performance:
${
  snapshot.followupSteps.length > 0
    ? snapshot.followupSteps.map((s) => `Step ${s.step}: ${s.sent} sent, ${s.gotReply} replies (${s.replyRate.toFixed(1)}%)`).join("\n")
    : "No follow-ups sent yet."
}

Conversion attribution:
${snapshot.attribution.buckets.map((b) => `${b.label}: ${b.count}`).join("\n")}
Total converted: ${snapshot.attribution.total}`;

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "Could not generate insights right now.";
}
