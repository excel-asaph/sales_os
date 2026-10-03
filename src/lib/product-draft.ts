import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { claude } from "@/lib/claude";

// Drafts a product's sales copy from its own text (v2, docs/V2_ONBOARDING.md
// step 4a): a description, who it's for, selling points, eight likely
// customer questions with answers, and a WhatsApp pitch. Only ever a draft:
// the owner edits and approves it on the product's page before anything
// reaches a customer.
//
// Its own model, not CLAUDE_MODEL (which runs every customer turn): this
// runs once per product, where quality matters more than the cost of a few
// cents. With server-side refusal fallbacks, so a safety decline on a health
// book is retried on another model rather than failing.
const DRAFT_MODEL = "claude-opus-5-5";

/** Far beyond any ebook; past this the text is a sign of a bad extraction, not a long book. */
const MAX_TEXT_CHARS = 1_500_000;

export const ProductDraft = z.object({
  description: z.string().describe("Two or three plain sentences saying what the product is and what the buyer gets."),
  whoItsFor: z.string().describe("One or two sentences on who it is for, in the words a customer would use about themselves."),
  sellingPoints: z.array(z.string()).describe("Three to five concrete things inside the book a buyer would care about."),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .describe("Eight questions customers are likely to ask before buying, each answered only from the book or the facts given."),
  pitch: z
    .string()
    .describe("A short WhatsApp message (under 80 words) introducing the product to someone who just messaged, ending by asking if they would like it."),
});
export type ProductDraft = z.infer<typeof ProductDraft>;

const SYSTEM = `You write sales copy for small Nigerian businesses that sell ebooks and digital products on WhatsApp. An AI sales assistant will use what you write, and customers will read it, so it has to be accurate and sound like a person.

Voice: a warm, direct Nigerian shopkeeper who knows the book well. Plain words, full sentences, the way people talk. Name real, everyday things where the book does. No hype.

Avoid these habits, which make writing sound machine-made: em dashes (use full stops, commas or brackets), "it's not X, it's Y" contrasts, strings of short dramatic fragments, tidy three-adjective lists, and the words genuinely, quietly, honestly, truly, simply, precisely, "the one thing", "here's the thing".

Truthfulness: say only what the book says or the facts given say. Never invent numbers, results, testimonials, guarantees or deadlines. If a likely question isn't answered by the book, answer honestly that the book doesn't cover it.

Health products: Meta's advertising rules apply to everything here. Never say a product cures, reverses, heals or treats a condition, never promise results, and never suggest stopping medication. Describe what the book teaches and what readers can try, and where the book touches on medicine, say to keep following their doctor's advice.`;

export class DraftError extends Error {}

export async function draftProductCopy(product: {
  name: string;
  price: string;
  currency: string;
  format: string | null;
  contentText: string;
}): Promise<ProductDraft> {
  if (product.contentText.length > MAX_TEXT_CHARS) {
    throw new DraftError("This file's text is far longer than an ebook's. Check the right file was uploaded.");
  }

  let response;
  try {
    response = await claude.beta.messages.parse({
      model: DRAFT_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(ProductDraft) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `<book_text>\n${product.contentText}\n</book_text>`,
            },
            {
              type: "text",
              text:
                `The product: "${product.name}", ${product.format ?? "an ebook"}, sold for ${product.currency} ${product.price}, ` +
                "sent to the customer on WhatsApp after they pay. Draft its sales copy from the book above.",
            },
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.InternalServerError) {
      throw new DraftError("The AI is busy right now. Try again in a minute.");
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new DraftError("The AI declined to draft copy for this book. Write the description and questions by hand.");
  }
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    throw new DraftError("The draft came back incomplete. Try again.");
  }
  return response.parsed_output;
}
