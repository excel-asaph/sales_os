import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getNumberFilterCookie } from "@/lib/number-filter";
import { Check, ExternalLink, FileText, AlertTriangle, UserX2, UserRound, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import type { ConversationStage, MessageType } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { ResolveConversationButton } from "@/components/resolve-conversation-button";
import { DeleteConversationButton } from "@/components/delete-conversation-button";
import { ScrollToBottomAnchor } from "@/components/scroll-to-bottom-anchor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Field, ReferralDetails } from "@/components/referral-details";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  HUMAN_STAGES,
  TERMINAL_STAGES,
  PIPELINE_MILESTONES,
  milestoneIndexForStage,
} from "@/lib/stage-display";
import { clampMaxFollowups, FOLLOWUP_SEQUENCE } from "@/lib/followup-sequence";
import { sendHumanReply } from "./actions";

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

  // Two branches sharing one business (see number-filter.ts) — a
  // conversation belongs to whichever number it came in on, and someone
  // scoped to the other branch (a stale link, a shared URL) shouldn't land
  // on it while still thinking they're looking at their own branch's data.
  // Conversations from before multi-number support existed have no number
  // stamped at all (null) and stay reachable regardless of filter, same as
  // they always have been. Resolved the same way as every other page: no
  // cookie yet defaults to the primary number, same as the sidebar shows.
  const [business, numberFilter] = await Promise.all([
    prisma.business.findUnique({ where: { id: session.businessId }, select: { whatsappPhoneNumberId: true } }),
    getNumberFilterCookie(),
  ]);
  const effectiveNumber =
    numberFilter === "all" ? undefined : (numberFilter ?? business?.whatsappPhoneNumberId ?? undefined);
  if (effectiveNumber && conversation.whatsappPhoneNumberId && conversation.whatsappPhoneNumberId !== effectiveNumber) {
    redirect("/dashboard");
  }

  const businessConfig = await prisma.businessConfig.findUnique({
    where: { businessId: session.businessId },
  });
  const maxFollowups = clampMaxFollowups(businessConfig?.maxFollowups ?? FOLLOWUP_SEQUENCE.length);
  // The step beyond maxFollowups is an internal "did they come back?"
  // check with no real content (src/worker/followup-worker.ts) — nothing
  // a human needs to see.
  const visibleFollowups = conversation.followups.filter((f) => f.step <= maxFollowups);

  const { name, phoneNumber, tags } = conversation.customer;
  const customerTags = Array.isArray(tags) ? (tags as string[]) : [];
  const isLost = conversation.currentStage === "LOST_LEAD";
  const isHumanStage = HUMAN_STAGES.includes(conversation.currentStage);
  // Safe to resolve without a strong warning: a human already owns it, or
  // the outcome is already final. Anything else means the AI is still
  // actively mid-sale, expecting the customer's next move.
  const requiresResolveWarning = ![...HUMAN_STAGES, ...TERMINAL_STAGES].includes(conversation.currentStage);

  // Rendered twice: as its own persistent column at `lg` and up, and inside
  // the mobile Sheet triggered from the header below `lg` (see `actions`)
  // — same content either way, just a different container around it.
  const detailsPanel = (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Record</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {customerTags.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {customerTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tag === "Uninterested" ? "secondary" : "default"}
                    className="font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <Field label="Objective" value={conversation.currentObjective || "—"} />
          <Field
            label="Confidence"
            value={conversation.confidence != null ? conversation.confidence.toFixed(2) : "—"}
          />
          <Field label="Summary" value={conversation.summary || "—"} />
          <Field label="Assigned to" value={conversation.assignedTo?.name ?? "—"} />
        </CardContent>
      </Card>

      {conversation.referral != null && (
        <Card>
          <CardHeader>
            <CardTitle>Came from</CardTitle>
          </CardHeader>
          <CardContent>
            <ReferralDetails referral={conversation.referral as Record<string, string | undefined>} />
          </CardContent>
        </Card>
      )}

      {conversation.facts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Remembered facts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {conversation.facts.map((fact) => {
              const payload = fact.payload as { key?: string; value?: string };
              return (
                <div key={fact.id} className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary" className="mt-0.5 shrink-0">
                    {fact.kind}
                  </Badge>
                  <span className="min-w-0 text-muted-foreground">
                    <span className="font-medium text-foreground">{payload.key}</span>
                    {payload.value ? `: ${payload.value}` : ""}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {conversation.orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {conversation.orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{order.product.name}</span>
                  <Badge
                    variant={
                      order.status === "VERIFIED"
                        ? "default"
                        : order.status === "ESCALATED"
                          ? "destructive"
                          : order.status === "REJECTED"
                            ? "outline"
                            : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  Expected {formatNaira(Number(order.expectedAmount))}, extracted{" "}
                  {order.extractedAmount ? formatNaira(Number(order.extractedAmount)) : "—"} via{" "}
                  {order.extractedBank ?? "—"}
                </div>
                <div className="text-muted-foreground">
                  Confidence {order.verificationConfidence?.toFixed(2) ?? "—"}
                  {order.receiptImageUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={order.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium underline"
                      >
                        receipt <ExternalLink className="size-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {visibleFollowups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {visibleFollowups.map((followup) => (
              <div key={followup.id} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  Step {followup.step} of {maxFollowups} · {followup.scheduledFor.toLocaleString()}
                </span>
                <Badge variant={followup.cancelled ? "secondary" : followup.sent ? "default" : "outline"}>
                  {followup.cancelled ? "cancelled" : followup.sent ? "sent" : "pending"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );

  return (
    <AppShell
      active="conversations"
      title={name ?? phoneNumber}
      description={name ? phoneNumber : undefined}
      actions={
        <div className="flex items-center gap-2">
          {/* Below `lg` the Record/Facts/Orders panel isn't in the page
              flow at all (see the comment on the right-hand column below)
              — this is the only way to reach it there, the same "tap to
              reveal info" pattern real chat apps use on mobile instead of
              stacking it under the thread. Hidden at `lg` and up since the
              panel is already visible as its own column then. */}
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" />}>
              <Info />
              <span className="hidden sm:inline">Details</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader className="border-b">
                <SheetTitle>Conversation details</SheetTitle>
                <SheetDescription>Record, remembered facts, and orders for this conversation</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-4">{detailsPanel}</div>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/customers/${conversation.customer.id}`} />}
          >
            <UserRound />
            <span className="hidden sm:inline">Customer profile</span>
          </Button>
          <ResolveConversationButton conversationId={conversation.id} requiresWarning={requiresResolveWarning} />
          {session.isAdmin && conversation.orders.length === 0 && (
            <DeleteConversationButton conversationId={conversation.id} />
          )}
        </div>
      }
    >
      {/*
        The message list + reply box get their own bounded, internally-
        scrolling pane at every breakpoint — a docked composer with the
        thread scrolling above it is the one messaging convention that's
        arguably more universal on mobile than desktop (WhatsApp, Messenger,
        Telegram, Slack mobile all do it), so it isn't gated to `lg`. What
        *is* `lg`-only is the right-hand panel (Record/Facts/Orders): at
        `lg` and up it's a second independently-scrolling column next to the
        chat; below `lg` there's no room for two competing scroll regions,
        so it isn't in the page at all — it only exists inside the Sheet
        reachable from the header's "Details" action, the same "tap for
        info" pattern real chat apps use on mobile instead of stacking
        everything under the thread. The chat pane's mobile height is a
        fixed viewport fraction (h-[65dvh]) rather than "fill all remaining
        space" the way `lg:h-full` does on desktop, since there's no longer
        a right panel below it competing for the rest of the screen — just
        deliberately short of the full viewport so it's clear the page
        still scrolls. Only this page opts into any of this; app-shell
        itself, and every other page's normal page-scrolling, is untouched.
      */}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:h-full">
        {isHumanStage || isLost ? (
          <StatusBanner
            tone={isLost ? "muted" : conversation.currentStage === "HUMAN_ASSIGNED" ? "assigned" : "urgent"}
            title={
              isLost
                ? "Lost lead"
                : conversation.currentStage === "HUMAN_ASSIGNED"
                  ? `Assigned to ${conversation.assignedTo?.name ?? "a human agent"}`
                  : "Needs a human — the AI has paused on this conversation"
            }
            description={conversation.summary ?? undefined}
          />
        ) : (
          <PipelineTracker currentStage={conversation.currentStage} />
        )}

        <div className="grid grid-cols-1 gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_320px]">
          <div className="flex min-w-0 flex-col gap-5 lg:min-h-0">
            <Card className="flex h-[65dvh] min-h-0 flex-col overflow-hidden lg:h-auto lg:flex-1">
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
                {conversation.messages.map((message) => {
                  const fromCustomer = message.direction === "INBOUND";
                  const fromHuman = message.sender === "HUMAN";
                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col ${fromCustomer ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          fromCustomer
                            ? "rounded-bl-sm bg-muted"
                            : fromHuman
                              ? "rounded-br-sm bg-blue-50 dark:bg-blue-500/10"
                              : "rounded-br-sm bg-emerald-50 dark:bg-emerald-500/10"
                        }`}
                      >
                        <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                          {fromCustomer ? "Customer" : fromHuman ? "You" : "AI"} ·{" "}
                          {message.createdAt.toLocaleString()}
                        </div>
                        {!(message.mediaUrl && message.type === "DOCUMENT") && (
                          <div className="whitespace-pre-wrap">
                            {message.content ?? (message.mediaUrl ? null : `[${message.type}]`)}
                          </div>
                        )}
                        {message.mediaUrl && (
                          <MessageMedia url={message.mediaUrl} type={message.type} filename={message.content} />
                        )}
                      </div>
                    </div>
                  );
                })}
                <ScrollToBottomAnchor />
              </CardContent>
            </Card>

            <Card size="sm" className="shrink-0">
              <CardContent>
                <form action={sendHumanReply} className="flex flex-col gap-2">
                  <input type="hidden" name="conversationId" value={conversation.id} />
                  {/* Textarea already auto-grows with the typed content
                      (field-sizing-content, textarea.tsx) — rows={2} just
                      sets a shorter starting height so the composer doesn't
                      eat more of the pane's vertical budget than an empty
                      box needs. */}
                  <Textarea name="text" placeholder="Reply as a human agent…" rows={2} />
                  <div className="flex items-center justify-between">
                    {isHumanStage && (
                      <p className="text-xs text-muted-foreground">
                        The AI will not respond here while it&apos;s awaiting/assigned to a human.
                      </p>
                    )}
                    <SubmitButton size="sm" pendingLabel="Sending…" successMessage="Reply sent" className="ml-auto">
                      Send reply
                    </SubmitButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Desktop-only persistent column — below `lg` this content only
              exists inside the Sheet triggered from the header (see
              `actions` above), not stacked in the page flow, matching how
              real chat apps tuck conversation info behind a tap on mobile
              instead of making you scroll past it. Card's border is a
              `ring` (box-shadow), which renders outside its box and gets
              clipped by a flush-fitting scroll parent — worst at the top
              and where the scrollbar sits. `-m-1 p-1` gives every card's
              ring room to render before the scroll boundary/scrollbar
              starts, without shifting the column's visible position
              against its grid neighbor. */}
          <div className="-m-1 hidden flex-col gap-5 p-1 lg:flex lg:min-h-0 lg:overflow-y-auto">
            {detailsPanel}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// Inline media, matching how WhatsApp/Gemini/etc. render an attachment in
// place rather than as a bare "View media" link — an image thumbnail, a
// file card for documents, an inline player for voice notes. Inbound media
// only gets a real, servable URL once something (today: receipt
// verification) has downloaded and persisted it — until then `mediaUrl` is
// still the raw WhatsApp media reference, which isn't a fetchable link.
function MessageMedia({
  url,
  type,
  filename,
}: {
  url: string;
  type: MessageType;
  filename: string | null;
}) {
  if (url.startsWith("whatsapp-media:")) {
    return (
      <div className="mt-1.5 text-xs text-muted-foreground italic">Media received — not yet available to preview</div>
    );
  }

  if (type === "IMAGE") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 block">
        {/* eslint-disable-next-line @next/next/no-img-element -- external/self-hosted media URL, not a local asset Next can optimize */}
        <img src={url} alt="" className="max-h-64 w-auto max-w-full rounded-lg border object-cover" />
      </a>
    );
  }

  if (type === "VOICE") {
    return <audio controls src={url} className="mt-1.5 h-9 max-w-full" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 flex items-center gap-2 rounded-lg border bg-background/60 px-3 py-2 text-xs font-medium hover:bg-background"
    >
      <FileText className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{filename ?? "Attachment"}</span>
      <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
    </a>
  );
}

function StatusBanner({
  tone,
  title,
  description,
}: {
  tone: "urgent" | "assigned" | "muted";
  title: string;
  description?: string;
}) {
  const styles = {
    urgent: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
    assigned:
      "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300",
    muted: "border-border bg-muted text-muted-foreground",
  }[tone];
  const Icon = tone === "muted" ? UserX2 : AlertTriangle;

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-5 py-3 ${styles}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <div className="text-sm font-semibold">{title}</div>
        {description && <div className="mt-0.5 text-sm opacity-90">{description}</div>}
      </div>
    </div>
  );
}

function PipelineTracker({ currentStage }: { currentStage: ConversationStage }) {
  const activeIndex = milestoneIndexForStage(currentStage);
  const total = PIPELINE_MILESTONES.length;
  const progressPercent = total > 1 ? (activeIndex / (total - 1)) * 100 : 100;

  return (
    <>
      {/* Below `sm`, five spelled-out steps don't fit a phone width without
          either clipping past the edge or scrolling sideways — neither is
          how top platforms show mobile progress. Checkout flows (Stripe,
          Shopify) collapse this to a slim bar plus the current step's name
          instead; the full node-by-node stepper is still exactly what
          renders from `sm` up. */}
      <div className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 sm:hidden">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-foreground">{PIPELINE_MILESTONES[activeIndex].label}</span>
          <span className="shrink-0 text-muted-foreground">
            Step {activeIndex + 1} of {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="hidden items-center rounded-xl border bg-card px-6 py-3 sm:flex">
        {PIPELINE_MILESTONES.map((milestone, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        const isLast = index === PIPELINE_MILESTONES.length - 1;
        return (
          <div key={milestone.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3" /> : index + 1}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {milestone.label}
              </span>
            </div>
            {!isLast && (
              <div className={`mx-2 h-0.5 flex-1 ${done ? "bg-emerald-600" : "bg-border"}`} />
            )}
          </div>
        );
      })}
      </div>
    </>
  );
}
