# Giving the AI the ebook — what changed, and how to undo it

**Shipped 2026-09-15.** Customers who already own the ebook were asking
questions the AI could not answer — *"What the book said in-between meals, even
my son didn't understand it"* — and a human was writing careful multi-paragraph
replies by hand. This is that gap closed.

Everything below is reversible, and the fastest revert is a single command
that touches no code. See **Reverting** at the bottom.

## The decision, and why not the alternatives

The ebook is **36 pages, 4,930 words, ~7,682 tokens** — measured, not
estimated. That number decided the design.

| Option | Verdict |
|---|---|
| Expand the curated FAQ | Only covers questions anticipated in advance. The customer above asked one nobody had. |
| Retrieval / RAG over chunks | Real machinery — chunking, embeddings, a vector store — to save single-digit dollars a month. Over-engineering at 7.7K tokens. `docs/FUTURE.md` deferred this and named the trigger; the trigger fired, but the size does not justify it. |
| **Full text in the cached prompt, gated on delivery** | **Chosen.** |
| Strip the claim sentences before storing | **Rejected** — see below. |

### Why stripping the claims was rejected

The customer holds the *unredacted* book. If the AI's copy has claims removed
and she writes *"the book says Day 8 is a deep cellular cleanse, what does that
mean?"*, the AI no longer recognises what she is quoting. Stripping would make
it confused about the exact document it exists to explain. It also needs a
judgment call on all 39 instances: over-strip and answers break, under-strip
and nothing is gained while believing otherwise.

## What the ebook actually contains (the compliance finding)

A scan on 2026-09-15 found **39 instances** of the vocabulary Meta's Health &
Wellness standard names explicitly:

| In the book | Why it matters |
|---|---|
| "Nerve damage from diabetes is reversible in early stages" | Reversal claim about a diabetes complication |
| "Consistency is the cure" | Cure claim |
| "flushes toxins from the kidneys" / "Flushes excess glucose from cells" | Detox and mechanism claims |
| "Day 8 — Deep Cellular Cleanse", "Day 6 — Nerve Repair" | The day *titles* are claims |
| "healing" ×18 | Mostly prayers, which read differently |

This is the vocabulary that got the previous WABA disabled on 2026-08-24
(`docs/AD_COPY_COMPLIANCE_AUDIT.md`). **Before this change the AI's clean
record was partly structural** — it had nothing to quote. That safety is now
gone and has to be replaced with real controls.

**On policy specifically**: the health-claim restrictions live in Meta's
*Advertising Standards*, which govern ads, not messages
(`docs/META_WHATSAPP_COMPLIANCE.md`). WhatsApp's Messaging Guidelines do not
address health claims in message content. So a message is not obviously a
violation. Three reasons not to rest on that: the August disablement was
portfolio-wide rather than ad-specific; the ad's welcome message is
mechanically injected as the conversation's first message, linking the
surfaces; and NAFDAC regulates health advertising in Nigeria including
digital, entirely separately from Meta.

## The rule: instructions, not claims

The book contains two kinds of sentence, and the line runs between them:

- **Instructions** — what to eat, how much, when, how to prepare. *"Cucumber,
  ½ cup sliced, between meals."* Safe, and what customers actually ask for.
- **Claims** — what it does to the body. *"Flushes toxins from the kidneys."*
  Never repeated, even verbatim from the book.

Every real support question so far is answerable from instructions alone. The
human's reply in the screenshot that prompted this work used not one claim.

## Three layers

| Layer | Where | What it does |
|---|---|---|
| 1. Content | `Product.contentText` → `buildProductContentBlock()` | Full text in a **separate cached system block**, only from `PRODUCT_DELIVERED` onward |
| 2. Rule | inside that block | Instructions vs claims, plus what still escalates |
| 3. Backstop | `src/lib/claim-filter.ts` | Deterministic scan of every outbound message |

Layer 3 exists because layer 2 is not a control. Same argument `createFollowup`
already makes about opt-out: *a compliance-sensitive rule shouldn't depend on
the model remembering it every turn* — and it gets harder to remember with the
book in front of it.

### Why gated on delivery

Before delivery, a content question is a sales objection the playbook covers,
and answering it from the book invites claims into a pitch. After delivery the
customer owns the thing and is asking for support.

The gate reads the **`PRODUCT_DELIVERED` event, not `currentStage`**, because
`escalate_to_human` overwrites the stage in place — a customer who received the
book and was then escalated would otherwise lose access to it the moment a
human touched the conversation.

### Why two cache blocks

The stable prompt is an identical prefix for every conversation, so it caches
once. The book is a ~7,700-token tail present only after delivery. Appending it
to the main prompt string would fork the cache into two full copies instead of
sharing the prefix.

## The filter ships in SHADOW MODE

`CLAIM_FILTER_ENFORCE = false` in `src/lib/claim-filter.ts`. A hit is recorded
as a `CLAIM_FILTER_HIT` event **and the message is sent anyway.** Nothing about
the customer's experience changes.

This is deliberate. The audit of 719 real outbound messages found four
claim-vocabulary matches and **all four were the AI refusing to make a claim**:

> "I can't promise a '100%' medical guarantee — no ebook can replace personal
> medical advice"

A filter blocking on a bare word list would suppress exactly the messages
proving the system behaves. `findClaims()` has a negation check meant to catch
that, and `scripts/check-claim-filter.ts` shows it passing on all four —
**but fixtures are not real traffic.** The opt-out matcher also looked correct
until it was run against 469 real inbound messages and found to fire on
*"can it stop"*.

**Review the Trends card after a few days of real traffic. Only flip
`CLAIM_FILTER_ENFORCE` to `true` once the logged hits show the negation
handling holds.** When enforcing, `sendWhatsAppText` throws `ClaimBlockedError`
instead of sending.

## Files changed

| File | Change |
|---|---|
| `prisma/schema.prisma` + migration `20260915090000_add_product_content_text` | `Product.contentText` (nullable) |
| `src/lib/system-prompt.ts` | **+63 lines only**, no existing line modified — `buildProductContentBlock()` |
| `src/lib/ai-runtime.ts` | `loadDeliveredProductContent()`; system becomes two blocks |
| `src/lib/claim-filter.ts` | **new** |
| `src/lib/whatsapp-send.ts` | optional `conversationId`; filter runs here — the one place all text leaves |
| `src/lib/actions.ts`, `src/app/dashboard/[id]/actions.ts`, `src/worker/followup-worker.ts` | pass `conversationId` through |
| `src/lib/trends.ts` | `getClaimFilterHits()` |
| `src/components/claim-filter-card.tsx`, `src/app/trends/page.tsx` | the card |
| `scripts/extract-product-text.py`, `scripts/set-product-text.ts`, `scripts/check-claim-filter.ts` | tooling |

## Loading the text

```
python scripts/extract-product-text.py ebook.pdf --out ebook.txt
npx tsx scripts/set-product-text.ts --list
npx tsx scripts/set-product-text.ts --product-id <id> --file ebook.txt
```

## Reverting

**To turn the whole feature off without touching code or deploying:**

```
npx tsx scripts/set-product-text.ts --product-id <id> --clear
```

`contentText` goes back to `NULL`, `loadDeliveredProductContent()` returns
null, the second system block is never added, and the prompt is byte-identical
to before this change. Verified: `git diff` on `system-prompt.ts` shows 63
insertions and **zero deletions**, so the existing prompt text is untouched.

**To disable only the filter:** it is already off. Nothing blocks while
`CLAIM_FILTER_ENFORCE` is `false`; it only writes events.

**To remove the code entirely:** revert the commit. The migration can stay —
a nullable unused column costs nothing, and dropping it would need another
migration.

**What is NOT reversible:** `CLAIM_FILTER_HIT` events already written. They are
harmless log rows.

## Still open

- **Load the text** — the column is empty until `set-product-text.ts` is run,
  so the feature is dormant on deploy.
- **Shadow review**, then the enforce decision.
- **Two pages extracted nothing** (the cover and a blank notes page). If any
  meal table were an image, the AI could not answer about it. Neither of these
  two is a table, but re-check if the ebook is ever revised.
