"use client";

import { useActionState } from "react";
import { Loader2, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateInsightsAction } from "@/app/trends/actions";
import type { TrendsInsights, FindingSeverity } from "@/lib/trends";

type State = { ok: true; data: TrendsInsights } | { ok: false; message: string } | null;

async function action(_prevState: State, _formData: FormData): Promise<State> {
  try {
    const data = await generateInsightsAction();
    if (!data) return { ok: false, message: "Could not generate insights right now. Please try again." };
    return { ok: true, data };
  } catch (error) {
    console.error("Failed to generate trends insights", error);
    return { ok: false, message: "Couldn't generate insights right now — try again in a moment." };
  }
}

// Severity is carried by an icon and a word, not by colour alone — the
// panel has to stay readable in greyscale and for a colourblind reader,
// same reasoning as the stage badges in stage-display.ts.
const SEVERITY: Record<FindingSeverity, { label: string; icon: typeof CheckCircle2; className: string }> = {
  good: {
    label: "Working",
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  watch: {
    label: "Watch",
    icon: AlertTriangle,
    className: "text-amber-600 dark:text-amber-400",
  },
  risk: {
    label: "Risk",
    icon: AlertCircle,
    className: "text-red-600 dark:text-red-400",
  },
};

// On-demand, not auto-generated on page load and not cached — a couple of
// cents per click at Sonnet 5 pricing, cheap enough that click-to-generate
// is simpler than adding storage for a cached copy (see src/lib/trends.ts).
export function TrendsInsightsPanel() {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Insights</CardTitle>
          <CardDescription>
            A short AI read on the last 30 days against the 30 before it — generated on demand, not automatic.
          </CardDescription>
        </div>
        <form action={formAction}>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isPending ? "Generating…" : "Generate insights"}
          </Button>
        </form>
      </CardHeader>

      {state && (
        <CardContent className="space-y-5">
          {!state.ok ? (
            <p className="text-sm text-muted-foreground">{state.message}</p>
          ) : (
            <>
              <p className="text-base font-medium leading-snug">{state.data.headline}</p>

              <ul className="space-y-4">
                {state.data.findings.map((finding, i) => {
                  const severity = SEVERITY[finding.severity] ?? SEVERITY.watch;
                  const Icon = severity.icon;
                  return (
                    <li key={i} className="flex gap-3">
                      <Icon className={`mt-0.5 size-4 shrink-0 ${severity.className}`} aria-hidden />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-snug">
                          {finding.title}
                          <span className={`ml-2 text-xs font-normal ${severity.className}`}>{severity.label}</span>
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{finding.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex gap-3 rounded-md border bg-muted/40 p-3">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Do next</p>
                  <p className="text-sm leading-relaxed">{state.data.recommendation}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
