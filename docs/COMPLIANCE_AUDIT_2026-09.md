# Compliance audit — 2026-09-03, against live production data

The first audit run against **real traffic** (719 outbound messages, 155
conversations, ads running). Earlier compliance work
(`docs/META_WHATSAPP_COMPLIANCE.md`, `docs/AD_COPY_COMPLIANCE_AUDIT.md`) was
written before any of this existed and was necessarily theoretical.

Policy claims below are quoted from Meta's own policy page. Where a
third-party claim couldn't be confirmed at the source, that's recorded
rather than repeated.

## Live account health (Graph API, 2026-09-03)

| Field | Value |
|---|---|
| `quality_rating` | **GREEN** |
| `status` | CONNECTED |
| `messaging_limit_tier` | TIER_250 |
| `verified_name` | Vitalfix |
| `name_status` | AVAILABLE_WITHOUT_REVIEW |

Healthy on every axis Meta exposes, after a full day of real traffic.

## What passed

**Message content is clean.** All 719 outbound messages were scanned against
the Health & Wellness patterns Meta names explicitly (cure/heal/eliminate,
reverse, permanent, guarantee, timeframe promises, doctor claims). Four
matched — and all four are the AI *refusing* to make a medical claim:

- *"it's best to discuss that with your doctor or health provider"*
- *"I can't promise a '100%' medical guarantee — no ebook can replace personal medical advice"*
- *"for your health it's best to also confirm with your doctor"*

For a diabetes-adjacent product, that's the behaviour you want. The playbook
itself matched nothing at all — the rewrite after the August disablement
held up under real use.

**Automation is permitted, and the escalation requirement is met.** Policy:

> "You may use automation when responding during the 24-hour window, but
> must also have available prompt, clear, and direct escalation paths."

`escalate_to_human` is instructed to fire when "the customer asks for a
human" (`src/lib/tools.ts`), alongside low confidence, refunds, complaints,
anger and medical claims. The dashboard's human queue is the receiving end.

**The re-engagement template carries an opt-out.** `antflow_followup_checkin`
includes a STOP quick-reply button (`src/lib/meta-templates.ts`), which is
what the marketing-template opt-out requirement asks for.

**No exposure outside the 24-hour window yet.** Zero template sends to date —
every message so far has been inside a customer-initiated window.

## Gaps, most urgent first

### 1. Business Verification is NOT_STARTED — now the binding constraint

`businessVerificationStatus: NOT_STARTED`, and the number sits at
`TIER_250`. Two consequences, and the second is the one that will bite:

- Capped at 250 unique recipients per 24h for business-initiated messages.
- Per the January 2026 policy change recorded in
  `docs/META_WHATSAPP_COMPLIANCE.md`, Business Verification is required
  before template messages can send at all.

Follow-ups outside the 24-hour window **must** use the template. With ads
running and leads arriving daily, the first customer who goes quiet past 24
hours is the first test of a path that has never run. Start verification
before that happens, not after.

### 2. Opt-out depends on the AI noticing — no deterministic backstop
### ✅ CLOSED 2026-09-03 — see `src/lib/opt-out.ts`

An explicit opt-out is now recorded in code at ingest, before and
independently of the AI turn: pending follow-ups cancelled, customer tagged
`Opted out`, conversation moved to `LOST_LEAD`, `OPT_OUT_RECEIVED` event
written. `createFollowup` refuses unconditionally for that tag — deliberately
not stage-scoped, since an opted-out conversation sits at `LOST_LEAD` and the
existing "Uninterested" guard only fires at `NEW_LEAD`.

Matching is whole-message only, never substring. That distinction is load
bearing: a naive `/\bstop\b/` over the same 467 messages matched a customer
asking *"…urinating frequently can it stop lf am using your dia[betes fix]"* —
a live lead who would have been silently closed by the compliance feature.
Verified: 37 fixture phrases matched correctly, and **0 of 469 real inbound
messages** trigger it.

The AI still replies afterwards, and the prompt now tells it to send one warm
acknowledgement and nothing else for an opted-out customer — no pitch, no
asking why. A single opt-out confirmation is a use case Meta names explicitly
under Utility messages ("Confirm when a customer opts in or opts out of
WhatsApp messages from your business"), so the acknowledgement itself is
sanctioned. Enforcement no longer depends on it happening.

**Original finding, kept for context:**

The policy language is unconditional:

> "You must respect all requests (either on or off WhatsApp) by a person to
> block, discontinue, or otherwise opt out of communications from you via
> WhatsApp, including removing that person from your contacts list."

Today this is handled *only* by model judgment. `system-prompt.ts` tells the
AI that "no", "not interested", "stop messaging me" is an outright decline →
tag `Uninterested`, stage `LOST_LEAD`, no follow-up. That works when the
model runs and reads it correctly. It does nothing when:

- the AI is unavailable (this happened on 2026-09-03 — an expired
  `ANTHROPIC_API_KEY` took every turn down for hours),
- the conversation is parked on a human stage, where the runtime no-ops, or
- the model simply misreads a terse "stop".

The codebase already argues this exact point, in `createFollowup`:

> "enforced here rather than only in the system prompt, since a
> compliance-sensitive rule shouldn't depend on the model remembering it
> every turn."

That reasoning applies at least as strongly to an explicit opt-out — and
more so because the template *invites* customers to send STOP. Offering an
opt-out and then missing it is worse than not offering one.

**Recommendation:** detect opt-out keywords deterministically at ingest,
before the AI turn — cancel pending follow-ups, tag `Uninterested`, move to
`LOST_LEAD` — so it holds regardless of model availability or judgment. The
AI can still reply warmly on top; the enforcement just stops depending on it.

### 3. A playbook key can still reach a customer as message text

25 follow-up rows store the literal string `"payment_followup"` as their
fallback text — the model passed the playbook *key* rather than the text,
understandably, since key-references are how templates work elsewhere.

No customer has received it (verified: zero outbound messages match a
playbook key). But `deliverFollowup`'s catch block sends `followup.message`
verbatim when composing fails, so a failed AI call on one of those 25 rows
sends a customer the word "payment_followup".

## Corrections to earlier docs

- **`business.whatsapp.com/policy` now 301-redirects to
  `whatsappbusiness.com/policy/`.** `docs/META_WHATSAPP_COMPLIANCE.md`
  called that second domain "a different, unofficial-looking domain" that
  "shouldn't be treated as a primary source". That was true when written and
  is now wrong — it is the canonical policy home.

- **"Meta's 2026 policy restricts open-ended, assistant-style bots"** —
  claimed by a third-party blog, **not supported** by the policy text.
  What the policy actually requires is automation *plus* escalation paths
  (quoted above). Recorded so it isn't repeated as fact.

## Not changed by this audit

Volume is not currently a risk: 719 outbound in a day were all inside
customer-initiated windows, which don't count against the tier cap, and
quality stayed GREEN throughout. The relevant metric remains unique
recipients messaged *outside* the window — currently zero.
