"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

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

  await prisma.product.create({
    data: {
      businessId: session.businessId,
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      price,
      fileUrl: String(formData.get("fileUrl") ?? "").trim() || null,
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
      fileUrl: String(formData.get("fileUrl") ?? "").trim() || null,
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
