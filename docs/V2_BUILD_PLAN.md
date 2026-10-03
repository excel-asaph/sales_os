# v2 build plan: data structure, moving VitalFix across, order of work

Part of [V2_REVAMP.md](V2_REVAMP.md). Proposal, 2026-09-30. Nothing here is
built yet. All work happens on the `v2` branch; `main` keeps running
VitalFix until the switch-over at the end of Phase 1.

## Principles

1. **Add first, remove last.** Every database change in the first
   migrations only *adds* tables and nullable columns. Old columns stay
   until v2 has run cleanly in production, so a bad day can be rolled back.
2. **VitalFix must behave exactly the same after the move.** Phase 1 ends
   only when the live business runs on v2 with nothing its customers or its
   team can notice.
3. **v2 never touches the production database until switch-over.** It runs
   against a staging copy with a test WhatsApp number.
4. **One app, one database, many workspaces.** Every query is scoped to the
   workspace the logged-in person is working in.

## The data structure

Names below are what the business sees. The existing `businesses` table
stays (renaming tables buys nothing and risks a lot); the app calls it a
*workspace*.

### People and access (replaces "one login per business")

| New | What it holds |
|---|---|
| `User` | one person: email (unique), name, password hash or Google ID, email verified |
| `HumanAgent` gains `userId` and `role` | becomes the person's *membership* of one workspace. `role` is OWNER, ADMIN or AGENT, replacing `isAdmin`. Conversations already point at `HumanAgent`, so "assigned to" keeps working |
| `PlatformAdmin` flag on `User` | Antflow staff: see every workspace, help with setup, suspend a workspace. Every action they take inside a workspace is written to the event log |

The login cookie carries the user and the workspace they're in; a person in
two workspaces gets a switcher.

### Products own their sales brain

| Change | Why |
|---|---|
| New `ProductSettings` (one per product), every field optional: greeting, playbook, deliver-before-payment, follow-up count and on/off, receipt handling, tone | a product's own sales script. Empty fields **inherit** the workspace's `BusinessConfig`. One function, `getEffectiveSettings(workspace, product)`, does the merge, so nothing else needs to know about inheritance |
| `FaqEntry` gains `productId` (optional) | an FAQ with no product applies to all of them |
| `Product` gains: status (draft or live), cover image, uploaded file (R2), WhatsApp opening text | products are created and finished in the app, not by script |
| `Product.contentText` is filled by an in-app upload and extraction job | replaces `scripts/set-product-text.ts` |

### Numbers become channels, and channels know their products

| Change | Why |
|---|---|
| `BusinessMetaConnection` gains: Meta app ID, app secret (encrypted), webhook verify token, and a random webhook key | each business has its own Meta App (decided). The webhook address becomes `/api/whatsapp/<webhook key>`, so we know which secret to check a message against |
| New `Channel`: one row per WhatsApp number, with its phone number ID (unique), display number, label, status | replaces `whatsappPhoneNumberId`, the `additional…` array and the labels JSON, which are three fields doing one table's job |
| New `ChannelProduct`: which products a number sells | one product means a dedicated number; several means a shared one |
| New `AdProduct`: which product an ad sells, keyed by the ad ID Meta sends | the most reliable way to know what a customer came for on a shared number |
| `Conversation` gains `channelId` and `productId` | which number, and which product, the conversation is about. `productId` is set by routing, or by the AI with a new `choose_product` tool once the customer says what they want |

Customers stay per workspace, so one person buying two books is one record
with two purchases, which is already how v1 works.

### Deliberately not in Phase 1

- **Offers** (₦10,000 standard and ₦20,000 personalised under one
  product). The structure allows adding them later with an `Offer` table
  and `Order.offerId`; until then a product has one price, as today.
- **Billing and usage metering** (Phase 4).

## Moving VitalFix across

1. **Staging.** A separate Railway environment with its own Postgres,
   filled from a copy of production, plus a test Meta App and Meta's free
   test number. v2 runs there, never against production.
2. **Additive migration and a one-off backfill script**, run in staging
   first:
   - a `User` for each `HumanAgent`, keeping their password; `role` from
     `isAdmin`
   - a `Channel` for each number in the current three fields
   - the existing Meta credentials copied into the extended
     `BusinessMetaConnection`, including today's app ID and secret from the
     environment
   - `Conversation.channelId` from its `whatsappPhoneNumberId`, and
     `productId` set to Diabetes Fix (VitalFix sells one product)
   - empty `ProductSettings` for Diabetes Fix, so it inherits everything
     VitalFix has today
   - **Before running it with `--env-credentials-for`:** production
     must have `CREDENTIAL_ENCRYPTION_KEY` set (64 hex characters), and
     it must never change afterwards, or every stored secret becomes
     unreadable. The script prints VitalFix's new webhook address.
3. **Prove it's the same.** Replay a set of real past conversations
   through both v1 and v2 in staging and compare the system prompt each
   builds. They should be identical apart from the new product section.
4. **Switch over.** Merge `v2` into `main` in a quiet hour. Railway runs
   the migration on boot. VitalFix's webhook moves to its new per-business
   address; the old address keeps working for a while as a fallback.
5. **Clean up** (a later migration, weeks after): drop the old number
   fields and `isAdmin`.

## Order of work

Each phase ends with something real working. Rough sizes, not promises.

### Phase 0: before code (days)
- The client setup guide: one Meta App per business, written up from the
  brother's setup, with screenshots.
- Staging environment on Railway, test Meta App and test number.

### Phase 1: foundations (1 to 2 weeks)
Users, memberships and roles; the workspace switcher; channels;
per-business webhook; the migration and backfill; the platform-admin flag.
**Done when:** VitalFix runs on v2 in production and nobody notices.

Progress:
- [x] Migration `20261001090000_v2_people_and_channels`: users, roles,
  channels, channel-product links, conversation channel and product, and
  the per-business Meta App fields. Adds only.
- [x] `scripts/v2-backfill.ts`, with `--dry-run`; tested on local data,
  and a second run changes nothing.
- [x] Login through `User`, the session carrying user and workspace, the
  workspace switcher (`src/lib/workspaces.ts`, `/api/workspace`). Login
  falls back to v1's lookup only for a login not yet linked to a User, so
  nobody is locked out between deploying and running the backfill. Adding
  a teammate creates or links their User; role and isAdmin change
  together so v1 still works on rollback.
- [x] Inbound messages matched to a `Channel`; conversations stamped with
  channel and product (`src/lib/channels.ts`). A disconnected channel
  drops its messages; a number with no channel row falls back to the v1
  fields until the backfill has run. The WhatsApp connection wizard now
  creates the channel too.
- [ ] The dashboard's number switcher and filters reading `Channel`
  instead of the v1 number fields (needed before the clean-up migration,
  not before switch-over)
- [x] Per-business webhook `/api/whatsapp/<webhook key>` (`src/app/api/whatsapp/[key]/route.ts`).
  Checked against that business's own app secret and verify token, never
  unsigned, and drops a message for any number that isn't the business's
  own. The shared `/api/whatsapp` runs the same code
  (`src/lib/whatsapp-webhook.ts`) and stays as the fallback. Tested with
  signed fake messages; still to be proven against Meta with the test
  Meta App.
- [ ] Platform-admin access, logged to the event log

### Phase 2: products run themselves (1 to 2 weeks)
Product settings with inheritance; FAQ per product; file upload and text
extraction in the app; routing a conversation to a product (dedicated
number, pre-filled link text, ad mapping, or asking); a test chat to talk
to your own AI before going live.
**Done when:** the brother adds his second ebook and sells it without us
touching code.

### Phase 3: onboarding (1 to 2 weeks)
Sign-up, the setup checklist, the "Ebook seller" starting template, the
guided WhatsApp connection with a live connection check, team invites, and
the platform-admin screens (all workspaces, their setup progress, support
access). See [V2_ONBOARDING.md](V2_ONBOARDING.md).
**Done when:** a new business goes from sign-up to live without a
developer.

### Phase 4: website and billing (1 week)
The public site, ₦300,000 monthly billing through Paystack, AI usage
counted per workspace. See [V2_WEBSITE.md](V2_WEBSITE.md).

### Phase 5: extras
Offers and the ₦20,000 personalised tier, Paystack checkout for customers
(instead of receipt checking), more templates, Tech Provider status and
one-click WhatsApp sign-up.
