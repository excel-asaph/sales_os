# Meta Conversions API setup — runbook

What to do, in order, whenever a WhatsApp number needs to report sales back to
Meta's ad algorithm (`src/lib/meta-conversions.ts`). Written after diagnosing a
real failure (2026-08-22): 46% of verified sales on a number silently never
reported, because the env vars pointed at a stale WABA/dataset pair from
before this business's numbers were reorganized. This doc exists so that
diagnosis never has to happen twice.

## What this actually does

When a sale gets verified, `reportPurchaseConversion` sends a `Purchase`
event to Meta's Conversions API, tagged with the conversation's `ctwa_clid`
(only present if the conversation started from a Click-to-WhatsApp ad — an
organic conversation has nothing to report). This is what lets Meta's ad
algorithm learn "this ad conversation led to a real sale," not just "someone
opened a chat." Without it, ad spend optimizes blind.

## The one thing that actually breaks this: datasets are per-WABA, not per-business

Meta's Conversions API for Business Messaging assigns **one dataset per
WhatsApp Business Account**, not one dataset that automatically covers every
number/WABA on a Business Manager. This codebase has exactly one
`META_CONVERSIONS_DATASET_ID` and one `META_WHATSAPP_BUSINESS_ACCOUNT_ID` env
var, used on every report regardless of which number the sale came from —
**deliberate**, scoped to whichever single number is actually running ads
right now (see "Scope" below), not a bug to fix by making it dynamic unless
that stops being true.

If those two env vars ever point at a WABA/dataset that doesn't match the
number actually generating the ad-attributed sale, Meta rejects the report.
The failure is silent to the customer and to the AI — it only shows up as
`Order.metaConversionReportReason = "send_failed"`, logged with the real
Meta error body via `console.error` but not persisted to the database. Check
Railway deploy logs for "Meta conversion report failed" to see the actual
rejection reason if this happens again.

## Setup checklist — do this whenever ad spend moves to a different number

1. **Get the new number's WABA ID.** WhatsApp Manager → the number → shown
   alongside "WhatsApp Business Account ID."

2. **Create/retrieve that WABA's dataset.** This call is idempotent — if a
   dataset already exists for the WABA, it returns the existing ID instead of
   creating a duplicate, so it's always safe to run:
   ```bash
   curl -X POST "https://graph.facebook.com/v21.0/{WABA_ID}/dataset?access_token={TOKEN}"
   ```
   Use a token with `whatsapp_business_management` + `business_management`
   permissions (see "Common failure" below if this call itself fails).

3. **Set both Railway env vars** (`sales_os` service → Variables) to match:
   - `META_WHATSAPP_BUSINESS_ACCOUNT_ID` = the WABA ID from step 1
   - `META_CONVERSIONS_DATASET_ID` = the dataset ID returned in step 2

4. **If the ad account that will actually use this data lives in a
   *different* Business Manager than the one that owns the dataset**
   (true for this business — the ad account is on a family member's Facebook
   account, not the one running this WhatsApp number) — the dataset has to be
   explicitly shared:
   - **In the Business Manager that owns the dataset:** Business Settings →
     Data Sources → Datasets → select the dataset → **Assign Partner** →
     enter the other Business Manager's Business ID.
   - **In the Business Manager that owns the ad account** (needs access to
     that account, or someone who has it): accept the partner request, then
     Business Settings → Data Sources → Datasets → the now-shared dataset →
     **Add assets** → connect the actual ad account/campaign.
   - Skip this step entirely if the dataset and the ad account are already in
     the same Business Manager.

5. **Verify**: drive one real (or test) sale through to `PAYMENT_VERIFIED` on
   an ad-attributed conversation, then check
   `Order.metaConversionReportReason` — should read `"reported"`, not
   `"send_failed"`. `"not_ad_attributed"` is fine too (means the conversation
   was organic, nothing to attribute).

## Common failure: `error_subcode: 33` ("object does not exist... or missing permissions")

Seen repeatedly this session across several different Graph API calls, not
just this one — it means the access token you're using isn't scoped to see
that specific WABA, not that the WABA is broken. Two causes, in order of
likelihood:
- The token was generated (e.g. via Graph API Explorer) with only *some*
  WhatsApp accounts checked in the asset-selection screen — go back through
  that flow and make sure the WABA in question is actually selected.
- The System User whose token you're using doesn't have that WABA assigned
  as an asset in Business Settings, or lacks `business_management` scope
  (messaging-only permissions aren't enough for the Dataset API).

## Scope — single number, deliberately

This whole setup assumes **one number is running ads at a time**. If this
business ever advertises on two numbers simultaneously, the single global env
var pair would need to become per-number (likely: store dataset ID alongside
`Business.whatsappPhoneNumberId`/`additionalWhatsappPhoneNumberIds`, or a
small lookup table), and `reportPurchaseConversion` would need to pick the
right one per conversation instead of always reading the same two env vars.
Not needed today — revisit only when a second number actually starts
carrying ad spend.
