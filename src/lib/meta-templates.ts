const GRAPH_API_VERSION = "v21.0";

export type TemplateSubmissionResult =
  | { submitted: true; status: string }
  | { submitted: false; reason: string };

/**
 * Submits the re-engagement follow-up template for a WABA (step 5 of the
 * Connect WhatsApp wizard, src/app/settings/whatsapp) — the one Meta-
 * approved template deliverFollowup (src/worker/followup-worker.ts) falls
 * back to outside the 24h customer service window. MARKETING category
 * (re-engagement messages are explicitly a marketing conversation per
 * Meta's Jan 2026 policy, docs/META_WHATSAPP_COMPLIANCE.md) requires an
 * opt-out — the STOP quick-reply button below is that opt-out, not
 * decorative.
 *
 * Submission only starts Meta's own review; this returns "PENDING" on a
 * successful submit, never "APPROVED" — the wizard polls
 * fetchTemplateStatus separately for the real outcome.
 */
export async function submitFollowupTemplate(
  wabaId: string,
  accessToken: string,
  templateName: string,
  languageCode: string
): Promise<TemplateSubmissionResult> {
  const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/message_templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: templateName,
      language: languageCode,
      category: "MARKETING",
      components: [
        {
          type: "BODY",
          text: "Hi! Just checking in — are you still interested? Let us know if you have any questions.",
        },
        {
          type: "FOOTER",
          text: "Reply STOP to stop receiving these messages.",
        },
        {
          type: "BUTTONS",
          buttons: [{ type: "QUICK_REPLY", text: "Stop" }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { submitted: false, reason: `Meta rejected the template submission (${response.status}): ${body}` };
  }

  const data = (await response.json()) as { status?: string };
  return { submitted: true, status: data.status ?? "PENDING" };
}

/** Polls the review status of an already-submitted template. */
export async function fetchTemplateStatus(
  wabaId: string,
  accessToken: string,
  templateName: string
): Promise<string | null> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/message_templates?name=${encodeURIComponent(templateName)}&fields=status`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { data?: { status?: string }[] };
  return data.data?.[0]?.status ?? null;
}
