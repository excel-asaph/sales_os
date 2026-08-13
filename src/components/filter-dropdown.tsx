"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FilterDropdownOption {
  value: string;
  label: string;
  count: number;
  /** Where selecting this option navigates to — computed server-side, where the other active filters and search query are already known, rather than reconstructed here. */
  href: string;
}

/**
 * A single filter facet as a compact "Label: value ▾" dropdown, instead of
 * a permanently-visible row of chips — the standard pattern (Linear,
 * Notion, Zendesk, Front) once there are more than a handful of options at
 * once. Purely a navigation trigger: selecting an option pushes its href,
 * the actual filtering happens server-side via the resulting URL.
 */
export function FilterDropdown({
  label,
  placeholder,
  activeValue,
  clearHref,
  options,
}: {
  label: string;
  placeholder: string;
  activeValue: string | undefined;
  clearHref: string;
  options: FilterDropdownOption[];
}) {
  const router = useRouter();
  const ALL = "__all__";

  return (
    <Select
      value={activeValue ?? ALL}
      onValueChange={(value) => {
        if (value === ALL) {
          router.push(clearHref);
          return;
        }
        const option = options.find((o) => o.value === value);
        if (option) router.push(option.href);
      }}
    >
      <SelectTrigger className="w-fit">
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue placeholder={placeholder}>
          {(value: string) => (value === ALL ? placeholder : (options.find((o) => o.value === value)?.label ?? placeholder))}
        </SelectValue>
      </SelectTrigger>
      {/* Overridden here, not in the shared ui/select.tsx primitive: that
          default (w-(--anchor-width), alignItemWithTrigger) is the
          "native <select>" interaction — popup aligned to the selected
          item, sized to the trigger — which a future genuine native-style
          select elsewhere might actually want. This is a plain filter
          dropdown instead: always opens directly below the trigger, sized
          to fit its own longest label rather than the (much narrower)
          trigger button, since w-(--anchor-width) was clipping stage
          labels like "INTRODUCTION COMPLETED" with no ellipsis or scroll. */}
      <SelectContent align="start" alignItemWithTrigger={false} className="w-max min-w-48">
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label} · {option.count}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
