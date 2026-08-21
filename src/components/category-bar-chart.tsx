"use client";

// Ordered categories -> count, horizontal bars, single hue. Shared by the
// Trends funnel panel and the conversion-attribution panel — both are
// structurally the same comparison, just different categories, so one
// component covers both rather than two near-duplicates. Styled like
// revenue-chart.tsx (scoped custom properties, light/dark override) rather
// than inventing a new visual language for this page.
export interface CategoryBarDatum {
  key: string;
  label: string;
  value: number;
  // Caller-computed, e.g. "23% of total" for the funnel or a status note —
  // kept generic here so this component doesn't need to know what kind of
  // percentage it is.
  sublabel?: string;
}

export function CategoryBarChart({ data }: { data: CategoryBarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="category-bar-chart flex flex-col gap-3">
      <style>{`
        .category-bar-chart {
          --bar-fill: #2a78d6;
          --bar-track: #e1e0d9;
        }
        .dark .category-bar-chart {
          --bar-fill: #3987e5;
          --bar-track: #2c2c2a;
        }
      `}</style>
      {data.map((d) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        return (
          <div key={d.key} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-sm text-muted-foreground">{d.label}</span>
            <div
              className="relative h-6 flex-1 overflow-hidden rounded-[4px]"
              style={{ background: "var(--bar-track)" }}
            >
              <div
                className="h-full rounded-[4px] transition-[width]"
                style={{
                  width: `${Math.max(pct, d.value > 0 ? 2 : 0)}%`,
                  background: "var(--bar-fill)",
                }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">{d.value}</span>
            {d.sublabel && (
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{d.sublabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
