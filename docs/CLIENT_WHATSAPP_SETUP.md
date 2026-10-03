# Connecting a new business's WhatsApp to Antflow

The guide for the setup call. Each business gets **its own Meta App, in its
own Meta business account**, so it uses WhatsApp directly and Antflow never
needs Meta Tech Provider status (decided 2026-09-30, see
[V2_REVAMP.md](V2_REVAMP.md)). A ban on one business stays with that
business.

Written for an Antflow team member running the call with the business
owner sharing their screen. Budget about an hour; most of it is waiting
for Meta's codes and reviews.

> **Parts marked "(Phase 1)" need the v2 code.** Until then, only VitalFix
> is connected, through the older Embedded Signup wizard.

## Rules for the call

- **The business does the clicking, in its own accounts.** Antflow staff
  never become admins of a client's Meta business account. Meta links
  accounts through the people who manage them, so a staff member sitting in
  every client's account would tie all our clients together if one gets
  banned.
- **Secrets go straight into Antflow's form**, never into WhatsApp, email
  or chat. Antflow stores them encrypted.
- **Check the business sells what we accept:** digital products or ebooks
  that can be sold on WhatsApp. Ask whether the business or its owner has
  ever had a Meta account, ad account or WhatsApp number banned; if so,
  stop and talk it through first, because Meta may refuse or ban again.

## Before the call, the business needs

1. **A Facebook account** belonging to the owner (their real one).
2. **A phone number for sales only**, one that can receive an SMS or call.
   It **must not be in use on WhatsApp or the WhatsApp Business app**. If
   it is, the owner deletes that WhatsApp account from the phone first
   (WhatsApp → Settings → Account → Delete account), after backing up
   anything they need. Meta's "coexistence", which would let them keep the
   app, isn't confirmed for Nigerian numbers yet.
3. **A debit card** for Meta's WhatsApp charges (Meta bills the business
   directly, not Antflow).
4. **The business's legal name and address**, and ideally its CAC
   registration documents, for Meta's business verification.

## 1. Create the Meta business account (portfolio)

If the business already has one that has **never had anything banned**,
use it. Otherwise:

[business.facebook.com](https://business.facebook.com) → Create a
business portfolio → the business's real name, the owner's name and a
business email.

## 2. Create the business's own Meta App

1. [developers.facebook.com](https://developers.facebook.com) → log in
   with the same Facebook account → **My Apps → Create App**.
2. Use case: **Connect with customers through WhatsApp**.
3. App name: the business's name (for example `VitalFix Sales`), contact
   email: the business's.
4. Business portfolio: the one from step 1.

## 3. Add the WhatsApp number

1. In the app: **WhatsApp → API Setup → Add phone number**.
2. Display name: the business's name as customers should see it. Meta
   reviews it, and it has to match the business, so no product slogans.
3. Category: the closest match (usually *Education* or *Other* for
   ebooks).
4. Verify with the code Meta sends to the number.

## 4. Payment method

WhatsApp Manager → the business's WhatsApp account → **Payment settings**
→ add the debit card. Without it, messages that start a conversation
(like follow-ups outside 24 hours) are refused.

## 5. A permanent access token (the "system user")

The token in the API Setup page expires in 24 hours. A real business needs
one that doesn't.

1. [business.facebook.com](https://business.facebook.com) → Settings →
   **Users → System users → Add**. Name: `Antflow`. Role: **Admin**.
2. **Assign assets** to that system user:
   - the app from step 2: *Manage app*
   - the WhatsApp account from step 3: *Full control*
3. **Generate new token** → choose the app → expiry **Never** →
   permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
   - `business_management` (needed for ad reporting)
4. The owner copies the token **straight into Antflow's connection form**
   (below). Meta never shows it again.

## 6–9. The connection wizard in Antflow

In Antflow: **Settings → WhatsApp → Start the connection wizard**
(`/settings/whatsapp/connect`). It walks through the rest, and the owner
copies only two things:

| Step | The owner | Antflow, by itself |
|---|---|---|
| Access token | copies the permanent token from step 5 | recognises it on the clipboard when they come back to the tab, finds the app, and refuses a temporary token or one missing a WhatsApp permission |
| App secret | copies it from App settings → Basic → Show | checks it belongs to the app |
| Number | ticks the number(s); picks a 6-digit PIN if Meta hasn't registered the number | lists every number the token reaches, registers it, subscribes the app to the WhatsApp account, sets up sales tracking, saves a channel per number |
| Webhook | pastes the Callback URL and Verify token shown (copy buttons) into **WhatsApp → Configuration**, subscribes to **messages**, and switches the app to **Live** (needs a privacy policy URL under App settings → Basic) | ticks the step itself the moment Meta verifies the address |
| Test message | sends a WhatsApp message to the number from their own phone | ticks it when the message arrives |

Meta only allows the webhook to be set in the app's own dashboard, which
is why that one step is by hand. A half-finished wizard is saved, so the
call can pause and pick up again. **Connect another number** later reuses
the saved token.

Then choose which product(s) each number sells, on each product's Sales
settings page.

## 10. After the call

- **Business verification**: Meta Business Settings → Security Centre →
  Start verification. It takes a few days and lifts the limit on how many
  new people the number can message a day (250 before, more after). Start
  it on the call.
- **Ads**: when the business runs Click-to-WhatsApp ads, the conversion
  location must be *Messaging apps → WhatsApp*; details in
  [META_CONVERSIONS_SETUP.md](META_CONVERSIONS_SETUP.md).
- **The follow-up template** usually gets Meta's decision within a day.
  Antflow shows the status in Settings.

## When something goes wrong

| What you see | Usually means |
|---|---|
| "Object does not exist… missing permissions" (error 33) | the system user doesn't have the WhatsApp account assigned, or the token lacks `business_management` |
| Webhook won't verify | the verify token was pasted with a space, or the app's callback URL is wrong |
| Customer messages don't arrive | not subscribed to the **messages** field, or the app is still in Development |
| Can't add the number | it's still registered on WhatsApp or the WhatsApp Business app |
