"use client";

import { useState } from "react";

interface RevenueChartPoint {
  label: string;
  fullLabel: string;
  value: number;
}

// Single-series magnitude-over-time: a plain column chart, one hue, no
// legend needed (the card title already says what's plotted). Colors are
// the dataviz skill's validated sequential-blue steps, scoped locally
// since this app's shadcn theme is an achromatic "neutral" preset with no
// real accent hue defined — chart color intentionally doesn't borrow from
// --primary here.
export function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(0, ...data.map((d) => d.value));
  const niceMax = niceCeiling(max);
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="revenue-chart">
      <style>{`
        .revenue-chart {
          --bar-fill: #2a78d6;
          --bar-fill-hover: #1c5cab;
          --grid-line: #e1e0d9;
        }
        .dark .revenue-chart {
          --bar-fill: #3987e5;
          --bar-fill-hover: #5598e7;
          --grid-line: #2c2c2a;
        }
      `}</style>
      <div className="flex gap-3">
        <div className="flex h-48 flex-col justify-between pb-6 text-right text-xs text-muted-foreground">
          {[...gridSteps].reverse().map((step) => (
            <span key={step} className="tabular-nums">
              {formatCompactNaira(niceMax * step)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-0 bottom-6 flex flex-col justify-between">
            {[...gridSteps].reverse().map((step) => (
              <div key={step} className="h-px" style={{ background: "var(--grid-line)" }} />
            ))}
          </div>
          <div className="relative flex h-48 items-end gap-1">
            {data.map((point, i) => {
              const heightPct = niceMax > 0 ? (point.value / niceMax) * 100 : 0;
              return (
                <div
                  key={point.fullLabel}
                  className="group relative flex flex-1 flex-col items-center justify-end pb-6"
                  onPointerEnter={() => setHovered(i)}
                  onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered((h) => (h === i ? null : h))}
                  tabIndex={0}
                >
                  {hovered === i && (
                    <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-popover px-2.5 py-1.5 text-xs shadow-md ring-1 ring-foreground/10">
                      <div className="font-semibold tabular-nums">{formatNaira(point.value)}</div>
                      <div className="text-muted-foreground">{point.fullLabel}</div>
                    </div>
                  )}
                  <div
                    className="w-full max-w-6 rounded-t-[4px] transition-colors"
                    style={{
                      height: `${Math.max(heightPct, point.value > 0 ? 2 : 0)}%`,
                      background: hovered === i ? "var(--bar-fill-hover)" : "var(--bar-fill)",
                    }}
                  />
                  <span className="absolute bottom-0 text-[11px] text-muted-foreground">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function niceCeiling(value: number): number {
  if (value <= 0) return 10000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function formatNaira(value: number): string {
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}

function formatCompactNaira(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${Math.round(value)}`;
}
