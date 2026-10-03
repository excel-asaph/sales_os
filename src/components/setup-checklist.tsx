import Link from "next/link";
import { Check } from "lucide-react";
import { getSetupChecklist } from "@/lib/setup-checklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { hideSetupChecklist, loadStarterScripts } from "@/app/home/actions";

// The new-business setup checklist (src/lib/setup-checklist.ts), shown on
// Home to admins until every step is done or they hide it.
export async function SetupChecklist({ businessId }: { businessId: string }) {
  const checklist = await getSetupChecklist(businessId);
  if (!checklist || checklist.hidden) return null;
  const { steps } = checklist;
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  const next = steps.find((s) => !s.done)!;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle>Get selling on WhatsApp</CardTitle>
          <CardDescription>
            {done} of {steps.length} done. Leave any time; this stays here until you finish.
          </CardDescription>
        </div>
        <form action={hideSetupChecklist}>
          <SubmitButton variant="ghost" size="sm" pendingLabel="Hiding…">
            Hide this checklist
          </SubmitButton>
        </form>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2">
          {steps.map((step, i) => {
            const isNext = step === next;
            return (
              <li
                key={step.key}
                className={`flex items-start gap-3 rounded-lg border p-3 ${isNext ? "border-primary bg-primary/5" : ""}`}
              >
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${step.done ? "bg-primary text-primary-foreground" : "border"}`}
                >
                  {step.done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : ""}`}>{step.title}</span>
                  {!step.done && <span className="text-xs text-muted-foreground">{step.hint}</span>}
                </div>
                {!step.done &&
                  (step.key === "scripts" ? (
                    <form action={loadStarterScripts}>
                      <SubmitButton size="sm" variant={isNext ? "default" : "outline"} pendingLabel="Loading…" successMessage="Scripts loaded. Edit them any time in Settings → Scripts.">
                        {step.action}
                      </SubmitButton>
                    </form>
                  ) : (
                    <Button size="sm" variant={isNext ? "default" : "outline"} nativeButton={false} render={<Link href={step.href} />}>
                      {step.action}
                    </Button>
                  ))}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
