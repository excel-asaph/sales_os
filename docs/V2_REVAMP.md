# v2: from one business's tool to a platform many businesses sign up to

Started 2026-09-30 on branch `v2`. This is the discussion record and the
working proposal, not a finished plan. Decisions get marked **Decided** as
the owner makes them; everything else is a proposal to argue with.

## What the owner asked for

- A business can sign up, onboard its own product, and set everything up
  itself. Nobody on our side touches the code to add a product.
- A business can sell several products, on separate WhatsApp numbers or on
  one shared number, its choice.
- A proper public website (landing page), onboarding for new sign-ups, and
  a way for existing businesses to add more products and numbers.
- A professional product that can take on a lot of users, closer to how
  HubSpot, Salesforce and the WhatsApp platforms work.

## Where v1 stands (what we are building on)

More of the groundwork exists than the dashboard suggests:

| Already there | Where |
|---|---|
| Every table is keyed by `businessId`, so data is already separated per business | `prisma/schema.prisma` |
| Per-business WhatsApp credentials, encrypted, written by an Embedded Signup wizard | `BusinessMetaConnection`, `src/app/settings/whatsapp` |
| Several WhatsApp numbers per business, with a number switcher | `Business.additionalWhatsappPhoneNumberIds`, `src/lib/number-filter.ts` |
| Business rules as data, not code | `BusinessConfig` |
| Products, payment accounts, team members editable in the app | `/manage` |

What ties v1 to one business and one product:

- **The sales brain is per business, not per product.** The playbook, FAQ,
  greeting and follow-up settings live on `BusinessConfig` and `FaqEntry`,
  so a second product would share the first one's sales script.
- **Product text is loaded by a script** (`scripts/set-product-text.ts`),
  not uploaded in the app.
- **No sign-up.** The first admin is created with `npm run create-admin`.
  Login is a signed cookie per `HumanAgent`, and a person belongs to exactly
  one business.
- **Numbers aren't linked to products.** A number belongs to the business,
  and nothing says which product a number is selling.
- **No billing**, no plans, no usage limits.
- **Not a Meta Tech Provider.** Connecting *other* businesses' WhatsApp
  accounts needs it (see "The long pole" below).

## How the big platforms do it (researched 2026-09-30)

**The account structure is the same everywhere: people, then workspaces,
then everything else.**

- **HubSpot**: one account, with a shared CRM. The *Brands* add-on gives
  each brand its own assets, users, permissions and reporting while the
  contact database stays shared; up to 100 brands, sold one at a time.
  ([HubSpot Brands](https://knowledge.hubspot.com/branding/manage-your-brands-with-hubspot-brands), [multi-brand guide](https://bayardbradford.com/learning-center/the-2026-multi-brand-hubspot-setup-guide))
- **respond.io**: organisation, then workspaces; each workspace has its own
  channels (WhatsApp numbers), contacts, users and AI agents. Several
  workspaces only on the top plan. ([pricing](https://respond.io/pricing))
- **GoHighLevel**: agency, then sub-accounts; each client is an isolated
  sub-account. *Snapshots* copy a whole proven setup (automations, scripts,
  settings) into a new sub-account in one click, which cuts onboarding "from
  a 10-hour manual build to a 20-minute configuration task". *SaaS mode*
  lets people sign up and pay by themselves and get a ready account.
  ([sub-accounts and snapshots](https://www.ghlscaleup.com/blog/gohighlevel-for-agencies), [SaaS mode](https://ghlops.com/blog/gohighlevel-saas-mode-guide))
- **WATI**: a 30 to 60 minute self-serve wizard: sign up, link Facebook
  Business Manager, verify the number, import templates, set up a basic bot.
  Several numbers only on the Business plan. ([pricing reviews](https://chatarmin.com/en/blog/wati-pricing))

**Setting up the AI is a form, not code.**

- HubSpot's Customer Agent: create the agent, choose its knowledge
  sources, assign it to channels (WhatsApp included), set handoff rules.
  HubSpot's own advice is that content and handoff rules matter more than
  the model. ([HubSpot KB](https://knowledge.hubspot.com/customer-agent/deploy-the-customer-agent-to-channels))
- Salesforce Agentforce Builder: topics, actions, guardrails and escalation
  rules set up visually, plus a *Testing Center* to run test conversations
  before going live. ([pricing and builder](https://www.getmacha.com/blog/agentforce-pricing-explained))

**How they charge.**

| Platform | Model |
|---|---|
| HubSpot | per-seat plans; the AI agent needs Professional or above |
| Salesforce Agentforce | about $0.10 per AI action, or $2 per resolved conversation, or per-user licences |
| respond.io | $79 / $159 / $279 a month, by *monthly active contacts*; AI agents from the $159 plan; plus Meta's fees |
| WATI | about $29 / $79 / $219 a month; several numbers only at $219 |
| Selar (Nigeria, digital products) | no subscription; 4% + ₦50 per sale |
| Vendy (Nigeria, checkout in chat) | about 1% per transaction |

**Nigeria-specific.** Selar has paid out billions of naira to 240,000+
creators of ebooks and courses; WhatsApp Status is one of their best free
channels ([Selar](https://selar.com/pricing)). These sellers are our
target customers, and they are used to per-sale fees, not dollar
subscriptions.

## The proposed shape of v2

### The account structure

```
Person (logs in with email or Google)
  └─ member of one or more Workspaces, with a role (Owner, Admin, Agent)
       Workspace = one business (billing, team, defaults)
         ├─ Products      what it sells, each with its own sales brain
         │    └─ Offers   price tiers of a product: ₦10,000 standard,
         │                ₦20,000 personalised, each with its own delivery
         ├─ Channels      WhatsApp numbers, each routed to one product or several
         ├─ Contacts      shared across the workspace: one person, one record,
         │                all their purchases
         └─ Conversations one per contact per channel, as today
```

This is the HubSpot and respond.io pattern, and it maps onto v1 almost one
to one: `Business` becomes the workspace, `HumanAgent` splits into a person
plus a membership, and the rest gains a `productId`.

### Settings that inherit

Everything a business sets once at workspace level (tone of voice, bank
accounts, follow-up cadence, business hours) applies to every product, and
any product can override any of it. This is how a business with ten ebooks
avoids setting the same thing ten times, and how two very different
products can still sound different.

**Per product** (each product's own sales brain): name, description,
price and offers, the file to deliver, the book's text for after-sale
questions (uploaded in the app, not by script), FAQ, sales playbook,
greeting, objection answers, and any overrides.

### One number, several products

When a number sells more than one product, the AI has to know which one
the customer came for. In order of reliability:

1. **The ad they clicked.** Click-to-WhatsApp messages carry the ad's ID
   (we already store it in `Conversation.referral`). The business maps
   each ad to a product once, and every conversation from that ad starts
   on the right product.
2. **The pre-filled message.** Each product gets its own WhatsApp link with
   its own opening text ("Hi, I want the Fat-Burning Switch").
3. **Asking.** If neither tells us, the AI asks, the way a shop assistant
   would.

A dedicated number skips all of this: it always means one product.

### Onboarding (new business)

A checklist the business can leave and come back to, the way WATI and
HubSpot do it, aimed at a first sale on day one:

1. Sign up (email or Google), name the business, choose the country.
2. **Pick a starting template**, our version of GoHighLevel's snapshots.
   "Ebook seller" loads our proven Diabetes Fix playbook, follow-up
   sequence and FAQ structure. What we have learned from real sales becomes
   something no competitor can copy.
3. Add the first product: upload the file, and the AI drafts the
   description, suggested FAQ and selling points from it for the owner to
   edit.
4. Add a bank account for transfers.
5. Connect WhatsApp through Meta's Embedded Signup.
6. **Test before going live**: a chat window in the app to talk to your own
   AI as a customer would, the way Salesforce's Testing Center works.
7. Go live, and get the product's WhatsApp link and ad setup guide.

**Existing business adding more:** "Add product" runs steps 3, 4 and 6.
"Add number" runs step 5 and then asks which product(s) the number sells.

### The website

A public site at the main domain and the app at `app.` on the same
domain. Pages: home, how it works, pricing, who it's for (ebook sellers,
course creators, coaches), sign up and log in, plus the privacy policy and
terms. Meta requires those two for app review. It can live inside the same
Next.js app as a separate route group, so there is still one thing to
deploy.

## The long pole: Meta Tech Provider

To let *other* businesses connect *their own* WhatsApp numbers through our
app, Meta requires us to be a Tech Provider: a Business-Verified portfolio
and App Review for advanced access to `whatsapp_business_messaging` and
`whatsapp_business_management`. Until then, Embedded Signup only works
for WhatsApp accounts our own portfolio owns. Details and the liability
terms are in [META_BSP_TECH_PROVIDER_NOTES.md](META_BSP_TECH_PROVIDER_NOTES.md).

This is outside our control and takes time, so it should start **before**
the code, not after. It also brings responsibilities:

- We become jointly liable for how clients use WhatsApp through us.
- Every client has to accept Meta's own terms during onboarding.
- We need a rule on which businesses we accept. Health products are allowed
  with conditions, but "businesses with prior Meta policy violations" are
  refused across the industry.

## Other risks to plan for

- **Coexistence may not work in Nigeria.** Coexistence lets a business keep
  using the WhatsApp Business app on the same number our platform connects
  to. One source says it is not available for Nigerian or South African
  numbers ([WhAutomate](https://whautomate.com/whatsapp-coexistence)). Meta's
  own page and 360dialog's docs don't list excluded countries, so this is
  **unconfirmed**. If it's true, a Nigerian seller has to either give up the
  app on that number or use a new number, and onboarding must say so
  plainly. Test it with a real Nigerian number before promising anything.
- **Keeping businesses apart.** Every query must be scoped to the right
  workspace, and a person in two workspaces must never see across them.
  Worth enforcing in the database as well as in code.
- **AI cost per business.** Every conversation costs us Claude tokens. We
  need usage metering and limits per workspace before pricing makes sense.
- **The personalised ₦20,000 offer** is an ebook-building pipeline today,
  not a general feature. In v2 it becomes an offer type: "ask these
  questions, then fulfil", with our book builder as one way to fulfil it.
  See [PERSONALISED_EDITION_PLAN.md](PERSONALISED_EDITION_PLAN.md).

## A possible order of work

0. **Start now, outside the code:** Meta Business Verification and the
   Tech Provider application; decide the client acceptance policy.
1. **Data model:** workspaces, people and roles, per-product sales brain
   with inheritance, offers, channel-to-product routing. Move VitalFix and
   Diabetes Fix across as workspace number one, with nothing breaking.
2. **Product setup in the app:** everything a product needs, including
   file upload and text extraction, playbook, FAQ, and the test chat.
3. **Sign-up and onboarding:** real accounts, the checklist, templates,
   Embedded Signup for new businesses.
4. **Website, pricing and billing.**
5. **Extras:** the personalised offer, Paystack checkout, more templates.

`main` keeps running the live business the whole time.

## Open questions for the owner

1. **Who is v2 for first?** Your brother's businesses running several
   products (no Tech Provider needed), or outside sellers signing up
   (Tech Provider needed)?
2. **What can be sold?** Digital products only, or also courses, coaching
   calls and services?
3. **How should we charge?** A monthly naira plan, a fee per sale like
   Selar, or a mix (small monthly fee plus a smaller per-sale fee)?
4. **Name and domain** for the public site. Is it Antflow?
5. **Which businesses will we accept?** Health products included, and with
   what checks?
