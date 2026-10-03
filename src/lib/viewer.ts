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
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const session = await getSession();
  if (!session) return null;

  const [agent, workspaces] = await Promise.all([
    prisma.humanAgent.findUnique({
      where: { id: session.agentId },
      select: { name: true, business: { select: { name: true } } },
    }),
    listWorkspaces(session),
  ]);

  return {
    session,
    businessName: agent?.business.name ?? "Antflow Sales OS",
    agentName: agent?.name ?? "Agent",
    workspaces,
  };
}
