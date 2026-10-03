import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startSession } from "@/lib/workspaces";

// Antflow staff working inside other businesses (docs/V2_BUILD_PLAN.md,
// "platform-admin flag"). Staff status lives on User.isPlatformAdmin, is
// granted only by scripts/platform-admin.ts, and is read from the database
// on every check rather than trusted from the session cookie, so revoking
// it takes effect at once.

export const SUPPORT_ACCESS_EVENT = "SUPPORT_ACCESS_OPENED";

/** The signed-in person, if they are Antflow staff; otherwise null. */
export async function getPlatformAdmin() {
  const session = await getSession();
  if (!session?.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user?.isPlatformAdmin ? user : null;
}

export type OpenResult = "opened" | "not-staff" | "no-business" | "removed-from-team";

/**
 * Moves the staff member's session into a business. Their own membership is
 * used if they have one; otherwise a support membership is created (or
 * reused). Each opening is written to the event log with who and when, and
 * shown to the business on its Team page.
 *
 * A business that removed the person from its own team stays closed to
 * them: support access is not a way round a client's own decision.
 */
export async function openAsSupport(businessId: string): Promise<OpenResult> {
  const user = await getPlatformAdmin();
  if (!user) return "not-staff";
  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) return "no-business";

  let membership = await prisma.humanAgent.findFirst({ where: { businessId, userId: user.id } });

  if (membership && !membership.support && !membership.active) return "removed-from-team";

  if (!membership) {
    membership = await prisma.humanAgent.create({
      data: {
        businessId,
        userId: user.id,
        name: `${user.name} (Antflow support)`,
        // A support membership is only ever entered from /admin, never by
        // logging in, so it has no login of its own: no contact, and a
        // hash no password can match.
        passwordHash: "!",
        isAdmin: true,
        role: "ADMIN",
        support: true,
      },
    });
  } else if (membership.support && !membership.active) {
    membership = await prisma.humanAgent.update({ where: { id: membership.id }, data: { active: true } });
  }

  if (membership.support) {
    await prisma.event.create({
      data: {
        type: SUPPORT_ACCESS_EVENT,
        payload: { businessId, userId: user.id, email: user.email, membershipId: membership.id },
      },
    });
  }

  await startSession(membership);
  return "opened";
}
