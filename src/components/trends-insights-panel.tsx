"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateInsightsAction } from "@/app/trends/actions";

async function action(_prevState: string | null, _formData: FormData) {
  try {
    return await generateInsightsAction();
  } catch (error) {
    console.error("Failed to generate trends insights", error);
    return "Couldn't generate insights right now — try again in a moment.";
  }
}

// On-demand, not auto-generated on page load and not cached — a couple of
// cents per click at Sonnet 5 pricing, cheap enough that click-to-generate
// is simpler than adding storage for a cached copy (see src/lib/trends.ts).
export function TrendsInsightsPanel() {
  const [insights, formAction, isPending] = useActionState(action, null);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Insights</CardTitle>
          <CardDescription>A short AI read on the numbers below — generated on demand, not automatic.</CardDescription>
        </div>
        <form action={formAction}>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isPending ? "Generating…" : "Generate insights"}
          </Button>
        </form>
      </CardHeader>
      {insights && (
        <CardContent>
          <p className="whitespace-pre-line text-sm leading-relaxed">{insights}</p>
        </CardContent>
      )}
    </Card>
  );
}
