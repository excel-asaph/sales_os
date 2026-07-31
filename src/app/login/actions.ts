"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, newSessionExpiry, SESSION_COOKIE } from "@/lib/auth";

export async function login(formData: FormData) {
  const contact = String(formData.get("contact") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const agent = contact
    ? await prisma.humanAgent.findFirst({ where: { contact, active: true } })
    : null;

  if (!agent || !(await verifyPassword(password, agent.passwordHash))) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = createSessionToken({
    agentId: agent.id,
    businessId: agent.businessId,
    isAdmin: agent.isAdmin,
    exp: newSessionExpiry(),
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  redirect(next.startsWith("/") ? next : "/dashboard");
}
