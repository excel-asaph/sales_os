"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A progress bar that visibly fills toward the next scheduled follow-up,
 * with no polling or ticking timer: it paints at the current elapsed
 * fraction on mount, then — one frame later — sets a CSS transition to
 * 100% timed to land exactly at `scheduledFor`. The browser's compositor
 * does the rest; nothing re-renders while it's running.
 */
export function FollowupCountdownBar({
  createdAt,
  scheduledFor,
  className,
}: {
  createdAt: string;
  scheduledFor: string;
  className?: string;
}) {
  const start = new Date(createdAt).getTime();
  const end = new Date(scheduledFor).getTime();
  const totalMs = Math.max(end - start, 1);
  const initialPct = Math.min(100, Math.max(0, ((Date.now() - start) / totalMs) * 100));

  const [pct, setPct] = useState(initialPct);
  const [transitionMs, setTransitionMs] = useState(0);

  useEffect(() => {
    const remainingMs = end - Date.now();
    if (remainingMs <= 0) {
      setPct(100);
      return;
    }
    // The frame boundary here matters: setting the target width in the
    // same paint as the initial one gives the browser nothing to
    // transition from. One rAF later, the initial fraction has already
    // committed, so this update animates instead of snapping.
    const raf = requestAnimationFrame(() => {
      setTransitionMs(remainingMs);
      setPct(100);
    });
    return () => cancelAnimationFrame(raf);
    // Deliberately run once on mount — a fresh page load is the only time
    // this should recompute; the CSS transition owns the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("h-1 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full bg-primary"
        style={{
          width: `${pct}%`,
          transitionProperty: "width",
          transitionDuration: `${transitionMs}ms`,
          transitionTimingFunction: "linear",
        }}
      />
    </div>
  );
}
