# Pay-before-delivery vs pay-after-delivery — design notes

**Status: discussed 2026-09-11, not built.** Parked deliberately; see "Do this
first" at the bottom.

The business currently runs **deliver-first**: the ebook goes out on trust,
payment is chased afterwards. The proposal is to test **pay-first** against
it, with a temporary Trends panel comparing the two, plus an exception — a
suspicious customer who needs proof still gets the ebook up front.

## The toggle already exists

`BusinessConfig.deliverBeforePayment` (prisma/schema.prisma), a radio group in
Settings, and seven read sites:

| File | What it does with the flag |
|---|---|
| `src/lib/actions.ts` | `sendProduct` refuses to deliver unless an order is VERIFIED |
| `src/lib/system-prompt.ts` | States today's default and branches the playbook flow lines |
| `src/lib/greeting-shortcut.ts` | Picks `delivery_first_pitch` vs `payment_first_pitch` |
| `src/lib/ai-runtime.ts` | Passes it into the prompt |
| `src/app/settings/*` | Reads and writes it |
| `src/worker/followup-worker.ts` | Comment only — explains why `PRODUCT_DELIVERED` is not in `BLOCKS_FOLLOWUP` |

**Nothing needs building to flip modes.** The problems are elsewhere.

## Four things that break or mislead

### 1. The follow-up message becomes false (real bug, automatic path)

The `payment_followup` playbook text reads *"We sent the ebook based on trust,
and we're still waiting for your payment."* Under pay-first **nothing was
sent**. That message would chase people for payment on a product they never
received.

`system-prompt.ts` carries the same assumption in its flow line: *"The product
was delivered on trust and payment has gone quiet for a while."*

**Needs a second playbook key** for the pay-first variant before flipping.

### 2. The greeting shortcut diverges from the prompt under pay-first

The prompt instructs pay-first to send `payment_first_benefits`, **then**
`payment_first_pitch` as a separate second message. `greeting-shortcut.ts`
sends only `payment_first_pitch`. New leads would get the pitch without the
benefits that set it up.

Also: if `payment_first_pitch` is not filled in on the live playbook, the
shortcut bails and every new lead falls through to a full AI turn — slower and
more expensive, though not broken.

### 3. The experiment cannot be measured as designed

`deliverBeforePayment` is a **business-level boolean holding current state,
with no history**. Flip it and every past conversation becomes unattributable:
there is no way to ask which mode a conversation ran under. Trends would have
nothing to group by.

It also changes behaviour **for conversations already in flight** — someone
halfway through a deliver-first flow gets pay-first handling on their next
message.

**Fix: a per-conversation `deliveryMode` field**, stamped from the business
default at conversation creation and never touched by the toggle afterwards.
That single change buys four things:

- attribution for the comparison,
- consistency for in-flight conversations,
- a real home for the suspicious-customer exception (currently only a
  `record_fact` note the model has to remember — see the system prompt's
  "the customer's own behavior always takes precedence"),
- something the Trends panel can group by.

### 4. Mixed-mode data makes two existing metrics ambiguous

- **"Delivered, unpaid"** is a deliver-first concept; under pay-first it should
  always be zero. Meaningless in a mixed dataset without mode filtering.
- **`PRODUCT_DELIVERED`** means "sent, payment possibly still pending" under
  deliver-first, and "sale essentially done" under pay-first.

## The risk not raised in the original proposal

**The failure mode inverts, and gets much worse.**

| | Deliver-first (today) | Pay-first |
|---|---|---|
| Payment reached, delivery didn't | Lost ebook revenue | **Took money, delivered nothing** |

As of 2026-09-06 the Trends cohort showed **351 conversations reaching Payment
against 198 reaching Delivered** — a gap of ~153 people. Today that gap is a
leak. Under pay-first the same gap is 153 people owed a product or a refund,
plus complaint and WhatsApp quality-rating exposure.

Two smaller consequences:

- **Receipt verification moves onto the critical path.** Every "unclear" or
  low-confidence result now blocks a delivery rather than merely delaying a
  confirmation. See `src/lib/receipt-verification.ts`.
- **Follow-up cancellation still works**: `PAYMENT_VERIFIED` is in
  `BLOCKS_FOLLOWUP`, and under pay-first that stage is reached before delivery,
  so sequences stop correctly.

## Do this first

**Close the Payment-to-Delivered gap before switching modes.** It is the
largest thing on the dashboard, and the switch converts it from a revenue leak
into a liability.

## Build order when this resumes

1. Close the delivery gap.
2. Add `Conversation.deliveryMode`, stamped at creation from the business default.
3. Add the pay-first follow-up playbook key.
4. Fix the greeting shortcut to send both pay-first messages.
5. Temporary Trends panel grouped by `deliveryMode`.
