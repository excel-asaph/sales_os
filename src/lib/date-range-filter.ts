import { cookies } from "next/headers";

// Each page that gets a date-range picker has its OWN cookie, not one
// shared value — Dashboard's range only touches 2 of 5 tiles (a minor,
// secondary lens on a mostly-live queue page), while Home's range is the
// primary way the whole page gets viewed. Sharing one cookie would mean
// picking "Today" on Dashboard to check today's queue also silently
// flips Home's revenue numbers to "Today" the next time you visit it —
// surprising, and the two pages' natural defaults genuinely differ (see
// DEFAULT_PRESET below), which a single shared value couldn't express
// anyway.
export const DATE_RANGE_FILTER_COOKIES = {
  dashboard: "date_range_filter",
  home: "home_date_range_filter",
} as const;

export type DateRangeScope = keyof typeof DATE_RANGE_FILTER_COOKIES;

export async function getDateRangeFilterCookie(scope: DateRangeScope): Promise<string | undefined> {
  const store = await cookies();
  return store.get(DATE_RANGE_FILTER_COOKIES[scope])?.value;
}

export interface ResolvedDateRange {
  // `end` is an EXCLUSIVE upper bound (the instant just after the range) —
  // avoids off-by-one/timezone edge cases from trying to express "end of
  // day" as an inclusive boundary. `start`/`end` both undefined means no
  // filter at all ("All time").
  start: Date | undefined;
  end: Date | undefined;
  label: string;
}

const PRESET_DAY_SPANS: Record<string, number> = {
  last7: 7,
  last30: 30,
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Parses a plain "YYYY-MM-DD" string (what the calendar picker and the URL
// param both use) as a LOCAL midnight, not UTC — `new Date("2026-08-01")`
// parses as UTC midnight, which lands on the wrong calendar day in any
// negative UTC-offset timezone. Returns undefined for anything malformed
// rather than throwing, since this always comes from a URL param a user
// could hand-edit.
function parseDateOnly(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatRangeLabel(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

// `value` is the raw cookie value: "today" | "yesterday" | "last7" |
// "last30" | "thismonth" | "all" | "custom:<from>:<to>" (both YYYY-MM-DD).
// `fallback` is which preset applies when there's no cookie yet (a first
// visit) — Dashboard defaults to "all" (this business's volume is low
// enough that "Today" could easily show all zeros and read as broken, see
// dashboard/page.tsx), Home defaults to "thismonth" (its behavior before
// this picker existed at all — introducing the picker shouldn't change
// what anyone already relying on that view sees by default). Anything
// unrecognized also falls back rather than erroring, since a real number
// silently vanishing from a misparsed range is worse than just showing
// the default.
export function resolveDateRange(value: string | undefined, fallback: string = "all"): ResolvedDateRange {
  const resolved = value ?? fallback;
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  if (resolved === "today") {
    return { start: today, end: tomorrow, label: "Today" };
  }

  if (resolved === "yesterday") {
    const yesterday = addDays(today, -1);
    return { start: yesterday, end: today, label: "Yesterday" };
  }

  if (resolved in PRESET_DAY_SPANS) {
    // Inclusive of today: "last 7 days" spans today and the 6 before it.
    const start = addDays(today, -(PRESET_DAY_SPANS[resolved] - 1));
    return { start, end: tomorrow, label: resolved === "last7" ? "Last 7 days" : "Last 30 days" };
  }

  if (resolved === "thismonth") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start, end: tomorrow, label: "This month" };
  }

  if (resolved.startsWith("custom:")) {
    const [, fromRaw, toRaw] = resolved.split(":");
    const from = parseDateOnly(fromRaw);
    const to = parseDateOnly(toRaw);
    if (from && to) {
      // Swap if picked out of order rather than reject — a calendar range
      // click can land the "end" before the "start" depending on click
      // order, and there's nothing actually invalid about that intent.
      const [start, rawEnd] = from <= to ? [from, to] : [to, from];
      const end = addDays(startOfDay(rawEnd), 1);
      return { start, end, label: formatRangeLabel(start, rawEnd) };
    }
  }

  return { start: undefined, end: undefined, label: "All time" };
}
