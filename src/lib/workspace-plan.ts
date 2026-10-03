import { prisma } from "@/lib/prisma";

// Workspace plans (docs/V2_ONBOARDING.md, decided 2026-10-03). The only
// place the rules live; everything else asks getWorkspaceStatus.
//
// When a plan isn't active the AI stops selling but never leaves a customer
// in silence: new messages still arrive, and each conversation is handed to
// the business's team (src/lib/ingest-message.ts). Nothing is deleted, and
// paying switches the AI straight back on. The test chat keeps working
// either way.

export const FREE_PLAN_DAYS = 14;
export const FREE_PLAN_SALES = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

export type WorkspaceStatus =
  /** daysLeft is null until the first real customer conversation starts the clock. */
  | { state: "free"; daysLeft: number | null; salesLeft: number }
  | { state: "free_ended"; reason: "days" | "sales" }
  /** until is null for paid with no end date. */
  | { state: "paid"; until: Date | null }
  | { state: "payment_lapsed"; since: Date }
  | { state: "suspended"; reason: string | null };

export function aiIsActive(status: WorkspaceStatus): boolean {
  return status.state === "free" || status.state === "paid";
}

export async function getWorkspaceStatus(businessId: string, now = new Date()): Promise<WorkspaceStatus> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true, freeStartedAt: true, paidUntil: true, suspendedAt: true, suspendedReason: true },
  });

  if (business.suspendedAt) return { state: "suspended", reason: business.suspendedReason };

  if (business.plan === "PAID") {
    if (!business.paidUntil || business.paidUntil > now) return { state: "paid", until: business.paidUntil };
    return { state: "payment_lapsed", since: business.paidUntil };
  }

  const sales = await prisma.order.count({
    where: { status: "VERIFIED", conversation: { customer: { businessId, isTest: false } } },
  });
  if (sales >= FREE_PLAN_SALES) return { state: "free_ended", reason: "sales" };

  if (!business.freeStartedAt) return { state: "free", daysLeft: null, salesLeft: FREE_PLAN_SALES - sales };
  const endsAt = business.freeStartedAt.getTime() + FREE_PLAN_DAYS * DAY_MS;
  if (now.getTime() >= endsAt) return { state: "free_ended", reason: "days" };
  return { state: "free", daysLeft: Math.ceil((endsAt - now.getTime()) / DAY_MS), salesLeft: FREE_PLAN_SALES - sales };
}

/** Starts the free plan's 14 days, once, at the first real customer conversation. */
export async function startFreePlanClock(businessId: string): Promise<void> {
  await prisma.business.updateMany({
    where: { id: businessId, plan: "FREE", freeStartedAt: null },
    data: { freeStartedAt: new Date() },
  });
}

/** One line for the business, explaining where its plan stands, or null if there's nothing to say. */
export function describeStatus(status: WorkspaceStatus): { text: string; urgent: boolean } | null {
  switch (status.state) {
    case "free":
      return {
        urgent: false,
        text:
          status.daysLeft === null
            ? `Free plan: ${FREE_PLAN_DAYS} days and ${FREE_PLAN_SALES} sales, starting from your first customer conversation.`
            : `Free plan: ${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"} or ${status.salesLeft} sale${status.salesLeft === 1 ? "" : "s"} left, whichever comes first.`,
      };
    case "free_ended":
      return {
        urgent: true,
        text: `Your free plan has ended (${status.reason === "sales" ? `${FREE_PLAN_SALES} sales made` : `${FREE_PLAN_DAYS} days used`}). The AI is paused: new messages go to your team. Pay to switch it back on.`,
      };
    case "payment_lapsed":
      return {
        urgent: true,
        text: "Your payment has run out. The AI is paused: new messages go to your team. Pay to switch it back on.",
      };
    case "suspended":
      return {
        urgent: true,
        text: `Antflow has suspended this workspace${status.reason ? `: ${status.reason}` : ""}. The AI is paused: new messages go to your team.`,
      };
    case "paid":
      if (status.until && status.until.getTime() - Date.now() < 7 * DAY_MS) {
        return {
          urgent: false,
          text: `Paid until ${status.until.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}. Pay before then to keep the AI selling.`,
        };
      }
      return null;
  }
}
