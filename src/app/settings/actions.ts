"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { PLAYBOOK_SCHEMA } from "@/lib/playbook-schema";
import { clampMaxFollowups } from "@/lib/followup-sequence";

export async function updateDeliveryPolicy(formData: FormData) {
  const session = await requireAdminSession();
  const deliverBeforePayment = formData.get("deliverBeforePayment") === "true";

  await prisma.businessConfig.update({
    where: { businessId: session.businessId },
    data: { deliverBeforePayment },
  });

  revalidatePath("/settings");
}

export async function updateAiHandlesReceiptIssues(formData: FormData) {
  const session = await requireAdminSession();
  const aiHandlesReceiptIssues = formData.get("aiHandlesReceiptIssues") === "true";

  await prisma.businessConfig.update({
    where: { businessId: session.businessId },
    data: { aiHandlesReceiptIssues },
  });

  revalidatePath("/settings");
}

export async function updateMaxFollowups(formData: FormData) {
  const session = await requireAdminSession();
  const raw = Number(formData.get("maxFollowups"));
  if (!Number.isFinite(raw)) return;

  await prisma.businessConfig.update({
    where: { businessId: session.businessId },
    data: { maxFollowups: clampMaxFollowups(raw) },
  });

  revalidatePath("/settings");
}

// Playbook is a JSON blob (no per-key columns — see prisma/schema.prisma's
// comment on BusinessConfig.playbook), so editing one template is a
// read-modify-write rather than a single-column update. Fine at this
// business's scale (one admin editing at a time); a real concurrent-write
// story would need a different storage shape, not a bigger transaction.
export async function updatePlaybookTemplate(formData: FormData) {
  const session = await requireAdminSession();
  const key = String(formData.get("key") ?? "");
  // Browsers CRLF-normalize textarea values on form submission — strip the
  // \r back out so saved content stays byte-exact \n, matching what's
  // already stored (this business's scripts are edited elsewhere for exact
  // line-break structure, and a stray \r would silently break that).
  const value = String(formData.get("value") ?? "").replace(/\r\n/g, "\n");

  if (!PLAYBOOK_SCHEMA.some((field) => field.key === key)) {
    throw new Error(`Unknown playbook key "${key}"`);
  }

  const config = await prisma.businessConfig.findUniqueOrThrow({
    where: { businessId: session.businessId },
  });
  const playbook = { ...((config.playbook as Record<string, string> | null) ?? {}) };
  playbook[key] = value;

  await prisma.businessConfig.update({
    where: { businessId: session.businessId },
    data: { playbook },
  });

  revalidatePath("/settings");
}

// Curated FAQ (see prisma/schema.prisma's FaqEntry comment) — a real table,
// not a JSON blob like playbook, since it's a variable-length list the
// business grows over time rather than a fixed set of keys.
export async function addFaqEntry(formData: FormData) {
  const session = await requireAdminSession();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;

  const count = await prisma.faqEntry.count({ where: { businessId: session.businessId } });
  await prisma.faqEntry.create({
    data: { businessId: session.businessId, question, answer, order: count },
  });

  revalidatePath("/settings");
}

export async function updateFaqEntry(formData: FormData) {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;

  await prisma.faqEntry.updateMany({
    where: { id, businessId: session.businessId },
    data: { question, answer },
  });

  revalidatePath("/settings");
}

export async function deleteFaqEntry(formData: FormData) {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "");

  await prisma.faqEntry.deleteMany({ where: { id, businessId: session.businessId } });

  revalidatePath("/settings");
}
