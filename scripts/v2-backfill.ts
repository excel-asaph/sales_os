import "dotenv/config";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/credential-crypto";
import { getBusinessNumbers } from "@/lib/whatsapp-numbers";

// Fills the v2 tables from v1 data (docs/V2_BUILD_PLAN.md, "Moving VitalFix
// across", step 2). Safe to run more than once: anything already filled is
// left alone, so a second run only picks up what changed since the first.
//
//   npm run v2:backfill -- --dry-run      do everything, report, then undo it
//   npm run v2:backfill                   do it for real
//   npm run v2:backfill -- --env-credentials-for <businessId>
//       also copy this deployment's WhatsApp env vars (app ID, app secret,
//       verify token, and the access token if the business has no stored
//       connection) into that one business's BusinessMetaConnection, and
//       give it a webhook key. For VitalFix, which runs on the env vars.
//
// What it does, per business:
//   1. a User for each HumanAgent whose contact is an email, keeping their
//      password; role OWNER for an admin, AGENT otherwise
//   2. a Channel for each WhatsApp number in the three v1 number fields
//   3. if the business has exactly one available product, every channel
//      sells it
//   4. Conversation.channelId from its whatsappPhoneNumberId, and productId
//      from its latest order, or the business's only product
//
// Admins become OWNER rather than ADMIN because a v1 admin could do
// everything, and v2 must behave the same on day one. Anyone who should be
// a plain ADMIN can be changed in the app afterwards.

class DryRunRollback extends Error {}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LIKE = /^\+?[\d\s()-]{7,}$/;

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const warnings: string[] = [];
const warn = (message: string) => warnings.push(message);

async function backfillUsers(tx: Tx, businessId: string) {
  const agents = await tx.humanAgent.findMany({ where: { businessId, userId: null } });
  let linked = 0;

  for (const agent of agents) {
    const email = agent.contact?.trim().toLowerCase();
    if (!email || !EMAIL.test(email)) {
      warn(`Agent "${agent.name}" (${agent.id}) logs in with "${agent.contact ?? "nothing"}", not an email. Give them an email before switch-over.`);
      continue;
    }

    let user = await tx.user.findUnique({ where: { email } });
    if (!user) {
      user = await tx.user.create({
        data: { email, name: agent.name, passwordHash: agent.passwordHash },
      });
    } else if (user.passwordHash !== agent.passwordHash) {
      warn(`${email} already has a login with a different password. Their membership of business ${businessId} now uses that one.`);
    }

    await tx.humanAgent.update({
      where: { id: agent.id },
      data: { userId: user.id, role: agent.isAdmin ? "OWNER" : "AGENT" },
    });
    linked++;
  }
  return linked;
}

async function backfillChannels(tx: Tx, businessId: string) {
  const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });
  let created = 0;

  for (const number of getBusinessNumbers(business)) {
    const existing = await tx.channel.findUnique({ where: { phoneNumberId: number.id } });
    if (existing) {
      if (existing.businessId !== businessId) {
        warn(`Number ${number.id} is listed on business ${businessId} but already belongs to business ${existing.businessId}. Skipped.`);
      }
      continue;
    }
    // A v1 label is almost always the number itself ("+234 810 573 4894").
    const hasLabel = number.label !== number.id;
    const looksLikeNumber = hasLabel && PHONE_LIKE.test(number.label);
    await tx.channel.create({
      data: {
        businessId,
        phoneNumberId: number.id,
        displayNumber: looksLikeNumber ? number.label : null,
        label: hasLabel && !looksLikeNumber ? number.label : null,
      },
    });
    created++;
  }
  return created;
}

async function backfillChannelProducts(tx: Tx, businessId: string, onlyProductId: string | null) {
  if (!onlyProductId) return 0;
  const channels = await tx.channel.findMany({ where: { businessId, products: { none: {} } } });
  for (const channel of channels) {
    await tx.channelProduct.create({ data: { channelId: channel.id, productId: onlyProductId } });
  }
  return channels.length;
}

async function backfillConversations(tx: Tx, businessId: string, onlyProductId: string | null) {
  let channelsSet = 0;
  const channels = await tx.channel.findMany({ where: { businessId } });
  for (const channel of channels) {
    const result = await tx.conversation.updateMany({
      where: {
        customer: { businessId },
        channelId: null,
        whatsappPhoneNumberId: channel.phoneNumberId,
      },
      data: { channelId: channel.id },
    });
    channelsSet += result.count;
  }

  const withoutChannel = await tx.conversation.count({ where: { customer: { businessId }, channelId: null } });
  if (withoutChannel > 0) {
    warn(`Business ${businessId}: ${withoutChannel} conversation(s) are on no known number, so have no channel.`);
  }

  // A conversation that reached an order is about that order's product,
  // whatever else the business sells.
  let productsSet = 0;
  const ordered = await tx.conversation.findMany({
    where: { customer: { businessId }, productId: null, orders: { some: {} } },
    select: { id: true, orders: { orderBy: { createdAt: "desc" }, take: 1, select: { productId: true } } },
  });
  for (const conversation of ordered) {
    await tx.conversation.update({
      where: { id: conversation.id },
      data: { productId: conversation.orders[0].productId },
    });
    productsSet++;
  }

  if (onlyProductId) {
    const result = await tx.conversation.updateMany({
      where: { customer: { businessId }, productId: null },
      data: { productId: onlyProductId },
    });
    productsSet += result.count;
  }

  return { channelsSet, productsSet };
}

async function copyEnvCredentials(tx: Tx, businessId: string) {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!appId || !appSecret || !verifyToken) {
    throw new Error("--env-credentials-for needs NEXT_PUBLIC_META_APP_ID, WHATSAPP_APP_SECRET and WHATSAPP_WEBHOOK_VERIFY_TOKEN set.");
  }

  const fields = {
    metaAppId: appId,
    encryptedAppSecret: encryptSecret(appSecret),
    encryptedWebhookVerifyToken: encryptSecret(verifyToken),
  };

  const connection = await tx.businessMetaConnection.findUnique({ where: { businessId } });
  if (connection) {
    await tx.businessMetaConnection.update({
      where: { businessId },
      data: { ...fields, webhookKey: connection.webhookKey ?? newWebhookKey() },
    });
    return;
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;
  if (!accessToken || !wabaId) {
    throw new Error(`Business ${businessId} has no stored connection, so WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_BUSINESS_ACCOUNT_ID must be set too.`);
  }
  await tx.businessMetaConnection.create({
    data: {
      businessId,
      wabaId,
      encryptedAccessToken: encryptSecret(accessToken),
      conversionsDatasetId: process.env.META_CONVERSIONS_DATASET_ID ?? null,
      followupTemplateName: process.env.WHATSAPP_FOLLOWUP_TEMPLATE_NAME ?? null,
      followupTemplateLang: process.env.WHATSAPP_FOLLOWUP_TEMPLATE_LANG ?? null,
      ...fields,
      webhookKey: newWebhookKey(),
    },
  });
}

function newWebhookKey() {
  return crypto.randomBytes(24).toString("base64url");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const envCredentialsFor = getArg("--env-credentials-for");

  try {
    await prisma.$transaction(
      async (tx) => {
        const businesses = await tx.business.findMany({ select: { id: true, name: true } });
        if (envCredentialsFor && !businesses.some((b) => b.id === envCredentialsFor)) {
          throw new Error(`No business with id ${envCredentialsFor}.`);
        }

        for (const business of businesses) {
          const products = await tx.product.findMany({ where: { businessId: business.id, available: true }, select: { id: true } });
          const onlyProductId = products.length === 1 ? products[0].id : null;
          if (!onlyProductId) {
            warn(`Business "${business.name}" has ${products.length} available products, so its numbers aren't linked to any. Choose in the app.`);
          }

          const users = await backfillUsers(tx, business.id);
          const channels = await backfillChannels(tx, business.id);
          const links = await backfillChannelProducts(tx, business.id, onlyProductId);
          const { channelsSet, productsSet } = await backfillConversations(tx, business.id, onlyProductId);
          if (envCredentialsFor === business.id) await copyEnvCredentials(tx, business.id);

          console.log(`${business.name} (${business.id})`);
          console.log(`  logins linked: ${users}, channels created: ${channels}, channel-product links: ${links}`);
          console.log(`  conversations given a channel: ${channelsSet}, given a product: ${productsSet}`);
          if (envCredentialsFor === business.id) console.log(`  Meta app credentials copied from env, webhook key set`);
        }

        if (dryRun) throw new DryRunRollback();
      },
      { timeout: 10 * 60 * 1000, maxWait: 30 * 1000 }
    );
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error;
  }

  if (warnings.length) {
    console.log(`\nNeeds attention (${warnings.length}):`);
    for (const message of warnings) console.log(`  - ${message}`);
  }
  console.log(dryRun ? "\nDry run: nothing was saved." : "\nSaved.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
