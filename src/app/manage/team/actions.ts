"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession, hashPassword } from "@/lib/auth";
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
  const contact = String(formData.get("contact") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const isAdmin = formData.get("role") === "admin";
  if (!name || !contact || !password) return;

  // Login looks agents up by contact (login/actions.ts) — a duplicate
  // would make that lookup ambiguous. The DB's unique(business_id,
  // contact) index enforces this too; checking first avoids a raw
  // constraint-violation crash for the common case of someone re-adding
  // an existing teammate by mistake.
  const existing = await prisma.humanAgent.findFirst({
    where: { businessId: session.businessId, contact },
  });
  if (existing) return;

  const passwordHash = await hashPassword(password);
  await prisma.humanAgent.create({
    data: { businessId: session.businessId, name, contact, passwordHash, isAdmin },
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

  if (agent.isAdmin) {
    await assertNotLastActiveAdmin(agent);
  }

  await prisma.humanAgent.update({ where: { id: agentId }, data: { isAdmin: !agent.isAdmin } });
  revalidatePath("/manage/team");
}
