import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: Request) {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.redirect(new URL("/login", request.url));
}
