# Running v2 on this computer (the free test setup)

Decided 2026-09-30: v2 is built and tested on this computer, not on a
second Railway account. A Railway staging environment on the existing
account is used only for the few days of rehearsing the VitalFix move.
See [V2_BUILD_PLAN.md](V2_BUILD_PLAN.md).

## What's already here

| Piece | State |
|---|---|
| Postgres | Docker, `docker-compose.yml`, port **55432** (5432 belongs to a native Postgres on this machine) |
| Database schema | up to date with `main` as of 2026-09-30 |
| Tunnel | `cloudflared` installed |
| Node | 20 |
| `.env` | points `DATABASE_URL` at the local Postgres. Its WhatsApp token is dead (Meta refuses it for its number), so nothing local can message real customers |

**No production data on this computer.** The local database gets made-up
data from `scripts/seed-dev.ts`: a demo business with two ebooks and six
customers, one at each point of the sales flow (new lead, waiting to pay,
receipt sent, sale completed, being followed up, waiting for a person).
Their phone numbers start 2340000, which no network issues. The script
refuses to run against any database that isn't on this computer. Log in
with `admin@antflow.test` / `antflow-dev`. Real data is only ever
copied inside Railway, with names and numbers scrambled, for the move
rehearsal. (Exception, owner's decision 2026-10-04: the switch-over
rehearsal ran here on an unscrambled copy, in a throwaway container that
was deleted afterwards. See V2_BUILD_PLAN.md, "Switch-over rehearsal".)

## Starting a session

```
docker compose up -d                 # Postgres (start Docker Desktop first)
npx prisma migrate deploy            # bring the schema up to date
npm run seed:dev                     # made-up demo business, once (--reset to rebuild)
npm run v2:backfill                  # fill the v2 tables from the v1 data (safe to repeat)
npm run dev                          # the app, http://localhost:3000
npm run worker                       # follow-ups, in a second terminal
cloudflared tunnel --url http://localhost:3000   # a third terminal
```

The tunnel prints a public address like
`https://something-random.trycloudflare.com`. It changes every time the
tunnel restarts, so the test Meta App's webhook has to be pointed at the
new one each session (Meta for Developers → the test app → WhatsApp →
Configuration → Callback URL). A fixed address needs a domain, which we
don't have yet.

## The test Meta App (done once, by the owner, in Meta for Developers)

This is a separate app used only for testing, with Meta's free test
number. The test number can only message up to five phone numbers you add
yourself, so it can't reach customers.

1. [developers.facebook.com](https://developers.facebook.com) → My Apps →
   **Create App** → use case **Connect with customers through WhatsApp**.
   Name it `Antflow Test`.
2. Choose a business portfolio. A separate one called `Antflow Test` keeps
   it apart from VitalFix's.
3. In the app: **WhatsApp → API Setup**. Meta shows a test phone number and
   a temporary access token (valid 24 hours). Under **To**, add your own
   WhatsApp number as a recipient and confirm the code Meta sends.
4. Note these down (don't paste them into chat):
   - Phone number ID and WhatsApp Business Account ID (API Setup page)
   - App ID and App Secret (App settings → Basic)
   - the temporary access token
5. Put them in the local `.env`, replacing the old WhatsApp lines:
   ```
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_APP_SECRET=...
   NEXT_PUBLIC_META_APP_ID=...
   META_WHATSAPP_BUSINESS_ACCOUNT_ID=...
   ```
6. **Give the demo business its own webhook address** (the v2 way, one
   per business). Add an encryption key for stored secrets to `.env`,
   once, and never change it afterwards:
   ```
   CREDENTIAL_ENCRYPTION_KEY=<output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```
   Then copy the test app's details from `.env` into the demo business:
   ```
   npm run v2:backfill -- --env-credentials-for <demo business id>
   ```
   The id is printed by `npm run v2:backfill -- --dry-run`. The script
   prints the address, `/api/whatsapp/<key>`.
7. **Webhook:** WhatsApp → Configuration → Edit. Callback URL is the
   tunnel address plus that `/api/whatsapp/<key>`; the verify token is the
   value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env`. Then subscribe to
   the **messages** field. (Plain `/api/whatsapp` also still works: that
   is v1's shared address.)

The temporary token expires daily. Regenerating it on the API Setup page
is fine for testing; a permanent system-user token is only needed for a
real business.

## Testing the connection wizard without Meta

`scripts/fake-meta.mjs` answers the calls the WhatsApp connection wizard
makes, so the whole wizard can be clicked through locally:

```
node scripts/fake-meta.mjs                       # a stand-in Meta on :4555
META_GRAPH_BASE_URL=http://localhost:4555 npm run dev
```

`.env` needs a `CREDENTIAL_ENCRYPTION_KEY` (see step 6 above). The script's
header lists the token and secret it accepts. The webhook step can't
complete against the stand-in, because nothing calls the webhook; do it by
hand with `curl` against the address the wizard shows, or with the real
test Meta App through the tunnel.
