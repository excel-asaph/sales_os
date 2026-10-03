"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { loadEbookSellerScripts } from "@/lib/starter-scripts";

export async function hideSetupChecklist() {
  const session = await requireAdminSession();
  await prisma.business.update({ where: { id: session.businessId }, data: { setupChecklistHiddenAt: new Date() } });
  revalidatePath("/home");
}

export async function loadStarterScripts() {
  const session = await requireAdminSession();
  await loadEbookSellerScripts(session.businessId);
  revalidatePath("/home");
  revalidatePath("/settings");
}
