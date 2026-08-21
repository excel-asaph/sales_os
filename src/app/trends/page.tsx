import { Funnel, MessageCircleReply, PackageCheck, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getNumberFilterCookie } from "@/lib/number-filter";
import { getBusinessNumbers } from "@/lib/whatsapp-numbers";
import { getFunnelBreakdown, getFollowupStepPerformance, getConversionAttribution } from "@/lib/trends";
import { fetchNumberHealth, qualityBadge } from "@/lib/whatsapp-number-health";
import { StatTile } from "@/components/stat-tile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CategoryBarChart } from "@/components/category-bar-chart";
import { FollowupStepChart } from "@/components/followup-step-chart";
import { TrendsInsightsPanel } from "@/components/trends-insights-panel";

// Everything on this page pulls together, by hand, what earlier this
// session got pulled via ad-hoc SQL: where the funnel leaks, whether
// follow-ups actually work, and an honest read on number health straight
// from Meta rather than an invented "risk score."
export default async function TrendsPage() {
  const session = await getSession();
  if (!session) return null;

  const [business, numberFilter] = await Promise.all([
    prisma.business.findUniqueOrThrow({
      where: { id: session.businessId },
      select: { whatsappPhoneNumberId: true, additionalWhatsappPhoneNumberIds: true, whatsappPhoneNumberLabels: true },
    }),
    getNumberFilterCookie(),
  ]);
  const numbers = getBusinessNumbers(business);
  const effectiveNumber =
    numberFilter === "all" ? undefined : (numberFilter ?? business.whatsappPhoneNumberId ?? undefined);

  const [funnel, followupSteps, attribution, numberHealth] = await Promise.all([
    getFunnelBreakdown(session.businessId, effectiveNumber),
    getFollowupStepPerformance(session.businessId, effectiveNumber),
    getConversionAttribution(session.businessId, effectiveNumber),
    Promise.all(numbers.map((n) => fetchNumberHealth(n.id))),
  ]);

  const totalReplySent = followupSteps.reduce((sum, s) => sum + s.sent, 0);
  const totalReplyGot = followupSteps.reduce((sum, s) => sum + s.gotReply, 0);
  const overallReplyRate = totalReplySent > 0 ? (totalReplyGot / totalReplySent) * 100 : 0;
  const unpaidDelivered = attribution.buckets.find((b) => b.key === "unpaid")?.count ?? 0;

  const funnelChartData = funnel.milestones.map((m) => ({
    key: m.key,
    label: m.label,
    value: m.count,
    sublabel: funnel.total > 0 ? `${Math.round((m.count / funnel.total) * 100)}%` : undefined,
  }));

  const attributionTotal = attribution.buckets.reduce((sum, b) => sum + b.count, 0);
  const attributionChartData = attribution.buckets.map((b) => ({
    key: b.key,
    label: b.label,
    value: b.count,
    sublabel: attributionTotal > 0 ? `${Math.round((b.count / attributionTotal) * 100)}%` : undefined,
  }));

  return (
    <AppShell active="trends" title="Trends" description="Where the funnel leaks, and whether follow-ups work">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total conversations" value={funnel.total} icon={TrendingUp} />
          <StatTile label="Converted" value={attribution.total} icon={PackageCheck} tone="good" />
          <StatTile
            label="Follow-up reply rate"
            value={totalReplySent > 0 ? `${overallReplyRate.toFixed(0)}%` : "—"}
            icon={MessageCircleReply}
          />
          <StatTile
            label="Delivered, unpaid"
            value={unpaidDelivered}
            icon={Funnel}
            tone={unpaidDelivered > 0 ? "warn" : "default"}
          />
        </div>

        <TrendsInsightsPanel />

        <Card>
          <CardHeader>
            <CardTitle>Funnel</CardTitle>
            <CardDescription>Where conversations are right now, by pipeline stage.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <CategoryBarChart data={funnelChartData} />
            {funnel.exceptions.some((e) => e.count > 0) && (
              <div className="flex flex-wrap gap-3 border-t pt-4 text-sm text-muted-foreground">
                {funnel.exceptions
                  .filter((e) => e.count > 0)
                  .map((e) => (
                    <span key={e.key}>
                      {e.label}: <span className="font-medium text-foreground">{e.count}</span>
                    </span>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-up step performance</CardTitle>
            <CardDescription>Reply rate per step, out of every follow-up actually sent.</CardDescription>
          </CardHeader>
          <CardContent>
            {followupSteps.length > 0 ? (
              <FollowupStepChart data={followupSteps} />
            ) : (
              <p className="text-sm text-muted-foreground">No follow-ups have been sent yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where conversions come from</CardTitle>
            <CardDescription>Organic vs. recovered by a follow-up vs. delivered but never paid.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={attributionChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Number health</CardTitle>
            <CardDescription>Meta&apos;s own quality rating and messaging tier — not something this app can compute itself.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {numberHealth.map((health) => {
              const label = numbers.find((n) => n.id === health.phoneNumberId)?.label ?? health.phoneNumberId;
              if (!health.ok) {
                return (
                  <div key={health.phoneNumberId} className="rounded-lg border p-4">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {health.reason === "not_configured" ? "WhatsApp access token not configured" : "Couldn't reach Meta"}
                    </div>
                  </div>
                );
              }
              const badge = qualityBadge(health.qualityRating);
              return (
                <div key={health.phoneNumberId} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {health.messagingTier ? `Messaging tier: ${health.messagingTier}` : "Messaging tier unavailable"}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
