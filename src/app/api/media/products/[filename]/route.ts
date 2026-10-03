import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { productStorageDir } from "@/lib/media-storage";
import { getSession } from "@/lib/auth";

// Serves product files saved by media-storage.ts's local-disk stand-in for
// real object storage: development only, like api/media/receipts. In
// production product files are served straight from R2.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  // basename: a crafted name can only ever read inside productStorageDir().
  const safeName = path.basename((await params).filename);
  if (!safeName.endsWith(".pdf")) return new NextResponse("Not found", { status: 404 });

  try {
    const buffer = await fs.readFile(path.join(productStorageDir(), safeName));
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/pdf", "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
