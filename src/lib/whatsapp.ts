import crypto from "node:crypto";

// Types for the slice of the WhatsApp Cloud API webhook payload the MVP
// actually reads. Not exhaustive — Meta's payload has many more optional
// fields; add them here as the runtime needs them.
// Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

interface WhatsAppChange {
  field: string;
  value: WhatsAppChangeValue;
}

export interface WhatsAppChangeValue {
  messaging_product: "whatsapp";
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: { profile: { name: string }; wa_id: string }[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type:
    | "text"
    | "image"
    | "document"
    | "audio"
    | "video"
    | "sticker"
    | "location"
    | "contacts"
    | "reaction"
    | "unknown";
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  document?: { id: string; mime_type: string; filename?: string };
  audio?: { id: string; mime_type: string };
  // Present on the first message of a conversation that started from a
  // "click to WhatsApp" Facebook/Instagram ad or a post (PRD: "Customers
  // discover products through Facebook Ads, Instagram... and are redirected
  // directly into WhatsApp conversations"). Ad attribution, not delivered
  // to a separate webhook field.
  referral?: {
    source_url?: string;
    source_type?: "ad" | "post";
    source_id?: string;
    headline?: string;
    body?: string;
    media_type?: "image" | "video";
    image_url?: string;
    video_url?: string;
    thumbnail_url?: string;
    ctwa_clid?: string;
  };
}

interface WhatsAppStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
}

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request body.
 * Must run against the *raw* body string — parsing to JSON and
 * re-serializing before verifying would produce a different byte sequence
 * and always fail.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader) return false;
  const [algo, receivedDigest] = signatureHeader.split("=");
  if (algo !== "sha256" || !receivedDigest) return false;

  const expectedDigest = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  const expected = Buffer.from(expectedDigest, "hex");
  const received = Buffer.from(receivedDigest, "hex");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}
