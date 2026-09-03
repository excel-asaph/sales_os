# Meta BSP / Tech Provider research — reference doc

Not an active plan — a save point. This captures research done 2026-08-26/27
while diagnosing repeated WABA/Business Portfolio disablements (see
`docs/META_WHATSAPP_COMPLIANCE.md` and `docs/AD_COPY_COMPLIANCE_AUDIT.md` for
that incident itself). Relevant again if/when Antflow moves from "run our own
WhatsApp number" toward "let other businesses run theirs through us" — the
Growth OS direction sketched in `docs/GROWTH_OS_STRATEGY.md`.

Sourcing note, same standard as the compliance doc: claims are marked by
where they came from. Meta's own legal terms and developer docs are quoted
directly. Where a claim only came from BSP marketing content, agency blogs,
or (worse) antidetect-browser/account-farming vendors, that's flagged
explicitly — some of it turned out to be unreliable and shouldn't be reused
without re-checking.

## The architecture: three separate things people conflate

1. **A WABA** (WhatsApp Business Account) — the real messaging account, a
   phone number, a quality rating. Always owned by a **Business Portfolio**
   (Business Manager), the same container that also holds Pages and ad
   accounts.
2. **A Meta App** — a one-time developer registration (App ID + App Secret),
   separate from any specific business. Doesn't send messages itself; it's
   the mechanism that *lets* code talk to Meta on behalf of a WABA.
3. **Embedded Signup** — the bridge. A business owner logs into *their own*
   Facebook account, creates or selects *their own* Business Portfolio,
   registers *their own* phone number, and grants a specific Meta App
   permission to act on that WABA. The App never owns or absorbs the
   account — it's a permission grant (an OAuth `code`), not a transfer.

The one-time Meta App setup (App ID, Embedded Signup `config_id`, App
Secret) is documented as a prerequisite in `docs/META_CONVERSIONS_SETUP.md`
— this doc doesn't repeat those mechanics, just the BSP/liability layer on
top of them.

**For a single business connecting only its own WABA** (not managing other
businesses' accounts), Advanced Access / full App Review is not required —
a System User access token is sufficient. Advanced Access only becomes
mandatory when `whatsapp_business_management` is used to access a WABA the
App's own business doesn't own (source:
[developers.facebook.com — Get Started, Business Management API](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started/)).
This is why the current wizard (`src/app/settings/whatsapp`) doesn't need a
Tech Provider application to work for one business.

## Becoming a Tech Provider (the tier required to manage *other* businesses' WABAs)

Source: [developers.facebook.com — Become a Tech Provider](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/get-started-for-tech-providers), [Partners overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/overview)

- A Meta Business Portfolio, fully Business-Verified (2–5 business days once submitted).
- A Meta App with **Advanced Access** to `whatsapp_business_messaging` (send on behalf of clients) and `whatsapp_business_management` (access clients' WABAs).
- **App Review** — Meta reviews the actual use case before granting Advanced Access; without approval, those permissions don't appear in the Embedded Signup flow offered to clients.

**Tech Partner** (the higher tier — gets you into Meta's public Partner Directory, where Respond.io/360dialog/Wati are listed): minimum **10 clients** and average **2,500 conversations/day** across them.

## Liability — the part that matters most if this is ever pursued

Quoted directly from Meta's own legal terms, fetched 2026-08-26:

**[Meta Business Messaging Technology Provider Terms](https://www.facebook.com/legal/BM-tech-provider-terms):**
> "Company and its Customers are jointly and severally liable for all acts and omissions" in connection with the platform.

> "Company is responsible for its Customers' use of the Applicable Platform(s), including any breach, act, or omission."

> "Meta may immediately terminate these Tech Provider Terms or suspend or terminate your access to the Applicable Platform(s), with or without notice to you, if we determine, in our sole discretion, that you violate these Tech Provider Terms."

> Meta may also "prohibit any of your Customers' use of the Applicable Platform(s), effective upon notice to you" — and the Tech Provider must comply immediately.

**[WhatsApp Business Terms for Service Providers](https://www.whatsapp.com/legal/business-terms-for-service-providers):**
> BSPs "must timely notify WhatsApp if they know or reasonably surmise that their Client has breached" the terms.

> A BSP "must not block or prevent a Client from accessing its WABA" unilaterally — but "upon WhatsApp's written request, the BSP will promptly block, disable, or delete a Client's WABA." (Enforcement is scoped per-client-WABA by default, not blanket against the BSP's whole book of business.)

> "If the BSP has **not ensured** that their Client has accepted the WhatsApp Business Solution Terms, the BSP... [is] jointly and severally liable for... any harm that results from the Client's acts and omissions." This is the load-bearing detail: getting every client to directly accept Meta's own terms during onboarding (not just the BSP's own contract) is what actually limits a BSP's exposure.

## How large BSPs manage this risk in practice (synthesized from the above + industry sources)

1. **Scoped enforcement** — Meta's default response to a bad client is disabling that client's WABA specifically, not the BSP's entire platform. This is why isolated client suspensions are a routine, absorbable cost at scale rather than existential.
2. **Mandatory self-reporting** — BSPs are contractually required to detect and report client violations, which is why serious ones build real compliance-monitoring tooling.
3. **Direct terms acceptance** — every client clicks through and accepts *Meta's* terms during onboarding, not just the BSP's, which is what actually shifts primary liability onto the client.
4. **Upfront category vetting** — Respond.io publishes restricted-category tiers directly ([eligibility page](https://respond.io/help/whatsapp/check-whatsapp-business-eligibility-and-policy-rules)):
   - **Allowed with conditions**: beauty/aesthetic clinics, medical and healthcare, subscriptions, insurance, event tickets, alcohol and OTC drugs (country-dependent).
   - **Prohibited**: loans/lending/debt collection, investment and trading, cryptocurrency, MLM, drugs, **and "businesses with prior Meta policy violations."**
   - Respond.io itself does not screen at onboarding and cannot override Meta's decisions or guarantee approval/reinstatement — eligibility is Meta's own call based on the business's entire online presence, not the BSP's.
   - **Relevant to this business specifically**: health/wellness products are not blanket-prohibited (they're "allowed with conditions"), but "prior Meta policy violations" is explicitly listed as prohibited — meaning Truefix Wellness's own history would currently fail this exact screen, at Respond.io or anywhere else, independent of which software is used.

## Meta AI Business Agent (native alternative, not a BSP)

Launched globally June 2026, token-based pricing from Aug 1 2026. Native,
no-code — configured directly inside WhatsApp Business using uploaded
catalog/FAQs/website/chat history, no API or hosting needed (source:
[WABetaInfo](https://wabetainfo.com/meta-introduces-ai-business-agent-for-whatsapp-worldwide/),
[Omnichat](https://blog.omnichat.ai/meta-business-agent-platform-explained-features-pricing-and-what-the-2026-whatsapp-changes-mean-for-your-business/)).

**Doesn't solve account-health problems** — still requires a live, undisabled
WABA underneath it. **Not a CRM/pipeline substitute** — it's a generic
FAQ/booking/lead-qualification bot, no concept of pipeline stages, follow-up
sequencing, or a dashboard. Worth revisiting only as a possible first-line
responder layered in front of Antflow's own system later, not a
replacement — and doing so would mean handing Meta the training content
directly, worth weighing against the compliance sensitivity already
established for this product category.

## Account-linking and ban-risk mechanics

**Confirmed, from Meta's own Account Integrity policy**
([transparency.meta.com](https://transparency.meta.com/policies/community-standards/account-integrity/)):
Meta can restrict accounts/assets "owned by the same entity" as one already
disabled, or ones that appear "created or repurposed to evade a previous
account removal." Enforcement tracks **the person/entity behind an asset**,
not just container IDs — two separate Business Portfolios administered by
the same personal profile are still linked through that profile.

**Observed directly this session** (not just theoretical): a Business
Portfolio ("Truefix") with a disabled main WABA also showed its *test* WABA
as disabled, and an unrelated ad account (AKSOT — actually the same
campaign's ad account, not unrelated) as restricted "in last 30 days." All
three assets sat in the same portfolio container and were swept together.

**Splitting infrastructure across two portfolios** (e.g., the platform's own
Meta App in one portfolio, a client's production WABA in another) reduces
this specific "same-container sweep" risk, but does **not** fully insulate
against entity-level linkage if both portfolios share the same admin
profile — that's a partial mitigation, not full isolation.

**Removing a disabled/restricted asset from a portfolio does not clear its
violation history** — Meta's enforcement is tied to the entity/owner, not
live portfolio membership, and doing this shortly before creating a
replacement asset risks reading as ban evasion rather than cleanup.

**Device type (mobile vs. laptop) — no credible data found either way.**
One claim surfaced during this research ("mobile sessions see 30–50% lower
ban rates") should **not** be trusted or reused — it traced back to an
antidetect-browser vendor, a device-farming/cloud-phone vendor, and a
black-hat marketing forum thread, all businesses whose income depends on
claiming they can help evade platform detection. No independent study or
Meta source was found supporting it. What *is* well-documented: device
fingerprinting is used to cross-reference a specific device against
already-flagged accounts — the risk is reusing a device tied to a flagged
account, or trying to mask/spoof device signals (which itself reads as
evasion), not which category of device is used.

## If Antflow becomes a platform other businesses use (not just its own tool)

The multi-tenant credential architecture already built this session
(`BusinessMetaConnection`, per-business encrypted tokens, `getMetaCredentials`)
is structurally close to what a Tech Provider needs to manage multiple
clients' WABAs — this wasn't built with that in mind, but it's a real head
start if that direction gets pursued later.

Before pursuing Tech Provider status specifically: revisit this doc's
liability section, decide the client-vetting policy up front (given the
"prior policy violations" and health-category precedents above), and budget
for the same category of infrastructure large BSPs use to limit exposure —
proactive quality-rating monitoring, mandatory client acceptance of Meta's
own terms, and an eligibility screen before onboarding, not after.
