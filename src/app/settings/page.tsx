import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PLAYBOOK_SCHEMA } from "@/lib/playbook-schema";
import { FOLLOWUP_SEQUENCE } from "@/lib/followup-sequence";
import {
  updateDeliveryPolicy,
  updatePlaybookTemplate,
  updateMaxFollowups,
  updateFollowupsEnabled,
  updateAiHandlesReceiptIssues,
  addFaqEntry,
  updateFaqEntry,
  deleteFaqEntry,
} from "./actions";

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `day ${days}`;
}

// Module 9 (Dashboard), "Manage" surface, MVP-light per PRD 13.6. Two tabs:
// General (the delivery-order default) and Scripts (this business's exact
// WhatsApp templates — src/lib/playbook-schema.ts, sent verbatim by
// send_template_message). Scripts closes a real gap: before this, editing
// a script meant a one-off DB script, not anything reachable from the app.
export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.isAdmin) return null;

  const [business, faqEntries] = await Promise.all([
    prisma.business.findUnique({
      where: { id: session.businessId },
      include: { config: true },
    }),
    prisma.faqEntry.findMany({ where: { businessId: session.businessId }, orderBy: { order: "asc" } }),
  ]);

  if (!business) {
    return (
      <AppShell active="settings" title="Settings">
        <p className="text-sm text-muted-foreground">No business is configured yet.</p>
      </AppShell>
    );
  }

  const deliverBeforePayment = business.config?.deliverBeforePayment ?? false;
  const aiHandlesReceiptIssues = business.config?.aiHandlesReceiptIssues ?? true;
  const maxFollowups = business.config?.maxFollowups ?? FOLLOWUP_SEQUENCE.length;
  const followupsEnabled = business.config?.followupsEnabled ?? true;
  const playbook = (business.config?.playbook as Record<string, string> | null) ?? {};

  const followupTimeline = FOLLOWUP_SEQUENCE.reduce<Array<(typeof FOLLOWUP_SEQUENCE)[number] & { cumulativeHours: number }>>(
    (acc, step) => {
      const previous = acc[acc.length - 1]?.cumulativeHours ?? 0;
      acc.push({ ...step, cumulativeHours: previous + step.deltaHours });
      return acc;
    },
    []
  );

  return (
    <AppShell active="settings" title="Settings" description={business.name}>
      <div className="mx-auto max-w-2xl">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery order</CardTitle>
                <CardDescription>
                  Should the AI send the digital product before payment is confirmed, or wait for a verified
                  payment first? This is today&apos;s default — the AI will still follow a customer&apos;s own
                  lead and switch to payment-first for that customer if they ask for payment details directly,
                  even when &quot;deliver first&quot; is selected below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateDeliveryPolicy} className="flex flex-col gap-5">
                  <RadioGroup name="deliverBeforePayment" defaultValue={deliverBeforePayment ? "true" : "false"}>
                    <Label className="flex items-start gap-3 rounded-lg border p-4 has-data-checked:border-primary has-data-checked:bg-primary/5">
                      <RadioGroupItem value="false" className="mt-0.5" />
                      <span className="flex flex-col gap-0.5 text-sm font-normal">
                        <span className="font-medium">Wait for verified payment before delivering</span>
                        <span className="text-muted-foreground">Safer — the default for a new business</span>
                      </span>
                    </Label>
                    <Label className="flex items-start gap-3 rounded-lg border p-4 has-data-checked:border-primary has-data-checked:bg-primary/5">
                      <RadioGroupItem value="true" className="mt-0.5" />
                      <span className="flex flex-col gap-0.5 text-sm font-normal">
                        <span className="font-medium">Deliver the product first, then request payment</span>
                        <span className="text-muted-foreground">
                          Trust-building — matches how the team already sells
                        </span>
                      </span>
                    </Label>
                  </RadioGroup>
                  <SubmitButton className="self-start" pendingLabel="Saving…" successMessage="Delivery order saved">
                    Save
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment issues</CardTitle>
                <CardDescription>
                  When a receipt doesn&apos;t match what we&apos;re expecting — wrong amount, wrong account, or
                  an unclear photo — should the AI tell the customer specifically what&apos;s wrong and ask them
                  to resend, or should it go straight to a human every time? Either way, this never applies to a
                  receipt that looks digitally altered, repeated failures on the same conversation, or anything
                  else needing a human (refunds, complaints, a customer asking for one) — those always reach a
                  person.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateAiHandlesReceiptIssues} className="flex flex-col gap-5">
                  <RadioGroup name="aiHandlesReceiptIssues" defaultValue={aiHandlesReceiptIssues ? "true" : "false"}>
                    <Label className="flex items-start gap-3 rounded-lg border p-4 has-data-checked:border-primary has-data-checked:bg-primary/5">
                      <RadioGroupItem value="true" className="mt-0.5" />
                      <span className="flex flex-col gap-0.5 text-sm font-normal">
                        <span className="font-medium">Let the AI ask the customer to fix it (recommended)</span>
                        <span className="text-muted-foreground">
                          Faster for the customer — useful while the team is small
                        </span>
                      </span>
                    </Label>
                    <Label className="flex items-start gap-3 rounded-lg border p-4 has-data-checked:border-primary has-data-checked:bg-primary/5">
                      <RadioGroupItem value="false" className="mt-0.5" />
                      <span className="flex flex-col gap-0.5 text-sm font-normal">
                        <span className="font-medium">Always send mismatches to a human</span>
                        <span className="text-muted-foreground">More conservative — today&apos;s original behavior</span>
                      </span>
                    </Label>
                  </RadioGroup>
                  <SubmitButton className="self-start" pendingLabel="Saving…" successMessage="Payment issue handling saved">
                    Save
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Follow-ups</CardTitle>
                <CardDescription>
                  When a customer goes quiet, the AI checks in on a fixed schedule that starts frequent and
                  spreads out over time — the timing and wording of each step aren&apos;t editable, but how many
                  of them to send before giving up is. After the last one, the customer is automatically tagged
                  &quot;Uninterested&quot; if they still haven&apos;t replied.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateMaxFollowups} className="flex flex-col gap-5">
                  <RadioGroup name="maxFollowups" defaultValue={String(maxFollowups)} className="gap-2">
                    {followupTimeline.map((step) => (
                      <Label
                        key={step.step}
                        className="flex items-start gap-3 rounded-lg border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5"
                      >
                        <RadioGroupItem value={String(step.step)} className="mt-0.5" />
                        <span className="flex flex-col gap-0.5 text-sm font-normal">
                          <span className="font-medium">
                            {step.step} follow-up{step.step === 1 ? "" : "s"} — ends at {formatDuration(step.cumulativeHours)}
                          </span>
                          <span className="text-muted-foreground">{step.angle}</span>
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                  <SubmitButton className="self-start" pendingLabel="Saving…" successMessage="Follow-up limit saved">
                    Save
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Pause follow-ups</CardTitle>
                <CardDescription>
                  Stop automated check-ins across every number on this business — useful while deprioritizing a
                  number or pausing outreach for a while. Pausing cancels every currently pending follow-up
                  outright rather than delaying it; nothing gets sent late once you turn this back on, and nothing
                  new gets scheduled while it&apos;s off.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateFollowupsEnabled} className="flex flex-col gap-5">
                  <RadioGroup name="followupsEnabled" defaultValue={followupsEnabled ? "true" : "false"}>
                    <Label className="flex items-start gap-3 rounded-lg border p-4 has-data-checked:border-primary has-data-checked:bg-primary/5">
                      <RadioGroupItem value="true" className="mt-0.5" />
                      <span className="flex flex-col gap-0.5 text-sm font-normal">
                        <span className="font-medium">Enabled</span>
                        <span className="text-muted-foreground">Normal — the AI checks in on quiet customers</span>
                      </span>
                    </Label>
                    <Label className="flex items-start gap-3 rounded-lg border p-4 has-data-checked:border-primary has-data-checked:bg-primary/5">
                      <RadioGroupItem value="false" className="mt-0.5" />
                      <span className="flex flex-col gap-0.5 text-sm font-normal">
                        <span className="font-medium">Paused</span>
                        <span className="text-muted-foreground">
                          No automated check-ins anywhere on this business until turned back on
                        </span>
                      </span>
                    </Label>
                  </RadioGroup>
                  <SubmitButton className="self-start" pendingLabel="Saving…" successMessage="Follow-up pause setting saved">
                    Save
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scripts" className="mt-6 flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              The AI sends these exact scripts verbatim for the moments below — it never retypes or paraphrases
              them. Line breaks and blank lines matter; they&apos;re preserved exactly as written here.
            </p>
            {PLAYBOOK_SCHEMA.map((field) => (
              <Card key={field.key}>
                <CardHeader>
                  <CardTitle className="text-sm">{field.label}</CardTitle>
                  <CardDescription>{field.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={updatePlaybookTemplate} className="flex flex-col gap-3">
                    <input type="hidden" name="key" value={field.key} />
                    <Textarea
                      name="value"
                      defaultValue={playbook[field.key] ?? ""}
                      rows={7}
                      className="font-mono text-xs"
                      placeholder="Not set — the AI will compose this moment naturally instead of using a fixed script."
                    />
                    <SubmitButton
                      size="sm"
                      className="self-start"
                      pendingLabel="Saving…"
                      successMessage={`${field.label} saved`}
                    >
                      Save
                    </SubmitButton>
                  </form>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="faq" className="mt-6 flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              Answers to the questions customers actually ask about the product. The AI uses these verbatim
              instead of improvising — anything not covered here, it&apos;ll say it needs to check rather than
              guess.
            </p>
            {faqEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <CardTitle className="text-sm">{entry.question}</CardTitle>
                  <form action={deleteFaqEntry}>
                    <input type="hidden" name="id" value={entry.id} />
                    <SubmitButton
                      variant="destructive"
                      size="sm"
                      pendingLabel="Deleting…"
                      successMessage="Question removed"
                    >
                      Delete
                    </SubmitButton>
                  </form>
                </CardHeader>
                <CardContent>
                  <form action={updateFaqEntry} className="flex flex-col gap-3">
                    <input type="hidden" name="id" value={entry.id} />
                    <Input name="question" defaultValue={entry.question} required />
                    <Textarea name="answer" defaultValue={entry.answer} rows={3} required />
                    <SubmitButton
                      size="sm"
                      className="self-start"
                      pendingLabel="Saving…"
                      successMessage="Question saved"
                    >
                      Save
                    </SubmitButton>
                  </form>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add a question</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={addFaqEntry} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="faq-question">Question</Label>
                    <Input id="faq-question" name="question" placeholder="e.g. Is this a physical book or a PDF?" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="faq-answer">Answer</Label>
                    <Textarea id="faq-answer" name="answer" rows={3} required />
                  </div>
                  <SubmitButton className="self-start" pendingLabel="Adding…" successMessage="Question added">
                    Add question
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
