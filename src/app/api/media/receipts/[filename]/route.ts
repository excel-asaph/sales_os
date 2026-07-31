import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { receiptStorageDir } from "@/lib/media-storage";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Serves receipt images saved by media-storage.ts's local-disk stand-in for
// real object storage. Internal-only (no auth) for the same reason
// /settings has none yet — revisit before any of this is customer-facing.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // path.basename strips any directory components a crafted filename param
  // might contain, so this can only ever read inside receiptStorageDir().
  const safeName = path.basename(filename);
  const extension = safeName.split(".").pop() ?? "";
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await fs.readFile(path.join(receiptStorageDir(), safeName));
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
