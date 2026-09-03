# Meta / WhatsApp compliance — verified facts

A reference doc, not an incident report — `docs/AD_COPY_COMPLIANCE_AUDIT.md` covers what actually happened to Truefix Wellness's account on 2026-08-24. This doc exists so the *rules* don't have to be re-researched and re-verified from scratch next time a campaign or message template is written, for this business or any future one.

**Every claim below was checked directly against Meta's own primary sources** (transparency.meta.com, developers.facebook.com, whatsapp.com) on 2026-08-25 — not secondary blogs, comparison sites, or BSP marketing content. Where a claim couldn't be verified this way, or turned out to be wrong, that's recorded explicitly in its own section rather than silently omitted — the point of "verified" is knowing what was actually checked, including the corrections.

## Advertising Standards (governs ad copy — Meta Ads Manager)

Source: [transparency.meta.com/policies/ad-standards](https://transparency.meta.com/policies/ad-standards/)

**Personal Attributes policy** ([exact page](https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes)):
> "Ads must not contain content that asserts or implies personal attributes" including "physical or mental health (including medical conditions)." Ads cannot "imply knowledge of medical information of a user or user's family."

Meta's own example of a **prohibited** ad: *"Depression getting you down? Get help now."* Meta's own example of an **allowed** ad: *"Depression counseling"* (a service announcement that doesn't assert the viewer has the condition).

**Exception**: Public Service Announcements about health issues are allowed, as long as they don't assert the viewer or their family has the condition.

**Health & Wellness restricted category** ([exact page](https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/)):
- Cannot claim to **"cure, heal, or eliminate"** incurable or terminal conditions — Meta names **diabetes** explicitly, alongside herpes, cancer, autism, HIV. Treating/managing symptoms is permitted; curing/reversing is not.
- Cannot use **"promises of specific outcomes within a set timeframe without disclaimers or qualifiers"** — e.g. "reversed in 10 days" is exactly this pattern.
- No "statements of inferiority about physical appearance."
- No misleading visuals (e.g. implying results from a wearable product alone).
- No skin-whitening/bleaching claims involving permanent color change.
- No "sensational language with exaggerated or extreme claims."
- Weight-loss/cosmetic-procedure ads must be targeted 18+.

**Practical read**: second-person copy that describes symptoms as if addressing the reader's own body ("your energy drops," "fear of your sugar suddenly spiking") is a Personal Attributes violation even if the condition is never named. First-person "I had this symptom, you might too" testimonial framing risks the same thing. Any word implying reversal/cure/elimination for diabetes specifically is a named, explicit violation — not a gray area.

## WhatsApp Business Platform — messaging limits

Source: [developers.facebook.com — Messaging Limits](https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits)

- Tiers: **250 → 2,000 → 10,000 → 100,000 → Unlimited**.
- The limit counts **unique WhatsApp phone numbers messaged outside the customer service window** (i.e. template sends to people who haven't messaged in the last 24h), in a **rolling 24-hour period**. Free-form messages sent *inside* the 24-hour window do not count against this limit at all.
- 250 → 2,000 requires either completing Business Verification (directly or via a partner) **or** delivering 2,000 high-quality-rated template messages to unique numbers over a rolling 30-day period.
- Beyond 2,000, the limit auto-scales up if the business sends high-quality messages **and** has used at least half its current limit in the last 7 days.
- **Meta does not publish a specific day-by-day ramp schedule or percentage** (no "50–100/day, +20%/day" — that figure is third-party approximation, not official guidance; see Corrections below).

**Practical read**: hitting the messaging-limit cap causes mechanical throttling/rejection of further template sends — it's a different, less severe enforcement mechanism than a Business Terms of Service violation. Don't conflate the two when diagnosing why an account was actually restricted.

## Business Verification and templates

Per Meta's January 2026 policy update: **Business Verification and a valid privacy policy URL are required before sending any template messages at all** — not just before scaling past 250. If a business is sending template messages (e.g. a follow-up fallback template outside the 24h window) without having completed Business Verification, that's an independent compliance gap regardless of message content.

**Marketing/re-engagement templates require an opt-out mechanism.** Meta's Jan 2026 policy explicitly categorizes re-engagement messages as "marketing conversations," which require an easy opt-out option. Worth confirming any approved re-engagement template actually includes one.

## WhatsApp Business Policy (general conduct, not ads)

Source: [whatsappbusiness.com/policy](https://whatsappbusiness.com/policy/).

> **Corrected 2026-09-03.** This section previously said whatsappbusiness.com
> was "a different, unofficial-looking domain" not to be treated as a primary
> source. `business.whatsapp.com/policy` now returns a 301 redirect to it, so
> it is the canonical policy home. Verified directly — see
> `docs/COMPLIANCE_AUDIT_2026-09.md`.

- Must not "wrongfully discriminate or suggest a preference for or against people because of personal characteristics including... medical or genetic condition."
- Prohibits telemedicine or requesting/sending health-related information where local regulations require heightened handling for such data.
- A specific list of fully-prohibited business categories exists (payday loans, debt collection, bail bonds, political campaigning, etc.) — not relevant to this business, but worth checking against for any future product line.

**What this page does *not* cover, checked directly**: WhatsApp's own [Messaging Guidelines](https://www.whatsapp.com/legal/messaging-guidelines) (illegal content, fraud, spam, adversarial behavior) do not specifically address health claims in message content. The health-claim restrictions that actually apply live in the Advertising Standards (ads) and this general non-discrimination clause (messages) — not a dedicated "no medical claims in chat" policy. Don't assume a page covers something without checking it directly.

## A real mechanical link between ads and WhatsApp messages

A Click-to-WhatsApp ad's configured "welcome message" (icebreaker text set in Ads Manager) is injected as the **actual first message** in the resulting WhatsApp conversation thread (confirmed via this app's own `Conversation.referral.welcome_message` data). Ad-level configuration isn't fully separate from WhatsApp message content — this is one concrete, direct channel between the two, independent of any general cross-policy-enforcement question.

## Corrections — claims made during this investigation that didn't hold up, recorded so they aren't repeated

- **"Meta recommends 50–100 messages/day in week one, ramping ~20%/day"** — not found anywhere in Meta's own documentation. Sourced from third-party BSP blogs (Chatarmin, Whapi Cloud). The general principle (gradual scaling matters) is real and reflected in the actual tier-advancement mechanics above, but this specific schedule is not an official Meta figure.
- **"500–680 follow-ups/day likely breached the messaging limit and contributed to the ban"** — checked directly against this business's own template-send data (the correct metric: unique numbers messaged via template per day) and found the actual peak was 174 unique numbers in a day, under the 250 cap. The volume figure originally cited conflated total follow-ups (including free-form, in-window messages that don't count against the limit) with the actual limited metric. Retracted as a likely contributor to the 2026-08-24 disablement specifically — general volume/pacing discipline is still worth maintaining, but this wasn't the evidenced mechanism here.
- **Ad-policy violations directly triggering WhatsApp account-level enforcement** — no *documented* single mechanism found for this either way. What is verified: the 2026-08-24 disablement notice described action against the entire business portfolio ("Waris market and its WhatsApp Business accounts"), which is more consistent with a portfolio-wide conduct issue (matching the pervasive ad-copy violations, confirmed word-for-word against the Advertising Standards above) than a narrow single-message content flag.

## Pre-flight checklist for any future ad copy or message template

- [ ] No second-person or first-person-testimonial language that implies the reader/narrator has a specific medical condition.
- [ ] No "cure," "heal," "eliminate," "reverse," or similar for any named or implied medical condition.
- [ ] No promised outcome within a specific timeframe, without a disclaimer.
- [ ] Any claimed credential (e.g. "Dr. ___") is real and verifiable, or removed.
- [ ] Business Verification is complete before any template messages go out on a new number.
- [ ] Any re-engagement/marketing template includes an opt-out.
- [ ] New numbers: check actual tier via the Trends → Number Health panel before assuming volume is safe, rather than estimating from a third-party rule of thumb.
