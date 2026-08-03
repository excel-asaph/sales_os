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
          "The recipient account number shown, exactly as displayed — including any masking (e.g. \"142****141\"). Do not try to unmask it. Null if unreadable.",
      },
      extracted_account_name: {
        type: ["string", "null"],
        description: "The recipient account name shown. Null if unreadable.",
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
      "reasoning",
    ],
  },
};

function instructionFor(content: ReceiptContent, expectedAmount: number, accountsList: string): string {
  const shared = `The expected amount is NGN ${expectedAmount}. This business's own accounts are:\n${accountsList || "(none configured)"}\n\nDon't assume it matches what was expected; say so plainly if it doesn't. Separately report legibility (confidence) and tampering signs (looks_altered) as two distinct things.`;

  if (content.kind === "text") {
    return `A customer sent this WhatsApp message as evidence of payment (a forwarded bank SMS/debit-alert, not an image):\n"""\n${content.text}\n"""\n\nExamine it carefully and report exactly what it shows — the real amount, bank, account number and name, and whether it indicates a completed transaction. ${shared}`;
  }
  return `This is payment evidence a customer sent on WhatsApp. Examine it carefully and report exactly what it shows — the real amount, bank, account number and name, and whether it indicates success. ${shared}`;
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

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
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

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    return {
      extractedAmount: null,
      extractedBank: null,
      extractedAccountNumber: null,
      extractedAccountName: null,
      transactionStatus: "unclear",
      modelConfidence: 0,
      looksAltered: false,
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
    reasoning: typeof input.reasoning === "string" ? input.reasoning : "",
  };
}
