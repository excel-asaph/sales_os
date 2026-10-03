"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { decryptSecret, encryptSecret } from "@/lib/credential-crypto";
import { registerChannel } from "@/lib/channels";
import { createOrGetConversionsDataset } from "@/lib/meta-conversions";
import {
  GraphError,
  MetaSetupError,
  checkAppSecret,
  identifyApp,
  inspectToken,
  listNumbers,
  registerNumber,
  subscribeAppToAccount,
  isAppSubscribed,
  fetchNumberStatus,
  type WhatsAppNumber,
} from "@/lib/meta-setup";
import { relativeTime } from "@/lib/relative-time";

// The WhatsApp connection wizard (page.tsx beside this), one action per
// step. Each returns { ok } or { error } in words the owner can act on,
// rather than throwing, because the wizard shows them inline. Progress is
// kept in MetaConnectionDraft until a number is connected.

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function failure(error: unknown): { ok: false; error: string } {
  if (error instanceof MetaSetupError) return { ok: false, error: error.message };
  console.error("WhatsApp connection wizard failed", error);
  return { ok: false, error: "Something went wrong on our side. Try again, or book a setup call." };
}

async function loadDraft(businessId: string) {
  const draft = await prisma.metaConnectionDraft.findUnique({ where: { businessId } });
  if (!draft?.encryptedAccessToken || !draft.metaAppId) throw new MetaSetupError("Start again from the access token step.");
  return {
    token: decryptSecret(draft.encryptedAccessToken),
    appId: draft.metaAppId,
    appSecret: draft.encryptedAppSecret ? decryptSecret(draft.encryptedAppSecret) : null,
  };
}

/** Step: the permanent access token. */
export async function submitAccessToken(rawToken: string): Promise<Result<{ appName: string }>> {
  try {
    const session = await requireAdminSession();
    const token = rawToken.trim();
    if (!token) return { ok: false, error: "Paste the access token first." };

    const { appId, appName } = await identifyApp(token);
    // The full check (permanent, both WhatsApp permissions, which accounts)
    // where Meta lets a token describe itself; otherwise it happens at the
    // app-secret step with the app's own token. Only Meta refusing the
    // question is deferred: a real problem with the token is reported now.
    try {
      await inspectToken(token);
    } catch (error) {
      if (!(error instanceof GraphError)) throw error;
    }

    await prisma.metaConnectionDraft.upsert({
      where: { businessId: session.businessId },
      create: { businessId: session.businessId, encryptedAccessToken: encryptSecret(token), metaAppId: appId },
      // A different app's token makes any saved secret meaningless.
      update: { encryptedAccessToken: encryptSecret(token), metaAppId: appId, encryptedAppSecret: null },
    });
    revalidatePath("/settings/whatsapp/connect");
    return { ok: true, appName };
  } catch (error) {
    return failure(error);
  }
}

/** Step: the app secret, which also lets the token be fully checked. */
export async function submitAppSecret(rawSecret: string): Promise<Result> {
  try {
    const session = await requireAdminSession();
    const secret = rawSecret.trim();
    if (!secret) return { ok: false, error: "Paste the app secret first." };
    const { token, appId } = await loadDraft(session.businessId);

    await checkAppSecret(appId, secret);
    await inspectToken(token, `${appId}|${secret}`);

    await prisma.metaConnectionDraft.update({
      where: { businessId: session.businessId },
      data: { encryptedAppSecret: encryptSecret(secret) },
    });
    revalidatePath("/settings/whatsapp/connect");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The numbers the token reaches, for the owner to choose from. */
export async function loadNumbers(): Promise<Result<{ numbers: WhatsAppNumber[] }>> {
  try {
    const session = await requireAdminSession();
    const { token, appId, appSecret } = await loadDraft(session.businessId);
    if (!appSecret) throw new MetaSetupError("Add the app secret first.");
    const { wabaIds } = await inspectToken(token, `${appId}|${appSecret}`);
    return { ok: true, numbers: await listNumbers(token, wabaIds) };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Step: connect the chosen numbers. Registers any not yet registered for the
 * Cloud API (with the PIN the owner chose), subscribes the app to the
 * account, then saves the connection, its webhook key and verify token, and
 * a channel per number. The webhook itself is the owner's next step.
 */
export async function connectNumbers(phoneNumberIds: string[], pin: string): Promise<Result> {
  try {
    const session = await requireAdminSession();
    const { token, appId, appSecret } = await loadDraft(session.businessId);
    if (!appSecret) throw new MetaSetupError("Add the app secret first.");
    if (phoneNumberIds.length === 0) return { ok: false, error: "Choose at least one number." };

    const { wabaIds } = await inspectToken(token, `${appId}|${appSecret}`);
    const available = await listNumbers(token, wabaIds);
    const chosen = available.filter((n) => phoneNumberIds.includes(n.id));
    if (chosen.length !== phoneNumberIds.length) throw new MetaSetupError("One of those numbers isn't in this account any more. Refresh the list.");
    const wabaId = chosen[0].wabaId;
    if (chosen.some((n) => n.wabaId !== wabaId)) {
      throw new MetaSetupError("Choose numbers from one WhatsApp account at a time.");
    }

    const unregistered = chosen.filter((n) => !n.registered);
    if (unregistered.length && !/^\d{6}$/.test(pin)) {
      return { ok: false, error: "Choose a 6-digit PIN to register the number with. Keep it somewhere safe." };
    }
    for (const number of unregistered) await registerNumber(token, number.id, pin);
    await subscribeAppToAccount(token, wabaId);

    const existing = await prisma.businessMetaConnection.findUnique({ where: { businessId: session.businessId } });
    // Same app: keep the address the owner may already have saved in Meta.
    // A different app needs its own, verified afresh.
    const sameApp = existing?.metaAppId === appId;
    const webhookFields = {
      metaAppId: appId,
      encryptedAppSecret: encryptSecret(appSecret),
      webhookKey: sameApp && existing?.webhookKey ? existing.webhookKey : crypto.randomBytes(24).toString("base64url"),
      encryptedWebhookVerifyToken:
        sameApp && existing?.encryptedWebhookVerifyToken
          ? existing.encryptedWebhookVerifyToken
          : encryptSecret(crypto.randomBytes(18).toString("base64url")),
      ...(sameApp ? {} : { webhookVerifiedAt: null, lastWebhookAt: null }),
    };

    await prisma.$transaction(async (tx) => {
      await tx.businessMetaConnection.upsert({
        where: { businessId: session.businessId },
        create: { businessId: session.businessId, wabaId, encryptedAccessToken: encryptSecret(token), ...webhookFields },
        update: { wabaId, encryptedAccessToken: encryptSecret(token), lastVerifiedAt: new Date(), ...webhookFields },
      });

      const business = await tx.business.findUniqueOrThrow({ where: { id: session.businessId } });
      for (const number of chosen) {
        await registerChannel(tx, session.businessId, number.id);
        await tx.channel.updateMany({
          where: { phoneNumberId: number.id, displayNumber: null },
          data: { displayNumber: number.displayNumber },
        });
        // The v1 number fields too, for the dashboard's number switcher
        // and rollback, as completeEmbeddedSignup does (../actions.ts).
        const primary = business.whatsappPhoneNumberId;
        if (!primary) {
          await tx.business.update({ where: { id: business.id }, data: { whatsappPhoneNumberId: number.id } });
          business.whatsappPhoneNumberId = number.id;
        } else if (primary !== number.id && !business.additionalWhatsappPhoneNumberIds.includes(number.id)) {
          await tx.business.update({
            where: { id: business.id },
            data: { additionalWhatsappPhoneNumberIds: { push: number.id } },
          });
          business.additionalWhatsappPhoneNumberIds.push(number.id);
        }
      }
      await tx.metaConnectionDraft.delete({ where: { businessId: session.businessId } });
    });

    // Sales tracking, as after Embedded Signup: attempted now, retried from
    // the Connect WhatsApp page if it fails.
    try {
      const datasetId = await createOrGetConversionsDataset(wabaId, token);
      await prisma.businessMetaConnection.update({
        where: { businessId: session.businessId },
        data: { conversionsDatasetId: datasetId },
      });
    } catch (error) {
      console.error(`Conversions dataset setup failed for business ${session.businessId}`, error);
    }

    revalidatePath("/settings/whatsapp/connect");
    revalidatePath("/settings/whatsapp");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** What the wizard polls for while the owner is in Meta's dashboard or sending a test message. */
export async function getWebhookProgress(): Promise<{ verified: boolean; messageArrived: boolean }> {
  const session = await requireAdminSession();
  const connection = await prisma.businessMetaConnection.findUnique({
    where: { businessId: session.businessId },
    select: { webhookVerifiedAt: true, lastWebhookAt: true },
  });
  return { verified: Boolean(connection?.webhookVerifiedAt), messageArrived: Boolean(connection?.lastWebhookAt) };
}

/** Throws the half-finished connection away. A finished one is untouched. */
export async function startConnectionOver(): Promise<void> {
  const session = await requireAdminSession();
  await prisma.metaConnectionDraft.deleteMany({ where: { businessId: session.businessId } });
  revalidatePath("/settings/whatsapp/connect");
}

/** Adding a number to a business already connected: reuses its token and secret. */
export async function startAddingNumber(): Promise<Result> {
  try {
    const session = await requireAdminSession();
    const connection = await prisma.businessMetaConnection.findUnique({ where: { businessId: session.businessId } });
    if (!connection?.metaAppId || !connection.encryptedAppSecret) {
      throw new MetaSetupError("This business isn't connected through the wizard yet. Start from the access token step.");
    }
    await prisma.metaConnectionDraft.upsert({
      where: { businessId: session.businessId },
      create: {
        businessId: session.businessId,
        encryptedAccessToken: connection.encryptedAccessToken,
        metaAppId: connection.metaAppId,
        encryptedAppSecret: connection.encryptedAppSecret,
      },
      update: {
        encryptedAccessToken: connection.encryptedAccessToken,
        metaAppId: connection.metaAppId,
        encryptedAppSecret: connection.encryptedAppSecret,
      },
    });
    revalidatePath("/settings/whatsapp/connect");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export interface CheckItem {
  label: string;
  /** null: nothing to judge yet (e.g. no message has ever arrived). */
  ok: boolean | null;
  detail: string;
}

/**
 * Check connection: asks Meta, live, whether everything the business's
 * WhatsApp needs still holds. Each problem comes back in words the owner
 * can act on, rather than stopping at the first one.
 */
export async function checkConnection(): Promise<{ ok: true; items: CheckItem[] } | { ok: false; error: string }> {
  try {
    const session = await requireAdminSession();
    const connection = await prisma.businessMetaConnection.findUnique({ where: { businessId: session.businessId } });
    if (!connection) return { ok: false, error: "WhatsApp isn't connected yet. Start the connection wizard." };

    const token = decryptSecret(connection.encryptedAccessToken);
    const appSecret = connection.encryptedAppSecret ? decryptSecret(connection.encryptedAppSecret) : null;
    const items: CheckItem[] = [];
    const attempt = async (label: string, run: () => Promise<string>) => {
      try {
        items.push({ label, ok: true, detail: await run() });
      } catch (error) {
        items.push({ label, ok: false, detail: error instanceof MetaSetupError ? error.message : "Couldn't check this." });
      }
    };

    if (connection.metaAppId && appSecret) {
      const appId = connection.metaAppId;
      await attempt("App secret", async () => {
        await checkAppSecret(appId, appSecret);
        return "Correct, so messages from Meta can be verified.";
      });
      await attempt("Access token", async () => {
        const info = await inspectToken(token, `${appId}|${appSecret}`);
        if (!info.wabaIds.includes(connection.wabaId)) {
          throw new MetaSetupError("The token can no longer reach this WhatsApp account. Give the system user access again.");
        }
        return "Works, never expires, and has both WhatsApp permissions.";
      });
      await attempt("App subscribed to your WhatsApp account", async () => {
        if (!(await isAppSubscribed(token, connection.wabaId, appId))) {
          throw new MetaSetupError("Your app isn't receiving this account's messages any more. Run the connection wizard's number step again to fix it.");
        }
        return "Yes.";
      });
    } else {
      await attempt("Access token", async () => {
        const { appName } = await identifyApp(token);
        return `Works (app: ${appName}). Connect through the wizard to also check its expiry and permissions.`;
      });
    }

    const channels = await prisma.channel.findMany({ where: { businessId: session.businessId, status: "ACTIVE" } });
    for (const channel of channels) {
      await attempt(`Number ${channel.displayNumber ?? channel.phoneNumberId}`, async () => {
        const status = await fetchNumberStatus(token, channel.phoneNumberId);
        if (!status.registered) throw new MetaSetupError("Not registered with Meta, so it can't send. Run the wizard's number step to register it.");
        if (status.quality === "RED") {
          throw new MetaSetupError("Meta rates this number's quality as low (red): too many customers blocked or reported it. Sending may be limited.");
        }
        return status.quality === "UNKNOWN" ? "Registered. Meta hasn't rated its quality yet." : `Registered. Quality: ${status.quality.toLowerCase()}.`;
      });
    }

    if (connection.webhookKey) {
      items.push({
        label: "Messages arriving",
        ok: connection.lastWebhookAt ? true : connection.webhookVerifiedAt ? null : false,
        detail: connection.lastWebhookAt
          ? `Last one ${relativeTime(connection.lastWebhookAt)}.`
          : connection.webhookVerifiedAt
            ? "Meta has verified the address, but no message has arrived yet. Send one from your phone to check."
            : "Meta hasn't verified the webhook address yet. Finish the wizard's webhook step.",
      });
    }

    if (items.every((item) => item.ok !== false)) {
      await prisma.businessMetaConnection.update({ where: { businessId: session.businessId }, data: { lastVerifiedAt: new Date() } });
    }
    return { ok: true, items };
  } catch (error) {
    return failure(error);
  }
}
