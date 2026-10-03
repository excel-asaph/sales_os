import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/viewer";
import { getTestChat } from "@/lib/test-chat";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendTestChatMessage, resetTestChatAction } from "./actions";

// Talk to your own AI as a customer would, before going live (v2,
// src/lib/test-chat.ts). Real AI, real settings, scripts and FAQ; nothing
// reaches WhatsApp or the dashboard.

const VIA: Record<string, string> = {
  ad: "from the ad they came from",
  opening_message: "from the product's opening message",
  channel: "because the number sells only this product",
  ai: "chosen by the AI from what the customer said",
  sale: "when the AI sent it or took payment for it",
};

type Payload = Record<string, unknown> | null;

function describeEvent(type: string, payload: Payload, productNames: Map<string, string>): string | null {
  switch (type) {
    case "PRODUCT_ROUTED":
      return `Product set to ${productNames.get(String(payload?.productId)) ?? "a product"} ${VIA[String(payload?.via)] ?? ""}.`;
    case "FOLLOWUP_SCHEDULED":
      return `The AI would follow up in ${payload?.hours ?? "?"} hours if the customer went quiet (not scheduled: this is a test).`;
    case "HUMAN_ASSIGNED":
      return "Handed to a person. A real customer would now wait for your team.";
    case "PRODUCT_DELIVERED":
      return "Product file sent (in a test chat it isn't actually sent).";
    case "PAYMENT_ESCALATED":
      return "The payment was passed to a person to check.";
    default:
      return null;
  }
}

export default async function TestChatPage() {
  const session = await requireAdminPage();
  const [conversation, products] = await Promise.all([
    getTestChat(session.businessId, session.agentId),
    prisma.product.findMany({
      where: { businessId: session.businessId, available: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const productNames = new Map(products.map((p) => [p.id, p.name]));

  const timeline = [
    ...(conversation?.messages ?? []).map((m) => ({ at: m.createdAt, kind: "message" as const, message: m })),
    ...(conversation?.events ?? []).flatMap((e) => {
      const text = describeEvent(e.type, e.payload as Payload, productNames);
      return text ? [{ at: e.createdAt, kind: "note" as const, text, id: e.id }] : [];
    }),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <AppShell
      active="test-chat"
      title="Test chat"
      description="Talk to your AI as a customer would. Nothing is sent to WhatsApp, and it stays out of your dashboard."
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div className="flex flex-col gap-1">
              <CardTitle>{conversation ? "Your test conversation" : "Start a test conversation"}</CardTitle>
              <CardDescription>
                {conversation
                  ? `Product: ${conversation.product?.name ?? "not known yet"}. Stage: ${conversation.currentStage.replaceAll("_", " ").toLowerCase()}.`
                  : "Write the first message a customer might send. The AI answers with your real settings, scripts and questions."}
              </CardDescription>
            </div>
            {conversation && (
              <form action={resetTestChatAction}>
                <SubmitButton variant="outline" size="sm" pendingLabel="Clearing…" successMessage="Test chat cleared">
                  Start over
                </SubmitButton>
              </form>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {timeline.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Try it the way customers do: a bare &quot;Hi&quot;, a product&apos;s opening message, a price question, an
                objection, &quot;I have paid&quot;.
              </p>
            )}
            {timeline.map((item) =>
              item.kind === "note" ? (
                <p key={item.id} className="text-center text-xs text-muted-foreground">
                  {item.text}
                </p>
              ) : (
                <div
                  key={item.message.id}
                  className={
                    item.message.direction === "INBOUND"
                      ? "ml-10 self-end rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm whitespace-pre-wrap text-primary-foreground"
                      : "mr-10 self-start rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm whitespace-pre-wrap"
                  }
                >
                  {item.message.type === "DOCUMENT" ? `📄 ${item.message.content ?? "Document"}` : item.message.content}
                </div>
              )
            )}
          </CardContent>
        </Card>

        <form action={sendTestChatMessage} className="flex flex-col gap-3">
          {!conversation && products.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productId">How does this customer arrive?</Label>
              <select id="productId" name="productId" defaultValue="" className="h-9 rounded-md border bg-background px-2 text-sm">
                <option value="">On a number that sells several products (the AI finds out)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    On a number for {product.name} only
                  </option>
                ))}
              </select>
            </div>
          )}
          <Label htmlFor="text" className="sr-only">
            Message
          </Label>
          <Textarea id="text" name="text" rows={3} required placeholder="Write as the customer…" />
          <SubmitButton className="self-start" pendingLabel="The AI is replying… (can take up to a minute)">
            Send
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
