const GRAPH_API_VERSION = "v21.0";

/**
 * Sends a WhatsApp text message via the Cloud API. Falls back to logging
 * (rather than throwing) when credentials aren't configured yet, so the
 * AI Employee Runtime is testable locally before WhatsApp is provisioned
 * (ARCHITECTURE.md §12 prerequisites).
 */
export async function sendWhatsAppText(to: string, text: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.log(`[whatsapp-send:dry-run] to=${to} text=${JSON.stringify(text)}`);
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp send failed (${response.status}): ${body}`);
  }
}

/**
 * Sends a document as a real WhatsApp attachment (native PDF-in-chat
 * experience), not a text message with a link pasted into it. WhatsApp
 * fetches `link` once and re-hosts it — the customer never sees the URL
 * itself, only the file appearing in the conversation.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#document-object
 */
export async function sendWhatsAppDocument(to: string, link: string, filename: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.log(`[whatsapp-send:dry-run] to=${to} document=${filename} link=${link}`);
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: { link, filename },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp document send failed (${response.status}): ${body}`);
  }
}
