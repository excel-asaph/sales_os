import Anthropic from "@anthropic-ai/sdk";
import { claude, CLAUDE_MODEL } from "@/lib/claude";

export interface PaymentAccountRef {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface ReceiptExtraction {
  extractedAmount: number | null;
  extractedBank: string | null;
  extractedAccountNumber: string | null;
  extractedAccountName: string | null;
  transactionStatus: "successful" | "failed" | "pending" | "unclear";
  /** How clearly the details could be read — blur, cropping, low resolution, or (for text) how well-formed the alert reads. A quality problem, not a trust problem: safe to just ask the customer for a clearer copy. */
  modelConfidence: number;
  /** Signs of tampering specifically — inconsistent fonts/misaligned elements/editing artifacts on an image or PDF, or formatting inconsistent with a genuine bank SMS template on text. Distinct from modelConfidence on purpose: a fraud signal must never be treated as "just ask them to resend." */
  looksAltered: boolean;
  /**
   * Many real Nigerian bank debit alerts never show a recipient account
   * number at all — only the sender's own (masked) account, with the
   * recipient identified solely by name in a free-text description (e.g.
   * "TRF TO JAI/BAWAK INTEGRATED SER"). This is the model's own semantic
   * judgment — accounting for bank-SMS abbreviation, truncation, and typos
   * — on whether whatever identifies the recipient (name, description, or
   * account) plausibly matches one of the configured accounts it was
   * given. Reported separately from extractedAccountNumber so the
   * platform can accept this as corroboration when no recipient account
   * number was ever shown, rather than only ever trusting a number match.
   */
  recipientIdentityPlausible: boolean;
  reasoning: string;
}

/**
 * What the customer actually sent as evidence of payment. WhatsApp receipts
 * arrive in any of three shapes (ARCHITECTURE.md §13.3's "handle real
 * customer behavior" note) — a screenshot, a forwarded PDF, or a pasted
 * bank SMS/debit-alert as plain text — and all three deserve the same
 * rigor, not just the ones that happen to be images.
 */
export type ReceiptContent =
  | { kind: "image"; base64: string; mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" }
  | { kind: "document"; base64: string }
  | { kind: "text"; text: string };

const REPORT_TOOL: Anthropic.Tool = {
  name: "report_receipt_details",
  description: "Report exactly what this payment evidence shows.",
  input_schema: {
    type: "object",
    properties: {
      extracted_amount: {
        type: ["number", "null"],
        description: "The amount paid, as shown. Null if unreadable.",
      },
      extracted_bank: {
        type: ["string", "null"],
        description: "The recipient's bank name shown. Null if unreadable.",
      },
      extracted_account_number: {
        type: ["string", "null"],
        description:
          "The RECIPIENT/beneficiary account number, exactly as displayed — including any masking (e.g. \"142****141\" or \"**83793\"). Do not try to unmask it. Null if no recipient account number is shown. Important: many bank debit alerts only show the SENDER's own account being debited (often labeled just \"Acc:\" with no \"beneficiary\"/\"Ben.\" qualifier) — that is NOT the recipient account. Never report the sender's own account here; leave this null if the recipient's account number isn't actually shown, even if some other account-shaped number is present.",
      },
      extracted_account_name: {
        type: ["string", "null"],
        description: "The recipient/beneficiary account name shown, if explicitly labeled as such. Null if unreadable or not shown.",
      },
      transaction_status: {
        type: "string",
        enum: ["successful", "failed", "pending", "unclear"],
        description: "What the evidence itself indicates about the transaction's outcome.",
      },
      confidence: {
        type: "number",
        description:
          "Your confidence, 0 to 1, that you read the amount, bank, and account correctly. Lower this for blur, cropping, low resolution, or (for text) a garbled/incomplete message — purely about legibility. Report tampering signs separately in looks_altered, don't fold them into this number.",
      },
      looks_altered: {
        type: "boolean",
        description:
          "True if there are actual signs of tampering — for an image/PDF: inconsistent fonts, misaligned or overlapping elements, mismatched compression/artifacts around specific text, anything pasted-in rather than a genuine capture. For text: formatting/structure inconsistent with a real bank SMS/debit-alert template, or content that reads as invented. False for evidence that's simply blurry, low-quality, or shows a genuine mismatch — those aren't tampering.",
      },
      recipient_identity_plausible: {
        type: "boolean",
        description:
          "Does whatever identifies the recipient — an explicit beneficiary account number, a beneficiary name field, or a transfer description/narration mentioning who was paid (e.g. \"TRF TO JAI/BAWAK INTEGRATED SER\") — plausibly refer to ONE of this business's configured accounts listed above? Judge this the way a person familiar with Nigerian bank SMS conventions would: account for truncation, all-caps abbreviation, common typos, and a bank name prefix bleeding into the recipient name. True only if there's a real, specific reference to compare, not just because nothing contradicts it — false if no recipient is identified at all, or if what's named is clearly a different business.",
      },
      reasoning: {
        type: "string",
        description: "Briefly explain what you saw — both legibility and any tampering signs.",
      },
    },
    required: [
      "extracted_amount",
      "extracted_bank",
      "extracted_account_number",
      "extracted_account_name",
      "transaction_status",
      "confidence",
      "looks_altered",
      "recipient_identity_plausible",
      "reasoning",
    ],
  },
};

function instructionFor(content: ReceiptContent, expectedAmount: number, accountsList: string): string {
  const shared = `The expected amount is NGN ${expectedAmount}. This business's own accounts are:\n${accountsList || "(none configured)"}\n\nDon't assume it matches what was expected; say so plainly if it doesn't. Separately report legibility (confidence), tampering signs (looks_altered), and recipient identity (recipient_identity_plausible) as three distinct judgments — a genuine debit alert that simply doesn't show a recipient account number is a normal bank-SMS format, not a red flag, so judge recipient_identity_plausible from whatever recipient information actually is present (name, description, or account).`;

  if (content.kind === "text") {
    return `A customer sent this WhatsApp message as evidence of payment (a forwarded bank SMS/debit-alert, not an image):\n"""\n${content.text}\n"""\n\nExamine it carefully and report exactly what it shows — the amount, bank, and whatever identifies the recipient — and whether it indicates a completed transaction. Many Nigerian bank debit alerts only show the account being DEBITED (the sender's own, often masked) with no recipient account number at all — the recipient is then identified only by name or in a transfer description/narration. Don't confuse the sender's account for the recipient's. ${shared}`;
  }
  return `This is payment evidence a customer sent on WhatsApp. Examine it carefully and report exactly what it shows — the amount, bank, and whatever identifies the recipient — and whether it indicates success. ${shared}`;
}

/**
 * The perception half of payment verification (PRD 13.3): reads whatever
 * evidence of payment a customer sent — screenshot, PDF, or pasted bank
 * alert text — and reports what it sees. It does not decide whether the
 * payment counts as verified — that judgment (matching against the
 * expected amount and this business's configured accounts, applying the
 * confidence threshold) belongs to the platform, in actions.ts, per "the
 * AI reasons, the platform executes" (PRD Philosophy 3 / Non-Negotiable 14.2).
 */
export async function verifyReceiptContent(params: {
  content: ReceiptContent;
  expectedAmount: number;
  paymentAccounts: PaymentAccountRef[];
}): Promise<ReceiptExtraction> {
  const accountsList = params.paymentAccounts
    .map((a) => `${a.bankName} — ${a.accountNumber} (${a.accountName})`)
    .join("\n");

  const attachmentBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam | null =
    params.content.kind === "image"
      ? {
          type: "image",
          source: { type: "base64", media_type: params.content.mimeType, data: params.content.base64 },
        }
      : params.content.kind === "document"
        ? {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: params.content.base64 },
          }
        : null;

  // Not a prompt-caching candidate: the image/document/text is the very
  // first content block and is different on every single call (a distinct
  // receipt each time), so there's no reusable prefix to mark a breakpoint
  // on — see shared/prompt-caching.md's "prompts that change from the
  // beginning every time" guidance. Usage is still logged for cost
  // visibility, since vision calls are a real, recurring cost center.
  // 4096, not 1024: thinking counts against max_tokens and Sonnet 5 thinks
  // by default, so a budget sized for "one tool call, no thinking" can be
  // exhausted before the tool call is ever emitted. That failure lands on
  // the no-toolUse path below as "unclear" with confidence 0, i.e. a real
  // customer's real receipt silently failing verification — same root cause
  // as the trends-insights bug found 2026-09-03, but on a money path.
  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: "report_receipt_details" },
    messages: [
      {
        role: "user",
        content: [
          ...(attachmentBlock ? [attachmentBlock] : []),
          { type: "text", text: instructionFor(params.content, params.expectedAmount, accountsList) },
        ],
      },
    ],
  });

  console.log(
    `[claude-usage] receipt-verification kind=${params.content.kind} model=${CLAUDE_MODEL} ` +
      `input=${response.usage.input_tokens} output=${response.usage.output_tokens}`
  );

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    console.error(
      `[receipt-verification] no tool_use block. stop_reason=${response.stop_reason} ` +
        `blocks=[${response.content.map((b) => b.type).join(",")}]`
    );
    return {
      extractedAmount: null,
      extractedBank: null,
      extractedAccountNumber: null,
      extractedAccountName: null,
      transactionStatus: "unclear",
      modelConfidence: 0,
      looksAltered: false,
      recipientIdentityPlausible: false,
      reasoning: "Model did not return a structured extraction.",
    };
  }

  const input = toolUse.input as Record<string, unknown>;
  const status = input.transaction_status as string;
  return {
    extractedAmount: typeof input.extracted_amount === "number" ? input.extracted_amount : null,
    extractedBank: typeof input.extracted_bank === "string" ? input.extracted_bank : null,
    extractedAccountNumber:
      typeof input.extracted_account_number === "string" ? input.extracted_account_number : null,
    extractedAccountName:
      typeof input.extracted_account_name === "string" ? input.extracted_account_name : null,
    transactionStatus: (["successful", "failed", "pending", "unclear"].includes(status)
      ? status
      : "unclear") as ReceiptExtraction["transactionStatus"],
    modelConfidence:
      typeof input.confidence === "number" ? Math.max(0, Math.min(1, input.confidence)) : 0,
    looksAltered: input.looks_altered === true,
    recipientIdentityPlausible: input.recipient_identity_plausible === true,
    reasoning: typeof input.reasoning === "string" ? input.reasoning : "",
  };
}
