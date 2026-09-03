"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getNumberFilterCookie, resolveEffectiveNumber } from "@/lib/number-filter";
import {
  getFunnelBreakdown,
  getFollowupStepPerformance,
  getConversionAttribution,
  getPeriodComparison,
  generateTrendsInsights,
  type TrendsInsights,
} from "@/lib/trends";

// Re-derives everything server-side from the session + cookie, the same
// way the page itself does, rather than trusting client-supplied numbers
// for what gets sent to Claude.
export async function generateInsightsAction(): Promise<TrendsInsights | null> {
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

  const [funnel, followupSteps, attribution, comparison, businessConfig] = await Promise.all([
    getFunnelBreakdown(session.businessId, effectiveNumber),
    getFollowupStepPerformance(session.businessId, effectiveNumber),
    getConversionAttribution(session.businessId, effectiveNumber),
    getPeriodComparison(session.businessId, effectiveNumber),
    prisma.businessConfig.findUnique({
      where: { businessId: session.businessId },
      select: { maxFollowups: true, followupsEnabled: true },
    }),
  ]);

  return generateTrendsInsights({
    funnel,
    followupSteps,
    attribution,
    comparison,
    // Defaults mirror BusinessConfig's own schema defaults, for the case
    // where a business has no config row yet.
    config: {
      maxFollowups: businessConfig?.maxFollowups ?? 5,
      followupsEnabled: businessConfig?.followupsEnabled ?? true,
    },
  });
}
