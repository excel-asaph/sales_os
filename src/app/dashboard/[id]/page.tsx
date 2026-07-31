import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";
import { sendHumanReply, resolveConversation } from "./actions";

// Dashboard "Review" view (ARCHITECTURE.md §10): per-conversation
// drill-down — summary, stage, message history, Conversation Brain facts —
// plus the two actions a human actually needs once they're looking at an
// escalated conversation: reply directly, or resolve it.
export default async function ConversationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedTo: true,
      messages: { orderBy: { createdAt: "asc" } },
      facts: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { product: true } },
      followups: { orderBy: { scheduledFor: "asc" } },
    },
  });

  // Not found, or belongs to a different business — same response either
  // way so this can't be used to probe which conversation ids exist.
  if (!conversation || conversation.customer.businessId !== session.businessId) return notFound();

  return (
    <main style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <DashboardNav isAdmin={session.isAdmin} />
      <Link href="/dashboard" style={{ color: "#555", fontSize: 14 }}>
        ← Back to dashboard
      </Link>

      <h1 style={{ marginBottom: 4 }}>
        {conversation.customer.name || conversation.customer.phoneNumber}
      </h1>
      <p style={{ color: "#666", marginTop: 0 }}>{conversation.customer.phoneNumber}</p>

      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <Field label="Stage" value={conversation.currentStage.replaceAll("_", " ")} />
        <Field label="Objective" value={conversation.currentObjective || "—"} />
        <Field
          label="Confidence"
          value={conversation.confidence != null ? conversation.confidence.toFixed(2) : "—"}
        />
        <Field label="Summary" value={conversation.summary || "—"} />
        <Field label="Assigned to" value={conversation.assignedTo?.name ?? "—"} />
      </section>

      {conversation.referral != null && (
        <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Came from</h2>
          <ReferralDetails referral={conversation.referral as Record<string, string | undefined>} />
        </section>
      )}

      <form action={resolveConversation} style={{ marginBottom: 24 }}>
        <input type="hidden" name="conversationId" value={conversation.id} />
        <button type="submit" style={{ padding: "8px 16px" }}>
          Mark resolved
        </button>
        <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>
          Closes this conversation — the customer&apos;s next message starts a new one.
        </span>
      </form>

      <h2>Messages</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {conversation.messages.map((message) => {
          const fromCustomer = message.direction === "INBOUND";
          return (
            <div
              key={message.id}
              style={{
                alignSelf: fromCustomer ? "flex-start" : "flex-end",
                maxWidth: "75%",
                background: fromCustomer ? "#f1f1f1" : message.sender === "HUMAN" ? "#dbeafe" : "#dcfce7",
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                {fromCustomer ? "Customer" : message.sender} · {message.createdAt.toLocaleString()}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{message.content ?? `[${message.type}]`}</div>
              {message.mediaUrl && (
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <a href={message.mediaUrl} target="_blank" rel="noreferrer">
                    media
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form action={sendHumanReply} style={{ marginBottom: 32 }}>
        <input type="hidden" name="conversationId" value={conversation.id} />
        <textarea
          name="text"
          placeholder="Reply as a human agent…"
          rows={3}
          style={{ width: "100%", padding: 8, fontFamily: "inherit", fontSize: 14 }}
        />
        <button type="submit" style={{ marginTop: 8, padding: "8px 16px" }}>
          Send reply
        </button>
        <p style={{ color: "#888", fontSize: 13 }}>
          The AI will not respond to this conversation while it&apos;s awaiting/assigned to a human.
        </p>
      </form>

      {conversation.facts.length > 0 && (
        <>
          <h2>Remembered facts</h2>
          <ul style={{ marginBottom: 24 }}>
            {conversation.facts.map((fact) => {
              const payload = fact.payload as { key?: string; value?: string };
              return (
                <li key={fact.id}>
                  <strong>{fact.kind}</strong> — {payload.key}: {payload.value}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {conversation.orders.length > 0 && (
        <>
          <h2>Orders</h2>
          <ul style={{ marginBottom: 24 }}>
            {conversation.orders.map((order) => (
              <li key={order.id}>
                {order.product.name} — expected ₦{order.expectedAmount.toString()}, extracted{" "}
                {order.extractedAmount ? `₦${order.extractedAmount.toString()}` : "—"} via{" "}
                {order.extractedBank ?? "—"} — confidence{" "}
                {order.verificationConfidence?.toFixed(2) ?? "—"} —{" "}
                <strong>{order.status}</strong>
                {order.receiptImageUrl && (
                  <>
                    {" "}
                    ·{" "}
                    <a href={order.receiptImageUrl} target="_blank" rel="noreferrer">
                      receipt
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {conversation.followups.length > 0 && (
        <>
          <h2>Follow-ups</h2>
          <ul>
            {conversation.followups.map((followup) => (
              <li key={followup.id}>
                Step {followup.step} — {followup.scheduledFor.toLocaleString()} —{" "}
                {followup.cancelled ? "cancelled" : followup.sent ? "sent" : "pending"}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ color: "#666", fontSize: 13 }}>{label}: </span>
      <span>{value}</span>
    </div>
  );
}

// Which ad/post started this conversation (src/lib/whatsapp.ts's `referral`
// type) — useful for a human deciding how to handle a lead, and eventually
// for attributing sales back to ad spend, neither of which this MVP does
// yet beyond just keeping the raw data around.
function ReferralDetails({ referral }: { referral: Record<string, string | undefined> }) {
  return (
    <>
      <Field label="Type" value={referral.source_type ?? "—"} />
      <Field label="Ad/post headline" value={referral.headline ?? "—"} />
      <Field label="Ad/post body" value={referral.body ?? "—"} />
      {referral.source_url && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: "#666", fontSize: 13 }}>Source: </span>
          <a href={referral.source_url} target="_blank" rel="noreferrer">
            {referral.source_url}
          </a>
        </div>
      )}
    </>
  );
}
