import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const agents = await prisma.humanAgent.findMany({
    where: { businessId: session.businessId },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell active="team" title="Team" description="Who can log in to this dashboard">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const isSelf = agent.id === session.agentId;
                return (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.name}
                      {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{agent.contact ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={agent.isAdmin ? "default" : "secondary"}>
                        {agent.isAdmin ? "Admin" : "Member"}
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
                            successMessage={agent.isAdmin ? "Made a member" : "Made an admin"}
                          >
                            {agent.isAdmin ? "Make member" : "Make admin"}
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
                  <Label htmlFor="contact">Login</Label>
                  <Input id="contact" name="contact" required placeholder="Whatever they'll sign in with" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
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
