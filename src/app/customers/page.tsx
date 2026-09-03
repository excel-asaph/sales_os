import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { relativeTime } from "@/lib/relative-time";
import { stageStyle } from "@/lib/stage-display";
import { STAGE_VALUES } from "@/lib/tools";
import type { ConversationStage } from "@/generated/prisma/client";
import { clampMaxFollowups } from "@/lib/followup-sequence";
import { getBusinessConfig } from "@/lib/knowledge";
import { getBusinessNumbers } from "@/lib/whatsapp-numbers";
import { getNumberFilterCookie, resolveEffectiveNumber } from "@/lib/number-filter";
import { AppShell } from "@/components/app-shell";
import { FilterDropdown } from "@/components/filter-dropdown";
import { FollowupCountdownBar } from "@/components/followup-countdown-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Follow-up sequence events worth surfacing once a sequence is no longer
// active, so the column doesn't just go blank the moment it stops — see
// src/worker/followup-worker.ts and src/lib/ingest-message.ts for where
// each of these is written.
const FOLLOWUP_END_EVENT_TYPES = [
  "FOLLOWUP_CANCELLED",
  "FOLLOWUP_SEQUENCE_EXHAUSTED",
  "FOLLOWUP_SEQUENCE_EXHAUSTED_ESCALATED",
] as const;

// FOLLOWUP_CANCELLED alone doesn't say why — it's written both when the
// customer actually replies (ingest-message.ts) AND when a scheduled
// check-in fires into a stage that no longer needs one, e.g. payment
// already verified (followup-worker.ts) — two unrelated situations
// sharing one event type. `reason` in the payload is what actually
// distinguishes them; a previous version of this page ignored it and
// labeled every cancellation "customer replied," which was wrong for
// anything that stopped for a stage/order reason instead.
function describeFollowupEnd(type: string, payload: unknown): string {
  if (type === "FOLLOWUP_SEQUENCE_EXHAUSTED") return "Sequence ended — no reply";
  if (type === "FOLLOWUP_SEQUENCE_EXHAUSTED_ESCALATED") return "Sequence ended — escalated to a human";
  if (type !== "FOLLOWUP_CANCELLED") return "Stopped";

  const reason = (payload as { reason?: string } | null)?.reason;
  if (reason === "customer_replied") return "Stopped — customer replied";
  if (reason === "order_already_verified") return "Stopped — payment already verified";
  if (reason === "business_paused") return "Stopped — follow-ups paused";
  if (reason?.startsWith("conversation_stage_")) {
    const stage = reason.slice("conversation_stage_".length).replaceAll("_", " ").toLowerCase();
    return `Stopped — moved to ${stage}`;
  }
  return "Stopped";
}

// Customers directory — the "browse everyone" complement to the Customer
// Profile page (/customers/[id]): before this, a customer was only
// reachable via one of their orders or conversations, with no way to just
// look someone up.
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; tag?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { q, stage: stageParam, tag: tagParam } = await searchParams;
  const query = q?.trim();
  // Same page-local URL-param pattern as `q` — stage/tag here describe a
  // customer's *latest conversation* and free-text Customer.tags, neither
  // of which Prisma can filter as part of the query below (tags is a Json
  // array, and "stage" means the first of an already-ordered relation), so
  // both are applied in JS after `rows` is built, same as the existing
  // lastActivity sort just below it.
  const activeStage =
    stageParam && (STAGE_VALUES as readonly string[]).includes(stageParam) ? (stageParam as ConversationStage) : undefined;
  const activeTag = tagParam?.trim() || undefined;

  // The number filter is a cookie (app-shell.tsx's switcher, via
  // /api/number-filter), not a URL param — it has to agree with what the
  // sidebar shows regardless of which page set it last. No cookie at all
  // (first visit) defaults to the business's primary number.
  const [business, numberFilter] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: session.businessId },
      select: { whatsappPhoneNumberId: true, additionalWhatsappPhoneNumberIds: true, whatsappPhoneNumberLabels: true },
    }),
    getNumberFilterCookie(),
  ]);
  const effectiveNumber = resolveEffectiveNumber(numberFilter, business);

  const [customers, config] = await Promise.all([
    prisma.customer.findMany({
      where: {
        businessId: session.businessId,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { phoneNumber: { contains: query } },
              ],
            }
          : {}),
        ...(effectiveNumber ? { conversations: { some: { whatsappPhoneNumberId: effectiveNumber } } } : {}),
      },
      include: {
        conversations: {
          // Scoped to the same number the top-level `where` above matched
          // on — without this, a customer would correctly show up under a
          // number filter (because they have *some* conversation on it) but
          // display orders/totals/stage aggregated from ALL their
          // conversations, including ones from the other number entirely.
          where: effectiveNumber ? { whatsappPhoneNumberId: effectiveNumber } : undefined,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            updatedAt: true,
            currentStage: true,
            whatsappPhoneNumberId: true,
            orders: { select: { status: true, expectedAmount: true } },
            followups: {
              where: { sent: false, cancelled: false },
              orderBy: { step: "asc" },
              take: 1,
            },
          },
        },
      },
    }),
    getBusinessConfig(session.businessId),
  ]);
  const maxFollowups = clampMaxFollowups(config.maxFollowups);
  const numberLabels = new Map(getBusinessNumbers(business).map((n) => [n.id, n.label]));
  // Only worth labeling rows under "All numbers" — once a specific branch
  // is selected, every row already belongs to it by definition, so the
  // badge would just repeat the same number on every row.
  const showNumberBadge = effectiveNumber === undefined;

  // Each customer's most-recent conversation is checked for a pending
  // follow-up; conversations without one fall back to the last time a
  // sequence ended, if any, so the column reads "why did it stop" rather
  // than just disappearing.
  const conversationsNeedingLastEvent = customers
    .map((c) => c.conversations[0])
    .filter((c): c is NonNullable<typeof c> => Boolean(c) && c.followups.length === 0)
    .map((c) => c.id);

  const lastEvents = conversationsNeedingLastEvent.length
    ? await prisma.event.findMany({
        where: { conversationId: { in: conversationsNeedingLastEvent }, type: { in: [...FOLLOWUP_END_EVENT_TYPES] } },
        orderBy: { createdAt: "desc" },
        distinct: ["conversationId"],
        select: { conversationId: true, type: true, payload: true },
      })
    : [];
  const lastEventByConversation = new Map(lastEvents.map((e) => [e.conversationId, e]));

  const allRows = customers
    .map((customer) => {
      const orders = customer.conversations.flatMap((c) => c.orders);
      const totalSpent = orders
        .filter((o) => o.status === "VERIFIED")
        .reduce((sum, o) => sum + Number(o.expectedAmount), 0);
      const lastActivity = customer.conversations.reduce<Date | null>(
        (latest, c) => (!latest || c.updatedAt > latest ? c.updatedAt : latest),
        null
      );
      const tags = Array.isArray(customer.tags) ? (customer.tags as string[]) : [];

      const latestConversation = customer.conversations[0] ?? null;
      const activeFollowup = latestConversation?.followups[0] ?? null;
      const lastFollowupEvent = latestConversation ? lastEventByConversation.get(latestConversation.id) : undefined;

      const numberLabel = latestConversation?.whatsappPhoneNumberId
        ? (numberLabels.get(latestConversation.whatsappPhoneNumberId) ?? latestConversation.whatsappPhoneNumberId)
        : null;

      return {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        numberLabel,
        tags,
        conversationCount: customer.conversations.length,
        totalOrders: orders.length,
        totalSpent,
        lastActivity,
        stage: latestConversation?.currentStage ?? null,
        followupStep: activeFollowup?.step ?? null,
        followupCreatedAt: activeFollowup?.createdAt ?? null,
        followupDue: activeFollowup?.scheduledFor ?? null,
        followupEndLabel: lastFollowupEvent
          ? describeFollowupEnd(lastFollowupEvent.type, lastFollowupEvent.payload)
          : null,
      };
    })
    .sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0));

  // Counted against allRows (not narrowed by activeStage/activeTag) so
  // every chip — including whichever one is currently selected — keeps
  // showing its real count instead of disappearing once clicked.
  const stageCounts = new Map<ConversationStage, number>();
  const tagCounts = new Map<string, number>();
  for (const row of allRows) {
    if (row.stage) stageCounts.set(row.stage, (stageCounts.get(row.stage) ?? 0) + 1);
    for (const tag of row.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  // Funnel order for stages (STAGE_VALUES), same as the Conversations page;
  // tags have no inherent order, so most-used first.
  const stageChips = STAGE_VALUES.map((stage) => ({ stage, count: stageCounts.get(stage) ?? 0 })).filter(
    (c) => c.count > 0
  );
  const tagChips = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const rows = allRows.filter(
    (row) => (!activeStage || row.stage === activeStage) && (!activeTag || row.tags.includes(activeTag))
  );

  // Preserves the other two filters (and the search query) when toggling
  // one — passing null for a key clears it instead of carrying it forward.
  function customersHref(overrides: { stage?: string | null; tag?: string | null }) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const stage = overrides.stage === null ? undefined : (overrides.stage ?? activeStage);
    const tag = overrides.tag === null ? undefined : (overrides.tag ?? activeTag);
    if (stage) params.set("stage", stage);
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return `/customers${qs ? `?${qs}` : ""}`;
  }

  return (
    <AppShell
      active="customers"
      title="Customers"
      description="Every customer who has ever messaged this business"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <form action="/customers" className="max-w-sm">
          {activeStage && <input type="hidden" name="stage" value={activeStage} />}
          {activeTag && <input type="hidden" name="tag" value={activeTag} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={query ?? ""} placeholder="Search by name or phone number" className="pl-9" />
          </div>
        </form>

        {(stageChips.length > 0 || tagChips.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {stageChips.length > 0 && (
              <FilterDropdown
                label="Stage"
                placeholder="All stages"
                activeValue={activeStage}
                clearHref={customersHref({ stage: null })}
                options={stageChips.map(({ stage, count }) => ({
                  value: stage,
                  label: stage.replaceAll("_", " "),
                  count,
                  href: customersHref({ stage }),
                }))}
              />
            )}
            {tagChips.length > 0 && (
              <FilterDropdown
                label="Tags"
                placeholder="All tags"
                activeValue={activeTag}
                clearHref={customersHref({ tag: null })}
                options={tagChips.map(({ tag, count }) => ({
                  value: tag,
                  label: tag,
                  count,
                  href: customersHref({ tag }),
                }))}
              />
            )}
          </div>
        )}

        <Card className="py-0">
          {rows.length === 0 ? (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {query ? `No customers match "${query}".` : activeStage || activeTag ? "No customers match this filter." : "No customers yet."}
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Conversations</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total spent</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/customers/${row.id}`} className="flex flex-col gap-1 hover:underline">
                        <span>{row.name ?? row.phoneNumber}</span>
                        {row.name && (
                          <span className="text-xs font-normal text-muted-foreground">{row.phoneNumber}</span>
                        )}
                        {showNumberBadge && row.numberLabel && (
                          <Badge variant="outline" className="w-fit font-normal text-muted-foreground">
                            {row.numberLabel}
                          </Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {row.tags.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.tags.map((tag) => (
                            <Badge key={tag} variant={tag === "Uninterested" ? "secondary" : "default"}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="min-w-40">
                      {row.stage ? (
                        <div className="flex flex-col gap-1">
                          <Badge className={`${stageStyle(row.stage)} w-fit border-transparent font-medium`}>
                            {row.stage.replaceAll("_", " ")}
                          </Badge>
                          {row.followupStep !== null && row.followupCreatedAt && row.followupDue ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {row.followupStep}/{maxFollowups} · next {relativeTime(row.followupDue)}
                                </span>
                              </div>
                              <FollowupCountdownBar
                                createdAt={row.followupCreatedAt.toISOString()}
                                scheduledFor={row.followupDue.toISOString()}
                                className="w-24"
                              />
                            </div>
                          ) : row.followupEndLabel ? (
                            <span className="text-xs text-muted-foreground">{row.followupEndLabel}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.conversationCount}</TableCell>
                    <TableCell className="text-muted-foreground">{row.totalOrders}</TableCell>
                    <TableCell className="tabular-nums">{formatNaira(row.totalSpent)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.lastActivity ? relativeTime(row.lastActivity) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
