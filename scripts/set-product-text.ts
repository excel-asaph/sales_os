import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";

// Loads a product's extracted text into Product.contentText, which is what
// lets the AI answer "what does the book actually say" (docs/EBOOK_KNOWLEDGE.md).
//
// Run against production the same way create-admin.ts is — locally with a
// production DATABASE_URL, or via `railway run`. There is no UI for this
// deliberately: the text is ~29,000 characters, which is not something anyone
// should be pasting into a form, and it changes about as often as the product
// itself does.
//
//   python scripts/extract-product-text.py ebook.pdf --out ebook.txt
//   npx tsx scripts/set-product-text.ts --product-id <id> --file ebook.txt
//
// To undo: --clear sets the column back to NULL, which returns the AI to
// exactly its pre-ebook behaviour (system-prompt.ts skips the block entirely
// when the text is absent).
function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const productId = getArg("--product-id");
  const file = getArg("--file");
  const clear = process.argv.includes("--clear");
  const list = process.argv.includes("--list");

  if (list) {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, available: true, contentText: true },
      orderBy: { name: "asc" },
    });
    for (const p of products) {
      const size = p.contentText ? `${p.contentText.length} chars` : "— none —";
      console.log(`${p.id}  ${p.available ? " " : "x"}  ${p.name.padEnd(30)} ${size}`);
    }
    return;
  }

  if (!productId || (!file && !clear)) {
    console.error(
      "usage:\n" +
        "  --list\n" +
        "  --product-id <id> --file <path>\n" +
        "  --product-id <id> --clear"
    );
    process.exitCode = 1;
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    console.error(`no product with id ${productId} — run --list to see them`);
    process.exitCode = 1;
    return;
  }

  if (clear) {
    await prisma.product.update({ where: { id: productId }, data: { contentText: null } });
    console.log(`cleared content text for "${product.name}"`);
    return;
  }

  const text = readFileSync(file!, "utf-8").trim();
  if (!text) {
    console.error(`${file} is empty — refusing to store nothing`);
    process.exitCode = 1;
    return;
  }

  await prisma.product.update({ where: { id: productId }, data: { contentText: text } });
  console.log(
    `stored ${text.length} chars (~${Math.round(text.length / 3.8)} tokens) ` +
      `for "${product.name}"`
  );
  console.log(
    "\nThis text now reaches the AI only once a conversation hits " +
      "PRODUCT_DELIVERED. Before that the prompt is byte-identical to before."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
