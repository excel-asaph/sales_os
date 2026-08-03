import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { relativeTime } from "@/lib/relative-time";
import { AppShell } from "@/components/app-shell";
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

  const customers = await prisma.customer.findMany({
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
        select: { updatedAt: true, orders: { select: { status: true, expectedAmount: true } } },
      },
    },
  });

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
      return {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        tags,
        conversationCount: customer.conversations.length,
        totalOrders: orders.length,
        totalSpent,
        lastActivity,
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
