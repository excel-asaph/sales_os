"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { PLAYBOOK_SCHEMA } from "@/lib/playbook-schema";
import { clampMaxFollowups } from "@/lib/followup-sequence";

// One product's own sales settings (ProductSettings) and FAQ. Every value
// here is an override: "inherit" stores null, which getEffectiveConfig
// (src/lib/knowledge.ts) reads as "use the business's setting".

async function requireOwnedProduct(productId: string) {
  const session = await requireAdminSession();
  const product = await prisma.product.findFirst({ where: { id: productId, businessId: session.businessId } });
  if (!product) throw new Error("Product not found in this business");
  return { session, product };
}

const BOOLEAN_FIELDS = ["deliverBeforePayment", "aiHandlesReceiptIssues", "productContentEnabled", "followupsEnabled"] as const;
type BooleanField = (typeof BOOLEAN_FIELDS)[number];

export async function updateProductSetting(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const field = String(formData.get("field") ?? "");
  const raw = String(formData.get("value") ?? "inherit");
  await requireOwnedProduct(productId);

  let data: Record<string, boolean | number | null>;
  if (field === "maxFollowups") {
    const n = Number(raw);
    data = { maxFollowups: raw === "inherit" || !Number.isFinite(n) ? null : clampMaxFollowups(n) };
  } else if ((BOOLEAN_FIELDS as readonly string[]).includes(field)) {
    data = { [field as BooleanField]: raw === "inherit" ? null : raw === "true" };
  } else {
    throw new Error(`Unknown product setting "${field}"`);
  }

  // Switching a product's follow-ups off needs no clean-up here: the worker
  // re-reads the merged settings when each follow-up is due and cancels it
  // then (src/worker/followup-worker.ts), as it does for the business pause.
  await prisma.productSettings.upsert({
    where: { productId },
    create: { productId, ...data },
    update: data,
  });
  revalidatePath(`/manage/products/${productId}`);
}

export async function updateProductScript(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const key = String(formData.get("key") ?? "");
  // Browsers send textarea line breaks as \r\n; scripts are stored with \n,
  // as in src/app/settings/actions.ts.
  const value = String(formData.get("value") ?? "").replace(/\r\n/g, "\n");
  await requireOwnedProduct(productId);
  if (!PLAYBOOK_SCHEMA.some((f) => f.key === key)) throw new Error(`Unknown playbook key "${key}"`);

  const existing = await prisma.productSettings.findUnique({ where: { productId } });
  const playbook = { ...((existing?.playbook as Record<string, string> | null) ?? {}) };
  // Emptying the box hands this script back to the business.
  if (value.trim()) playbook[key] = value;
  else delete playbook[key];
  const stored = Object.keys(playbook).length ? playbook : Prisma.DbNull;

  await prisma.productSettings.upsert({
    where: { productId },
    create: { productId, playbook: stored },
    update: { playbook: stored },
  });
  revalidatePath(`/manage/products/${productId}`);
}

export async function addProductFaq(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const { session } = await requireOwnedProduct(productId);
  if (!question || !answer) return;

  const count = await prisma.faqEntry.count({ where: { productId } });
  await prisma.faqEntry.create({ data: { businessId: session.businessId, productId, question, answer, order: count } });
  revalidatePath(`/manage/products/${productId}`);
}

export async function updateProductFaq(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  await requireOwnedProduct(productId);
  if (!question || !answer) return;

  await prisma.faqEntry.updateMany({ where: { id, productId }, data: { question, answer } });
  revalidatePath(`/manage/products/${productId}`);
}

export async function deleteProductFaq(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const id = String(formData.get("id") ?? "");
  await requireOwnedProduct(productId);

  await prisma.faqEntry.deleteMany({ where: { id, productId } });
  revalidatePath(`/manage/products/${productId}`);
}

export async function updateProductOpeningText(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const text = String(formData.get("whatsappOpeningText") ?? "").trim();
  await requireOwnedProduct(productId);

  await prisma.product.update({ where: { id: productId }, data: { whatsappOpeningText: text || null } });
  revalidatePath(`/manage/products/${productId}`);
}

/**
 * Which of the business's numbers sell this product. One product on a
 * number makes it a dedicated number for routing (src/lib/product-routing.ts);
 * several make it shared.
 */
export async function updateProductChannels(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const { session } = await requireOwnedProduct(productId);
  const chosen = new Set(formData.getAll("channelId").map(String));

  // Only this business's own numbers, whatever the form says.
  const channels = await prisma.channel.findMany({ where: { businessId: session.businessId }, select: { id: true } });
  const wanted = channels.filter((c) => chosen.has(c.id)).map((c) => c.id);

  await prisma.$transaction([
    prisma.channelProduct.deleteMany({
      where: { productId, channel: { businessId: session.businessId }, channelId: { notIn: wanted } },
    }),
    prisma.channelProduct.createMany({
      data: wanted.map((channelId) => ({ channelId, productId })),
      skipDuplicates: true,
    }),
  ]);
  revalidatePath(`/manage/products/${productId}`);
}
