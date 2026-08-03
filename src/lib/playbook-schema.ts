// Canonical list of this app's known playbook template keys — the single
// source of truth for both the Settings "Scripts" editor UI and
// system-prompt.ts's renderPlaybook() flow logic, so the two can't drift
// apart on what a key is called. The key SET is fixed (not user-definable)
// because renderPlaybook() has real branching logic keyed to these exact
// strings — a template under a key it doesn't recognize would render in
// the prompt but never get a "when to use it" instruction.
export interface PlaybookFieldSchema {
  key: string;
  label: string;
  description: string;
}

export const PLAYBOOK_SCHEMA: PlaybookFieldSchema[] = [
  {
    key: "delivery_first_pitch",
    label: "Delivery-first pitch",
    description: "Sent to a new lead when today's delivery-order default is deliver-before-payment.",
  },
  {
    key: "payment_first_benefits",
    label: "Payment-first: benefits",
    description: "Sent to a new lead when today's default is payment-first — the first of two messages.",
  },
  {
    key: "payment_first_pitch",
    label: "Payment-first: pitch",
    description: "Sent right after the benefits message, as a separate second message.",
  },
  {
    key: "payment_instructions_primary",
    label: "Payment instructions (primary account)",
    description: "Sent whenever a customer asks for payment or account details directly.",
  },
  {
    key: "payment_instructions_alternate",
    label: "Payment instructions (alternate account)",
    description: "Sent when a customer doesn't recognize or use the primary bank.",
  },
  {
    key: "ebook_delivery_note",
    label: "Delivery note",
    description: "Sent right after the product file, when delivering before payment.",
  },
  {
    key: "payment_confirmation",
    label: "Payment confirmed",
    description: "Sent once a payment is verified.",
  },
  {
    key: "thank_you_message",
    label: "Thank-you message",
    description: "Sent right after the payment-confirmed message, if this template is filled in.",
  },
  {
    key: "payment_followup",
    label: "Payment follow-up",
    description: "Used as the message when a delivered-on-trust payment goes quiet.",
  },
];
