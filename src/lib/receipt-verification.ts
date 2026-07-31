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
  modelConfidence: number;
  reasoning: string;
}

const REPORT_TOOL: Anthropic.Tool = {
  name: "report_receipt_details",
  description: "Report exactly what this payment receipt image shows.",
  input_schema: {
    type: "object",
    properties: {
      extracted_amount: {
        type: ["number", "null"],
        description: "The amount paid, as shown on the receipt. Null if unreadable.",
      },
      extracted_bank: {
        type: ["string", "null"],
        description: "The recipient's bank name shown on the receipt. Null if unreadable.",
      },
      extracted_account_number: {
        type: ["string", "null"],
        description: "The recipient account number shown on the receipt. Null if unreadable.",
      },
      extracted_account_name: {
        type: ["string", "null"],
        description: "The recipient account name shown on the receipt. Null if unreadable.",
      },
      transaction_status: {
        type: "string",
        enum: ["successful", "failed", "pending", "unclear"],
        description: "What the receipt itself indicates about the transaction's outcome.",
      },
      confidence: {
        type: "number",
        description:
          "Your confidence, 0 to 1, that this is a genuine, unaltered receipt clearly showing a successful transaction with the details you extracted. Lower this for blur, cropping, inconsistent fonts/alignment, or anything that looks edited.",
      },
      reasoning: {
        type: "string",
        description: "Briefly explain what you saw and why you assigned this confidence.",
      },
    },
    required: [
      "extracted_amount",
      "extracted_bank",
      "extracted_account_number",
      "extracted_account_name",
      "transaction_status",
      "confidence",
      "reasoning",
    ],
  },
};

/**
 * The perception half of payment verification (PRD 13.3): reads a receipt
 * image and reports what it sees. It does not decide whether the payment
 * counts as verified — that judgment (matching against the expected amount
 * and this business's configured accounts, applying the confidence
 * threshold) belongs to the platform, in actions.ts, per "the AI reasons,
 * the platform executes" (PRD Philosophy 3 / Non-Negotiable 14.2).
 */
export async function verifyReceiptImage(params: {
  imageBase64: string;
  mimeType: string;
  expectedAmount: number;
  paymentAccounts: PaymentAccountRef[];
}): Promise<ReceiptExtraction> {
  const accountsList = params.paymentAccounts
    .map((a) => `${a.bankName} — ${a.accountNumber} (${a.accountName})`)
    .join("\n");

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: "report_receipt_details" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: params.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: params.imageBase64,
            },
          },
          {
            type: "text",
            text: `This is a payment receipt a customer sent on WhatsApp. The expected amount is NGN ${params.expectedAmount}. This business's own accounts are:\n${accountsList || "(none configured)"}\n\nExamine the image carefully and report exactly what it shows — the real amount, bank, account number and name, and whether it indicates success. Don't assume it matches what was expected; say so plainly if it doesn't, or if the image looks blurry, cropped, or edited.`,
          },
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
    reasoning: typeof input.reasoning === "string" ? input.reasoning : "",
  };
}
