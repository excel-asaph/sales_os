"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";

// Bar height = reply rate %, one bar per follow-up step, sent-count as a
// muted direct label. A status badge marks any step with sent > 0 but zero
// replies -- status color reserved for that signal specifically, never
// used to repaint the bars themselves by performance (color follows the
// entity, not its rank). Same structural pattern as revenue-chart.tsx
// (scoped custom properties, hover tooltip via pointer/focus handlers).
export interface FollowupStepDatum {
  step: number;
  sent: number;
  replyRate: number;
}

const GRID_STEPS = [0, 0.25, 0.5, 0.75, 1];

export function FollowupStepChart({ data }: { data: FollowupStepDatum[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="followup-step-chart">
      <style>{`
        .followup-step-chart {
          --bar-fill: #2a78d6;
          --bar-fill-hover: #1c5cab;
          --grid-line: #e1e0d9;
        }
        .dark .followup-step-chart {
          --bar-fill: #3987e5;
          --bar-fill-hover: #5598e7;
          --grid-line: #2c2c2a;
        }
      `}</style>
      <div className="flex gap-3">
        <div className="flex h-48 flex-col justify-between pb-6 text-right text-xs text-muted-foreground">
          {[...GRID_STEPS].reverse().map((step) => (
            <span key={step} className="tabular-nums">
              {Math.round(step * 100)}%
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-0 bottom-6 flex flex-col justify-between">
            {[...GRID_STEPS].reverse().map((step) => (
              <div key={step} className="h-px" style={{ background: "var(--grid-line)" }} />
            ))}
          </div>
          <div className="relative flex h-48 gap-3">
            {data.map((point, i) => {
              const flagZeroReply = point.sent > 0 && point.replyRate === 0;
              return (
                <div
                  key={point.step}
                  className="group relative flex flex-1 flex-col items-center justify-end pb-6"
                  onPointerEnter={() => setHovered(i)}
                  onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered((h) => (h === i ? null : h))}
                  tabIndex={0}
                >
                  {hovered === i && (
                    <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-popover px-2.5 py-1.5 text-xs shadow-md ring-1 ring-foreground/10">
                      <div className="font-semibold tabular-nums">{point.replyRate.toFixed(1)}% replied</div>
                      <div className="text-muted-foreground">{point.sent} sent</div>
                    </div>
                  )}
                  {flagZeroReply && (
                    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
                      <TriangleAlert className="size-3" />
                      No replies
                    </span>
                  )}
                  <div
                    className="w-full max-w-10 rounded-t-[4px] transition-colors"
                    style={{
                      height: `${Math.max(point.replyRate, point.replyRate > 0 ? 2 : 0)}%`,
                      background: hovered === i ? "var(--bar-fill-hover)" : "var(--bar-fill)",
                    }}
                  />
                  <span className="absolute bottom-0 text-[11px] text-muted-foreground">Step {point.step}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
