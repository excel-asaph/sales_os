import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Confirms the app can reach Postgres. Nothing more — this exists so the
// scaffold can be verified end-to-end before any WhatsApp/Claude wiring.
export async function GET() {
  try {
    const businessCount = await prisma.business.count();
    return NextResponse.json({ status: "ok", businessCount });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
