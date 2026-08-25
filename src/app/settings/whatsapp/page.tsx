import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { HelpCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { CopyField } from "@/components/copy-field";
import { WizardStepper, type WizardStep } from "@/components/wizard-stepper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConnectStep } from "./connect-step";
import { retrySetupConversionsDataset, refreshBusinessVerificationStatus, submitReengagementTemplate } from "./actions";
import type { BusinessVerificationStatus } from "@/lib/meta-business-verification";

const STEPS: WizardStep[] = [
  { key: "connect", label: "Connect" },
  { key: "tracking", label: "Sales tracking" },
  { key: "ad-account", label: "Ad account" },
  { key: "verification", label: "Verification" },
  { key: "template", label: "Template" },
];

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  good: { label: "Ready", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  bad: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  muted: { label: "Not started", className: "bg-muted text-muted-foreground" },
};

function StatusChip({ tone, label }: { tone: keyof typeof STATUS_STYLES; label: string }) {
  const style = STATUS_STYLES[tone];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>{label}</span>;
}

function verificationTone(status: BusinessVerificationStatus): keyof typeof STATUS_STYLES {
  if (status === "VERIFIED") return "good";
  if (status === "PENDING") return "pending";
  if (status === "REJECTED") return "bad";
  return "muted";
}

function HelpTooltip({ children }: { children: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <HelpCircle className="size-3.5 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-64">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// The Connect WhatsApp wizard — walks a business owner through everything
// this session's own META_CONVERSIONS_SETUP.md runbook previously required
// doing by hand: Embedded Signup (Meta's own official mechanism for a SaaS
// platform onboarding its customers' WABAs), automatic Conversions dataset
// creation, guided cross-Business-Manager sharing (genuinely can't be
// automated — needs a human on the *other* Business Manager), live
// Business Verification status, and re-engagement template submission.
export default async function ConnectWhatsAppPage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const [business, connection] = await Promise.all([
    prisma.business.findUnique({ where: { id: session.businessId } }),
    prisma.businessMetaConnection.findUnique({ where: { businessId: session.businessId } }),
  ]);

  if (!business) {
    return (
      <AppShell active="settings" title="Connect WhatsApp">
        <p className="text-sm text-muted-foreground">No business is configured yet.</p>
      </AppShell>
    );
  }

  const connected = Boolean(connection);
  const datasetReady = Boolean(connection?.conversionsDatasetId);
  const verificationStatus = (connection?.businessVerificationStatus ?? "NOT_STARTED") as BusinessVerificationStatus;
  const templateSubmitted = Boolean(connection?.followupTemplateName);

  const activeIndex = !connected
    ? 0
    : !datasetReady
      ? 1
      : verificationStatus !== "VERIFIED"
        ? 3 // ad-account sharing (index 2) is optional/manual, doesn't gate progress on its own
        : templateSubmitted
          ? 4
          : 4;

  return (
    <AppShell
      active="settings"
      title="Connect WhatsApp"
      description="Set up a new WhatsApp Business Account, guided end to end"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <WizardStepper steps={STEPS} activeIndex={activeIndex} />

        <Card>
          <CardHeader>
            <CardTitle>1. Connect WhatsApp</CardTitle>
            <CardDescription>
              Log into your own Facebook account — Meta handles creating or selecting your WhatsApp Business Account
              and verifying your number, right here, without leaving this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectStep alreadyConnected={connected} wabaId={connection?.wabaId ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              2. Sales tracking
              <HelpTooltip>
                Lets Meta&apos;s ad algorithm learn which conversations actually led to a verified sale, not just
                which ones started a chat.
              </HelpTooltip>
            </CardTitle>
            <CardDescription>Set up automatically once WhatsApp is connected — nothing to fill in.</CardDescription>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <p className="text-sm text-muted-foreground">Connect WhatsApp first.</p>
            ) : datasetReady ? (
              <StatusChip tone="good" label={`Ready — dataset ${connection!.conversionsDatasetId}`} />
            ) : (
              <form action={retrySetupConversionsDataset}>
                <SubmitButton pendingLabel="Setting up…" successMessage="Sales tracking is set up">
                  Set up sales tracking
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              3. Share with your ad account
              <HelpTooltip>
                Only needed if the Facebook account running your ads lives on a different Business Manager than the
                one you just connected WhatsApp on — a common setup when a family member or agency manages ads.
              </HelpTooltip>
            </CardTitle>
            <CardDescription>This one step Meta doesn&apos;t let any app automate — it needs a human on the other side.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!datasetReady ? (
              <p className="text-sm text-muted-foreground">Finish step 2 first.</p>
            ) : (
              <>
                <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                  <li>
                    In <strong className="text-foreground">this</strong> Business Manager: Business Settings → Data
                    Sources → Datasets → select the dataset below → <strong className="text-foreground">Assign Partner</strong>.
                  </li>
                  <li>Enter the ad account&apos;s Business ID when asked.</li>
                  <li>
                    In the <strong className="text-foreground">ad account&apos;s</strong> Business Manager: accept the
                    partner request, then Business Settings → Data Sources → Datasets → the now-shared dataset →{" "}
                    <strong className="text-foreground">Add assets</strong> → connect the ad account.
                  </li>
                </ol>
                <CopyField label="Dataset ID" value={connection!.conversionsDatasetId!} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              4. Business Verification
              <HelpTooltip>Meta requires this before any message template — including the follow-up template in step 5 — can send.</HelpTooltip>
            </CardTitle>
            <CardDescription>Reviewed by Meta, not something this app can complete on your behalf.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <StatusChip tone={verificationTone(verificationStatus)} label={STATUS_STYLES[verificationTone(verificationStatus)].label} />
            {connected && (
              <form action={refreshBusinessVerificationStatus}>
                <SubmitButton variant="outline" size="sm" pendingLabel="Checking…">
                  Refresh status
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Re-engagement template</CardTitle>
            <CardDescription>The one message a follow-up can still send outside the 24-hour reply window.</CardDescription>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <p className="text-sm text-muted-foreground">Connect WhatsApp first.</p>
            ) : templateSubmitted ? (
              <StatusChip tone="pending" label={`Submitted — ${connection!.followupTemplateName} (awaiting Meta's review)`} />
            ) : (
              <form action={submitReengagementTemplate}>
                <SubmitButton pendingLabel="Submitting…" successMessage="Template submitted for review">
                  Submit template for review
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
