# The greeting shortcut — what it does, and how to undo it

Shipped 2026-09-03. The opening message of a brand-new conversation is sent
directly from the playbook instead of being composed by an AI turn.

This doc exists so the change can be reversed without re-deriving any of the
reasoning behind it. **To revert entirely, see "Reverting" at the bottom —
it's a two-line deletion.**

## Why

`docs/AI_COST_AUDIT.md` traced every Claude call in the app. The opening
turn stood out: it's the one turn where the model has nothing to reason
about — the customer has just arrived, nothing is known about them, and the
reply is this business's standard pitch either way.

Measured against production on 2026-09-03, 155 conversations:

| | |
|---|---|
| Distinct first AI messages | **4** |
| Most common | **152 (98.1%)** |

That most-common text was the playbook's `delivery_first_pitch`, verbatim.

Opening-turn *actions* were similarly uniform (157 conversations):

| Shape | Share |
|---|---|
| message + `record_fact` + `create_followup` + `update_stage` | 79.0% |
| message + `create_followup` + `update_stage` | 16.6% |
| minor variants | 4.4% |

The recorded fact was nearly always the same one: `selected_product:
DIABETES FIX ebook, price 10000 NGN, product_id …` — deterministic, because
the business sells exactly one thing.

## What it is not

It does **not** reimplement anything. It calls the same four Action Contract
handlers (`src/lib/actions.ts`) the model would have called, with the
arguments the data shows it reliably picks:

1. `send_template_message` — the playbook pitch key
2. `record_fact` — `ENTITY / selected_product`
3. `update_stage` — `GREETING_SENT` + objective
4. `create_followup` — 1 hour, `GENERAL`

Every rule embedded in those handlers still applies untouched — in
particular `createFollowup`'s paused-business kill switch, its refusal to
nudge a customer already tagged "Uninterested", and its no-op when a
follow-up is already active.

**Follow-ups were deliberately left alone.** The same audit found follow-up
text genuinely varied — 49 distinct texts across 99 sends, the most common
only 13.1%, referencing what each customer actually said ("have you been
able to save up towards it"). Those are still composed fresh by the AI at
send time, inside `followup-worker.ts`. Only the *creation* of the first
follow-up moved; everything about how follow-ups fire, compose, and continue
is unchanged.

## The gates

All must hold, or it falls through to the normal AI turn
(`src/lib/greeting-shortcut.ts`):

| Gate | Why |
|---|---|
| Stage is `NEW_LEAD` | Anything else has history the pitch can't account for |
| No outbound message yet | This must be the true opening turn |
| Customer has no prior conversations | A returning customer gets a cold re-pitch otherwise — one real customer opened with "I'm sorry for not going ahead" |
| Every opener message is `TEXT` | An image/PDF opener is exactly where the pitch is wrong — one customer opened by sending a "10 Days Diabetes Routine" PDF |
| Business has exactly 1 available product | "They want product X" is only deterministic with one product; with a catalogue it's real judgment |
| The playbook pitch key is non-empty | Nothing to send otherwise |
| The send actually succeeded | If it didn't, fall through so the model gets its normal attempt |

## Timing — what the customer experiences

Unchanged from before, deliberately:

- **The typing indicator still fires**, immediately on the inbound message,
  before any of this runs (`ingest-message.ts`).
- **The message-debounce window still applies.** This path sits *inside* the
  debounced callback, so a customer sending "hi" then "how much?" seconds
  apart is still coalesced into one reply, exactly as before. The shortcut
  is only consulted once the burst has settled.

What did change is that composing the reply no longer takes an AI turn. To
stop a multi-paragraph pitch from landing a fraction of a second after
"typing…" appears — faster than any business types — the shortcut pauses
2–4 seconds (randomised) before sending. Tunable via `TYPING_PAUSE_MIN_MS` /
`TYPING_PAUSE_MAX_MS` in `src/lib/greeting-shortcut.ts`; setting both to 0
removes the pause entirely.

That range is a judgment call about plausibility, not a measurement of what
the model used to take. The pause happens after every gate has passed, so
nothing that falls through to the model is delayed on its way there.

## Measured effect (dry run over all historical conversations)

| | |
|---|---|
| Would short-circuit — no AI call | **152** |
| Fall through to the AI | 9 (7 returning customers, 2 attachment openers) |
| Would receive a *different* message than the AI actually sent | **1 (0.66%)** |

That one case: an opener of *"Good morning, I don't have 10k, I just 5k with
me can it be delivered"*. The scripted pitch still states the ₦10,000 price,
so it answers the question without the empathetic framing the model used —
and the customer's next message goes through the full AI regardless.

## What this does NOT protect against

The AI adapts to what a customer actually said; a script cannot. The 98.1%
figure describes **today's traffic**, not a permanent property. If ad
creative or audience changes and openers diversify, the scripted pitch will
fit worse — and nothing will report that it's fitting worse.

**Re-run the measurement before assuming it still holds.** The queries used
are reproducible: group conversations by their first outbound AI message and
compare against the playbook pitch. If the "most common share" drops
meaningfully below ~95%, reconsider.

## Reverting

The shortcut is deliberately isolated to make this trivial.

**Full revert** — in `src/lib/ingest-message.ts`, delete these two lines:

```ts
import { tryGreetingShortcut } from "@/lib/greeting-shortcut";
```

```ts
if (await tryGreetingShortcut(conversation!.id)) return;
```

That restores the previous behaviour exactly: every opening turn goes to
`runAIEmployeeTurn` again. `src/lib/greeting-shortcut.ts` can then be
deleted, or left in place unused. Nothing else references it, no schema
changed, no data migrated.

**Partial revert** — to keep the shortcut but narrow it, tighten a gate in
`tryGreetingShortcut`. Returning `false` anywhere in that function always
falls through to the AI, so a new gate is a one-line early return.

**Per-business disable** — there is no Settings toggle for this. If one is
wanted later, the natural place is a `BusinessConfig` boolean checked
alongside the other gates.

## Related

- `docs/AI_COST_AUDIT.md` — the audit this came from, including the two
  places deliberately left alone (Trends insights, receipt verification)
- `src/lib/followup-sequence.ts` — follow-up timing, unchanged
- `src/worker/followup-worker.ts` — how follow-ups actually fire and
  compose, unchanged
