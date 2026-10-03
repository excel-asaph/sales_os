import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/credential-crypto";
import { verifyWebhookSignature, type WhatsAppWebhookPayload } from "@/lib/whatsapp";
import { processWebhookPayload } from "@/lib/whatsapp-webhook";

// v2: one webhook address per business, for a business that brings its own
// Meta App (docs/V2_REVAMP.md, "Connecting WhatsApp without becoming a Tech
// Provider"). The key in the address is BusinessMetaConnection.webhookKey,
// random and unguessable, and it says whose app secret and verify token to
// check against. Unlike the shared ../route.ts there is no unsigned
// fallback, in development or anywhere: a business only gets an address
// once its secret is stored.

async function findConnection(key: string) {
  const connection = await prisma.businessMetaConnection.findUnique({
    where: { webhookKey: key },
    select: { businessId: true, encryptedAppSecret: true, encryptedWebhookVerifyToken: true },
  });
  if (!connection?.encryptedAppSecret || !connection.encryptedWebhookVerifyToken) return null;
  return connection;
}

/** Constant-time string comparison, so the verify token can't be guessed by timing. */
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Meta's one-time verification handshake, when the address is saved in the
// business's Meta App (WhatsApp → Configuration → Callback URL).
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const connection = await findConnection(key);
  const search = request.nextUrl.searchParams;

  if (
    connection &&
    search.get("hub.mode") === "subscribe" &&
    safeEqual(search.get("hub.verify_token") ?? "", decryptSecret(connection.encryptedWebhookVerifyToken!))
  ) {
    // The connection wizard is watching for this: it means the owner has
    // saved the address in their Meta App and Meta can reach us.
    await prisma.businessMetaConnection.update({ where: { webhookKey: key }, data: { webhookVerifiedAt: new Date() } });
    return new NextResponse(search.get("hub.challenge"), { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const connection = await findConnection(key);
  if (!connection) return new NextResponse("Not found", { status: 404 });

  const rawBody = await request.text();
  const valid = verifyWebhookSignature(
    rawBody,
    request.headers.get("x-hub-signature-256"),
    decryptSecret(connection.encryptedAppSecret!)
  );
  if (!valid) return new NextResponse("Invalid signature", { status: 401 });

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // For the wizard and Check connection: messages are arriving. At most
  // once a minute, not a write per message.
  await prisma.businessMetaConnection.updateMany({
    where: { webhookKey: key, OR: [{ lastWebhookAt: null }, { lastWebhookAt: { lt: new Date(Date.now() - 60_000) } }] },
    data: { lastWebhookAt: new Date() },
  });

  await processWebhookPayload(payload, connection.businessId);
  return NextResponse.json({ received: true });
}
