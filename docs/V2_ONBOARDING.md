# v2 onboarding: from sign-up to first sale

Part of [V2_REVAMP.md](V2_REVAMP.md). Proposal, 2026-09-30.

The goal is a new business selling on WhatsApp the same day it signs up.
The steps are a checklist the owner can leave and come back to, shown on
their home screen until every step is done, as WATI and HubSpot do it.

## New business

### 1. Sign up
Name, email and password (or Google), and a WhatsApp number where Antflow
can reach the owner. Email is confirmed with a link.

### 2. Tell us about the business
Business name, what you sell (ebooks and digital products for now),
country and currency (Nigeria and naira by default), and time zone, set
automatically.

### 3. Setup call, then the free plan (decided)
No payment at sign-up. A setup call comes first, the business then runs on
the free plan, and pays ₦300,000 a month to continue past it. Nothing in
setup waits for payment.

When the free plan runs out, the AI **stops starting new sales but never
goes silent on a customer**: new messages still arrive in the dashboard,
the conversation is handed to the business's team, and the owner is told
why. No data is deleted, and paying switches the AI straight back on.

Until Paystack billing exists (Phase 4), Antflow staff mark a workspace as
paid from the admin view after a bank transfer, so billing never has to be
built before the first clients.

### 4. The setup checklist

**a. Add your first product.** Upload the ebook (PDF) and a cover, then
enter the name and price. Antflow reads the file and drafts a
description, the main selling points, who it's for, and eight likely
customer questions with answers. The owner edits and approves; nothing
goes to customers unapproved.

**b. Choose how the AI sells.** Pick a starting template. "Ebook seller"
loads the playbook, greeting, objection answers and follow-up sequence that
work for VitalFix, adjusted to this product. Then set the tone: friendly or
formal, and whether light Pidgin is allowed.

**c. Payment details.** The bank account(s) customers pay into, and
whether the AI may help a customer fix a wrong receipt before a person
steps in.

**d. Connect WhatsApp.** A guided page with numbered steps and pictures:
create a Meta App in your own Meta business account, add your number,
create a permanent access token. Antflow shows the webhook address and
verify token with copy buttons, and the owner pastes back the IDs and
token. A **Check connection** button confirms the token works, the number
is registered, and the webhook is receiving. A **Book a setup call** button
is always visible, because at ₦300,000 a month we do this with them if
they want.

Before this step the page states plainly: the number used here can't stay
in the normal WhatsApp Business app at the same time (until Meta's
"coexistence" is confirmed for Nigerian numbers), so use a number that
will be for sales only.

**e. Test your AI.** A chat window inside Antflow that talks to the owner's
AI exactly as a customer would, with no WhatsApp involved. Ask the price,
push back, say it's too expensive, upload a test receipt. The owner sees
what the AI would do, and can tweak the playbook and FAQ from the same
screen.

**f. Go live.** Switch the AI on for the number. Antflow gives:
- the product's WhatsApp link with its opening text
  (`wa.me/<number>?text=…`), and a QR code
- a short guide to setting up a Click-to-WhatsApp ad, including the
  Conversions API settings from
  [META_CONVERSIONS_SETUP.md](META_CONVERSIONS_SETUP.md)

### 5. The first week
- If the checklist stalls for a day, Antflow messages the owner on
  WhatsApp with the next step.
- The first real conversation and the first verified sale each get a
  message to the owner.
- A short daily summary: conversations, sales, anything waiting for a
  person.

## Existing business adding more

- **Add a product:** steps a, b (optional, only to override the
  workspace's defaults) and e. The product starts as a draft and goes live
  when the owner switches it on.
- **Add a number:** step d, then choose which product(s) the number sells.
- **Map ads to products:** a list of recent ads that sent customers, with a
  product picker next to each.
- **Invite the team:** by email, as Admin or Agent.

## Antflow's own admin view

For the Antflow team only:
- every workspace, its plan, and how far through setup it is
- open a workspace to help with setup (logged in the event log, and
  visible to the business)
- suspend a workspace, for example for non-payment or a policy problem

## Open questions

1. **What the free plan includes.** Proposed: everything unlocked, for 14
   days or the first 20 verified sales, whichever comes first. A sales
   limit costs us nothing until the AI is earning them money.
2. **Who does WhatsApp setup by default:** the business on its own with
   the guide, or always us on the setup call? Proposed: us, on the call,
   since there is a call anyway.
