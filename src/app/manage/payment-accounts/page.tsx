import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";
import { createPaymentAccount, togglePaymentAccountActive, deletePaymentAccount } from "./actions";

export default async function PaymentAccountsPage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const accounts = await prisma.paymentAccount.findMany({
    where: { businessId: session.businessId },
    orderBy: { bankName: "asc" },
  });

  return (
    <main style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <DashboardNav isAdmin={session.isAdmin} />
      <h1>Payment accounts</h1>

      {accounts.length === 0 ? (
        <p style={{ color: "#666" }}>No payment accounts yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "6px 8px" }}>Bank</th>
              <th style={{ padding: "6px 8px" }}>Account number</th>
              <th style={{ padding: "6px 8px" }}>Account name</th>
              <th style={{ padding: "6px 8px" }}>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "6px 8px" }}>{account.bankName}</td>
                <td style={{ padding: "6px 8px" }}>{account.accountNumber}</td>
                <td style={{ padding: "6px 8px" }}>{account.accountName}</td>
                <td style={{ padding: "6px 8px" }}>{account.active ? "Active" : "Inactive"}</td>
                <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                  <form action={togglePaymentAccountActive} style={{ display: "inline" }}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <button type="submit" style={{ marginRight: 8 }}>
                      {account.active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                  <form action={deletePaymentAccount} style={{ display: "inline" }}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <button type="submit">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Add a payment account</h2>
      <form action={createPaymentAccount}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Bank name
          <input type="text" name="bankName" required style={{ display: "block", width: "100%", padding: 6 }} />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          Account number
          <input
            type="text"
            name="accountNumber"
            required
            style={{ display: "block", width: "100%", padding: 6 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          Account name
          <input type="text" name="accountName" required style={{ display: "block", width: "100%", padding: 6 }} />
        </label>
        <button type="submit" style={{ padding: "8px 16px" }}>
          Add account
        </button>
      </form>
    </main>
  );
}
