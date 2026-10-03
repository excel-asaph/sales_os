import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  newSessionExpiry,
  verifyPassword,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  type SessionPayload,
} from "@/lib/auth";
import type { HumanAgent } from "@/generated/prisma/client";

// v2 login: a person (User) signs in once and works inside one of the
// businesses they belong to (a HumanAgent row is that membership). Kept out
// of auth.ts because auth.ts is also loaded by src/proxy.ts, which must
// stay free of database work.

/** Which business someone was last in, so login returns them there. */
const LAST_WORKSPACE_COOKIE = "antflow_workspace";
const LAST_WORKSPACE_MAX_AGE = 60 * 60 * 24 * 365;

type Membership = Pick<HumanAgent, "id" | "businessId" | "isAdmin" | "role" | "userId">;

/** `role` is the v2 answer; isAdmin covers a row the backfill hasn't reached. */
export function isAdminMembership(membership: Pick<HumanAgent, "isAdmin" | "role">): boolean {
  return membership.role ? membership.role !== "AGENT" : membership.isAdmin;
}

/**
 * Checks a login and returns the membership to start the session in, or
 * null. An email with a User behind it is the v2 path. Without one, falls
 * back to v1's lookup by HumanAgent.contact, but only for rows not yet
 * linked to a User: that covers the minutes between deploying v2 and
 * running scripts/v2-backfill.ts, when no User rows exist yet, without
 * letting anyone get round a v2 password by using their v1 one.
 */
export async function authenticate(login: string, password: string): Promise<Membership | null> {
  const user = await prisma.user.findUnique({
    where: { email: login.toLowerCase() },
    include: {
      memberships: {
        where: { active: true },
        orderBy: { business: { createdAt: "asc" } },
      },
    },
  });

  if (user) {
    if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) return null;
    if (user.memberships.length === 0) return null;
    const store = await cookies();
    const last = store.get(LAST_WORKSPACE_COOKIE)?.value;
    return user.memberships.find((m) => m.businessId === last) ?? user.memberships[0];
  }

  const agent = await prisma.humanAgent.findFirst({ where: { contact: login, active: true, userId: null } });
  if (!agent || !(await verifyPassword(password, agent.passwordHash))) return null;
  return agent;
}

/** Writes the session cookie for a membership, and remembers the business. */
export async function startSession(membership: Membership): Promise<void> {
  const token = createSessionToken({
    agentId: membership.id,
    businessId: membership.businessId,
    isAdmin: isAdminMembership(membership),
    ...(membership.userId ? { userId: membership.userId } : {}),
    exp: newSessionExpiry(),
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  store.set(LAST_WORKSPACE_COOKIE, membership.businessId, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: LAST_WORKSPACE_MAX_AGE,
  });
}

/**
 * Every business this session's person can switch to, current one
 * included, oldest first. Empty for a session with no person behind it.
 */
export async function listWorkspaces(session: SessionPayload): Promise<Array<{ businessId: string; name: string }>> {
  if (!session.userId) return [];
  const memberships = await prisma.humanAgent.findMany({
    where: { userId: session.userId, active: true },
    select: { businessId: true, business: { select: { name: true } } },
    orderBy: { business: { createdAt: "asc" } },
  });
  return memberships.map((m) => ({ businessId: m.businessId, name: m.business.name }));
}

/**
 * Moves the session into another of the person's businesses. Returns false,
 * changing nothing, if they have no active membership there.
 */
export async function switchWorkspace(session: SessionPayload, businessId: string): Promise<boolean> {
  if (!session.userId) return false;
  const membership = await prisma.humanAgent.findFirst({
    where: { userId: session.userId, businessId, active: true },
  });
  if (!membership) return false;
  await startSession(membership);
  return true;
}
