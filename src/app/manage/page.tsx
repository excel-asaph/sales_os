import Link from "next/link";
import { Package, Landmark, Users, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

// Dashboard "Manage" surface (ARCHITECTURE.md §10), MVP-light per PRD 13.6:
// direct CRUD on products and payment accounts, no workflow-builder UI.
export default async function ManagePage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const items = [
    {
      href: "/manage/products",
      label: "Products",
      description: "What the AI can sell, pricing, and availability",
      icon: Package,
    },
    {
      href: "/manage/payment-accounts",
      label: "Payment accounts",
      description: "Bank accounts the AI shares for payment",
      icon: Landmark,
    },
    {
      href: "/manage/team",
      label: "Team",
      description: "Who can log in to this dashboard",
      icon: Users,
    },
  ];

  return (
    <AppShell active="manage" title="Manage" description="Products, payment accounts, and your team">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <item.icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
