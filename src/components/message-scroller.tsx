"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { CardContent } from "@/components/ui/card";

/**
 * Dispatched on `window` by the reply box the moment a send starts, so the
 * thread can scroll even if the agent had scrolled up to re-read history
 * before typing. Sending is an explicit "I want to be at the bottom" action
 * in every chat client, and it's the one case the pinned-to-bottom rule
 * below must not veto.
 */
export const REPLY_SUBMITTED_EVENT = "antflow:reply-submitted";

// How close to the bottom still counts as following the conversation.
// Roughly one bubble of slack, so a small overscroll or a late-loading image
// doesn't silently unpin the viewer.
const PIN_THRESHOLD_PX = 120;

function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= PIN_THRESHOLD_PX;
}

/**
 * The message thread's scroll container. Replaces the older mount-only
 * ScrollToBottomAnchor, which scrolled once and never again — after a reply
 * the server component re-rendered with the new message but the client
 * component never remounted, so its `[]` effect didn't re-run and the new
 * bubble landed below the fold (reported 2026-09-04).
 *
 * Behaviour follows what every established chat client does:
 *
 *  - open at the latest message, with no visible jump;
 *  - auto-scroll on a new message ONLY if the viewer was already at the
 *    bottom, so nobody reading history gets yanked away mid-sentence;
 *  - always scroll when the viewer sent the message themselves;
 *  - offer an explicit "new messages" affordance instead of scrolling when
 *    they were scrolled up.
 */
export function MessageScroller({
  messageCount,
  children,
}: {
  messageCount: number;
  children: React.ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Whether the viewer was following the conversation *before* this render's
  // messages were added. It has to be tracked on scroll rather than measured
  // in the effect: once a new bubble is in the DOM the container has already
  // grown, and the previous position can no longer be recovered.
  const pinnedRef = useRef(true);
  const forceRef = useRef(false);
  const seenCountRef = useRef(messageCount);

  // `pinned` and `seenCount` exist as state purely so the pill can render;
  // pinnedRef is what the effects read, because a ref reflects the position
  // at the instant messages arrived rather than the last committed render.
  // Both are only ever written from event handlers — scroll and click — so
  // no effect in this component sets state, which is what keeps the
  // new-message path free of cascading renders.
  const [pinned, setPinned] = useState(true);
  const [seenCount, setSeenCount] = useState(messageCount);
  const unread = Math.max(0, messageCount - seenCount);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    pinnedRef.current = true;
    // Deliberately no setState here. Landing at the bottom fires a scroll
    // event, and the handler below marks the thread read from there.
  }, []);

  // Layout effect, not effect: this lands before paint, so the thread opens
  // at the newest message rather than visibly jumping down from the top.
  useLayoutEffect(() => {
    scrollToBottom("auto");
  }, [scrollToBottom]);

  useEffect(() => {
    const onReplySubmitted = () => {
      forceRef.current = true;
    };
    window.addEventListener(REPLY_SUBMITTED_EVENT, onReplySubmitted);
    return () => window.removeEventListener(REPLY_SUBMITTED_EVENT, onReplySubmitted);
  }, []);

  useLayoutEffect(() => {
    const added = messageCount - seenCountRef.current;
    seenCountRef.current = messageCount;
    if (added <= 0) return;

    if (forceRef.current || pinnedRef.current) {
      forceRef.current = false;
      scrollToBottom("smooth");
    }
    // Otherwise do nothing: the viewer is reading history, and `unread`
    // already reflects the gap between messageCount and what they've seen.
  }, [messageCount, scrollToBottom]);

  // Images, PDFs and receipts finish loading after their bubble is already
  // laid out, which grows the thread and pushes the newest message back out
  // of view. Re-pin whenever that happens, but only for a viewer who was at
  // the bottom to begin with.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) bottomRef.current?.scrollIntoView({ block: "end" });
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <CardContent
      ref={scrollerRef}
      onScroll={() => {
        const el = scrollerRef.current;
        if (!el) return;
        const atBottom = isNearBottom(el);
        pinnedRef.current = atBottom;
        setPinned(atBottom);
        if (atBottom) setSeenCount(messageCount);
      }}
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div ref={contentRef} className="flex flex-col gap-4">
        {children}
        <div ref={bottomRef} />
      </div>

      {unread > 0 && !pinned && (
        <div className="pointer-events-none sticky bottom-2 flex justify-center pt-2">
          <button
            type="button"
            onClick={() => {
              scrollToBottom("smooth");
              setPinned(true);
              setSeenCount(messageCount);
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium shadow-md transition-colors hover:bg-accent"
          >
            <ArrowDown className="size-3.5" aria-hidden />
            {unread === 1 ? "1 new message" : `${unread} new messages`}
          </button>
        </div>
      )}
    </CardContent>
  );
}
