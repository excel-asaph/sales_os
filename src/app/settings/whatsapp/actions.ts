"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { encryptSecret } from "@/lib/credential-crypto";
import { createOrGetConversionsDataset } from "@/lib/meta-conversions";
import { fetchBusinessVerificationStatus } from "@/lib/meta-business-verification";
import { submitFollowupTemplate, fetchTemplateStatus } from "@/lib/meta-templates";
import { getMetaCredentials } from "@/lib/meta-credentials";

const GRAPH_API_VERSION = "v21.0";
const DEFAULT_TEMPLATE_NAME = "antflow_followup_checkin";
const DEFAULT_TEMPLATE_LANG = "en_US";

async function exchangeCodeForToken(code: string): Promise<string> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Meta App is not configured (NEXT_PUBLIC_META_APP_ID / WHATSAPP_APP_SECRET).");
  }
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`
  );
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error(`Token exchange succeeded but returned no access_token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

/**
 * Step 1 completion — called directly from the client component
 * (whatsapp-connect-button.tsx's onComplete), not a form submission, since
 * this fires from a JS SDK callback, not a <form>.
 */
export async function completeEmbeddedSignup(result: { code: string; wabaId?: string; phoneNumberId?: string }) {
  const session = await requireAdminSession();

  if (!result.wabaId || !result.phoneNumberId) {
    throw new Error(
      "Facebook login completed, but Meta didn't send back the WhatsApp Business Account details — please try connecting again."
    );
  }

  const accessToken = await exchangeCodeForToken(result.code);

  await prisma.$transaction(async (tx) => {
    await tx.businessMetaConnection.upsert({
      where: { businessId: session.businessId },
      create: {
        businessId: session.businessId,
        wabaId: result.wabaId!,
        encryptedAccessToken: encryptSecret(accessToken),
      },
      update: {
        wabaId: result.wabaId!,
        encryptedAccessToken: encryptSecret(accessToken),
      },
    });

    // Stamp the phone number id onto Business too — this is the field
    // ingest-message.ts actually routes inbound webhooks by, unrelated to
    // credential storage. Primary if unset, otherwise added to the
    // additional-numbers list (same "up to 20 numbers per WABA" pattern
    // already supported).
    const business = await tx.business.findUniqueOrThrow({ where: { id: session.businessId } });
    if (!business.whatsappPhoneNumberId) {
      await tx.business.update({
        where: { id: session.businessId },
        data: { whatsappPhoneNumberId: result.phoneNumberId },
      });
    } else if (
      business.whatsappPhoneNumberId !== result.phoneNumberId &&
      !business.additionalWhatsappPhoneNumberIds.includes(result.phoneNumberId!)
    ) {
      await tx.business.update({
        where: { id: session.businessId },
        data: { additionalWhatsappPhoneNumberIds: { push: result.phoneNumberId! } },
      });
    }
  });

  // Step 2, automatically: dataset creation is idempotent and cheap enough
  // to just attempt right away rather than making this a separate click.
  // Failure here doesn't undo the connection above — the wizard's own
  // status card surfaces it and offers a retry (retrySetupConversionsDataset).
  try {
    const datasetId = await createOrGetConversionsDataset(result.wabaId, accessToken);
    await prisma.businessMetaConnection.update({
      where: { businessId: session.businessId },
      data: { conversionsDatasetId: datasetId, lastVerifiedAt: new Date() },
    });
  } catch (error) {
    console.error(`Conversions dataset setup failed for business ${session.businessId}`, error);
  }

  revalidatePath("/settings/whatsapp");
}

/** Retries just the dataset step, e.g. after it failed during the initial connect. */
export async function retrySetupConversionsDataset() {
  const session = await requireAdminSession();
  const credentials = await getMetaCredentials(session.businessId);
  if (!credentials?.wabaId) {
    throw new Error("Connect WhatsApp first — there's no WABA to set up a dataset for yet.");
  }
  const datasetId = await createOrGetConversionsDataset(credentials.wabaId, credentials.accessToken);
  await prisma.businessMetaConnection.update({
    where: { businessId: session.businessId },
    data: { conversionsDatasetId: datasetId, lastVerifiedAt: new Date() },
  });
  revalidatePath("/settings/whatsapp");
}

/** Step 4 — pulls the live status from Meta rather than trusting a stale cached value. */
export async function refreshBusinessVerificationStatus() {
  const session = await requireAdminSession();
  const credentials = await getMetaCredentials(session.businessId);
  if (!credentials?.wabaId) {
    throw new Error("Connect WhatsApp first.");
  }
  const status = await fetchBusinessVerificationStatus(credentials.wabaId, credentials.accessToken);
  if (status) {
    await prisma.businessMetaConnection.update({
      where: { businessId: session.businessId },
      data: { businessVerificationStatus: status, lastVerifiedAt: new Date() },
    });
  }
  revalidatePath("/settings/whatsapp");
}

/** Step 5 — submits the follow-up re-engagement template for review. */
export async function submitReengagementTemplate() {
  const session = await requireAdminSession();
  const credentials = await getMetaCredentials(session.businessId);
  if (!credentials?.wabaId) {
    throw new Error("Connect WhatsApp first.");
  }
  const result = await submitFollowupTemplate(credentials.wabaId, credentials.accessToken, DEFAULT_TEMPLATE_NAME, DEFAULT_TEMPLATE_LANG);
  if (!result.submitted) {
    throw new Error(result.reason);
  }
  await prisma.businessMetaConnection.update({
    where: { businessId: session.businessId },
    data: { followupTemplateName: DEFAULT_TEMPLATE_NAME, followupTemplateLang: DEFAULT_TEMPLATE_LANG },
  });
  revalidatePath("/settings/whatsapp");
}

/** Polls Meta for the template's current review status (pending/approved/rejected). */
export async function checkTemplateReviewStatus(): Promise<string | null> {
  const session = await requireAdminSession();
  const credentials = await getMetaCredentials(session.businessId);
  if (!credentials?.wabaId || !credentials.followupTemplateName) return null;
  return fetchTemplateStatus(credentials.wabaId, credentials.accessToken, credentials.followupTemplateName);
}
