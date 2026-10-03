import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPlatformAdmin, SUPPORT_ACCESS_EVENT } from "@/lib/support-access";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { openBusiness } from "./actions";

const ERRORS: Record<string, string> = {
  "not-staff": "Only Antflow staff can open other businesses.",
  "no-business": "That business no longer exists.",
  "removed-from-team":
    "This business removed you from its team, so support access is closed to you. Ask them to add you back.",
};

// Antflow's own view of every business on the platform (docs/V2_BUILD_PLAN.md,
// Phase 1 "platform-admin flag"). Not found, rather than forbidden, for
// anyone else, so the page doesn't advertise itself.
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const staff = await getPlatformAdmin();
  if (!staff) notFound();
  const { error } = await searchParams;

  const [businesses, recentConversations, visits] = await Promise.all([
    prisma.business.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        metaConnection: { select: { webhookKey: true } },
        _count: {
          select: {
            humanAgents: { where: { active: true, support: false } },
            channels: { where: { status: "ACTIVE" } },
            products: { where: { available: true } },
          },
        },
      },
    }),
    prisma.$queryRaw<Array<{ business_id: string; count: bigint }>>`
      SELECT c.business_id, COUNT(*) AS count
      FROM conversations v JOIN customers c ON c.id = v.customer_id
      WHERE v.created_at > NOW() - INTERVAL '7 days'
      GROUP BY c.business_id`,
    prisma.event.findMany({ where: { type: SUPPORT_ACCESS_EVENT }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  const conversationsByBusiness = new Map(recentConversations.map((r) => [r.business_id, Number(r.count)]));
  const nameById = new Map(businesses.map((b) => [b.id, b.name]));

  function whatsappStatus(business: (typeof businesses)[number]) {
    if (business.metaConnection?.webhookKey) return { label: "Own Meta App", variant: "default" as const };
    if (business._count.channels > 0) return { label: "Shared address (v1)", variant: "secondary" as const };
    return { label: "Not connected", variant: "outline" as const };
  }

  return (
    <AppShell active="admin" title="Antflow admin" description="Every business on the platform">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {error && ERRORS[error] && (
          <p className="rounded-lg border border-destructive/40 px-4 py-3 text-sm text-destructive">{ERRORS[error]}</p>
        )}

        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead className="text-right">Numbers</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Team</TableHead>
                <TableHead className="text-right">Chats, 7 days</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => {
                const status = whatsappStatus(business);
                return (
                  <TableRow key={business.id}>
                    <TableCell>
                      <div className="font-medium">{business.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Since {business.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{business._count.channels}</TableCell>
                    <TableCell className="text-right">{business._count.products}</TableCell>
                    <TableCell className="text-right">{business._count.humanAgents}</TableCell>
                    <TableCell className="text-right">{conversationsByBusiness.get(business.id) ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <form action={openBusiness}>
                        <input type="hidden" name="businessId" value={business.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Open
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent support visits</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm">
            {visits.length === 0 && <p className="text-muted-foreground">No one has opened a business as support yet.</p>}
            {visits.map((visit) => {
              const payload = visit.payload as { businessId?: string; email?: string } | null;
              return (
                <div key={visit.id} className="flex justify-between gap-4">
                  <span>
                    {payload?.email ?? "Unknown"} opened{" "}
                    <strong>{nameById.get(payload?.businessId ?? "") ?? "a deleted business"}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    {visit.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
