import { prisma } from "@/lib/prisma";
import { getSession, type SessionPayload } from "@/lib/auth";

// Every authenticated page needs the same three things to render the app
// shell (business name, agent name, admin flag) alongside its own
// business-scoped queries — centralized here so that isn't a repeated
// two-line Prisma lookup on every page.
export interface ViewerContext {
  session: SessionPayload;
  businessName: string;
  agentName: string;
}

export async function getViewerContext(): Promise<ViewerContext | null> {
  const session = await getSession();
  if (!session) return null;

  const agent = await prisma.humanAgent.findUnique({
    where: { id: session.agentId },
    select: { name: true, business: { select: { name: true } } },
  });

  return {
    session,
    businessName: agent?.business.name ?? "Antflow Sales OS",
    agentName: agent?.name ?? "Agent",
  };
}
