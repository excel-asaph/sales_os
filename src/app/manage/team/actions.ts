"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession, hashPassword } from "@/lib/auth";
import { isAdminMembership } from "@/lib/workspaces";
import type { HumanAgent } from "@/generated/prisma/client";

async function requireOwnedAgent(agentId: string, businessId: string) {
  const agent = await prisma.humanAgent.findUniqueOrThrow({ where: { id: agentId } });
  if (agent.businessId !== businessId) throw new Error("Agent does not belong to this business");
  return agent;
}

// There's no public sign-up route (see login/actions.ts) — the whole
// system relies on there always being at least one active admin able to
// provision everyone else. Without this, an admin could deactivate or
// demote themselves (or the only other admin) and lock the business out
// of its own dashboard with no recovery path short of a DB script.
async function assertNotLastActiveAdmin(agent: HumanAgent) {
  if (!agent.isAdmin || !agent.active) return;
  const otherActiveAdmins = await prisma.humanAgent.count({
    where: { businessId: agent.businessId, isAdmin: true, active: true, id: { not: agent.id } },
  });
  if (otherActiveAdmins === 0) {
    throw new Error("Can't remove the last active admin — promote someone else first.");
  }
}

export async function createAgent(formData: FormData) {
  const session = await requireAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("contact") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const isAdmin = formData.get("role") === "admin";
  if (!name || !email || !password) return;

  // v2: the login belongs to a User, and this row is their membership of
  // this business. Someone who already signs in for another business is
  // linked, not duplicated, and keeps their own password: the one typed
  // here is only used for a brand-new login.
  const user = await prisma.user.findUnique({ where: { email } });

  // Re-adding an existing teammate by mistake is the common case; checking
  // first avoids a raw unique-constraint crash. Matches on contact too, for
  // a row the backfill (scripts/v2-backfill.ts) hasn't linked to a User.
  const existing = await prisma.humanAgent.findFirst({
    where: {
      businessId: session.businessId,
      OR: [{ contact: email }, ...(user ? [{ userId: user.id }] : [])],
    },
  });
  if (existing) return;

  const passwordHash = user?.passwordHash ?? (await hashPassword(password));
  await prisma.humanAgent.create({
    data: {
      business: { connect: { id: session.businessId } },
      name,
      contact: email,
      // v1's own copy, kept in step so rolling back to v1 still logs them in.
      passwordHash,
      isAdmin,
      role: isAdmin ? "ADMIN" : "AGENT",
      user: user
        ? { connect: { id: user.id } }
        : { create: { email, name, passwordHash } },
    },
  });

  revalidatePath("/manage/team");
}

export async function toggleAgentActive(formData: FormData) {
  const session = await requireAdminSession();
  const agentId = String(formData.get("agentId"));
  const agent = await requireOwnedAgent(agentId, session.businessId);

  if (agent.active) {
    await assertNotLastActiveAdmin(agent);
  }

  await prisma.humanAgent.update({ where: { id: agentId }, data: { active: !agent.active } });
  revalidatePath("/manage/team");
}

export async function toggleAgentAdmin(formData: FormData) {
  const session = await requireAdminSession();
  const agentId = String(formData.get("agentId"));
  const agent = await requireOwnedAgent(agentId, session.businessId);

  const wasAdmin = isAdminMembership(agent);
  if (wasAdmin) {
    await assertNotLastActiveAdmin(agent);
  }

  // role is v2's answer, isAdmin v1's; both change together so either
  // version reads the same thing.
  await prisma.humanAgent.update({
    where: { id: agentId },
    data: { isAdmin: !wasAdmin, role: wasAdmin ? "AGENT" : "ADMIN" },
  });
  revalidatePath("/manage/team");
}
