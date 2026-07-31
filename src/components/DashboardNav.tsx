import Link from "next/link";

// Shared across every protected page (/dashboard, /settings, /manage) so
// there's one consistent way to move between them and sign out — these
// pages otherwise have no shared layout (each is intentionally
// self-contained, matching the plain-inline-style pattern already used
// throughout this MVP).
export function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        fontSize: 14,
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: "1px solid #eee",
      }}
    >
      <Link href="/dashboard">Dashboard</Link>
      {isAdmin && <Link href="/settings">Settings</Link>}
      {isAdmin && <Link href="/manage">Manage</Link>}
      <a href="/logout" style={{ marginLeft: "auto", color: "#888" }}>
        Log out
      </a>
    </nav>
  );
}
