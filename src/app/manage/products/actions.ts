"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { normalizeFileUrl } from "@/lib/file-url";

async function requireOwnedProduct(productId: string, businessId: string) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  if (product.businessId !== businessId) throw new Error("Product does not belong to this business");
  return product;
}

export async function createProduct(formData: FormData) {
  const session = await requireAdminSession();
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!name || !Number.isFinite(price)) return;

  // A business on one number almost always sells the new product on it
  // too, so it's added there; with several numbers, which ones sell it is
  // chosen on the product's own page.
  const channels = await prisma.channel.findMany({
    where: { businessId: session.businessId, status: "ACTIVE" },
    select: { id: true },
  });

  await prisma.product.create({
    data: {
      ...(channels.length === 1 ? { channels: { create: { channelId: channels[0].id } } } : {}),
      businessId: session.businessId,
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      price,
      fileUrl: normalizeFileUrl(String(formData.get("fileUrl") ?? "")) || null,
      category: String(formData.get("category") ?? "").trim() || null,
    },
  });

  revalidatePath("/manage/products");
}

export async function toggleProductAvailable(formData: FormData) {
  const session = await requireAdminSession();
  const productId = String(formData.get("productId"));
  const product = await requireOwnedProduct(productId, session.businessId);

  await prisma.product.update({ where: { id: productId }, data: { available: !product.available } });
  revalidatePath("/manage/products");
}

export async function updateProduct(formData: FormData) {
  const session = await requireAdminSession();
  const productId = String(formData.get("productId"));
  await requireOwnedProduct(productId, session.businessId);

  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!name || !Number.isFinite(price)) return;

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      price,
      fileUrl: normalizeFileUrl(String(formData.get("fileUrl") ?? "")) || null,
      category: String(formData.get("category") ?? "").trim() || null,
    },
  });

  revalidatePath("/manage/products");
}

// Only a product with zero order history can ever be hard-deleted — an
// Order references its product (no cascade, prisma/schema.prisma), so
// deleting one with orders would either fail on the FK or, worse, destroy
// real transaction history. "Mark unavailable" (above) is the right tool
// for a product that's no longer sold but was sold before.
export async function deleteProduct(formData: FormData) {
  const session = await requireAdminSession();
  const productId = String(formData.get("productId"));
  await requireOwnedProduct(productId, session.businessId);

  const orderCount = await prisma.order.count({ where: { productId } });
  if (orderCount > 0) {
    throw new Error(
      "This product has order history and can't be deleted — mark it unavailable instead to keep the record."
    );
  }

  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/manage/products");
}

/**
 * v2: which product a Click-to-WhatsApp ad sells (AdProduct), so a
 * conversation starting from it begins on that product
 * (src/lib/product-routing.ts). An empty product clears the link.
 */
export async function mapAdToProduct(formData: FormData) {
  const session = await requireAdminSession();
  const adId = String(formData.get("adId") ?? "").trim();
  const productId = String(formData.get("productId") ?? "");
  if (!adId) return;

  if (!productId) {
    await prisma.adProduct.deleteMany({ where: { businessId: session.businessId, adId } });
  } else {
    await requireOwnedProduct(productId, session.businessId);
    await prisma.adProduct.upsert({
      where: { businessId_adId: { businessId: session.businessId, adId } },
      create: { businessId: session.businessId, adId, productId },
      update: { productId },
    });
  }
  revalidatePath("/manage/products");
}
