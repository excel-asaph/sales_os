import Link from "next/link";
import { notFound } from "next/navigation";
import { Wallet, ShoppingBag, MessagesSquare, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { relativeTime } from "@/lib/relative-time";
import { AppShell } from "@/components/app-shell";
import { getNumberFilterCookie } from "@/lib/number-filter";
import { conversionBadge } from "@/lib/meta-conversions";
import { StatTile } from "@/components/stat-tile";
import { Field, ReferralDetails } from "@/components/referral-details";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stageStyle } from "@/lib/stage-display";
import { clampMaxFollowups, FOLLOWUP_SEQUENCE } from "@/lib/followup-sequence";

// Customer Profile (formerly discussed as "maximize Recent Orders into a
// full CRM page"): everything about one customer, across their entire
// history, in one place — not just their latest conversation. Reachable by
// clicking a customer's name from Home's Recent Orders or a conversation's
// Review page. Conversation-level detail (full message thread, per-turn
// facts) still lives on /dashboard/[id] — this page aggregates across all
// of a customer's conversations and links out to each one.
export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;

  // Two branches sharing one business — a customer who messaged both
  // numbers is really two separate branch relationships, not one merged
  // history, so this profile is scoped to whichever branch the sidebar has
  // selected (same cookie as Dashboard/Customers/Home), same as everywhere
  // else. "All numbers" is the only view that shows both together.
  const [business, numberFilter] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: session.businessId },
      select: { whatsappPhoneNumberId: true },
    }),
    getNumberFilterCookie(),
  ]);
  const effectiveNumber =
    numberFilter === "all" ? undefined : (numberFilter ?? business.whatsappPhoneNumberId ?? undefined);

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      conversations: {
        where: effectiveNumber ? { whatsappPhoneNumberId: effectiveNumber } : undefined,
        orderBy: { createdAt: "asc" },
        include: {
          orders: { include: { product: true }, orderBy: { createdAt: "desc" } },
          facts: { orderBy: { createdAt: "desc" } },
          followups: { orderBy: { step: "desc" }, take: 1 },
        },
      },
    },
  });

  // Not found, or belongs to a different business — same response either
  // way so this can't be used to probe which customer ids exist.
  if (!customer || customer.businessId !== session.businessId) return notFound();

  const businessConfig = await prisma.businessConfig.findUnique({
    where: { businessId: session.businessId },
  });
  const maxFollowups = clampMaxFollowups(businessConfig?.maxFollowups ?? FOLLOWUP_SEQUENCE.length);

  const { name, phoneNumber, tags, returningCustomer, preferredLanguage, country, customerSince } = customer;
  const customerTags = Array.isArray(tags) ? (tags as string[]) : [];

  const conversations = customer.conversations;
  const firstConversation = conversations[0];
  const mostRecentFirst = [...conversations].reverse();

  const allOrders = conversations.flatMap((c) => c.orders.map((order) => ({ ...order, conversationId: c.id })));
  const totalSpent = allOrders
    .filter((o) => o.status === "VERIFIED")
    .reduce((sum, o) => sum + Number(o.expectedAmount), 0);

  const allFacts = conversations
    .flatMap((c) => c.facts.map((fact) => ({ ...fact, conversationId: c.id })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  const lastActivity = conversations.reduce<Date | null>(
    (latest, c) => (!latest || c.updatedAt > latest ? c.updatedAt : latest),
    null
  );

  return (
    <AppShell
      active="customers"
      title={name ?? phoneNumber}
      description={name ? phoneNumber : undefined}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {(customerTags.length > 0 || returningCustomer) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {returningCustomer && (
              <Badge variant="outline" className="font-medium">
                Returning customer
              </Badge>
            )}
            {customerTags.map((tag) => (
              <Badge key={tag} variant={tag === "Uninterested" ? "secondary" : "default"} className="font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total spent" value={formatNaira(totalSpent)} icon={Wallet} tone="good" />
          <StatTile label="Orders" value={allOrders.length} icon={ShoppingBag} tone="default" />
          <StatTile label="Conversations" value={conversations.length} icon={MessagesSquare} tone="default" />
          <StatTile
            label="Customer since"
            value={customerSince.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            icon={CalendarDays}
            tone="default"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <Card className="py-0">
              <CardHeader className="py-5">
                <CardTitle>Conversations</CardTitle>
              </CardHeader>
              {mostRecentFirst.length === 0 ? (
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No conversations yet.
                </CardContent>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Last activity</TableHead>
                      <TableHead>Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mostRecentFirst.map((conversation) => {
                      const latestFollowup = conversation.followups[0];
                      const followupInProgress =
                        latestFollowup && !latestFollowup.cancelled && latestFollowup.step <= maxFollowups
                          ? latestFollowup
                          : null;
                      return (
                        <TableRow key={conversation.id} className="cursor-pointer">
                          <TableCell>
                            <Link href={`/dashboard/${conversation.id}`} className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge className={`${stageStyle(conversation.currentStage)} border-transparent font-medium`}>
                                  {conversation.currentStage.replaceAll("_", " ")}
                                </Badge>
                                {followupInProgress && (
                                  <Badge variant="outline" className="font-medium text-muted-foreground">
                                    Follow-up {followupInProgress.step}/{maxFollowups}
                                  </Badge>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {conversation.createdAt.toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {relativeTime(conversation.updatedAt)}
                          </TableCell>
                          <TableCell className="max-w-64 truncate text-muted-foreground">
                            {conversation.summary ?? "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>

            <Card className="py-0">
              <CardHeader className="py-5">
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              {allOrders.length === 0 ? (
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No orders yet.
                </CardContent>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders.map((order) => {
                      const metaBadge = conversionBadge(order.metaConversionReportReason);
                      return (
                      <TableRow key={order.id} className="cursor-pointer">
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/${order.conversationId}`} className="hover:underline">
                            {order.product.name}
                          </Link>
                        </TableCell>
                        <TableCell className="tabular-nums">{formatNaira(Number(order.expectedAmount))}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
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
                            {metaBadge && (
                              <Badge className={`${metaBadge.className} border-transparent font-medium`}>
                                {metaBadge.label}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{order.createdAt.toLocaleDateString()}</TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Field label="Phone" value={phoneNumber} />
                <Field label="Preferred language" value={preferredLanguage ?? "—"} />
                <Field label="Country" value={country ?? "—"} />
                <Field label="Last activity" value={lastActivity ? relativeTime(lastActivity) : "—"} />
              </CardContent>
            </Card>

            {firstConversation?.referral != null && (
              <Card>
                <CardHeader>
                  <CardTitle>Came from</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReferralDetails referral={firstConversation.referral as Record<string, string | undefined>} />
                </CardContent>
              </Card>
            )}

            {allFacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Remembered facts</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {allFacts.map((fact) => {
                    const payload = fact.payload as { key?: string; value?: string };
                    return (
                      <Link
                        key={fact.id}
                        href={`/dashboard/${fact.conversationId}`}
                        className="flex items-start gap-2 text-sm hover:opacity-80"
                      >
                        <Badge variant="secondary" className="mt-0.5 shrink-0">
                          {fact.kind}
                        </Badge>
                        <span className="min-w-0 text-muted-foreground">
                          <span className="font-medium text-foreground">{payload.key}</span>
                          {payload.value ? `: ${payload.value}` : ""}
                        </span>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
