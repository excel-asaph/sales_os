import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Confirms the app can reach Postgres. Nothing more — this exists so the
// scaffold can be verified end-to-end before any WhatsApp/Claude wiring.
export async function GET() {
  try {
    const businessCount = await prisma.business.count();
    return NextResponse.json({ status: "ok", businessCount });
  } catch (error) {
    // Log the real error server-side for debugging, but don't hand raw
    // Prisma/DB error text (which can include connection-string or
    // schema details) back to an unauthenticated caller.
    console.error("Health check failed", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
