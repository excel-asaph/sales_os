import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";

// Dashboard "Manage" surface (ARCHITECTURE.md §10), MVP-light per PRD 13.6:
// direct CRUD on products and payment accounts, no workflow-builder UI.
export default async function ManagePage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  return (
    <main style={{ padding: 32, fontFamily: "sans-serif", maxWidth: 560 }}>
      <DashboardNav isAdmin={session.isAdmin} />
      <h1>Manage</h1>
      <ul style={{ fontSize: 16, lineHeight: 2 }}>
        <li>
          <Link href="/manage/products">Products</Link>
        </li>
        <li>
          <Link href="/manage/payment-accounts">Payment accounts</Link>
        </li>
      </ul>
    </main>
  );
}
