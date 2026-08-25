import { Check } from "lucide-react";

// Generalized from PipelineTracker (src/app/dashboard/[id]/page.tsx) — same
// desktop/mobile dual-render, same emerald-done/primary-active/muted-
// upcoming color scheme, just driven by an arbitrary step list instead of
// being hardcoded to PIPELINE_MILESTONES. Used by the Connect WhatsApp
// wizard (src/app/settings/whatsapp); kept generic enough to reuse for any
// future multi-step flow rather than wizard-specific.
export interface WizardStep {
  key: string;
  label: string;
}

export function WizardStepper({ steps, activeIndex }: { steps: WizardStep[]; activeIndex: number }) {
  const total = steps.length;
  const progressPercent = total > 1 ? (activeIndex / (total - 1)) * 100 : 100;

  return (
    <>
      {/* Below `sm`, spelled-out steps don't fit a phone width without
          clipping or scrolling sideways — collapse to a slim bar plus the
          current step's name instead, same reasoning as PipelineTracker. */}
      <div className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 sm:hidden">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-foreground">{steps[activeIndex]?.label}</span>
          <span className="shrink-0 text-muted-foreground">
            Step {activeIndex + 1} of {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="hidden items-center rounded-xl border bg-card px-6 py-3 sm:flex">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          const isLast = index === steps.length - 1;
          return (
            <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-emerald-600 text-white"
                      : active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-3" /> : index + 1}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && <div className={`mx-2 h-0.5 flex-1 ${done ? "bg-emerald-600" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
