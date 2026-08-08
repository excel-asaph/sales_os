"use client";

import { useEffect, useRef } from "react";

// Placed as the last child inside a scrollable message list — on mount,
// scrolls its nearest scrollable ancestor down to reveal itself, landing
// the view at the latest message instead of the top, the same way every
// real messaging app opens a conversation. Deliberately mount-only (no
// dependency array tracking message count) — there's no live-updating
// message stream yet for this to fight with; revisit alongside that work
// (only auto-scroll on a new message if the viewer was already near the
// bottom, so it doesn't yank someone reading older history).
export function ScrollToBottomAnchor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "end" });
  }, []);

  return <div ref={ref} />;
}
