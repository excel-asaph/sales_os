import type { WhatsAppWebhookPayload } from "@/lib/whatsapp";
import { ingestInboundMessage } from "@/lib/ingest-message";

/**
 * What both webhook addresses do with a payload once its signature has
 * been checked: the shared /api/whatsapp (v1, the platform's own Meta App)
 * and the per-business /api/whatsapp/<webhook key> (v2, each business's own
 * Meta App).
 *
 * `onlyBusinessId` is set on the per-business address. A business's own
 * app secret proves the payload came from that business's Meta App, not
 * that the numbers in it are that business's, so a message for anyone
 * else's number is dropped rather than trusted.
 */
export async function processWebhookPayload(payload: WhatsAppWebhookPayload, onlyBusinessId?: string): Promise<void> {
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
          await ingestInboundMessage(change.value, message, onlyBusinessId);
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
}
