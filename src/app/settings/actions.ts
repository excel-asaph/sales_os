"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

export async function updateDeliveryPolicy(formData: FormData) {
  const session = await requireAdminSession();
  const deliverBeforePayment = formData.get("deliverBeforePayment") === "true";

  await prisma.businessConfig.update({
    where: { businessId: session.businessId },
    data: { deliverBeforePayment },
  });

  revalidatePath("/settings");
}
