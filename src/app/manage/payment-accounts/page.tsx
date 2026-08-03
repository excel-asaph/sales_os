import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createPaymentAccount, togglePaymentAccountActive, deletePaymentAccount } from "./actions";

export default async function PaymentAccountsPage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const accounts = await prisma.paymentAccount.findMany({
    where: { businessId: session.businessId },
    orderBy: { bankName: "asc" },
  });

  return (
    <AppShell active="payment-accounts" title="Payment accounts" description="Bank accounts the AI shares for payment">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Card className="py-0">
          {accounts.length === 0 ? (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No payment accounts yet.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account number</TableHead>
                  <TableHead>Account name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.bankName}</TableCell>
                    <TableCell className="tabular-nums">{account.accountNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{account.accountName}</TableCell>
                    <TableCell>
                      <Badge variant={account.active ? "default" : "secondary"}>
                        {account.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <form action={togglePaymentAccountActive}>
                          <input type="hidden" name="accountId" value={account.id} />
                          <SubmitButton
                            variant="outline"
                            size="sm"
                            pendingLabel="Updating…"
                            successMessage={account.active ? "Deactivated" : "Activated"}
                          >
                            {account.active ? "Deactivate" : "Activate"}
                          </SubmitButton>
                        </form>
                        <form action={deletePaymentAccount}>
                          <input type="hidden" name="accountId" value={account.id} />
                          <SubmitButton
                            variant="destructive"
                            size="sm"
                            pendingLabel="Deleting…"
                            successMessage="Account deleted"
                          >
                            Delete
                          </SubmitButton>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a payment account</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPaymentAccount} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bankName">Bank name</Label>
                  <Input id="bankName" name="bankName" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="accountNumber">Account number</Label>
                  <Input id="accountNumber" name="accountNumber" required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="accountName">Account name</Label>
                <Input id="accountName" name="accountName" required />
              </div>
              <SubmitButton className="self-start" pendingLabel="Adding…" successMessage="Account added">
                Add account
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
