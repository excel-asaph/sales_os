import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { PeriodComparison } from "@/lib/trends";

// A conversion rate off a handful of conversations is noise presented as a
// number — one extra sale on a base of three reads as a 33-point swing. Below
// this the rate column shows a dash instead, deliberately: the Insights panel
// is instructed to make the same call in words, and the two should agree.
const MIN_BASE_FOR_RATE = 10;

function Delta({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        <span className="sr-only">No change</span>0
      </span>
    );
  }
  const up = diff > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      }`}
    >
      <Icon className="size-3" aria-hidden />
      {up ? "+" : ""}
      {diff}
    </span>
  );
}

export function PeriodComparisonTable({ comparison }: { comparison: PeriodComparison }) {
  const { current, previous, days } = comparison;

  const rows = [
    { label: "Conversations started", current: current.started, previous: previous.started },
    ...current.reached.map((step, i) => ({
      label: `Reached ${step.label.toLowerCase()}`,
      current: step.count,
      previous: previous.reached[i]?.count ?? 0,
    })),
    { label: "Ended as lost lead", current: current.lostLead, previous: previous.lostLead },
    { label: "Escalated to a human", current: current.escalations, previous: previous.escalations },
    { label: "Follow-ups sent", current: current.followupsSent, previous: previous.followupsSent },
    { label: "Replies after a follow-up", current: current.followupReplies, previous: previous.followupReplies },
  ];

  const rateFor = (p: typeof current) => {
    const completed = p.reached[p.reached.length - 1]?.count ?? 0;
    if (p.started < MIN_BASE_FOR_RATE) return null;
    return (completed / p.started) * 100;
  };
  const currentRate = rateFor(current);
  const previousRate = rateFor(previous);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold tabular-nums">
          {currentRate === null ? "—" : `${currentRate.toFixed(0)}%`}
        </span>
        <span className="text-sm text-muted-foreground">
          of leads started in the last {days} days went on to complete
          {previousRate !== null && currentRate !== null
            ? `, against ${previousRate.toFixed(0)}% the ${days} days before`
            : currentRate === null
              ? ` — too few conversations yet to put a rate on it`
              : ""}
          .
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Measure</th>
              <th className="pb-2 pr-4 text-right font-medium">Last {days}d</th>
              <th className="pb-2 pr-4 text-right font-medium">Prev {days}d</th>
              <th className="pb-2 text-right font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="py-2 pr-4">{row.label}</td>
                <td className="py-2 pr-4 text-right font-medium tabular-nums">{row.current}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">{row.previous}</td>
                <td className="py-2 text-right tabular-nums">
                  <Delta current={row.current} previous={row.previous} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
