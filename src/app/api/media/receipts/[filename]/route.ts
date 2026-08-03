import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { receiptStorageDir, MIME_BY_EXTENSION } from "@/lib/media-storage";
import { getSession } from "@/lib/auth";

// Serves receipt images saved by media-storage.ts's local-disk stand-in for
// real object storage. These can contain bank account numbers and names —
// require a logged-in agent, same as every other conversation-adjacent
// page. (This is the local-disk dev fallback only; production media is
// served from R2 with its own access model — see STORAGE_* in .env.)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { filename } = await params;

  // path.basename strips any directory components a crafted filename param
  // might contain, so this can only ever read inside receiptStorageDir().
  const safeName = path.basename(filename);
  const extension = safeName.split(".").pop() ?? "";
  const contentType = MIME_BY_EXTENSION[extension];
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
