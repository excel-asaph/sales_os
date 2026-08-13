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
      "Send a WhatsApp text message to the customer, composed by you. Use this ONLY for things not covered by a template (see your instructions for this business's exact scripted messages) — small talk, unexpected objections, clarifying questions, anything genuinely unscripted. Never use this to retype or paraphrase a message that has a template — use send_template_message for those instead.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The message to send, in the customer's language/tone." },
      },
      required: ["text"],
    },
  },
  {
    name: "send_template_message",
    description:
      "Send one of this business's exact, pre-written message templates verbatim (see your instructions for the list of keys and when each applies). The platform sends the stored text exactly as written — you never see or edit it. Use this instead of send_message whenever the conversation reaches one of those scripted moments.",
    input_schema: {
      type: "object",
      properties: {
        template_key: {
          type: "string",
          description: "The exact key of the template to send, e.g. \"delivery_first_pitch\".",
        },
      },
      required: ["template_key"],
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
      "Ask the platform to verify payment evidence the customer sent — a screenshot, a forwarded PDF receipt, or a pasted bank SMS/debit-alert as plain text all work; the platform reads whichever the customer most recently sent, so you don't need to ask for a specific format. You must never declare payment confirmed yourself — only report what this tool's result says. If the evidence has a fixable problem (wrong amount, wrong account, unclear/unreadable), the result may ask you to relay that to the customer and wait for a corrected resend, rather than confirming or escalating — see your instructions for how to handle each possible result.",
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
    description:
      "Make sure a check-in is scheduled for this conversation if the customer goes quiet — call this any time you end a turn with the ball in the customer's court (a pitch, a question, payment details sent, evidence requested) and there's no reason to think a sequence is already running. It's always safe to call: if one is already active, this is a no-op and won't restart it. This schedules only the first check-in; the platform automatically continues the rest of the sequence (decreasing frequency over several days) if the customer stays quiet, up to this business's configured limit. If the customer gave a specific time (\"I'll pay this evening\", \"tomorrow morning\"), set hours to match that instead of the default.",
    input_schema: {
      type: "object",
      properties: {
        hours: {
          type: "number",
          description:
            "Hours from now to send the first check-in. Default to 1 for a routine pause; match the customer's own stated time if they gave one (e.g. ~5 for \"this evening\", ~15 for \"tomorrow morning\").",
        },
        message: {
          type: "string",
          description: "What you'd say in this first check-in — used as a fallback if composing fresh isn't possible when it fires.",
        },
        reason: {
          type: "string",
          enum: ["GENERAL", "AWAITING_PAYMENT_EVIDENCE"],
          description:
            "AWAITING_PAYMENT_EVIDENCE if the customer has claimed to have paid (with or without attaching anything) and you're waiting on them to actually send evidence — this changes what happens if the sequence exhausts with no reply (a human reviews it, since real money may be unreconciled, rather than the lead just being marked uninterested). GENERAL for every other case: a pitch gone quiet, payment details sent with no reply, a clarifying question left unanswered, or a stated deferral.",
        },
      },
      required: ["hours", "message", "reason"],
    },
  },
  {
    name: "no_reply_needed",
    description:
      "Declare that the customer's message needs no reply at all — a bare acknowledgment ('ok', 'thanks', a thumbs-up), and nothing is otherwise pending on your side. Call this instead of just ending your turn with no tool call: the platform can't otherwise tell 'nothing needed doing' apart from you getting stuck, and treats a turn with no reply and no explanation as a failure requiring human review. Never call this if there's outstanding work you haven't done yet — unverified payment evidence, an unanswered question, information you still owe the customer — do that instead.",
    input_schema: { type: "object", properties: {} },
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
    // This tool list is 100% static — identical on every single request,
    // for every business. Marking a cache breakpoint on the last entry
    // caches the whole list (prompt caching is a prefix match: tools
    // render before system/messages, ARCHITECTURE-level detail worth
    // knowing before moving this breakpoint), so it's reused across every
    // turn, every conversation, every business, for as long as it stays
    // warm — the closest thing to a free win the API offers.
    cache_control: { type: "ephemeral" },
  },
];
