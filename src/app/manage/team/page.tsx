import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/viewer";
import { isAdminMembership } from "@/lib/workspaces";
import { SUPPORT_ACCESS_EVENT } from "@/lib/support-access";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAgent, toggleAgentActive, toggleAgentAdmin } from "./actions";

// The only way to add a teammate before this page existed was
// `npm run create-admin` on a machine with DB access — this closes that
// gap. No public sign-up route still exists on purpose (see
// login/actions.ts); an admin has to provision every login from here.
export default async function TeamPage() {
  const session = await requireAdminPage();

  const [agents, supportVisits, business] = await Promise.all([
    prisma.humanAgent.findMany({
      where: { businessId: session.businessId, support: false },
      orderBy: { name: "asc" },
    }),
    // Every time Antflow staff opened this business (src/lib/support-access.ts),
    // shown here so the business can always see when we've been in.
    prisma.event.findMany({
      where: { type: SUPPORT_ACCESS_EVENT, payload: { path: ["businessId"], equals: session.businessId } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.business.findUniqueOrThrow({ where: { id: session.businessId }, select: { timezone: true } }),
  ]);

  return (
    <AppShell active="team" title="Team" description="Who can log in to this dashboard">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const isSelf = agent.id === session.agentId;
                const isAdmin = isAdminMembership(agent);
                return (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.name}
                      {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{agent.contact ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={isAdmin ? "default" : "secondary"}>
                        {agent.role === "OWNER" ? "Owner" : isAdmin ? "Admin" : "Member"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.active ? "default" : "secondary"}>
                        {agent.active ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <form action={toggleAgentAdmin}>
                          <input type="hidden" name="agentId" value={agent.id} />
                          <SubmitButton
                            variant="outline"
                            size="sm"
                            pendingLabel="Updating…"
                            successMessage={isAdmin ? "Made a member" : "Made an admin"}
                          >
                            {isAdmin ? "Make member" : "Make admin"}
                          </SubmitButton>
                        </form>
                        <form action={toggleAgentActive}>
                          <input type="hidden" name="agentId" value={agent.id} />
                          <SubmitButton
                            variant={agent.active ? "destructive" : "outline"}
                            size="sm"
                            pendingLabel="Updating…"
                            successMessage={agent.active ? "Deactivated" : "Reactivated"}
                          >
                            {agent.active ? "Deactivate" : "Reactivate"}
                          </SubmitButton>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {supportVisits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Antflow support access</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 text-sm">
              <p className="text-muted-foreground">
                The last times Antflow staff opened this workspace to help with setup or support.
              </p>
              {supportVisits.map((visit) => (
                <div key={visit.id} className="flex justify-between gap-4">
                  <span>{(visit.payload as { email?: string } | null)?.email ?? "Antflow staff"}</span>
                  <span className="text-muted-foreground">{visit.createdAt.toLocaleString("en-GB", { timeZone: business.timezone })}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Add a teammate</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAgent} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact">Email</Label>
                  <Input id="contact" name="contact" type="email" required placeholder="What they'll sign in with" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
                <p className="text-xs text-muted-foreground">
                  If this email already signs in to Antflow for another business, they keep their own password.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <RadioGroup name="role" defaultValue="member" className="grid-cols-2">
                  <Label className="flex items-start gap-3 rounded-lg border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5">
                    <RadioGroupItem value="member" className="mt-0.5" />
                    <span className="flex flex-col gap-0.5 text-sm font-normal">
                      <span className="font-medium">Member</span>
                      <span className="text-muted-foreground">Conversations only</span>
                    </span>
                  </Label>
                  <Label className="flex items-start gap-3 rounded-lg border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5">
                    <RadioGroupItem value="admin" className="mt-0.5" />
                    <span className="flex flex-col gap-0.5 text-sm font-normal">
                      <span className="font-medium">Admin</span>
                      <span className="text-muted-foreground">Full access, incl. Settings &amp; Manage</span>
                    </span>
                  </Label>
                </RadioGroup>
              </div>
              <SubmitButton className="self-start" pendingLabel="Adding…" successMessage="Teammate added">
                Add teammate
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
