# AI credit spend audit — findings to revisit

**Status: the greeting half shipped 2026-09-03 — see
`docs/GREETING_SHORTCUT.md` for what was built, what it measured, and how to
revert it. The follow-up half was deliberately NOT built: measuring it
against production showed follow-up text is genuinely varied (49 distinct
texts across 99 sends, most common only 13.1%), so the recommendation in
item 2 below was wrong and is retracted. Follow-ups stay AI-composed.**

A save point from an audit done 2026-08-28. Every Claude API call site in the codebase was traced (only 3
exist), plus a check on whether any of this touches Meta policy compliance.

## The 3 places Claude actually gets called

1. **`src/lib/ai-runtime.ts` (`runAIEmployeeTurn`)** — the AI Employee
   Runtime. A full reasoning loop (cached system prompt + every tool, up to
   12 iterations) that runs on:
   - every real inbound customer message (`ingest-message.ts`)
   - every follow-up that fires inside the 24h customer service window
     (`followup-worker.ts`)
   - every post-human-action turn (`dashboard/[id]/actions.ts`,
     `runAIAfterHumanAction` — e.g. after a human replies or an order gets
     verified)
2. **`src/lib/trends.ts` (`generateTrendsInsights`)** — one plain-text call,
   click-triggered only, on the Trends page. Already the cheapest possible
   shape (on-demand, no caching needed given how rarely it's clicked). Not
   worth optimizing further.
3. **`src/lib/receipt-verification.ts` (`verifyReceiptContent`)** — vision +
   fraud-judgment on every submitted payment receipt. Genuine, necessary AI
   work — no deterministic shortcut exists for reading a blurry bank alert
   and judging tampering. Leave alone.

## Already-good cost hygiene in place, worth knowing exists

- **Prompt caching** — `ai-runtime.ts` caches the system prompt and tools
  (`cache_control: { type: "ephemeral" }`), plus an automatic breakpoint on
  the growing message history. Most iterations past the first, and most
  turns within the cache window, read from cache instead of paying full
  input price again.
- **Message debouncing** (`src/lib/message-debounce.ts`) — a burst of
  near-simultaneous inbound messages from the same customer (e.g. "Yes"
  then "please send it over" two seconds apart) gets coalesced into ONE AI
  turn, not one per message. 5s debounce, 10s hard cap so a continuously
  typing customer still gets a reply.

## Two concrete, high-volume places paying for reasoning that isn't needed

1. **The greeting to every new lead runs the full AI loop — and there's an
   unused field built for exactly this.** `BusinessConfig.greetingTemplate`
   exists in the schema specifically for a fixed opener, but nothing in the
   codebase reads it (confirmed by grep — only the default-null fallback in
   `knowledge.ts` references the field name at all). Every first message to
   every new lead currently pays for a full system-prompt + tool-calling
   turn to say something that's the same for every new lead of a given
   business.
2. **Every in-window follow-up also runs the full loop, for content that's
   already scripted.** `followup-sequence.ts` fixes the "angle" per step in
   code (e.g. "a simple, low-pressure check-in"). A reviewed, business-
   specific fallback already exists (`BusinessConfig.playbook.payment_followup`)
   — but it's only ever used when the AI call *fails*
   (`followup-worker.ts`'s catch block), never as the primary path.

**Proposed fix (not yet built):** wire up `greetingTemplate` as a real
first-message path, and give in-window follow-ups a "compose from the
playbook template, skip the AI" default — falling back to a full AI call
only when something genuinely customer-specific is worth referencing.
Keeps personalization where it earns its cost (the live back-and-forth,
receipt judgment) and cuts it from the two most repetitive, highest-volume
touchpoints.

## Not yet fully audited — worth a closer look later

`runAIAfterHumanAction` (fires after a human reply or an order verification)
— some of its follow-through messages (e.g. "thanks, here's your product")
may be similarly templatable, but the individual trigger reasons weren't
each traced the way the greeting/follow-up paths were.

## On Meta policy — doesn't move the needle either way

Meta's policies govern message *content* and *delivery mechanics* (template
category, opt-in, frequency) — not which internal system produced the
text. Hardcoding the greeting or follow-up wording doesn't touch compliance
at all, as long as the text itself stays within what was already fixed in
the ad-copy/playbook audit (`docs/AD_COPY_COMPLIANCE_AUDIT.md`,
`docs/META_WHATSAPP_COMPLIANCE.md`) — since it would just be the same
reviewed playbook text, sent more cheaply.

**One real, separate, still-open compliance item** (unrelated to cost):
VitalFix's re-engagement template hasn't been submitted for review yet.
Per `docs/META_WHATSAPP_COMPLIANCE.md`'s checklist, any submitted
marketing/re-engagement template needs an opt-out mechanism built in —
worth confirming when it's actually submitted.
