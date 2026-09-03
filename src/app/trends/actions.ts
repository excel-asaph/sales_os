"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getNumberFilterCookie, resolveEffectiveNumber } from "@/lib/number-filter";
import { getFunnelBreakdown, getFollowupStepPerformance, getConversionAttribution, generateTrendsInsights } from "@/lib/trends";

// Re-derives everything server-side from the session + cookie, the same
// way the page itself does, rather than trusting client-supplied numbers
// for what gets sent to Claude.
export async function generateInsightsAction(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in.");

  const [business, numberFilter] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: session.businessId },
      select: { whatsappPhoneNumberId: true, additionalWhatsappPhoneNumberIds: true },
    }),
    getNumberFilterCookie(),
  ]);
  const effectiveNumber = resolveEffectiveNumber(numberFilter, business);

  const [funnel, followupSteps, attribution] = await Promise.all([
    getFunnelBreakdown(session.businessId, effectiveNumber),
    getFollowupStepPerformance(session.businessId, effectiveNumber),
    getConversionAttribution(session.businessId, effectiveNumber),
  ]);

  return generateTrendsInsights({ funnel, followupSteps, attribution });
}
