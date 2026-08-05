// Coalesces a burst of near-simultaneous inbound messages from the same
// customer into one AI turn instead of one per message. Real customers
// routinely send a thought across two or three WhatsApp bubbles seconds
// apart ("Yes" then "please send it over") — without this, each one
// independently triggers a full AI turn, and the second turn often lands
// before the customer has even seen the reply to the first, producing
// redundant or confused-looking back-to-back replies. This is also what
// caused a real duplicate-payment-verification bug (two messages 2 seconds
// apart, each independently verifying the same receipt).
//
// `run` isn't called immediately — it's scheduled after a short window of
// silence, and rescheduled (not stacked) if another message for the same
// key arrives before it fires, so only the LAST of a burst actually runs.
// By the time it does, it re-reads current state (conversation brain,
// messages) fresh, so it naturally sees everything that arrived during the
// wait — no message content needs to be threaded through here.
//
// In-process only, keyed by customerId — sufficient because this is a
// single-instance deployment (same reasoning as src/lib/customer-lock.ts
// and the login lockout). Revisit with a durable/cross-instance mechanism
// if this ever runs on more than one instance.
const DEBOUNCE_MS = 5_000;
const MAX_WAIT_MS = 10_000;

interface PendingBurst {
  timer: ReturnType<typeof setTimeout>;
  firstMessageAt: number;
}

const pending = new Map<string, PendingBurst>();

export function scheduleDebounced(key: string, run: () => Promise<void>): void {
  const existing = pending.get(key);
  if (existing) clearTimeout(existing.timer);

  // Reset the "wait for silence" clock on every message, but never push
  // the total wait past MAX_WAIT_MS from the first message in the burst —
  // otherwise a customer who keeps typing continuously would get no reply
  // at all until they finally paused, which reads as the bot going silent.
  const firstMessageAt = existing?.firstMessageAt ?? Date.now();
  const elapsedSinceFirst = Date.now() - firstMessageAt;
  const delay = Math.min(DEBOUNCE_MS, Math.max(0, MAX_WAIT_MS - elapsedSinceFirst));

  const timer = setTimeout(() => {
    pending.delete(key);
    run().catch((error) => console.error(`Debounced task failed for ${key}`, error));
  }, delay);

  pending.set(key, { timer, firstMessageAt });
}
