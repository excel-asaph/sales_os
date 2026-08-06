const GRAPH_API_VERSION = "v21.0";

/**
 * Sends a WhatsApp text message via the Cloud API. Falls back to logging
 * (rather than throwing) when credentials aren't configured yet, so the
 * AI Employee Runtime is testable locally before WhatsApp is provisioned
 * (ARCHITECTURE.md §12 prerequisites).
 */
export async function sendWhatsAppText(to: string, text: string, phoneNumberId: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

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
 * Sends a Meta-approved WhatsApp Message Template — the only way to reach
 * a customer outside the 24-hour customer service window (see
 * src/lib/whatsapp-window.ts). Unlike sendWhatsAppText, the body content
 * is fixed and pre-approved by Meta; this can invoke a template by name
 * but can't send arbitrary text.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  phoneNumberId: string
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken || !phoneNumberId) {
    console.log(`[whatsapp-send:dry-run] to=${to} template=${templateName} lang=${languageCode}`);
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
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp template send failed (${response.status}): ${body}`);
  }
}

/**
 * Sends a document as a real WhatsApp attachment (native PDF-in-chat
 * experience), not a text message with a link pasted into it. WhatsApp
 * fetches `link` once and re-hosts it — the customer never sees the URL
 * itself, only the file appearing in the conversation.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#document-object
 */
export async function sendWhatsAppDocument(
  to: string,
  link: string,
  filename: string,
  phoneNumberId: string
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

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

/**
 * Marks an inbound message as read and shows the "typing…" indicator to
 * the customer — visible for up to 25 seconds or until a real reply is
 * sent, whichever comes first (Meta's own limit, not configurable). Used
 * so a customer isn't left staring at silence during the debounce window
 * (src/lib/message-debounce.ts) before the AI actually replies. Never
 * call this unless a reply is actually coming (Meta's own guidance) —
 * ingest-message.ts skips it for reactions, which never get a reply.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators
 */
export async function sendTypingIndicator(messageId: string, phoneNumberId: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken || !phoneNumberId) {
    console.log(`[whatsapp-send:dry-run] typing-indicator for message=${messageId}`);
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
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp typing-indicator send failed (${response.status}): ${body}`);
  }
}
