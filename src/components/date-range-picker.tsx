"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import type { DateRangeScope } from "@/lib/date-range-filter";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "thismonth", label: "This month" },
  { value: "all", label: "All time" },
];

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Shared between Dashboard and Home, each with its own cookie (`scope`,
// see date-range-filter.ts) — never a shared value, and on either page it
// only ever scopes the report-style numbers, not any live/current-state
// count or list (each page's own comments explain which is which for it).
// Presets are plain links to the same cookie-setting route the sidebar's
// number switcher already uses (a real navigation, not a client-side
// state change, so the new cookie is guaranteed visible on the very next
// render); the custom range needs its own "Apply" link since the target
// URL depends on what's been clicked in the calendar, computed
// client-side as that selection changes.
export function DateRangePicker({
  currentLabel,
  redirectTo,
  scope,
}: {
  currentLabel: string;
  redirectTo: string;
  scope: DateRangeScope;
}) {
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);

  const applyHref =
    from && to
      ? `/api/date-range-filter?scope=${scope}&value=custom:${formatDateOnly(from)}:${formatDateOnly(to)}&redirectTo=${encodeURIComponent(redirectTo)}`
      : undefined;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <CalendarDays />
        {currentLabel}
        <ChevronDown className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex">
          <div className="flex flex-col gap-0.5 border-r p-2">
            {PRESETS.map((preset) => (
              <a
                key={preset.value}
                href={`/api/date-range-filter?scope=${scope}&value=${preset.value}&redirectTo=${encodeURIComponent(redirectTo)}`}
                className="rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap hover:bg-muted"
              >
                {preset.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-3 p-3">
            <DateRangeCalendar from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }} />
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {from && to ? "Pick Apply to use this range" : "Pick a start and end date"}
              </span>
              {applyHref ? (
                <Button size="sm" nativeButton={false} render={<a href={applyHref} />}>
                  Apply
                </Button>
              ) : (
                <Button size="sm" disabled>
                  Apply
                </Button>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
