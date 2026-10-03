import { extractText, getDocumentProxy } from "unpdf";

// Product files uploaded in the app (v2). Replaces the two-step manual job of
// scripts/extract-product-text.py then scripts/set-product-text.ts: the text
// is pulled out of the PDF as it is uploaded and stored in
// Product.contentText, which the AI answers from after delivery
// (docs/EBOOK_KNOWLEDGE.md).

/** WhatsApp accepts documents up to 100 MB; an ebook is far smaller. */
export const MAX_PRODUCT_FILE_BYTES = 50 * 1024 * 1024;

export interface ExtractedText {
  text: string;
  pages: number;
  /** Pages with almost no text: usually images, which the AI can't read. */
  emptyPages: number;
  words: number;
}

/** True if the bytes are a PDF, whatever the file is called. */
export function looksLikePdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

/**
 * The PDF's text, with the same clean-up as the old Python script: NUL bytes
 * removed and the whitespace runs PDF column layout produces collapsed.
 * Bullets, dashes and fractions are left exactly as they are.
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractedText> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text: pageTexts } = await extractText(pdf, { mergePages: false });

  const emptyPages = pageTexts.filter((page) => page.trim().length < 40).length;
  const text = pageTexts
    .join("\n\n")
    .replace(/\x00/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, pages: totalPages, emptyPages, words: text ? text.split(/\s+/).length : 0 };
}
