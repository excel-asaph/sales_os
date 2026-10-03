# v2 website: antflow

Part of [V2_REVAMP.md](V2_REVAMP.md). Proposal, 2026-09-30.

## Who it's for, and its one job

Nigerian sellers of ebooks and digital products who run WhatsApp ads and
answer every DM by hand: replying at midnight, checking bank-transfer
receipts, sending the file, chasing people who went quiet. The site's job
is to get them to **talk to us**, because at ₦300,000 a month almost
nobody buys without a conversation first.

## Use Antflow to sell Antflow

The main button on the site opens WhatsApp, where Antflow's own AI
answers, qualifies the business, handles objections and books the setup
call. Every visitor sees the product working before paying for it. It's
the strongest demo we can give, and it runs on the same system.

## Pages

| Page | What it does |
|---|---|
| Home | the promise, the problem, how it works, proof, pricing summary, questions, WhatsApp button |
| How it works | the full flow with real screenshots: a conversation, a receipt checked, a file delivered, a follow-up |
| Pricing | ₦300,000 a month and exactly what's included, especially the done-for-you WhatsApp setup |
| Results | VitalFix's real numbers, with the brother's permission |
| Sign in, Get started | into the app. On a subdomain (`app.`) once a domain is bought; until then on the same address, by path |
| Privacy policy, Terms | Meta requires a privacy policy URL on every Meta App, so each client's app points here too |

## The home page, top to bottom

1. **Headline:** a WhatsApp sales rep for your ebook that replies in
   seconds, checks the payment receipt, sends the book and follows up,
   day and night. Button: **Chat with Antflow on WhatsApp**.
2. **The problem**, in the reader's words: DMs you miss at night, fake and
   wrong receipts, people who say "I'll pay tomorrow" and vanish.
3. **How it works** in four steps: the ad brings them, the AI sells, the
   receipt is checked, the book is delivered. The follow-ups happen on
   their own.
4. **Proof:** real VitalFix figures (conversations handled, sales
   verified, share recovered by follow-up) from the Trends page.
5. **What you control:** take over any chat, set the sales script, pause
   follow-ups, see every conversation.
6. **Pricing:** ₦300,000 a month, setup included.
7. **Questions:** Is my number safe? What does Meta charge? Can I take over
   a chat? What if the AI gets something wrong? What if a customer sends a
   fake receipt?
8. **Last call to action:** the WhatsApp button again.

## Rules for the copy

- **Only real numbers.** No invented results, no made-up testimonials, no
  income promises. The same rule as the ebooks, and Meta's ad policies
  apply to anything we later advertise.
- **Don't claim to be a WhatsApp partner.** Say "works with WhatsApp";
  we aren't a Meta Tech Provider or Business Partner.
- The writing follows [BOOK_VOICE.md](BOOK_VOICE.md): plain Nigerian
  English, no hype.

## How it's built

A `(marketing)` section of the same Next.js app: static, fast pages, no
login. **No domain is owned yet (decided),** so the site takes over `/`
on the current Railway address and the app keeps its current paths
(`/home`, `/dashboard` and so on). When a domain is bought, the app moves
to `app.` on it. One deployment, one codebase. Measurement: the Meta Pixel on the WhatsApp button, so the site
itself can be advertised later.

## Decided

- **Brand (2026-10-04): direction B "Colony"**, ink #121614 and coral
  #FF6A4D on chalk #F5F6F4, Sora headings and Manrope text, and its logo:
  a chat bubble whose "typing…" dots are an ant's body. Headline and
  subheadline from direction A: "A WhatsApp sales rep for your ebook,
  working day and night." The three directions are on the canvas
  "Antflow brand directions" (claude.ai artifact).
- No domain yet; use the current address (above).
- VitalFix's real numbers can go on the Results page.
- We design Antflow's brand ourselves and iterate with the owner.

## Built (2026-10-04)

`src/app/(marketing)`: Home, How it works, Pricing, Results, and
Antflow's own privacy policy and terms at `/legal/privacy` and
`/legal/terms`. VitalFix's own policy stays at `/privacy`, where its Meta
App points. `/` is now the home page instead of a redirect into the app.

Still to fill in (`src/app/(marketing)/site-config.ts` and Railway
variables):
- `NEXT_PUBLIC_ANTFLOW_WHATSAPP`: Antflow's own number, answered by
  Antflow's AI. Until it's set the main button goes to the Pricing page.
- `NEXT_PUBLIC_ANTFLOW_EMAIL`: the contact address in the footer and legal pages.
- `RESULTS`: VitalFix's real figures from `scripts/site-stats.ts` run
  against production. Until then the results section and page don't show.
- The privacy policy and terms should be read by a lawyer, and name the
  registered business once there is one.
- The Meta Pixel (`NEXT_PUBLIC_META_PIXEL_ID`) is configured but not yet
  wired to the button.
