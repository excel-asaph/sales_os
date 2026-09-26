# What the AI actually costs, and what we changed

**Measured 2026-09-23** from 804 production API calls across 259 customer
turns, pulled from Railway. Every number here came out of the logs. The
estimates that preceded them were wrong in both directions, which is the
main lesson of this document.

## How to reproduce this

```
npx --yes @railway/cli@latest logs --service sales_os | head -600 > app.log
npx --yes @railway/cli@latest logs --service worker   | head -400 > wk.log
cat app.log wk.log | python scripts/analyze-claude-usage.py
```

The CLI needs no install — `npx` fetches it, and the project is already
linked (`celebrated-determination`, production). Both services log
`[claude-usage]` on every call.

## The baseline (2026-09-23)

| | |
|---|---|
| Cost per customer turn | **$0.0176** (~28 naira) |
| API calls per turn | **mean 3.10**, median 3, max 7 |
| Cache hit rate | 95.3% of input tokens — **misleading, see the TTL section** |
| Uncached input per call | **2 tokens** |
| Output per turn | mean 426, median 318 |

Split by service:

| | Turns | Cost | Per turn | Calls/turn |
|---|---|---|---|---|
| `sales_os` (inbound messages) | 124 | $2.63 | $0.0212 | 3.24 |
| `worker` (follow-ups) | 135 | $1.93 | $0.0143 | 2.96 |
| receipt verification | 16 calls | $0.18 | — | 1 |

Where the money goes:

| | Share |
|---|---|
| **Cache reads** | **46.8%** |
| Cache writes | 28.9% |
| Output (incl. thinking) | 24.2% |
| Uncached input | 0.1% |

## The finding

Nearly half the bill is re-reading the same prompt, because **two thirds of
turns take three API calls** and each call re-reads the whole ~9,000-token
prefix. (The original text here also called the caching "close to perfect".
It is well built, but that judgement rested on a metric that cannot see cache
misses — see the TTL section.)

The arithmetic is structural. One tool call per response means:

| Tool calls | Emitted | API calls |
|---|---|---|
| 1 | — | 2 |
| 2 | serially | **3** |
| 2 | together | **2** |

`ai-runtime.ts` has always collected every `tool_use` block from a response,
executed them in order, and returned all results in one message. The model
simply was not batching them.

## What we shipped

**`825aa70` — a three-line addition to `system-prompt.ts`** telling the model
to put multiple tool calls in the same response, with an explicit carve-out
for genuinely sequential work (relaying a `request_payment_verification`
result, deciding what to do after a send fails).

Additive: no existing line changed. It alters how many round trips a turn
takes, not what the turn does.

**Expected:** ~20% off, if the median moves from 3 calls to 2.

**The trade, stated plainly:** with serial calls the model sees each result
before choosing the next action. Batched, it commits to both up front — so
if a send fails, the fact was already recorded.

**To revert:** delete the "Doing several things at once" section.

## Did the batching change work? (measured 2026-09-26)

Yes, but at about a quarter of the projected size. Segmented so the two
samples are comparable:

| Segment | Calls/turn before | after | Turns in <=2 calls |
|---|---|---|---|
| No ebook | 3.07 | **2.93** (-4.6%) | 14% -> 20% |
| With ebook | 3.15 | **3.02** (-4.1%) | 24% -> 30% |

The instruction lands consistently in both segments, but the median turn
still takes three calls, so the saving is ~4.5% rather than the ~20%
projected. Worth keeping — it costs nothing — but it was oversold.

**Raw cost per turn rose 30% over the same period, and none of it was this
change.** Two things moved underneath it: ebook traffic grew from 31.7% to
43.2% of turns as more customers passed delivery, and cold cache starts
tripled from 5.0% to 15.0%. Comparing raw cost across two windows without
segmenting on those would have produced exactly the wrong conclusion.

## What we ruled out, and why

Three of the four original candidates died on contact with the data. Each was
plausible from reading the code and wrong once measured.

### 1-hour cache TTL — RULED OUT, THEN REINSTATED

**This section was wrong on 2026-09-23 and is kept as written plus its
correction, because the mistake is more instructive than the conclusion.**

*What it said:* the cache is at 95.3% hit rate with 2 uncached tokens per
call, so it is continuously warm; a 1-hour cache writes at 2x instead of
1.25x, so on an already-warm cache it is a pure surcharge and would raise
the bill.

*Why that was wrong:* **`input_tokens` cannot detect a cache miss.** When the
cache misses, the prefix is billed as `cache_write`, not as `input`. So
`input_tokens` reads 2 whether the call hit cache or missed it entirely. The
"95.3% hit rate" was computed from a number that is blind to the thing it
was being used to measure.

**The right signal is a large `cache_write` on `iter=0`.** By that measure,
on 2026-09-26: **15.0% of turns started cold** (43 of 287), and a cold turn
costs **$0.050 against a warm turn's $0.018 — 2.75x.**

The refinement that matters is *which* block. Measured by segment:

| Block | Size | Share of turns | Cold starts |
|---|---|---|---|
| Base prefix (system + tools) | ~9,000 tok | 100% | 2.8% |
| Product text (the ebook) | ~13,000 tok | 43% | **18.5%** |

The base prefix is touched by every conversation and stays warm on five
minutes. The ebook block is larger, touched by under half of traffic, and
runs at roughly five turns an hour — so its five-minute window lapses
between hits, and each miss rewrites 13,000 tokens.

**First attempt (854c69e): `ttl: "1h"` on the product block only. It took
production down.** Every request carrying that block was rejected:

    system.1.cache_control.ttl: a ttl='1h' cache_control block must not
    come after a ttl='5m' cache_control block. Note that blocks are
    processed in the following order: `tools`, `system`, `messages`.

Longer TTLs must come **first**. The layout was tools (5m) -> stable prompt
(5m) -> product (1h), which is exactly backwards. It broke every conversation
past delivery — 43% of turns — for about four hours, and surfaced to the
owner as "the AI ran into a technical error right after a human action",
because *Return to AI* and *Record payment* both re-enter the runtime on
conversations that are by definition post-delivery.

Typecheck, lint and build all passed. Only the API could catch it.

**Shipped (0c9a395): `ttl: "1h"` on all three blocks that render before
`messages`** — the tools breakpoint, the stable prompt, and the product text.
The automatic breakpoint on `messages` stays 5m, which is legal because it
renders last. Expected 10-15%, growing as more customers pass delivery.

**`scripts/check-cache-ttl.ts` is the durable outcome.** It sends the real
request shape at `max_tokens: 1` and asserts three layouts: the old one is
accepted, the outage layout is rejected, and the proposed one is accepted.
Run it before touching `cache_control` again:

    npx --yes @railway/cli@latest run --service sales_os --       npx tsx scripts/check-cache-ttl.ts <product-text.txt>

`railway run` injects production credentials into a local process, so the key
never has to be copied anywhere.

### Setting `effort` — not where the money is

The theory was that Sonnet 5 runs adaptive thinking at default `high` effort
on every message, including "ok thanks", and that thinking (billed at output
rates) was dominating.

Output averages **426 tokens per turn**, median 318 — a reply plus modest
reasoning. Output is 24.2% of the bill; a `medium` setting might trim a
quarter of that, so **~6% of the bill against a real quality cost** on the
judgment calls that matter most (opt-out detection, receipt interpretation,
escalation, the medication rule). Bad trade.

### Downscaling receipt images — worth 0.71%

Vision input is tokenized by pixel area, so the theory was that full-size
receipt screenshots were expensive.

Measured: 9 image receipts averaged **3,011 input tokens** (max 3,472).
WhatsApp already compresses what customers send. Downscaling every one to
~1,200 tokens saves **$0.03 in this sample — 0.71% of the bill** — while
risking a misread amount on a blurry transfer alert.

Receipt verification in total is **3.9%** of spend. Not where to look.

## Correction: follow-ups are 42% of spend, not a minor line

An earlier version of this analysis called the follow-up worker "the smallest
measured prize". That was wrong. The worker is **$1.93 of the $4.56 sample —
42%** — because follow-ups run the same full agent loop as a live customer
message, at 2.96 calls per turn.

It is still not the next thing to change. The batching fix applies to the
worker too, since it goes through `runAIEmployeeTurn`. **Re-measure before
deciding whether a rewrite is still worth it** — if follow-ups drop to 2
calls, most of the prize is already taken.

If it is still worth it afterwards, the shape is a single forced-tool call
returning `{action: "send" | "skip" | "escalate", message, fact?}`, with the
worker executing the decision in code. That is this codebase's own stated
principle — *AI reasons, platform executes* — applied to the one path that
does not follow it. It is not a Batch API candidate: batch cannot run an
agent loop, and the 24-hour SLA can push a follow-up outside the WhatsApp
customer-service window, where it would need a template instead.

## Measuring the change

Re-run the command at the top. The number that matters is **API calls per
turn**, baseline **3.10**.

| Signal | Where | What bad looks like |
|---|---|---|
| Calls per turn | this script | unchanged at ~3.1 → the instruction isn't landing, delete it |
| Conversions, follow-up reply rate | Trends | any drop |
| Conversations awaiting a human | sidebar badge | a spike |
| Health-claim hits | Trends | a jump |

## Things that are already right

Worth recording so nobody "optimizes" them later:

- **Prompt caching is correctly *structured*.** Two explicit breakpoints
  (stable prompt, product text) plus automatic caching on the growing tail.
  The structure was right; only the TTL on the product block was wrong, and
  that is now fixed. Judge it by cold-start rate, never by `input_tokens`.
- **The two blocks are deliberately separate.** Appending the ebook to the
  system string would fork the cache into two full copies instead of sharing
  a prefix.
- **`greeting-shortcut.ts` skips the model entirely** on opening turns. The
  logs show it working. Same instinct as the batching fix, one level earlier.
- **Model choice is not the lever.** Haiku 4.5 is $1/$5 against Sonnet 5's
  $2/$10 — exactly 2x, not the order of magnitude it sounds like — and this
  system is entirely tool-driven, which is where smaller models are weakest.

## The lesson worth keeping

Three separate conclusions in this document were wrong when first written,
and each was wrong in a way the next measurement caught:

| Claim | Why it was wrong |
|---|---|
| "The cache is near-perfect, 95.3% hit rate" | `input_tokens` cannot see a cache miss — a miss bills as `cache_write` |
| "The follow-up worker is the smallest prize" | It is 42% of spend |
| "The 1h TTL carries zero risk, the model sees identical bytes" | True of the model, irrelevant to the request, which the API rejected |

The pattern: each was a confident inference from reading code, and each
survived until something actually measured it. Nothing in this file should be
trusted over a fresh run of `scripts/analyze-claude-usage.py`.

## Related: the duplicate-order guard (a0b2527)

The outage's second-order effect. While the AI was failing behind *Record
payment*, the button looked broken and was clicked four times on one
conversation — four VERIFIED orders, 40,000 naira against a 10,000 naira
sale. The rows were deleted; `createAndVerifyOrder` now ignores a second
VERIFIED order for the same conversation and product within ten minutes and
writes a `DUPLICATE_ORDER_IGNORED` event instead.

A silent no-op, not a thrown error: the dialog has no error surface, so
throwing would close it and still report success.
