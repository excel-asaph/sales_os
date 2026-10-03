import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionPayload } from "@/lib/auth";
import { listWorkspaces } from "@/lib/workspaces";

// Every authenticated page needs the same three things to render the app
// shell (business name, agent name, admin flag) alongside its own
// business-scoped queries — centralized here so that isn't a repeated
// two-line Prisma lookup on every page.
export interface ViewerContext {
  session: SessionPayload;
  businessName: string;
  agentName: string;
  /** Every business this person can switch to, current one included. */
  workspaces: Array<{ businessId: string; name: string }>;
  /** Antflow staff inside a business they only support (src/lib/support-access.ts). */
  isSupport: boolean;
  /** Antflow staff, who get the /admin link. Read from the database, never the cookie. */
  isPlatformAdmin: boolean;
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const session = await getSession();
  if (!session) return null;

  const [agent, workspaces] = await Promise.all([
    prisma.humanAgent.findUnique({
      where: { id: session.agentId },
      select: {
        name: true,
        support: true,
        business: { select: { name: true } },
        user: { select: { isPlatformAdmin: true } },
      },
    }),
    listWorkspaces(session),
  ]);

  return {
    session,
    businessName: agent?.business.name ?? "Antflow Sales OS",
    agentName: agent?.name ?? "Agent",
    workspaces,
    isSupport: agent?.support ?? false,
    isPlatformAdmin: agent?.user?.isPlatformAdmin ?? false,
  };
}

/**
 * For pages: the session, or off to /logout (and so the login page) if it
 * has ended. A cookie can outlive its session now that getSession checks the
 * membership in the database (src/lib/auth.ts), and the cookie has to be
 * cleared for the proxy to stop treating the browser as signed in.
 */
export async function requirePageSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/logout");
  return session;
}

/** As requirePageSession, for admin-only pages; a non-admin goes to /dashboard, as in src/proxy.ts. */
export async function requireAdminPage(): Promise<SessionPayload> {
  const session = await requirePageSession();
  if (!session.isAdmin) redirect("/dashboard");
  return session;
}
