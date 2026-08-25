import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/credential-crypto";

export interface MetaCredentials {
  accessToken: string;
  wabaId: string | null;
  conversionsDatasetId: string | null;
  followupTemplateName: string | null;
  followupTemplateLang: string | null;
}

/**
 * Resolves the Meta/WhatsApp credentials for one business. Checks
 * BusinessMetaConnection (written by the Embedded Signup wizard,
 * src/app/settings/whatsapp) first; falls back to the old global env vars
 * if that business hasn't been through the wizard yet.
 *
 * This fallback is permanent, not a migration shim to delete later — it's
 * what keeps local dev working without every developer running a full
 * OAuth flow, and what keeps any business that hasn't (re)connected yet
 * functioning exactly as it did before this existed.
 */
export async function getMetaCredentials(businessId: string): Promise<MetaCredentials | null> {
  const connection = await prisma.businessMetaConnection.findUnique({ where: { businessId } });

  if (connection) {
    return {
      accessToken: decryptSecret(connection.encryptedAccessToken),
      wabaId: connection.wabaId,
      conversionsDatasetId: connection.conversionsDatasetId,
      followupTemplateName: connection.followupTemplateName,
      followupTemplateLang: connection.followupTemplateLang,
    };
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) return null;

  return {
    accessToken,
    wabaId: process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID ?? null,
    conversionsDatasetId: process.env.META_CONVERSIONS_DATASET_ID ?? null,
    followupTemplateName: process.env.WHATSAPP_FOLLOWUP_TEMPLATE_NAME ?? null,
    followupTemplateLang: process.env.WHATSAPP_FOLLOWUP_TEMPLATE_LANG ?? null,
  };
}
