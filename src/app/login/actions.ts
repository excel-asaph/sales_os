"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, newSessionExpiry, SESSION_COOKIE } from "@/lib/auth";

// In-memory brute-force guard, keyed by login identifier. Deliberately not
// DB-backed — this is a single-instance deployment (Railway, one sales_os
// service) with a handful of known team logins, so a simple in-process
// counter is enough; it resets on redeploy, which is an acceptable
// tradeoff against adding a new table + queries to every login attempt.
// Revisit if this ever runs on more than one instance.
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_MAX = 5;
const loginAttempts = new Map<string, { count: number; windowStart: number }>();

function isLockedOut(key: string): boolean {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= LOGIN_ATTEMPT_MAX;
}

function recordFailedAttempt(key: string): void {
  const entry = loginAttempts.get(key);
  if (!entry || Date.now() - entry.windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, windowStart: Date.now() });
    return;
  }
  entry.count += 1;
}

export async function login(formData: FormData) {
  const contact = String(formData.get("contact") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/home");
  const attemptKey = contact.toLowerCase();

  if (contact && isLockedOut(attemptKey)) {
    redirect(`/login?error=2&next=${encodeURIComponent(next)}`);
  }

  const agent = contact
    ? await prisma.humanAgent.findFirst({ where: { contact, active: true } })
    : null;

  if (!agent || !(await verifyPassword(password, agent.passwordHash))) {
    if (contact) recordFailedAttempt(attemptKey);
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  loginAttempts.delete(attemptKey);

  const token = createSessionToken({
    agentId: agent.id,
    businessId: agent.businessId,
    isAdmin: agent.isAdmin,
    exp: newSessionExpiry(),
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  redirect(next.startsWith("/") ? next : "/home");
}
