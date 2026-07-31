"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

async function requireOwnedAccount(accountId: string, businessId: string) {
  const account = await prisma.paymentAccount.findUniqueOrThrow({ where: { id: accountId } });
  if (account.businessId !== businessId) throw new Error("Payment account does not belong to this business");
  return account;
}

export async function createPaymentAccount(formData: FormData) {
  const session = await requireAdminSession();
  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  if (!bankName || !accountNumber || !accountName) return;

  await prisma.paymentAccount.create({
    data: { businessId: session.businessId, bankName, accountNumber, accountName },
  });

  revalidatePath("/manage/payment-accounts");
}

export async function togglePaymentAccountActive(formData: FormData) {
  const session = await requireAdminSession();
  const accountId = String(formData.get("accountId"));
  const account = await requireOwnedAccount(accountId, session.businessId);

  await prisma.paymentAccount.update({ where: { id: accountId }, data: { active: !account.active } });
  revalidatePath("/manage/payment-accounts");
}

export async function deletePaymentAccount(formData: FormData) {
  const session = await requireAdminSession();
  const accountId = String(formData.get("accountId"));
  await requireOwnedAccount(accountId, session.businessId);

  await prisma.paymentAccount.delete({ where: { id: accountId } });
  revalidatePath("/manage/payment-accounts");
}
