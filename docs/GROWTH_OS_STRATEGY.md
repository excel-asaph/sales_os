# Antflow Growth OS — strategy discussion (2026-08-22/23)

Not a plan, not committed to — a record of a strategic discussion so it doesn't have to be re-derived later. Written after `docs/PROJECT_SNAPSHOT.md` was handed to another AI for a second opinion, then that opinion was cross-checked against live web research. Where a claim below is marked "verified," it was checked against a live source during this discussion, not assumed.

## The starting question

The current product (WhatsApp AI sales agent for one business, Truefix Wellness / DIABETES FIX ebook) works, but is it a *feature* or a *company*? Two walls surfaced immediately:

1. **Meta itself now ships the core loop natively.** The Meta Business Agent Platform (launched June–July 2026) answers product questions grounded in a live catalog, recommends products, checks stock, and closes orders in-chat, with native product cards, Commerce Manager integration, and in-chat checkout (Flows 2.0). Free through the WhatsApp Business App today, moving to ~$2/million tokens Aug 1, 2026. **This is the single most important fact in this whole discussion** — the exact thing this app's AI runtime does is becoming a commodity feature of the channel it depends on.
2. **Real, funded competitors already exist in African conversational commerce**: Vendy (YC-backed, Lagos, CBN-licensed, PCI-DSS certified, checkout inside WhatsApp/Instagram/Telegram, 2,000+ merchants, 20M+ transactions, 1% take rate), Sukhiba ($1.5M seed), Chpter ($1.2M pre-seed, Techstars), ChatCash. This isn't a green field.

Broader context (verified): VCs have largely stopped funding "thin wrappers" over LLM APIs — when the platform/model provider ships your feature natively, the wrapper's value evaporates. ~90% of thin-wrapper AI products are projected dead by end of 2026. Real defensibility = proprietary data + owned workflow + compliance/trust position — not the chat UI itself.

## Then: what if chat is just one feature, and the product is a full AI business/marketing OS?

Two more walls surfaced:

3. **Meta is automating the marketing/ad layer too**, not just chat. Advantage+ already drives 65% of advertisers with 22% higher ROAS than manual; full campaign generation (creative + targeting + budget from a product URL) is rolling out through 2026; 4M+ advertisers already use Meta's generative ad tools. Building "AI ad creative generation" competes directly with Meta's own core ad business — a worse position than competing on chat.
4. **"Full business operating system" already has a scaled, funded Nigerian incumbent: Bumpa** (verified) — "King of Social Commerce," storefront + inventory + CRM + invoicing + payments + Meta/Instagram/WhatsApp catalog integration, expanded into Kenya in 2026 with M-Pesa. **Bumpa AI** (verified, current) already runs agents that recover abandoned orders, reply to DMs, upsell at checkout, write product copy, launch campaigns, and chase invoices — trained on *"thousands of African SMEs on Bumpa."* Bumpa already has both the tooling **and** the proprietary cross-merchant data moat this whole discussion identified as the real differentiator — at a scale one business's data can't match.

## The four-stage growth-loop model (from the second-opinion discussion)

A useful framing, formalized as:

```
1. DISCOVER & CREATE  (offer, creative, copy, positioning)
        ↓
2. LAUNCH & ACQUIRE   (which channel, actually running campaigns)
        ↓
3. CONVERT & NURTURE  (turn attention into paying customers — Sales OS lives here)
        ↓
4. MEASURE & IMPROVE  (attribution, what's leaking, what to change)
        │
        └──────────→ back to 1
```

The feedback loop is the interesting part, not the four boxes individually — a system that asks *"what should the business do next, based on everything that just happened"* is a materially different product than four separate tools.

**But every stage, built as a standalone product, is already heavily occupied**: HubSpot/HighLevel/Zoho/Salesforce Agentforce Marketing/Adobe cover most of the loop end to end (verified: Agentforce Marketing has named Goals/Content/Campaign-Optimizer agents; Klaviyo verified positioning itself explicitly as an "autonomous B2C CRM" with real agent products — Composer, Customer Agent). TikTok Creative Center commoditizes trend/creative intelligence. Respond.io directly occupies the conversational-conversion piece already built here.

## Where this landed

**Don't build all four stages.** That's a fight against Meta's ad automation, Bumpa's commerce OS, and HubSpot/Klaviyo/Salesforce simultaneously — too much, for one business's worth of validation.

**Reframe as "Growth OS," not "Marketing OS" or "full business OS."** The defensible core across every module is the same one dataset: structured, *verified* conversation and transaction data (objections, confidence-scored receipt verification, real conversion outcomes) that neither Meta's ad tools nor Bumpa's order-centric AI capture, because neither sees the full loop from ad click → conversation → objection → bank-transfer receipt → verified sale.

**Differentiation vs. Bumpa specifically** (the closest, scariest competitor): Bumpa's AI is bolted onto inventory/order management — it recovers abandoned *orders*. This system's asset is deep *conversational* intelligence — it can recover a stalled *conversation*, with the actual recorded objection, not an inferred one. Narrower, but genuinely different.

**Don't try to own the ad-creative or storefront/inventory layers.** Integrate with Meta's ad automation (feed it better signal — verified-purchaser audiences, real objection language for ad copy) and with Bumpa/Catlog/Selar-type tools rather than rebuilding them.

## Proposed module breakdown (long-term architecture, not immediate scope)

1. **AI-run retention & lifecycle marketing** — extends the existing `Followup` engine past one sale into an ongoing per-customer clock: win-back, post-purchase nurture, cold-lead reactivation, segment campaigns off existing `ConversationFact`/`Customer.tags` data. Smallest lift — reuses the "business rules as data" pattern already in `BusinessConfig`.
2. **Growth analytics tied to verified revenue** — extends the existing Trends page: objection intelligence, playbook A/B testing measured against verified purchases (not reply rate), campaign/creative-level attribution, eventual cross-business benchmarking.
3. **Feed better signal into ad platforms, don't replace them** — surface real pre-purchase objection language for ad copy; push verified-purchaser/high-intent audiences to Meta Custom Audiences via the Marketing API. Needs `ads_read`/audience-write scope, deliberately not yet granted (see `docs/FUTURE.md`).
4. **Trust/payment layer, extended** — light version: verified-transaction history as a bookkeeping/credibility record. Heavy version: actually process/settle payments (Vendy's model) — a distinct regulatory track (CBN licensing, PCI compliance), parked separately, not part of this roadmap unless demand is validated.
5. **Multi-channel Conversation Brain** — same Customer/Conversation/Fact model ingesting Instagram DM, Telegram, web chat, not just WhatsApp. Insurance against single-channel platform risk. Architecture already anticipated this (PRD's Channel Gateway was designed pluggable).

Rough build order: 1 → 2 → 3 → 5 → 4 (4 parked until validated).

## A separate, important flag: regulatory risk on the current live product (verified)

NAFDAC regulates advertising of drug/health-related products in Nigeria (Drug and Related Products Advertisement Regulations 2021, among others), and this **explicitly extends to digital/social media platforms**. A product being NAFDAC-registered does not automatically clear whatever claims its ads make — unsubstantiated health claims legally require a caveat ("These claims have not been evaluated by NAFDAC"). This sits alongside — and is separate from — the Meta ad-policy question already looked at earlier this session (the "your diabetes will be completely reversed in 10 days" ad copy). Worth an actual compliance read (Nigerian advertising/regulatory counsel), independent of and probably before the growth-OS strategy work, since it's live legal exposure on the one business this whole thesis depends on.

## Standing next step (not yet done)

None of the above replaces actually talking to 5–10 other WhatsApp-first Nigerian sellers who aren't the one business currently running on this system. Two AI models now agree on a coherent internal thesis — that isn't market validation.

---

# Addendum (2026-09-04): the ad-creative pipeline, researched properly

Wall 3 above rejected building AI ad-creative generation on *strategic* grounds — it competes with Meta's own core ad business. This addendum came from a concrete follow-up question: pull high-converting ads from the Meta Ad Library, generate new creative from them with Google Flow and CapCut, orchestrate the whole thing including B-roll for a human feel.

The research produced a harder objection than the strategic one. **The intelligence input this design depends on does not exist.** That's a factual constraint, not a judgement call, and it holds regardless of how the strategy question is eventually resolved.

Same convention as the rest of this doc: "verified" means fetched from the primary source during this research. Everything else is marked.

## 1. The Ad Library cannot identify converting ads

**Verified** (fetched: [developers.facebook.com — ads_archive reference](https://developers.facebook.com/docs/graph-api/reference/ads_archive/)): the endpoint accepts an `ALL` ad-type parameter and 200+ country codes, but **ads lacking EU audience reach are excluded unless they are political or issue ads**. A Nigerian advertiser running to a Nigerian audience is therefore not in the API at all. The endpoint's field list does not include impressions or spend for commercial ads.

**Third-party, consistent with the above, not fetched from Meta**: the browser UI does show all active commercial ads in any country, including creative, primary text, headline, CTA, platforms, start date and A/B variants — but no spend, no impressions, no conversions and no targeting. Spend appears only for political/social-issue ads, and only as a bucketed range.

**Consequence**: "highly converting ads" is not a queryable property. The only genuine signal available is **longevity** — an ad still running after ~90 days is very likely profitable, because nobody funds a loser that long. That is a proxy, and any system built on it must present it as one rather than dress it up as conversion data.

**Consequence for architecture**: there is no legitimate programmatic path to this data for the Nigerian market. Scraping the public UI is against Meta's terms and breaks on markup changes. Meta's first-party programmatic route for commercial ad data is the Content Library API via a formal research-access process, which is explicitly not for marketing intelligence.

## 2. Google Flow has no API; Veo does

**Third-party, not fetched from Google's own docs**: Flow is a UI product with no public API. The model underneath it, Veo 3.1, is available through the Gemini API and Vertex AI. Clips are 8 seconds. Pricing is per second of output, reportedly $0.05 (Lite, 720p), $0.10 (Fast, 720p), $0.40 (Standard, 720p/1080p) — so roughly $1.50–$12.00 of raw generation per 30-second ad, before counting the failed generations you throw away.

**Verify current pricing at Google's own pricing page before putting these numbers in a budget.**

## 3. CapCut has no automation API

**Third-party**: CapCut's open platform builds plugins that run *inside* the editor; its AI endpoints cover isolated features. There is no way to construct a timeline, place clips, or render an MP4 programmatically. Community projects work by writing draft files for the desktop application, which means a machine with the app open — automation of a person's computer, not a service.

CapCut is where a human does assembly by hand. That is a real job, and it is the job that has to be replaced, not integrated with.

## 4. The layer that actually exists: render APIs

The distinction that makes the pipeline tractable:

- **Generation** produces footage that didn't exist. One shot, no text, no music, no captions, no knowledge of the shots around it.
- **Assembly** turns several pieces of footage into an ad: ordering, on-screen hook, captions, music, logo, aspect ratio, single exported file.

A render API does assembly over HTTP. You POST a JSON description of the edit and get back a video. **Verified** (fetched: [shotstack.io core concepts](https://shotstack.io/docs/guide/getting-started/core-concepts.md)) — a timeline holds tracks, tracks are layers with the first element on top, and clips carry `start` and `length` in seconds:

```json
{
  "timeline": {
    "tracks": [
      { "clips": [
        { "asset": { "type": "image", "src": "https://example.com/photo.jpg" },
          "start": 0, "length": 4 },
        { "asset": { "type": "video", "src": "https://example.com/footage.mp4",
                     "trim": 2, "volume": 0.5 },
          "start": 4, "length": 6,
          "transition": { "in": "fade", "out": "fade" } }
      ] }
    ]
  },
  "output": {}
}
```

**Why this matters more than the generation step**: once an edit is data, a variant is a value change. One template emits twenty JSON documents with different hooks, opening shots and CTAs, and returns twenty finished files. Creative volume is what Meta's delivery system rewards, and volume is impossible by hand and trivial in a loop. This — not the generation — is where the leverage is.

**Third-party pricing**, entry tiers around $49–$54/month for roughly 200 minutes of 1080p rendering, with per-minute rates spanning ~$0.10–$0.84. Shotstack bills a premium for minutes past the allowance; JSON2Video hard-stops when credits run out. For an automated pipeline that could loop, prefer the hard stop.

Self-hosted alternatives: Remotion (video frames as React components, which suits this stack) or ffmpeg directly. Start hosted; per-minute cost will not be a meaningful line item for a long time.

## 5. Meta's Marketing API closes the loop

**Third-party**: upload video to `/act_{id}/advideos`, poll until ready, reference the returned ID from `/act_{id}/adcreatives`. Needs `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`, and a System User token for production. Note this is the same scope expansion module 3 above already parks deliberately (`docs/FUTURE.md`). Every ad still goes through Meta's review regardless of how it was created.

## 6. Policy findings — and two claims that did NOT survive verification

> **Correction, same day.** Two claims were stated to the user with more confidence than the sources support, and are recorded here downgraded rather than quietly dropped:
>
> - **"Meta rewrote Health & Wellness advertising standards in July 2026 from product-based to claims-based enforcement."** Third-party blogs only. [Meta's Health and Wellness page](https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/) did not return substantive content on re-fetch, so the rewrite could not be confirmed or dated. **Do not plan around it.** What *is* verified, from earlier this session and recorded in `docs/META_WHATSAPP_COMPLIANCE.md`, is the substance that actually matters: no cure/heal/eliminate claims (diabetes named explicitly), no outcome promises within a timeframe, no sensational or exaggerated claims.
> - **"AI disclosure is now mandatory for advertisers, and undisclosed AI accounts for 14% of ad rejections."** [Meta's Advertising Standards index](https://transparency.meta.com/policies/ad-standards/) contains **no section on AI-generated content, synthetic media, or advertiser disclosure at all**. The 14% figure is a blog statistic with no traceable source. What is well established is the narrower, long-standing rule that *political and social issue* ads must disclose photorealistic digitally created or altered imagery and audio. Whether an equivalent obligation exists for commercial ads is **unconfirmed** and needs checking in Ads Manager directly, where any such control would actually appear.

**What survives regardless of those two.** The verified Health & Wellness rules are claim-shaped already, and they are what disabled this business's WABA on 2026-08-24 (`docs/AD_COPY_COMPLIANCE_AUDIT.md`). A system whose purpose is to generate ad copy at volume is a system that manufactures exposure to those exact rules at volume. That risk is real and does not depend on the July rewrite being true.

Separately, closely reproducing a competitor's creative is a copyright and trademark question independent of any Meta policy.

## 7. The B-roll instinct probably inverts

The original idea was generated B-roll to add a human, realistic feel. If any commercial AI-disclosure obligation does exist, it would fall hardest on exactly the photorealistic synthetic presenter that idea produces, while real footage with AI-assisted editing sits in the lighter category.

But the stronger argument doesn't need the policy question resolved at all: **actual phone footage of the real product is cheaper than generated video, more convincing than generated video, and carries no disclosure question whatever the answer turns out to be.** Generate the polish, not the person.

## 8. Build a CapCut-style editor, or embed one? — build/buy call

The question that followed: if users want to make their own edits, should we build the assembly engine ourselves?

**No. An embeddable one already exists, under a license that permits this use.**

**Verified** (fetched: [shotstack-studio-sdk](https://github.com/shotstack/shotstack-studio-sdk) and its `LICENSE`): the **Shotstack Studio SDK** is a browser video editor — timeline with drag/resize/selection, canvas preview, undo/redo command model, text/image/video/audio clips, and browser-side export via `VideoExporter`. TypeScript, framework-agnostic, works with React and Next.js.

**License, checked against the actual text rather than a summary**: PolyForm Shield 1.0.0. *"Any purpose is a permitted purpose, except for providing any product that competes with the software or any product the licensor or any of its affiliates provides using the software."* Commercial use is permitted outright. The only exclusion is building a competing video-editing platform. Antflow is a WhatsApp growth system, not a video API, so this is clear.

> Worth flagging because it will mislead someone re-reading this later: both a search summary and an automated page summary described PolyForm Shield as "a proprietary license restricting commercial use without explicit permission." The license text says the opposite. Read the text.

**But the cheaper answer probably covers most real demand.** Be precise about what "make some edits" means for a Nigerian merchant on a phone: change the hook line, swap the opening shot, change the CTA, pick a different variant. That is a **form with four fields plus a preview**, not a timeline — and it is nearly free, because the edit is already JSON (§4). Expose a few values as inputs, re-render, show the result.

Pair it with a one-button escape hatch: let them download the rendered file and the source clips. **Users already have CapCut on their phones and already know it.** Handing off to the tool they know beats anything embedded.

**The device constraint points the same way.** Browser editing means WebAssembly, heavy CPU, and downloading every asset to the handset before anything can be scrubbed. On a mid-range Android over Lagos mobile data, a full timeline is a poor experience regardless of who builds it. Form-plus-preview is the right shape for that constraint, not a compromise against it.

**Sequencing**: form and preview first → escape-hatch download → embed Studio SDK only when a real user asks for something the form cannot express.

**Remotion licensing, if the self-hosted path is ever taken** (**verified**: [remotion.dev license FAQ](https://www.remotion.dev/docs/license/faq)) — free for individuals and organisations of up to 3 people; a Company License is required at 4+. Remotion for Creators is $25 per seat per month; **Remotion for Automators is $0.01 per render with a $100/month minimum**, and *using the `<Player>` counts as automation*. Headcount aggregates across contractors and agencies on the same project. Not free at company scale — know this before choosing Remotion as the "own it" option.

**The strategic weighting.** An editor is the most enjoyable and least defensible item available. Nobody will choose Antflow because its editor is good; they might choose it because it stops their ad account being disabled — and that piece (§ the compliance gate, below) is still unbuilt.

## 9. Organic social (posts, trends, carousels) — the DM leg is the real asset

Proposal: pull trends, generate posts/carousels/captions, publish to IG/FB/TikTok, track engagement and DMs, run agents that learn from performance.

**The valuable half is the DM leg, not the content half.**

**Verified** ([Instagram Messaging API](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/)): a webhook fires when someone messages the business account, carrying their Instagram-scoped ID and message; the app has **24 hours** to respond, and cannot message first. That is architecturally identical to the WhatsApp integration already running — same webhook-in model, same 24-hour window. The Conversation Brain, playbook, follow-up engine, receipt verification and opt-out handler all apply unchanged. **This is module 5 ("Multi-channel Conversation Brain") from the main doc, and the work is mostly plumbing.** Needs `instagram_business_manage_messages`.

**The differentiated measurement**: post → DM → recorded objection → verified receipt → sale. Buffer/Later/Hootsuite see the post and the engagement. Bumpa sees the order. Nothing on the market sees the chain, because it requires owning both ends. This extends the moat this doc already identified from paid traffic to organic.

**Where the proposal goes wrong**:

- **Engagement metrics are a vanity trap**, and this repo just spent a session fixing exactly that class of error on the Trends page (`src/lib/trends.ts`, cohort vs snapshot). Reach and likes are what every scheduler already reports and what nobody can bank. Hold the line this doc already set: measure against *verified purchases*, not engagement.
- **Content generation is the commodity half** — same objection as §1–7, plus trend half-life. Detect, generate, review, publish, and the trend has moved.
- **Meme/trend content on a health product is live risk.** A joke about blood sugar is still a health claim to Meta's classifiers, on a channel whose enforcement already cost one WABA. Everything generated here must pass the same compliance gate as ad copy, *before* publishing.

**Hard constraints found** (Instagram figures **verified** at [Instagram Insights](https://developers.facebook.com/docs/instagram-platform/insights); TikTok third-party):

| Item | Reality |
|---|---|
| IG insights retention | **90 days, then deleted** |
| IG insights, <100 followers | Some metrics unavailable |
| IG publishing | Needs `instagram_business_content_publish`; a carousel counts as one post; per-24h cap is documented inconsistently (25 / 50 / 100 — query `GET /<IG_ID>/content_publishing_limit` rather than trusting a number) |
| TikTok direct post | Requires app audit, reportedly 2–4 weeks and multi-round |
| TikTok pre-audit | Every post publishes `SELF_ONLY` — looks fine in testing, broken for real users |

**The 90-day retention is the one that changes the design**: snapshot insights into our own Postgres from day one, or the agent has no history to learn from a year in.

**Build order (inverted from the proposal, same as §8):** IG DM ingestion → post-to-sale attribution → metric snapshotting → recommendations → content generation last, assisted rather than autonomous, behind the compliance gate.

## 10. VSL + landing-page funnels

Proposal: 15–30 minute video sales letters, landing pages/funnels built via API, tracking clicks/scrolls/form fills, email follow-up, payments.

### Veo is the wrong tool for a VSL — by an order of magnitude

Veo produces **8-second clips**. A 20-minute VSL is 1,200 seconds, i.e. ~150 disconnected clips with no continuity of person, room or wardrobe. Using the §2 rates:

| Approach | Rough cost, 20-minute VSL |
|---|---|
| Veo Standard at $0.40/sec | **~$480** |
| Veo Lite at $0.05/sec | ~$60, still 150 unrelated clips |
| HeyGen avatar at ~$1–4/min | ~$20–80, and actually coherent |
| Founder + phone camera | ~₦0 |

**Third-party**: HeyGen API runs roughly $0.0167–$0.0667 per second depending on avatar engine, with API access from about $108/month; Synthesia gates API behind enterprise pricing (reportedly $899+/month). A talking-head avatar is the correct *shape* for a VSL, unlike generated cinematic clips.

**But the honest recommendation is the last row.** A VSL is one trusted person talking to camera. In this market the founder's actual face outperforms a synthetic presenter, costs nothing, and sidesteps the whole AI-disclosure question flagged in §6. Generate the b-roll and captions around it, not the person — same conclusion as §7.

### Don't buy a landing-page builder — this app *is* one

No compelling "landing page API" category leader surfaced, and it doesn't matter: **this is already a Next.js app on Railway with Postgres.** A funnel page is a dynamic route reading a page definition from our own tables. That gives:

- **Total tracking control.** Clicks, scroll depth, video watch percentage and form events are our own instrumentation writing to the existing `Event` table. A third-party builder makes this *harder*, not easier, because the tracking lives on someone else's domain.
- **Attribution as a join, not an integration.** Page view, lead, conversation and verified order all sit in one database. That is the entire premise of this doc.
- **No per-page subscription**, and no vendor between us and the customer.

### Payments: Paystack replaces receipt OCR for web traffic

**Third-party**: Paystack charges 1.5% capped at ₦2,000 for local transactions, supports card/bank transfer/USSD, and fires a `charge.success` webhook on payment.

This is a **material upgrade over the current flow** for anyone arriving via web. Today payment is a bank transfer plus a screenshot run through vision-model receipt verification (`src/lib/receipt-verification.ts`) with confidence scoring and escalation. A `charge.success` webhook is deterministic. Receipt OCR remains necessary for WhatsApp-originated bank transfers; it should not be the path for funnel traffic.

### Question the email assumption

The proposal assumes email capture and email follow-up sequences. **In this market WhatsApp beats email decisively on open and reply rates**, and this system already owns a working follow-up engine, a 24-hour-window-aware sender, template fallback and opt-out enforcement.

**Capture the WhatsApp number, not the email address**, and drop the lead straight into the existing `Followup` sequence. That reuses everything already built and lands the lead in the channel where the AI can actually close. Email can be a secondary capture, not the primary one.

### This funnel would improve Meta attribution, not just add a channel

`src/lib/meta-conversions.ts` currently reports `event_name: "Purchase"` with `action_source: "business_messaging"`. A web funnel adds a Pixel plus `action_source: "website"`, and unlocks the intermediate events messaging conversions can't express — `ViewContent`, `Lead`, `InitiateCheckout`. Richer signal into Meta's optimiser is a real, compounding benefit, distinct from the funnel's own conversion rate.

### The risk that has to be said plainly

**Long-form health VSLs are the single most scrutinised creative format in this category.** The pattern of a 20-minute video making escalating claims about a medical condition is exactly what Meta's Health & Wellness standards target, and exactly the shape of the copy that got this business's WABA disabled on 2026-08-24 (`docs/AD_COPY_COMPLIANCE_AUDIT.md`). A VSL script is the *highest*-risk artifact anywhere in this roadmap and must go through the compliance gate before it is ever recorded, not after.

## Where this leaves the strategy

Wall 3's conclusion stands and is now better supported. Three separate things say don't build the intelligence half:

1. The data to rank ads by conversion is not obtainable for this market by any legitimate programmatic route.
2. The strategic objection from 2026-08-22 is unchanged: this competes with Meta's own core ad business.
3. Generating health-adjacent ad copy at volume multiplies the exact exposure that has already cost this business one WABA.

**If any of this gets built, the order should be inverted from how it was proposed.**

- **The swipe file, manual.** Log competitor ads with start dates and let longevity rank them. Honest about being a proxy. Cheap, and it captures the only real signal that exists.
- **The compliance gate, before the generator rather than after it.** This is the genuinely valuable automated piece and the one nobody sells. The raw material already exists in this repo: the verified rules in `docs/META_WHATSAPP_COMPLIANCE.md` and the failure post-mortem in `docs/AD_COPY_COMPLIANCE_AUDIT.md`. Screening generated copy against those before it reaches Ads Manager is what protects the account. It is also strategically defensible in a way creative generation is not — Meta will never ship a tool that tells you its own enforcement will reject you.
- **Generation last.** Veo or real footage for shots, a render API for assembly, Marketing API to publish. Technically the easiest third of the work and the least differentiated.

Note the ordering matches this doc's existing thesis rather than fighting it: the defensible asset is verified data and a compliance/trust position, not the creative itself.
