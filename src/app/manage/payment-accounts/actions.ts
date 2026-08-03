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

// send_payment_details (src/lib/knowledge.ts's getPaymentAccounts) only ever
// offers accounts with active: true — deactivating the last one would leave
// the AI with nothing to send a customer who asks how to pay, silently.
async function requireAnotherActiveAccountWouldRemain(businessId: string, excludingId: string) {
  const otherActiveCount = await prisma.paymentAccount.count({
    where: { businessId, active: true, id: { not: excludingId } },
  });
  if (otherActiveCount === 0) {
    throw new Error(
      "This is the last active payment account — deactivating it would leave nothing for the AI to offer customers. Activate another account first."
    );
  }
}

export async function togglePaymentAccountActive(formData: FormData) {
  const session = await requireAdminSession();
  const accountId = String(formData.get("accountId"));
  const account = await requireOwnedAccount(accountId, session.businessId);

  if (account.active) {
    await requireAnotherActiveAccountWouldRemain(session.businessId, accountId);
  }

  await prisma.paymentAccount.update({ where: { id: accountId }, data: { active: !account.active } });
  revalidatePath("/manage/payment-accounts");
}

export async function updatePaymentAccount(formData: FormData) {
  const session = await requireAdminSession();
  const accountId = String(formData.get("accountId"));
  await requireOwnedAccount(accountId, session.businessId);

  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  if (!bankName || !accountNumber || !accountName) return;

  await prisma.paymentAccount.update({
    where: { id: accountId },
    data: { bankName, accountNumber, accountName },
  });

  revalidatePath("/manage/payment-accounts");
}

// Deliberately narrow, same as deleteProduct: an Order can reference a
// payment account (prisma/schema.prisma), so a hard delete with history
// would destroy real transaction records. Deactivate (above) is the right
// tool for an account no longer in use but used before.
export async function deletePaymentAccount(formData: FormData) {
  const session = await requireAdminSession();
  const accountId = String(formData.get("accountId"));
  const account = await requireOwnedAccount(accountId, session.businessId);

  const orderCount = await prisma.order.count({ where: { paymentAccountId: accountId } });
  if (orderCount > 0) {
    throw new Error(
      "This account has order/payment history and can't be deleted — deactivate it instead to keep the record."
    );
  }

  if (account.active) {
    await requireAnotherActiveAccountWouldRemain(session.businessId, accountId);
  }

  await prisma.paymentAccount.delete({ where: { id: accountId } });
  revalidatePath("/manage/payment-accounts");
}
