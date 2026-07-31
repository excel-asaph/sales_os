import type Anthropic from "@anthropic-ai/sdk";

/**
 * The Action Contract (ARCHITECTURE.md §7.2, PRD 5.6). Every tool here is
 * executed by platform code (src/lib/actions.ts) — never by the model
 * directly. This is Philosophy 3 (PRD 3.3) and Non-Negotiable 14.2 made
 * literal: the AI requests, the platform decides and executes.
 */
export const STAGE_VALUES = [
  "NEW_LEAD",
  "GREETING_SENT",
  "INTRODUCTION_COMPLETED",
  "INTEREST_CONFIRMED",
  "PRODUCT_SELECTED",
  "WAITING_FOR_DECISION",
  "WAITING_FOR_PAYMENT",
  "RECEIPT_RECEIVED",
  "PAYMENT_VERIFIED",
  "PRODUCT_DELIVERED",
  "SALE_COMPLETED",
  "FOLLOWUP_DAY_1",
  "FOLLOWUP_DAY_3",
  "FOLLOWUP_DAY_7",
  "LOST_LEAD",
  "HUMAN_REVIEW_REQUIRED",
  "HUMAN_ASSIGNED",
  "RESOLVED",
] as const;

export const actionContractTools: Anthropic.Tool[] = [
  {
    name: "send_message",
    description:
      "Send a WhatsApp text message to the customer. This is the only way to speak to the customer — never rely on plain response text.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The message to send, in the customer's language/tone." },
      },
      required: ["text"],
    },
  },
  {
    name: "search_products",
    description:
      "Look up matching products from this business's catalog. Always call this before stating a product exists, its price, or its description — never answer from memory.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What the customer is looking for, e.g. 'diabetes ebook'." },
      },
      required: ["query"],
    },
  },
  {
    name: "send_product",
    description:
      "Deliver a digital product to the customer. Only call this when business policy or a verified payment allows it — the platform enforces this and will refuse if not allowed.",
    input_schema: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "The product's id, from search_products." },
      },
      required: ["product_id"],
    },
  },
  {
    name: "send_payment_details",
    description: "Retrieve and send this business's active payment account(s) to the customer.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "request_payment_verification",
    description:
      "Ask the platform to verify a payment receipt the customer sent. You must never declare payment confirmed yourself — only report what this tool's result says.",
    input_schema: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "The product the customer is paying for." },
        expected_amount: { type: "number", description: "The price that should have been paid." },
      },
      required: ["product_id", "expected_amount"],
    },
  },
  {
    name: "update_stage",
    description:
      "Move the conversation to a new workflow stage, and optionally state your current objective. Call this at every meaningful transition — it's how your progress persists into the next turn.",
    input_schema: {
      type: "object",
      properties: {
        new_stage: { type: "string", enum: [...STAGE_VALUES] },
        objective: {
          type: "string",
          description: "What you're now trying to accomplish, e.g. 'collect payment for Diabetes Fix ebook'. Optional, but set it whenever it changes.",
        },
      },
      required: ["new_stage"],
    },
  },
  {
    name: "record_fact",
    description:
      "Persist something you'll need to remember in later turns — which product the customer wants, their preferred payment method, an objection they raised, anything you'd otherwise have to re-ask for. You only see a short window of recent messages plus what you've recorded here, not the full history, so call this whenever you learn something worth keeping — don't wait until the end of the conversation.",
    input_schema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["GOAL", "OBJECTION", "ENTITY", "TASK"],
          description:
            "GOAL = what the customer overall wants. OBJECTION = a concern blocking progress. ENTITY = a specific fact (selected product, preferred bank, stated amount). TASK = something outstanding that must still happen.",
        },
        key: { type: "string", description: "Short label, e.g. 'selected_product', 'preferred_bank'." },
        value: { type: "string" },
      },
      required: ["kind", "key", "value"],
    },
  },
  {
    name: "create_followup",
    description: "Schedule a follow-up message for a customer who paused before completing their purchase.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "integer", description: "Days from now to send the follow-up (typically 1, 3, or 7)." },
        message: { type: "string", description: "The follow-up message to send when it fires." },
      },
      required: ["days", "message"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Hand the conversation off to a human agent. Use this whenever confidence is low, the situation is outside routine sales (refunds, complaints, anger, medical claims), or the customer asks for a human.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why this needs a human." },
        summary: { type: "string", description: "Concise handoff summary: objective, stage, what's been done, what's unresolved." },
      },
      required: ["reason", "summary"],
    },
  },
  {
    name: "tag_customer",
    description: "Apply a CRM tag to the customer record.",
    input_schema: {
      type: "object",
      properties: {
        tag: { type: "string" },
      },
      required: ["tag"],
    },
  },
];
