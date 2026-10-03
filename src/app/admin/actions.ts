"use server";

import { redirect } from "next/navigation";
import { openAsSupport } from "@/lib/support-access";

// A form post rather than a link, so a link sent to a staff member can't
// open a business on their behalf and put a false visit in its log.
export async function openBusiness(formData: FormData) {
  const result = await openAsSupport(String(formData.get("businessId") ?? ""));
  redirect(result === "opened" ? "/home" : `/admin?error=${result}`);
}
