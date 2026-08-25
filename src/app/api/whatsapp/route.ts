import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, type WhatsAppWebhookPayload } from "@/lib/whatsapp";
import { ingestInboundMessage } from "@/lib/ingest-message";

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

  // Meta expects a fast 200 to avoid retries; process synchronously for
  // now since there's no queue worker yet (ARCHITECTURE.md §3 — pg-boss
  // is planned but not built). Revisit if webhook latency becomes a
  // problem before the worker exists.
  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === "account_update") {
          // Meta requires a subscription to this event for Embedded Signup
          // (Connect WhatsApp wizard, src/app/settings/whatsapp) to work at
          // all — but it's not the load-bearing path for completing a
          // connection here. That happens synchronously, client-side: the
          // wizard's onComplete callback calls completeEmbeddedSignup
          // directly with the WABA ID/phone number ID Meta's own postMessage
          // already handed it. This event arrives asynchronously and isn't
          // guaranteed to include the same fields for every account-level
          // change, so it's logged for visibility/debugging rather than
          // driving a second write path that could race the first one.
          console.log("[whatsapp-webhook] account_update event", JSON.stringify(change.value));
          continue;
        }
        if (change.field !== "messages") continue;
        for (const message of change.value.messages ?? []) {
          await ingestInboundMessage(change.value, message);
        }
        // change.value.statuses (sent/delivered/read/failed receipts for
        // our own outbound messages) is intentionally not handled yet —
        // no outbound sending exists to reconcile against.
      }
    }
  } catch (error) {
    console.error("Failed to process WhatsApp webhook payload", error);
    // Still return 200: Meta will retry undeliverable webhooks aggressively,
    // and a transient DB error shouldn't turn into a retry storm. The raw
    // payload is only lost from *this* delivery — Meta's own webhook logs
    // retain it for a limited time if replay is needed.
  }

  return NextResponse.json({ received: true });
}
