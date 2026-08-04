import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { relativeTime } from "@/lib/relative-time";
import { stageStyle } from "@/lib/stage-display";
import { clampMaxFollowups } from "@/lib/followup-sequence";
import { getBusinessConfig } from "@/lib/knowledge";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { q } = await searchParams;
  const query = q?.trim();

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
      },
      include: {
        conversations: {
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            updatedAt: true,
            currentStage: true,
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

  const rows = customers
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

      return {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        tags,
        conversationCount: customer.conversations.length,
        totalOrders: orders.length,
        totalSpent,
        lastActivity,
        stage: latestConversation?.currentStage ?? null,
        followupStep: activeFollowup?.step ?? null,
        followupDue: activeFollowup?.scheduledFor ?? null,
        followupEndLabel: lastFollowupEvent
          ? describeFollowupEnd(lastFollowupEvent.type, lastFollowupEvent.payload)
          : null,
      };
    })
    .sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0));

  return (
    <AppShell active="customers" title="Customers" description="Every customer who has ever messaged this business">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <form action="/customers" className="max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={query ?? ""} placeholder="Search by name or phone number" className="pl-9" />
          </div>
        </form>

        <Card className="py-0">
          {rows.length === 0 ? (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {query ? `No customers match "${query}".` : "No customers yet."}
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
                      <Link href={`/customers/${row.id}`} className="flex flex-col hover:underline">
                        <span>{row.name ?? row.phoneNumber}</span>
                        {row.name && (
                          <span className="text-xs font-normal text-muted-foreground">{row.phoneNumber}</span>
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
                          {row.followupStep !== null && row.followupDue ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {row.followupStep}/{maxFollowups} · next {relativeTime(row.followupDue)}
                                </span>
                              </div>
                              <Progress value={(row.followupStep / maxFollowups) * 100} className="w-24" />
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
