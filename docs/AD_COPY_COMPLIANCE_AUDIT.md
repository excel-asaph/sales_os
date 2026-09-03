# Ad copy compliance audit — Truefix Wellness

Written 2026-08-25, after the Truefix Wellness WhatsApp account (WABA 964211045934076, primary number +234 706 164 5689) was permanently disabled by Meta for a Business Terms of Service / Acceptable Use breach. This is a full inventory of every distinct ad creative that drove traffic into this WhatsApp number, pulled directly from `Conversation.referral` (Meta's own ad-attribution data, captured on every ad-originated conversation) — not a sample, the actual full set of 19 distinct ad creatives that ran.

**Bottom line**: this is not one bad ad. The same violating template — explicit "reverse diabetes" claims, second-person fear/symptom copy, an unverified "Dr." credential — is duplicated word-for-word across at least 8 of the 19 creatives, and variants of it across nearly all the rest. This reads as the primary driver of the WhatsApp account's disablement, more than any single WhatsApp message.

## What's actually wrong, by pattern

### 1. Explicit "reverse diabetes" claims (unverified health/cure claim)
Appears verbatim in creatives `120248631393640314`, `120248884569450314`, `120248884623240314` ("...reverse diabetes, There Are 3 Non-Negotiables... you are not reversing the problem... help your body start reversing the problem instead of just managing it... give your body what it actually needs to **heal**"), and `120248631474580314` ("And your diabetes will be **completely reversed in 10 days**"). Also appears mid-copy in `120248677301540314`/`120248884569420314`/`120248884623260314` ("imagine **reversing diabetes** with just 10 minute a day routine").

This is a direct, repeated, unverified disease-reversal claim — exactly the category Meta's WhatsApp Business Messaging Policy (Jan 2026 update) explicitly prohibits ("using AI to generate misleading product claims or health benefits"), and exactly what NAFDAC's advertising regulations require substantiation for.

### 2. Second-person symptom/fear targeting (personal attributes violation)
The dominant template, duplicated across `120248677165320314`, `120248677301540314`, `120248721611310314`, `120248884569350314`, `120248884569420314`, `120248884623210314`, `120248884623250314`, `120248884623260314`:

> *"If you're living with diabetes right now, you're not really 'in control.' You're just managing fear. Fear of eating the wrong thing. Fear of your sugar suddenly spiking. Fear of waking up one day and hearing 'it has gotten worse.'... Your energy drops. Your body feels weak. Small issues take longer to heal."*

This matches Meta's personal attributes policy almost exactly: copy addressing the reader's own symptoms/condition in second person, closely associated with a specific health condition. Confirmed via Meta's current Advertising Standards research (2026-08-25) — this is a real, enforced policy, not a gray area.

### 3. First-person implied-diagnosis narrative
`120248884569410314` ("The Diabetes Fix Routine") and its duplicate `120248884623310314`: a first-person testimonial describing specific symptoms (fatigue, frequent urination, slow-healing wounds) framed as "you can have normal readings and still feel terrible" — designed to make a reader with normal test results self-diagnose. This is the creative that was attached to Ada Enugu's and several other real conversations.

### 4. Unverified medical credential
"Dr Daniel Suleiman" / "Dr. Daniel Sulieman" (spelled two different ways across creatives) is presented as the book's author across most of the campaign. No way to verify this credential from the data available — if this is not a real, verifiable medical credential, it's an independent, additional risk (false authority claim), on top of everything else.

### 5. Two creatives that are meaningfully safer, worth noting as a model
`120248677342200314`/`120248884569340314`/`120248884623230314` ("Fixing Diabetes and High Blood Sugar...") and `120248720839300314` are longer, more measured pieces — they explicitly say *"it is not a drug," "does not replace your doctor or prescribed medication,"* cite a real study (Diabetes Prevention Program, describing lifestyle intervention vs. metformin outcomes — this is a real, well-known study, not fabricated), and use "support healthier blood sugar" rather than "reverse." These still lean on some urgency/fear framing ("before it becomes a bigger fight") and repeat the unverified "Dr." credential, but they're structurally much closer to compliant than the rest of the set.

## Two additional findings, independent of the ad copy itself

**Business Verification was never completed** (already flagged in `docs/FUTURE.md`/prior session work as not started). Per Meta's January 2026 policy, Business Verification and a valid privacy policy URL are required *before sending any template messages* — this account has been sending template messages (the follow-up fallback template) without it. This is a separate, concrete, independent compliance gap from the content issue.

**Messaging volume ramp-up was never followed.** Meta's own guidance for new/scaling numbers: start at 50–100 messages/day in week one, increase ~20%/day, target engaged existing contacts first — not cold ad-driven leads. Actual data: 500–680 follow-ups created on multiple single days. Combined with cold, ad-driven, health-anxious leads, this is close to the exact failure pattern Meta's own documentation describes as triggering spam-report spikes and account restriction, independent of content.

## Fact-check: the Gemini research pasted by the user (2026-08-25)

| Claim | Verdict |
|---|---|
| "You're likely relying on gray-hat/unofficial methods (browser automation, whatsapp-web.js, QR-code linking)" | **False for this app.** Verified directly against the codebase — this has only ever used the official WhatsApp Cloud API (`graph.facebook.com`, `WHATSAPP_ACCESS_TOKEN`). No scraping, no Puppeteer/Selenium, no unofficial client. Gemini's default diagnosis doesn't apply here at all. |
| Official Cloud API / approved BSPs are how legitimate businesses thrive | Accurate, and already how this app is built. |
| Approved Message Templates required outside the 24h window | Accurate, and already correctly implemented (`WHATSAPP_FOLLOWUP_TEMPLATE_NAME` fallback). |
| 24-hour customer service window allows free-form messages "without risk of automated algorithmic filtering" | **Overstated.** The window removes the *template pre-approval* requirement, not content-policy exposure — free-form messages inside the window are still subject to WhatsApp's content policy (health claims, spam patterns). This is exactly what actually happened here. |
| Opt-in required before automated outbound sequences | Accurate as a general principle; a Click-to-WhatsApp ad click is itself valid opt-in, which this app's flow already relies on correctly. |
| High report/block rates get a number suspended regardless of API used | **Accurate and directly relevant** — this is a real, verified mechanism (quality rating tracks block/report rate), and a very plausible contributor here given the volume and fear-based copy. |
| "500 automated message cycles" triggers fraud heuristics | Directionally right (ramping too fast on a new number is a real, documented risk), but the specific "500" figure reads like a plausible-sounding but unsourced number, not a documented Meta threshold. Treat the general point as real, not the specific figure. |
| Commerce Policy: AI screens content, restricted categories (supplements, medical claims) face swift termination | **Accurate, and the single most directly applicable point in the whole research** — this is exactly the category (health/medical claims) that applies here. |
| Marketing/re-engagement templates require an opt-out mechanism | **Confirmed accurate** via direct research — re-engagement messages are explicitly categorized as "marketing conversations" under Meta's Jan 2026 policy and require an opt-out option. Worth checking whether the approved follow-up template includes one. |
| Warm-up / gradual volume ramp for new numbers | **Confirmed accurate** via direct research, and directly relevant given the actual volume data found (500–680 follow-ups/day on several days). |

Overall: Gemini's opening diagnosis (unofficial scraping tools) is a generic, wrong-for-this-case default that doesn't apply. But several of its supporting bullets — content screening, block-rate sensitivity, volume ramp-up — are accurate and, it turns out, are the actual mechanisms most likely responsible here once matched against this app's real data.

## Recommendation

Every creative in this set needs a rewrite before any future ad spend, on this number or a replacement — not just the highest-volume ones. Safer direction: keep the two more measured creatives' factual, "supports/manages" framing (never "reverses"/"heals"/"fixes"), drop all second-person symptom/fear language, drop the unverified "Dr." credential unless it can be substantiated, and drop urgency language implying medical consequences of waiting.
