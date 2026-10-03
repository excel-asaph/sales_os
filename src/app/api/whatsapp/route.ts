import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, type WhatsAppWebhookPayload } from "@/lib/whatsapp";
import { processWebhookPayload } from "@/lib/whatsapp-webhook";

// The shared webhook address: v1's, signed with the platform's own Meta App
// secret from the environment. In v2 each business that brings its own Meta
// App uses /api/whatsapp/<webhook key> instead (./[key]/route.ts); this one
// stays as VitalFix's fallback after switch-over.

// Meta's one-time webhook verification handshake (done when the webhook
// URL is registered/changed in the Meta App dashboard).
// https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Inbound messages, media, and status updates from WhatsApp Cloud API.
// This route is the Channel Gateway (PRD Module 1): it only normalizes and
// persists (messages + events rows). It does not decide how to respond —
// that's the AI Employee Runtime, not yet wired up (ARCHITECTURE.md §7).
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const valid = verifyWebhookSignature(
      rawBody,
      request.headers.get("x-hub-signature-256"),
      appSecret
    );
    if (!valid) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Fail closed, not open: an unset secret in production must not
    // silently degrade into accepting any POST as genuine Meta traffic.
    console.error("WHATSAPP_APP_SECRET is not set in production — rejecting webhook request.");
    return new NextResponse("Webhook not configured", { status: 500 });
  } else {
    console.warn(
      "WHATSAPP_APP_SECRET is not set — skipping webhook signature verification. Do not run like this in production."
    );
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  await processWebhookPayload(payload);

  return NextResponse.json({ received: true });
}
