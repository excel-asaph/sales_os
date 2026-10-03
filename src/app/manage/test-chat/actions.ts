"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { sendTestMessage, resetTestChat } from "@/lib/test-chat";

export async function sendTestChatMessage(formData: FormData) {
  const session = await requireAdminSession();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  const agent = await prisma.humanAgent.findUniqueOrThrow({ where: { id: session.agentId }, select: { name: true } });

  try {
    await sendTestMessage({
      businessId: session.businessId,
      agentId: session.agentId,
      agentName: agent.name,
      text,
      productId: String(formData.get("productId") ?? "") || null,
    });
  } finally {
    // Show whatever the AI managed even if the turn failed part-way.
    revalidatePath("/manage/test-chat");
  }
}

export async function resetTestChatAction() {
  const session = await requireAdminSession();
  await resetTestChat(session.businessId, session.agentId);
  revalidatePath("/manage/test-chat");
}
