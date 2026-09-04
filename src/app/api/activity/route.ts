import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * A cheap fingerprint of "has anything happened in this business yet".
 *
 * Exists so the dashboard can poll something small instead of re-rendering
 * the whole server component tree on a timer. The client (live-refresh.tsx)
 * calls this every few seconds and only triggers a real refresh when the
 * value actually changes, so an idle dashboard costs two indexed lookups per
 * tick rather than every query on the page.
 *
 * Two signals, because neither alone is sufficient:
 *  - the newest message id covers inbound messages arriving by webhook,
 *    which is the case this was built for;
 *  - the newest conversation updatedAt covers state that changes without a
 *    message, e.g. a stage change, an escalation, or a follow-up being
 *    cancelled.
 *
 * Scoped to the session's own business — this is behind auth and never takes
 * a businessId from the caller.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });

  const scope = { customer: { businessId: session.businessId } };

  const [newestMessage, newestConversation] = await Promise.all([
    prisma.message.findFirst({
      where: { conversation: scope },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
    prisma.conversation.findFirst({
      where: scope,
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  return Response.json(
    { v: `${newestMessage?.id ?? "none"}:${newestConversation?.updatedAt.getTime() ?? 0}` },
    { headers: { "Cache-Control": "no-store" } }
  );
}
