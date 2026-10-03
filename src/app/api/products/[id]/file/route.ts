import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { persistProductFile } from "@/lib/media-storage";
import { extractPdfText, looksLikePdf, MAX_PRODUCT_FILE_BYTES } from "@/lib/product-file";

// Uploads a product's PDF (v2, docs/V2_BUILD_PLAN.md Phase 2): stores it,
// makes it the file the AI sends customers, and replaces the product's text
// with the new file's. A Route Handler rather than a Server Action so the
// 1 MB Server Action body limit can stay as it is for every other form in
// the app; this one checks the session itself, as Server Actions do.
//
// The previous file is left in storage: its address is in past customers'
// chats and in the delivery messages on record.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Only an admin can upload product files." }, { status: 403 });

  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { id, businessId: session.businessId } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_PRODUCT_FILE_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "That file is too big. The limit is 50 MB." }, { status: 413 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a PDF to upload." }, { status: 400 });
  }
  if (file.size > MAX_PRODUCT_FILE_BYTES) {
    return NextResponse.json({ error: "That file is too big. The limit is 50 MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!looksLikePdf(buffer)) {
    return NextResponse.json({ error: "That isn't a PDF. Only PDF files can be uploaded for now." }, { status: 400 });
  }

  // Text first, so a PDF that can't be read is reported before anything
  // changes. A file with no readable text is still accepted: it can be sent
  // to customers, the AI just can't answer questions from it.
  let extracted;
  try {
    extracted = await extractPdfText(buffer);
  } catch (error) {
    console.error(`Text extraction failed for product ${product.id}`, error);
    return NextResponse.json(
      { error: "That PDF couldn't be opened. It may be damaged or password-protected." },
      { status: 400 }
    );
  }

  const fileUrl = await persistProductFile(buffer, session.businessId, file.name);
  await prisma.product.update({
    where: { id: product.id },
    // The old text described the old file, so it goes either way.
    data: { fileUrl, contentText: extracted.text || null },
  });

  return NextResponse.json({
    fileUrl,
    pages: extracted.pages,
    emptyPages: extracted.emptyPages,
    words: extracted.words,
  });
}
