// A small, deliberate marker distinguishing an internal record of what
// happened (e.g. "a pre-approved template went out instead of a composed
// reply") from an actual message body — both currently get stored as a
// normal outbound Message row (sendHumanReply, followup-worker.ts), which
// rendered identically to real content in the dashboard transcript and
// read as if the customer had received this literal bracketed sentence,
// when they'd actually received Meta's real approved template text
// (confirmed in production, 2026-08-13). Centralized here so the two
// writers and the one reader (dashboard/[id]/page.tsx) can't drift apart
// on the exact marker.
const SYSTEM_NOTE_PREFIX = "[System note] ";

export function formatSystemNote(text: string): string {
  return `${SYSTEM_NOTE_PREFIX}${text}`;
}

export function isSystemNote(content: string | null): boolean {
  return content != null && content.startsWith(SYSTEM_NOTE_PREFIX);
}

export function stripSystemNotePrefix(content: string): string {
  return content.slice(SYSTEM_NOTE_PREFIX.length);
}

// The actual approved wording of the re-engagement template
// (WHATSAPP_FOLLOWUP_TEMPLATE_NAME, "payment_followup_reminder" in
// WhatsApp Manager) — Meta stores this on their side, not ours, so it's
// hardcoded here purely for the transcript record (never sent —
// sendWhatsAppTemplate references the template by name/language, not this
// string). Shared by followup-worker.ts and dashboard/[id]/actions.ts, the
// two places a template goes out instead of a composed message.
//
// Note this template names "the Diabetes Fix ebook" specifically, not the
// customer's actual product — fine while that's the only product this
// business sells, but if a second product is ever added, a customer
// re-engaged outside the 24h window about a *different* product will see
// this same wrong product name. Update this constant (and the approved
// template itself in WhatsApp Manager) if that changes.
export const FOLLOWUP_TEMPLATE_DISPLAY_TEXT: string | null =
  "Hi! Just checking in.\n\nAre you still interested in the Diabetes Fix ebook?";

export function describeTemplateFallback(): string {
  return FOLLOWUP_TEMPLATE_DISPLAY_TEXT
    ? `Outside the 24h messaging window — sent the approved re-engagement template instead: "${FOLLOWUP_TEMPLATE_DISPLAY_TEXT}"`
    : "Outside the 24h messaging window — sent the approved re-engagement template instead (exact wording not recorded).";
}
