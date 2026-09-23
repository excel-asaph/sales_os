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
| Cache hit rate | **95.3%** of input tokens |
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

Nearly half the bill is re-reading the same prompt. Not because caching is
broken — it is close to perfect — but because **two thirds of turns take
three API calls**, and each call re-reads the whole ~9,000-token prefix.

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

## What we ruled out, and why

Three of the four original candidates died on contact with the data. Each was
plausible from reading the code and wrong once measured.

### 1-hour cache TTL — would have cost money

The idea was that WhatsApp is human-paced, so the 5-minute cache must be
expiring between messages.

It isn't. **95.3% hit rate, 2 uncached tokens per call.** The cache is shared
across the whole business, and inbound volume keeps it continuously warm.

A 1-hour cache writes at 2x instead of 1.25x. On an already-warm cache that
is a pure surcharge. **This change would have increased the bill.**

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

- **Prompt caching is correctly built.** Two explicit breakpoints (stable
  prompt, product text) plus automatic caching on the growing tail. 95.3% hit
  rate is the proof.
- **The two blocks are deliberately separate.** Appending the ebook to the
  system string would fork the cache into two full copies instead of sharing
  a prefix.
- **`greeting-shortcut.ts` skips the model entirely** on opening turns. The
  logs show it working. Same instinct as the batching fix, one level earlier.
- **Model choice is not the lever.** Haiku 4.5 is $1/$5 against Sonnet 5's
  $2/$10 — exactly 2x, not the order of magnitude it sounds like — and this
  system is entirely tool-driven, which is where smaller models are weakest.
