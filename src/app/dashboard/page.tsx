import Link from "next/link";
import { MessageCircleMore, UserRound, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { StatTile } from "@/components/stat-tile";
import { DateRangePicker } from "@/components/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HUMAN_STAGES, TERMINAL_STAGES, stageStyle } from "@/lib/stage-display";
import { clampMaxFollowups, FOLLOWUP_SEQUENCE } from "@/lib/followup-sequence";
import { relativeTime } from "@/lib/relative-time";
import { getBusinessNumbers } from "@/lib/whatsapp-numbers";
import { getNumberFilterCookie } from "@/lib/number-filter";
import { getDateRangeFilterCookie, resolveDateRange } from "@/lib/date-range-filter";

// Dashboard "Monitor" view (ARCHITECTURE.md §10, PRD 13.3): active
// conversations, today's counts, conversations awaiting a human. This is
// the missing other half of escalate_to_human (src/lib/actions.ts) — right
// now a conversation can reach HUMAN_REVIEW_REQUIRED with nothing pointing
// a human at it. This page is that pointer.

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // The number filter is a cookie (app-shell.tsx's switcher, via
  // /api/number-filter), not a URL param — it has to agree with what the
  // sidebar shows regardless of which page set it last. No cookie at all
  // (first visit) defaults to the business's primary number.
  const [business, numberFilter, dateRangeCookie] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: session.businessId },
      select: { whatsappPhoneNumberId: true, additionalWhatsappPhoneNumberIds: true, whatsappPhoneNumberLabels: true },
    }),
    getNumberFilterCookie(),
    getDateRangeFilterCookie("dashboard"),
  ]);
  const effectiveNumber =
    numberFilter === "all" ? undefined : (numberFilter ?? business.whatsappPhoneNumberId ?? undefined);

  // Applied to every count/list below so the stat tiles and the list agree
  // with each other once a number is selected — filtering the list alone
  // and leaving the tiles business-wide would make them contradict it.
  const businessScope = {
    customer: { businessId: session.businessId },
    ...(effectiveNumber ? { whatsappPhoneNumberId: effectiveNumber } : {}),
  };

  // Deliberately NOT applied to awaitingHumanCount, pendingPaymentCount, or
  // the conversation list below — those describe what's true right now,
  // not a reporting window. Only the two report-style tiles (Total
  // conversations, Sales Completed) respond to the picker; "All time" is
  // the default rather than "Today" specifically so a quiet day at this
  // business's current volume doesn't read as "something's broken" (see
  // date-range-filter.ts).
  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = resolveDateRange(dateRangeCookie, "all");
  const createdInRangeWhere = rangeStart && rangeEnd ? { createdAt: { gte: rangeStart, lt: rangeEnd } } : {};
  const updatedInRangeWhere = rangeStart && rangeEnd ? { updatedAt: { gte: rangeStart, lt: rangeEnd } } : {};

  const [conversations, awaitingHumanCount, pendingPaymentCount, totalConversationsCount, salesCompletedCount, businessConfig] =
    await Promise.all([
      prisma.conversation.findMany({
        where: { ...businessScope, NOT: { currentStage: { in: TERMINAL_STAGES } } },
        include: {
          customer: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          followups: { orderBy: { step: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.conversation.count({ where: { ...businessScope, currentStage: { in: HUMAN_STAGES } } }),
      prisma.conversation.count({
        where: { ...businessScope, currentStage: { in: ["WAITING_FOR_PAYMENT", "RECEIPT_RECEIVED"] } },
      }),
      prisma.conversation.count({ where: { ...businessScope, ...createdInRangeWhere } }),
      prisma.conversation.count({
        where: { ...businessScope, currentStage: "SALE_COMPLETED", ...updatedInRangeWhere },
      }),
      prisma.businessConfig.findUnique({ where: { businessId: session.businessId } }),
    ]);

  const maxFollowups = clampMaxFollowups(businessConfig?.maxFollowups ?? FOLLOWUP_SEQUENCE.length);
  const numberLabels = new Map(getBusinessNumbers(business).map((n) => [n.id, n.label]));
  // Only worth labeling rows under "All numbers" — once a specific branch
  // is selected, every row already belongs to it by definition, so the
  // badge would just repeat the same number on every row.
  const showNumberBadge = effectiveNumber === undefined;

  // Conversations needing a human float to the top regardless of recency —
  // that's the whole point of this view.
  const sorted = [...conversations].sort((a, b) => {
    const aUrgent = HUMAN_STAGES.includes(a.currentStage) ? 0 : 1;
    const bUrgent = HUMAN_STAGES.includes(b.currentStage) ? 0 : 1;
    return aUrgent - bUrgent;
  });

  return (
    <AppShell
      active="conversations"
      title="Conversations"
      description="Everything the AI is currently handling, plus anything waiting on you"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {/* Only the two report-style tiles below (Total conversations,
            Sales Completed) move with this picker — Awaiting Human and
            Pending Payment always show the live count, same as the list
            further down, regardless of what's picked here. */}
        <div className="flex justify-end">
          <DateRangePicker currentLabel={rangeLabel} redirectTo="/dashboard" scope="dashboard" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Awaiting a human"
            value={awaitingHumanCount}
            icon={AlertTriangle}
            tone={awaitingHumanCount > 0 ? "warn" : "default"}
          />
          <StatTile
            label="Pending payment"
            value={pendingPaymentCount}
            icon={Clock}
            tone="default"
          />
          <StatTile
            label="Total conversations"
            value={totalConversationsCount}
            icon={MessageCircleMore}
            tone="default"
          />
          <StatTile
            label="Sales completed"
            value={salesCompletedCount}
            icon={CheckCircle2}
            tone="good"
          />
        </div>

        {sorted.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No active conversations.
            </CardContent>
          </Card>
        ) : (
          <Card className="py-0">
            <div className="divide-y [&>a:first-child]:rounded-t-xl [&>a:last-child]:rounded-b-xl">
              {sorted.map((conversation) => {
                const latest = conversation.messages[0];
                const name = conversation.customer.name || conversation.customer.phoneNumber;
                const urgent = HUMAN_STAGES.includes(conversation.currentStage);
                const latestFollowup = conversation.followups[0];
                const followupInProgress =
                  latestFollowup && !latestFollowup.cancelled && latestFollowup.step <= maxFollowups
                    ? latestFollowup
                    : null;
                return (
                  <Link
                    key={conversation.id}
                    href={`/dashboard/${conversation.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        urgent
                          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {urgent ? <UserRound className="size-4" /> : name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {conversation.customer.name ?? conversation.customer.phoneNumber}
                        {conversation.customer.name && (
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            {conversation.customer.phoneNumber}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        {latest
                          ? `${latest.direction === "INBOUND" ? "Customer" : latest.sender === "AI" ? "AI" : "You"}: ${latest.content ?? "(no text)"}`
                          : "No messages yet"}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        {showNumberBadge && conversation.whatsappPhoneNumberId && (
                          <Badge variant="outline" className="font-medium text-muted-foreground">
                            {numberLabels.get(conversation.whatsappPhoneNumberId) ?? conversation.whatsappPhoneNumberId}
                          </Badge>
                        )}
                        {followupInProgress && (
                          <Badge variant="outline" className="font-medium text-muted-foreground">
                            Follow-up {followupInProgress.step}/{maxFollowups}
                          </Badge>
                        )}
                        <Badge className={`${stageStyle(conversation.currentStage)} border-transparent font-medium`}>
                          {conversation.currentStage.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(conversation.updatedAt)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
