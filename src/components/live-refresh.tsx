"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 10_000;

/**
 * Keeps the dashboard current without a manual reload.
 *
 * Inbound customer messages arrive by webhook and are written straight to
 * Postgres. Nothing told the browser: every page here is a server component,
 * so it only re-rendered on navigation or after a server action, and an
 * agent sitting on a conversation never saw a reply until they reloaded
 * (reported 2026-09-04).
 *
 * Polling rather than SSE or WebSockets, deliberately. A handful of agents
 * per business makes a push channel and its per-client database connection
 * disproportionate; this is a couple of indexed lookups every ten seconds,
 * and it fails soft — a dropped request just retries on the next tick
 * instead of leaving a dead socket that looks connected.
 *
 * The poll hits a small fingerprint endpoint (api/activity) and only calls
 * router.refresh() when the value changes, so an idle dashboard never
 * re-runs the real page queries. router.refresh() re-fetches the server
 * tree while preserving client state, so a half-typed reply survives, and
 * MessageScroller decides what to do about scroll position: it follows along
 * for anyone already at the bottom, and shows the "new messages" pill to
 * anyone reading back through history.
 */
export function LiveRefresh() {
  const router = useRouter();
  const lastSeenRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      // A backgrounded tab shouldn't poll at all: nobody is reading it, and
      // it still costs a request per tick per open tab.
      if (document.visibilityState !== "visible" || inFlightRef.current) return;

      inFlightRef.current = true;
      try {
        const response = await fetch("/api/activity", { cache: "no-store" });
        if (!response.ok) return;
        const { v } = (await response.json()) as { v: string };
        if (cancelled) return;

        if (lastSeenRef.current === null) {
          // First tick only establishes the baseline. Refreshing here would
          // fire a pointless refresh on every page load.
          lastSeenRef.current = v;
        } else if (v !== lastSeenRef.current) {
          lastSeenRef.current = v;
          router.refresh();
        }
      } catch {
        // Offline, or the request was cut off mid-navigation. Nothing to do
        // but try again on the next tick.
      } finally {
        inFlightRef.current = false;
      }
    }

    function schedule() {
      timer = setTimeout(async () => {
        await check();
        if (!cancelled) schedule();
      }, POLL_INTERVAL_MS);
    }

    // Coming back to the tab should show current state immediately rather
    // than after up to a full interval of staring at stale content.
    function onVisibilityChange() {
      if (document.visibilityState === "visible") void check();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
