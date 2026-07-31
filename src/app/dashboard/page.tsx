import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";
import type { ConversationStage } from "@/generated/prisma/client";

// Dashboard "Monitor" view (ARCHITECTURE.md §10, PRD 13.3): active
// conversations, today's counts, conversations awaiting a human. This is
// the missing other half of escalate_to_human (src/lib/actions.ts) — right
// now a conversation can reach HUMAN_REVIEW_REQUIRED with nothing pointing
// a human at it. This page is that pointer.
const HUMAN_STAGES: ConversationStage[] = ["HUMAN_REVIEW_REQUIRED", "HUMAN_ASSIGNED"];
const TERMINAL_STAGES: ConversationStage[] = ["SALE_COMPLETED", "LOST_LEAD", "RESOLVED"];

const STAGE_COLORS: Partial<Record<ConversationStage, string>> = {
  HUMAN_REVIEW_REQUIRED: "#b91c1c",
  HUMAN_ASSIGNED: "#c2410c",
  WAITING_FOR_PAYMENT: "#a16207",
  RECEIPT_RECEIVED: "#a16207",
  SALE_COMPLETED: "#15803d",
  PRODUCT_DELIVERED: "#15803d",
  PAYMENT_VERIFIED: "#15803d",
  LOST_LEAD: "#6b7280",
};

function stageColor(stage: ConversationStage): string {
  return STAGE_COLORS[stage] ?? "#374151";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const businessScope = { customer: { businessId: session.businessId } };

  const [conversations, awaitingHumanCount, completedTodayCount] = await Promise.all([
    prisma.conversation.findMany({
      where: { ...businessScope, NOT: { currentStage: { in: TERMINAL_STAGES } } },
      include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.conversation.count({ where: { ...businessScope, currentStage: { in: HUMAN_STAGES } } }),
    prisma.conversation.count({
      where: { ...businessScope, currentStage: "SALE_COMPLETED", updatedAt: { gte: startOfToday } },
    }),
  ]);

  // Conversations needing a human float to the top regardless of recency —
  // that's the whole point of this view.
  const sorted = [...conversations].sort((a, b) => {
    const aUrgent = HUMAN_STAGES.includes(a.currentStage) ? 0 : 1;
    const bUrgent = HUMAN_STAGES.includes(b.currentStage) ? 0 : 1;
    return aUrgent - bUrgent;
  });

  return (
    <main style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <DashboardNav isAdmin={session.isAdmin} />
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 16, margin: "24px 0" }}>
        <SummaryCard label="Active conversations" value={conversations.length} />
        <SummaryCard label="Awaiting a human" value={awaitingHumanCount} tone={awaitingHumanCount > 0 ? "warn" : undefined} />
        <SummaryCard label="Sales completed today" value={completedTodayCount} tone="good" />
      </div>

      {sorted.length === 0 ? (
        <p style={{ color: "#666" }}>No active conversations.</p>
      ) : (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
          {sorted.map((conversation) => {
            const latest = conversation.messages[0];
            return (
              <Link
                key={conversation.id}
                href={`/dashboard/${conversation.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  padding: "12px 16px",
                  borderBottom: "1px solid #eee",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>
                    {conversation.customer.name || conversation.customer.phoneNumber}
                  </div>
                  <div
                    style={{
                      color: "#666",
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 480,
                    }}
                  >
                    {latest ? `${latest.direction === "INBOUND" ? "Customer" : latest.sender}: ${latest.content ?? "(no text)"}` : "No messages yet"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ color: "#999", fontSize: 13 }}>
                    {conversation.updatedAt.toLocaleString()}
                  </span>
                  <span
                    style={{
                      color: "white",
                      background: stageColor(conversation.currentStage),
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {conversation.currentStage.replaceAll("_", " ")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: "warn" | "good" }) {
  const color = tone === "warn" ? "#b91c1c" : tone === "good" ? "#15803d" : "#111";
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, flex: 1 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
    </div>
  );
}
