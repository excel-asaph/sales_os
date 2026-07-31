import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";
import { updateDeliveryPolicy } from "./actions";

// Module 9 (Dashboard), "Manage" surface, MVP-light per PRD 13.6 — the
// smallest real control the business owner needs right now: toggling
// today's delivery-order default themselves, instead of it being a value
// only reachable by editing the database directly. Admin-only — src/proxy.ts
// already redirects non-admins away, this is the belt-and-suspenders check.
export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const business = await prisma.business.findUnique({
    where: { id: session.businessId },
    include: { config: true },
  });

  if (!business) {
    return (
      <main style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 560 }}>
        <DashboardNav isAdmin={session.isAdmin} />
        <h1>Settings</h1>
        <p>No business is configured yet.</p>
      </main>
    );
  }

  const deliverBeforePayment = business.config?.deliverBeforePayment ?? false;

  return (
    <main style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 560 }}>
      <DashboardNav isAdmin={session.isAdmin} />
      <h1>{business.name} — Settings</h1>

      <form action={updateDeliveryPolicy}>
        <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 24 }}>
          <legend style={{ fontWeight: 600, padding: "0 8px" }}>Delivery order</legend>
          <p style={{ marginTop: 0, color: "#555" }}>
            Should the AI send the digital product before payment is confirmed, or wait for a verified payment
            first? This is today&apos;s default — the AI will still follow a customer&apos;s own lead and switch to
            payment-first for that customer if they ask for payment details directly, even when &quot;deliver
            first&quot; is selected below.
          </p>
          <label style={{ display: "block", marginBottom: 8 }}>
            <input type="radio" name="deliverBeforePayment" value="false" defaultChecked={!deliverBeforePayment} />{" "}
            Wait for verified payment before delivering (safer)
          </label>
          <label style={{ display: "block" }}>
            <input type="radio" name="deliverBeforePayment" value="true" defaultChecked={deliverBeforePayment} />{" "}
            Deliver the product first, then request payment (trust-building)
          </label>
        </fieldset>
        <button type="submit" style={{ marginTop: 16, padding: "8px 20px", fontSize: 16 }}>
          Save
        </button>
      </form>
    </main>
  );
}
