import Link from "next/link";
import type { ReactNode } from "react";
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
import { ReturnToAIButton } from "@/components/return-to-ai-button";
import { VerifyOrderButton } from "@/components/verify-order-button";
import { CreateOrderButton } from "@/components/create-order-button";
import { SendProductButton } from "@/components/send-product-button";
import { DeleteConversationButton } from "@/components/delete-conversation-button";
import { ScrollToBottomAnchor } from "@/components/scroll-to-bottom-anchor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Field, ReferralDetails } from "@/components/referral-details";
import {
  MobileDetailsSheetProvider,
  MobileDetailsSheetTrigger,
  MobileDetailsSheetPanel,
} from "@/components/mobile-details-sheet";
import {
  HUMAN_STAGES,
  TERMINAL_STAGES,
  PIPELINE_MILESTONES,
  milestoneIndexForStage,
} from "@/lib/stage-display";
import { clampMaxFollowups, FOLLOWUP_SEQUENCE } from "@/lib/followup-sequence";
import { isSystemNote, stripSystemNotePrefix } from "@/lib/system-notes";
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
  // Backs both "Record payment" (isHumanStage-only) and the composer's
  // always-available attach button (SendProductButton) below, so it's
  // fetched unconditionally rather than gated to one of them.
  const orderableProducts = await prisma.product.findMany({
    where: { businessId: session.businessId, available: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true },
  });
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
                {order.status !== "VERIFIED" && (
                  <div className="pt-1">
                    <VerifyOrderButton
                      conversationId={conversation.id}
                      orderId={order.id}
                      productName={order.product.name}
                    />
                  </div>
                )}
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
    <MobileDetailsSheetProvider>
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
              panel is already visible as its own column then. Shares its
              open state with the StatusBanner's "View full details" link
              below (MobileDetailsSheetProvider, wrapping the whole page) —
              same Sheet, two doors into it. */}
          <MobileDetailsSheetTrigger
            render={
              <Button variant="outline" size="sm" className="lg:hidden">
                <Info />
                <span className="hidden sm:inline">Details</span>
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/customers/${conversation.customer.id}`} />}
          >
            <UserRound />
            <span className="hidden sm:inline">Customer profile</span>
          </Button>
          {isHumanStage && (
            <CreateOrderButton
              conversationId={conversation.id}
              products={orderableProducts.map((p) => ({ ...p, price: Number(p.price) }))}
            />
          )}
          {isHumanStage && <ReturnToAIButton conversationId={conversation.id} />}
          <ResolveConversationButton conversationId={conversation.id} requiresWarning={requiresResolveWarning} />
          {session.isAdmin && conversation.orders.length === 0 && (
            <DeleteConversationButton conversationId={conversation.id} />
          )}
        </div>
      }
    >
      {/*
        The whole pane — pipeline tracker, message list, reply box — is
        bounded to exactly the viewport at every breakpoint, not just `lg`:
        the message list gets the only internal scroll, and the composer is
        simply always on screen as a result, the same way WhatsApp/
        Messenger/Slack mobile never make you scroll to find the input.
        That only became possible everywhere once the right-hand panel
        stopped competing for space below the composer on mobile — it now
        lives in the header's "Details" Sheet instead of stacking under the
        thread, so there's nothing left in the page flow to leave room for.
        `lg` only changes the *columns* (chat next to a persistent Record/
        Facts/Orders panel instead of alone) — the height-bounding itself
        is identical at every size. Only this page opts into any of this;
        app-shell itself, and every other page's normal page-scrolling, is
        untouched.
      */}
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
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
            detailsTrigger={
              conversation.summary ? (
                <MobileDetailsSheetTrigger
                  render={
                    <button
                      type="button"
                      className="text-xs font-medium underline underline-offset-2 lg:hidden"
                    >
                      View full details
                    </button>
                  }
                />
              ) : undefined
            }
          />
        ) : (
          <PipelineTracker currentStage={conversation.currentStage} />
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex min-h-0 min-w-0 flex-col gap-5">
            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
                {conversation.messages.map((message) => {
                  // An internal record of what happened (e.g. "sent the
                  // approved template instead of a composed reply"), not
                  // something the customer actually received — rendering
                  // it as an ordinary chat bubble made it read as if the
                  // customer got this literal bracketed sentence, when
                  // they'd actually gotten Meta's real template text
                  // (confirmed in production, 2026-08-13).
                  if (isSystemNote(message.content)) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="max-w-[90%] rounded-md bg-muted/50 px-3 py-1.5 text-center text-xs text-muted-foreground italic">
                          {stripSystemNotePrefix(message.content!)}
                          <span className="ml-1.5 not-italic">· {message.createdAt.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SendProductButton
                        conversationId={conversation.id}
                        products={orderableProducts.map((p) => ({ id: p.id, name: p.name }))}
                      />
                      {isHumanStage && (
                        <p className="text-xs text-muted-foreground">
                          The AI will not respond here while it&apos;s awaiting/assigned to a human.
                        </p>
                      )}
                    </div>
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
    <MobileDetailsSheetPanel>{detailsPanel}</MobileDetailsSheetPanel>
    </MobileDetailsSheetProvider>
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
  detailsTrigger,
}: {
  tone: "urgent" | "assigned" | "muted";
  title: string;
  description?: string;
  detailsTrigger?: ReactNode;
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
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        {/* AI-written summaries vary a lot in length — an unclamped long
            one (a real complaint case, lots of detail) grows this banner
            tall enough to squeeze the chat pane below it down to nothing,
            since this div has no min-h-0 and flexbox won't shrink it below
            its content's natural height otherwise. Clamped to 3 lines: a
            quick-glance pointer, not the full detail — that's one scroll
            away in the actual transcript right below it. */}
        {description && (
          <div className="mt-0.5 line-clamp-3 text-sm opacity-90">{description}</div>
        )}
        {/* Full text lives in the Record card's "Summary" field — same
            value, already always visible on desktop, one tap away via the
            mobile Details Sheet. This just makes that connection obvious
            from the clamped text itself instead of relying on someone to
            separately notice the header's Info icon. Desktop doesn't need
            it: the Summary field is already on-screen there. */}
        {description && detailsTrigger && <div className="mt-1">{detailsTrigger}</div>}
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
