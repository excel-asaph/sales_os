import Link from "next/link";
import { Wallet, ShoppingBag, UserPlus, Percent, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { AppShell } from "@/components/app-shell";
import { StatTile } from "@/components/stat-tile";
import { RevenueChart } from "@/components/revenue-chart";
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

const CHART_DAYS = 14;

// Home: the bird's-eye view Conversations doesn't give — revenue, orders,
// and which ads actually drove them. Everything here reads from data
// already captured for other reasons (Order rows from payment
// verification, Conversation.referral from the WhatsApp webhook) — this
// page is aggregation, not new tracking.
export default async function HomePage() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const chartStart = new Date(now);
  chartStart.setDate(chartStart.getDate() - (CHART_DAYS - 1));
  chartStart.setHours(0, 0, 0, 0);

  const orderBusinessScope = {
    conversation: { customer: { businessId: session.businessId } },
  };

  const [verifiedThisMonth, verifiedForChart, leadsThisMonth, recentOrders, conversationsWithReferral] =
    await Promise.all([
      prisma.order.findMany({
        where: { ...orderBusinessScope, status: "VERIFIED", verifiedAt: { gte: startOfMonth } },
        select: { expectedAmount: true },
      }),
      prisma.order.findMany({
        where: { ...orderBusinessScope, status: "VERIFIED", verifiedAt: { gte: chartStart } },
        select: { expectedAmount: true, verifiedAt: true },
      }),
      prisma.conversation.count({
        where: { customer: { businessId: session.businessId }, createdAt: { gte: startOfMonth } },
      }),
      prisma.order.findMany({
        where: orderBusinessScope,
        include: { product: true, conversation: { include: { customer: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.conversation.findMany({
        where: { customer: { businessId: session.businessId } },
        select: { id: true, referral: true, orders: { where: { status: "VERIFIED" }, select: { id: true } } },
      }),
    ]);

  const revenueThisMonth = verifiedThisMonth.reduce((sum, o) => sum + Number(o.expectedAmount), 0);
  const ordersThisMonth = verifiedThisMonth.length;
  const conversionRate = leadsThisMonth > 0 ? (ordersThisMonth / leadsThisMonth) * 100 : 0;

  const chartData = buildDailyChartData(verifiedForChart, chartStart, CHART_DAYS);
  const adBreakdown = buildAdBreakdown(conversationsWithReferral);

  return (
    <AppShell active="home" title="Home" description="How the business is doing, at a glance">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Revenue this month" value={formatNaira(revenueThisMonth)} icon={Wallet} tone="good" />
          <StatTile label="Orders this month" value={ordersThisMonth} icon={ShoppingBag} tone="default" />
          <StatTile label="New leads this month" value={leadsThisMonth} icon={UserPlus} tone="default" />
          <StatTile label="Conversion rate" value={`${conversionRate.toFixed(0)}%`} icon={Percent} tone="default" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue, last {CHART_DAYS} days</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="py-0">
            <CardHeader className="py-5">
              <CardTitle>Recent orders</CardTitle>
            </CardHeader>
            {recentOrders.length === 0 ? (
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No orders yet.
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer">
                      <TableCell className="font-medium">
                        <Link
                          href={`/customers/${order.conversation.customer.id}`}
                          className="flex flex-col hover:underline"
                        >
                          <span>{order.conversation.customer.name ?? order.conversation.customer.phoneNumber}</span>
                          {order.conversation.customer.name && (
                            <span className="text-xs font-normal text-muted-foreground">
                              {order.conversation.customer.phoneNumber}
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{order.product.name}</TableCell>
                      <TableCell className="tabular-nums">{formatNaira(Number(order.expectedAmount))}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.createdAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Where leads come from</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {adBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No ad-attributed conversations yet — leads that start from a WhatsApp ad or post show up
                  here.
                </p>
              ) : (
                adBreakdown.map((source) => (
                  <div key={source.label} className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium" title={source.label}>
                        {source.label}
                      </span>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {source.leads} lead{source.leads === 1 ? "" : "s"} · {source.sales} sale
                      {source.sales === 1 ? "" : "s"}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function buildDailyChartData(
  orders: { expectedAmount: unknown; verifiedAt: Date | null }[],
  start: Date,
  days: number
) {
  const totals = new Map<string, number>();
  for (const order of orders) {
    if (!order.verifiedAt) continue;
    const key = order.verifiedAt.toDateString();
    totals.set(key, (totals.get(key) ?? 0) + Number(order.expectedAmount));
  }

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return {
      label: date.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      fullLabel: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long" }),
      value: totals.get(date.toDateString()) ?? 0,
    };
  });
}

interface ReferralShape {
  headline?: string;
  source_url?: string;
  source_type?: string;
}

function buildAdBreakdown(
  conversations: { referral: unknown; orders: { id: string }[] }[]
): Array<{ label: string; url?: string; leads: number; sales: number }> {
  const groups = new Map<string, { label: string; url?: string; leads: number; sales: number }>();

  for (const conversation of conversations) {
    if (!conversation.referral) continue;
    const referral = conversation.referral as ReferralShape;
    const label = referral.headline || referral.source_type || "Ad / post";
    const key = label;
    const existing = groups.get(key) ?? { label, url: referral.source_url, leads: 0, sales: 0 };
    existing.leads += 1;
    existing.sales += conversation.orders.length > 0 ? 1 : 0;
    groups.set(key, existing);
  }

  return Array.from(groups.values()).sort((a, b) => b.leads - a.leads);
}
