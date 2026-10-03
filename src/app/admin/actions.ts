"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { openAsSupport, getPlatformAdmin } from "@/lib/support-access";

// A form post rather than a link, so a link sent to a staff member can't
// open a business on their behalf and put a false visit in its log.
export async function openBusiness(formData: FormData) {
  const result = await openAsSupport(String(formData.get("businessId") ?? ""));
  redirect(result === "opened" ? "/home" : `/admin?error=${result}`);
}

// Plan changes by Antflow staff (src/lib/workspace-plan.ts). Until
// Paystack billing exists (Phase 4), "mark paid" is how a bank transfer is
// recorded. Every change is an event with who made it.

async function requireStaffAndBusiness(formData: FormData) {
  const staff = await getPlatformAdmin();
  if (!staff) throw new Error("Only Antflow staff can change plans.");
  const businessId = String(formData.get("businessId") ?? "");
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  return { staff, business };
}

async function logPlanChange(businessId: string, by: string, action: string, detail: Record<string, unknown> = {}) {
  await prisma.event.create({
    data: { type: "WORKSPACE_PLAN_CHANGED", payload: { businessId, by, action, ...detail } as Prisma.InputJsonValue },
  });
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** A month's payment, from today or from the end of what's already paid, whichever is later. */
export async function markPaidForMonth(formData: FormData) {
  const { staff, business } = await requireStaffAndBusiness(formData);
  // Paid with no end date (a business from before plans) stays that way.
  if (business.plan === "PAID" && !business.paidUntil) return;
  const from = business.plan === "PAID" && business.paidUntil && business.paidUntil > new Date() ? business.paidUntil : new Date();
  const paidUntil = new Date(from.getTime() + MONTH_MS);
  await prisma.business.update({ where: { id: business.id }, data: { plan: "PAID", paidUntil } });
  await logPlanChange(business.id, staff.email, "marked_paid", { paidUntil: paidUntil.toISOString() });
  revalidatePath("/admin");
}

export async function suspendWorkspace(formData: FormData) {
  const { staff, business } = await requireStaffAndBusiness(formData);
  const reason = String(formData.get("reason") ?? "").trim() || null;
  await prisma.business.update({ where: { id: business.id }, data: { suspendedAt: new Date(), suspendedReason: reason } });
  await logPlanChange(business.id, staff.email, "suspended", { reason });
  revalidatePath("/admin");
}

export async function unsuspendWorkspace(formData: FormData) {
  const { staff, business } = await requireStaffAndBusiness(formData);
  await prisma.business.update({ where: { id: business.id }, data: { suspendedAt: null, suspendedReason: null } });
  await logPlanChange(business.id, staff.email, "unsuspended");
  revalidatePath("/admin");
}
