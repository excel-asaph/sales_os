import Link from "next/link";
import {
  LayoutDashboard,
  MessagesSquare,
  BookUser,
  Package,
  Landmark,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Check,
  ChevronsUpDown,
  Phone,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getViewerContext } from "@/lib/viewer";
import { stageStyle } from "@/lib/stage-display";
import type { ConversationStage } from "@/generated/prisma/client";
import { getBusinessNumbers } from "@/lib/whatsapp-numbers";
import { getNumberFilterCookie } from "@/lib/number-filter";
import { Badge } from "@/components/ui/badge";
import { LiveRefresh } from "@/components/live-refresh";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavKey = "home" | "conversations" | "customers" | "trends" | "products" | "payment-accounts" | "team" | "settings" | "manage";

const HUMAN_STAGES = ["HUMAN_REVIEW_REQUIRED", "HUMAN_ASSIGNED"] as const;

// The app shell fetches its own viewer context and nav-badge data rather
// than taking it as props — every protected page just wraps its content in
// this and supplies a title, instead of repeating session/business
// lookups for the nav on every page.
export async function AppShell({
  active,
  title,
  description,
  actions,
  children,
}: {
  active: NavKey;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const viewer = await getViewerContext();
  if (!viewer) return null;

  const { session, businessName, agentName } = viewer;

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: session.businessId },
    select: {
      whatsappPhoneNumberId: true,
      additionalWhatsappPhoneNumberIds: true,
      whatsappPhoneNumberLabels: true,
    },
  });
  const numbers = getBusinessNumbers(business);
  // A cookie, not a page-passed prop — the selection has to survive
  // ordinary navigation between tabs, not just persist within one page's
  // own URL (see number-filter.ts).
  const numberFilter = await getNumberFilterCookie();
  // "all" is an explicit opt-out into the unified view; anything else
  // (including no param at all, e.g. on pages that don't filter) resolves
  // to the primary number — that's the business's main line, with any
  // additional numbers being deliberate opt-ins (e.g. a test number).
  const defaultNumberId = numbers[0]?.id;
  // Validated against this business's own numbers, not trusted verbatim —
  // the cookie is per-browser and outlives a business switch, so a stale id
  // from another business would otherwise filter the badge counts (and every
  // page) down to zero. Same reasoning as resolveEffectiveNumber
  // (number-filter.ts); done inline here since `numbers` is already loaded.
  const effectiveNumberId =
    numberFilter === "all" ? null : (numbers.find((n) => n.id === numberFilter)?.id ?? defaultNumberId);
  const selectedNumber = effectiveNumberId ? numbers.find((n) => n.id === effectiveNumberId) : undefined;

  const awaitingHumanWhere = {
    customer: { businessId: session.businessId },
    currentStage: { in: Array.from(HUMAN_STAGES) },
    ...(effectiveNumberId ? { whatsappPhoneNumberId: effectiveNumberId } : {}),
  };
  const [awaitingHuman, awaitingHumanCount] = await Promise.all([
    prisma.conversation.findMany({
      where: awaitingHumanWhere,
      include: { customer: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.conversation.count({ where: awaitingHumanWhere }),
  ]);

  const navItems: Array<{
    key: NavKey;
    href: string;
    label: string;
    icon: typeof MessagesSquare;
    adminOnly: boolean;
    badge?: number;
  }> = [
    {
      key: "home",
      href: "/home",
      label: "Home",
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      key: "conversations",
      href: "/dashboard",
      label: "Conversations",
      icon: MessagesSquare,
      adminOnly: false,
      badge: awaitingHumanCount > 0 ? awaitingHumanCount : undefined,
    },
    {
      key: "customers",
      href: "/customers",
      label: "Customers",
      icon: BookUser,
      adminOnly: false,
    },
    {
      key: "trends",
      href: "/trends",
      label: "Trends",
      icon: TrendingUp,
      adminOnly: false,
    },
    {
      key: "products",
      href: "/manage/products",
      label: "Products",
      icon: Package,
      adminOnly: true,
    },
    {
      key: "payment-accounts",
      href: "/manage/payment-accounts",
      label: "Payment accounts",
      icon: Landmark,
      adminOnly: true,
    },
    {
      key: "team",
      href: "/manage/team",
      label: "Team",
      icon: Users,
      adminOnly: true,
    },
    {
      key: "settings",
      href: "/settings",
      label: "Settings",
      icon: SettingsIcon,
      adminOnly: true,
    },
  ];

  const activeHref = navItems.find((item) => item.key === active)?.href ?? "/dashboard";
  const showNumberSwitcher = numbers.length > 1;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 shrink-0 justify-center px-4 py-0 group-data-[collapsible=icon]:px-2">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground group-data-[collapsible=icon]:size-8">
              {businessName.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold">{businessName}</span>
              <span className="text-xs text-muted-foreground">Sales OS</span>
            </div>
          </div>
        </SidebarHeader>
        {showNumberSwitcher && (
          <div className="px-3 pb-2 group-data-[collapsible=icon]:px-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex h-9 w-full items-center gap-2 rounded-lg border bg-sidebar px-2.5 text-sm outline-none hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                  />
                }
              >
                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-left font-medium group-data-[collapsible=icon]:hidden">
                  {selectedNumber?.label ?? "All numbers"}
                </span>
                <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {/* A plain <a>, not <Link> — this hits a Route Handler that
                    sets a cookie and redirects, not a page. Next's <Link>
                    does a client-side soft navigation that can reuse a
                    cached render of the destination from before the cookie
                    changed, since the URL itself is unchanged; a real
                    anchor always forces a fresh full-page load, which is
                    the only way to reliably see the new cookie on the very
                    first click. */}
                <DropdownMenuItem
                  className="justify-between"
                  render={
                    <a href={`/api/number-filter?value=all&redirectTo=${encodeURIComponent(activeHref)}`} />
                  }
                >
                  <span>All numbers</span>
                  {!selectedNumber && <Check className="size-3.5" />}
                </DropdownMenuItem>
                {numbers.map((number) => (
                  <DropdownMenuItem
                    key={number.id}
                    className="justify-between"
                    render={
                      <a
                        href={`/api/number-filter?value=${number.id}&redirectTo=${encodeURIComponent(activeHref)}`}
                      />
                    }
                  >
                    <span className="truncate">{number.label}</span>
                    {selectedNumber?.id === number.id && <Check className="size-3.5 shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <SidebarContent className="py-2">
          <SidebarGroup className="px-3 py-2">
            <SidebarGroupLabel className="px-1 pb-1">Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {navItems
                  .filter((item) => !item.adminOnly || session.isAdmin)
                  .map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={active === item.key}
                        tooltip={item.label}
                        className="h-10 gap-3 px-3"
                        render={<Link href={item.href} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.badge != null && (
                        <SidebarMenuBadge className="bg-destructive text-destructive-foreground">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <Separator />
        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Sign out"
                className="h-12 gap-3 px-3"
                render={<a href="/logout" />}
              >
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">
                    {agentName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col text-left leading-tight">
                  <span className="truncate text-sm font-medium">{agentName}</span>
                  <span className="text-xs text-muted-foreground">Sign out</span>
                </div>
                <LogOut className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="h-svh">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
          <NotificationBell conversations={awaitingHuman} count={awaitingHumanCount} />
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-6 md:p-8">{children}</div>
        {/* Mounted once here rather than per page, so every signed-in view
            picks up new customer messages: the conversation thread, the
            queue counts in the sidebar, and the notification bell above. */}
        <LiveRefresh />
      </SidebarInset>
    </SidebarProvider>
  );
}

interface AwaitingConversation {
  id: string;
  updatedAt: Date;
  currentStage: string;
  customer: { name: string | null; phoneNumber: string };
}

// A lightweight bell, not a full notification center: it surfaces the same
// "needs a human" signal already driving the sidebar badge, just reachable
// from anywhere, in a side panel (ElevenLabs-style) rather than a cramped
// dropdown. No read/unread state — at this team size the badge count
// itself (which clears the moment a conversation is resolved) is the
// signal, not a persisted per-agent inbox.
function NotificationBell({
  conversations,
  count,
}: {
  conversations: AwaitingConversation[];
  count: number;
}) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell className="size-4.5" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
        <span className="sr-only">Notifications</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {count > 0
              ? `${count} conversation${count === 1 ? "" : "s"} need a human`
              : "Nothing needs your attention right now."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
          {conversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/dashboard/${conversation.id}`}
                className="flex flex-col gap-1 rounded-xl border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {conversation.customer.name ?? conversation.customer.phoneNumber}
                    {conversation.customer.name && (
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {conversation.customer.phoneNumber}
                      </span>
                    )}
                  </span>
                  <Badge
                    className={`${stageStyle(conversation.currentStage as ConversationStage)} border-transparent font-medium`}
                  >
                    {conversation.currentStage.replaceAll("_", " ")}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Last updated {conversation.updatedAt.toLocaleString()}
                </span>
              </Link>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
