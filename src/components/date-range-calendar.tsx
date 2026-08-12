"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isSameDay(a: Date | null, b: Date | null): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// A plain month-grid range picker, built with native Date math rather than
// a library — this project has no date-picker dependency, and the only
// thing needed here (click a start day, click an end day, see the range
// highlighted between them) doesn't warrant adding one. Only handles
// single-month navigation (no dual-month view) and disables leading/
// trailing days from adjacent months rather than making them click-through
// — both deliberately smaller-scope choices to keep this contained.
export function DateRangeCalendar({
  from,
  to,
  onChange,
}: {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
}) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(from ?? new Date()));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const today = new Date();

  const previewEnd = from && !to ? hoverDate : null;
  const rangeStart = from && previewEnd ? (from <= previewEnd ? from : previewEnd) : from;
  const rangeEnd = from && previewEnd ? (from <= previewEnd ? previewEnd : from) : to;

  const cells = Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - firstWeekday + i));

  function handleDayClick(day: Date) {
    if (!from || (from && to)) {
      onChange(day, null);
      return;
    }
    onChange(day < from ? day : from, day < from ? from : day);
  }

  return (
    <div className="w-64">
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        ))}
        {cells.map((day) => {
          const inCurrentMonth = day.getMonth() === month;
          const isStart = isSameDay(day, rangeStart);
          const isEnd = isSameDay(day, rangeEnd);
          const inRange = inCurrentMonth && rangeStart && rangeEnd && day > rangeStart && day < rangeEnd;
          const isToday = isSameDay(day, today);

          if (!inCurrentMonth) {
            return <span key={day.toISOString()} className="size-8" />;
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => setHoverDate(day)}
              className={`relative flex size-8 items-center justify-center rounded-full text-sm transition-colors ${
                isStart || isEnd
                  ? "bg-primary font-semibold text-primary-foreground"
                  : inRange
                    ? "bg-primary/15 text-foreground"
                    : "text-foreground hover:bg-muted"
              } ${isToday && !isStart && !isEnd ? "font-semibold underline underline-offset-2" : ""}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
