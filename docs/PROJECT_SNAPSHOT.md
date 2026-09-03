# Antflow Sales OS — Full Project Documentation

*Compiled 2026-08-22. This is a snapshot for handing to another AI assistant (Gemini/ChatGPT) as project context — it covers what the product is, how it's built, what's live in production, and what's been done recently. It is not a substitute for the source of truth: the repo itself (`docs/PRD.md`, `docs/ARCHITECTURE.md`, `prisma/schema.prisma`, `docs/FUTURE.md`, `docs/META_CONVERSIONS_SETUP.md`).*

---

## 1. What this product is

**Antflow Sales OS** is an AI-powered Sales Operating System — not a chatbot, not a CRM, not a workflow builder. It gives a WhatsApp-first business an AI sales employee that runs the entire sales conversation end to end: greet the customer, recommend a product, handle objections, send payment details, verify a payment receipt, deliver the digital product, and follow up automatically if the customer goes quiet.

**Target businesses**: WhatsApp-first sellers of digital products — ebook sellers, course creators, coaches/consultants, info-product businesses — concentrated in Africa (Nigeria specifically, for the current deployment), where WhatsApp is the storefront, not just a support channel.

**Core philosophy** (from the Master PRD, `docs/PRD.md`):
1. **AI owns outcomes, not conversations** — success is a completed sale or a scheduled follow-up, not messages exchanged.
2. **Every conversation is a workflow** — a customer has a current stage, a current objective, and a next action; the AI always knows all three.
3. **The AI reasons, the platform executes** — the LLM never directly mutates the database or declares payment confirmed. It requests a tool call; platform code validates and executes it. This is the single most load-bearing design decision in the whole system.
4. **Business rules are data, not code** — delivery-before-payment, follow-up cadence, escalation thresholds, bank accounts, greeting copy — all configurable per business, never hardcoded.
5. **Memory creates better relationships** — customer profile, conversation state, objections, and outstanding tasks all persist as structured data, not just a raw transcript.
6. **Humans handle exceptions** — low-confidence payment verification, refund requests, anger, policy exceptions escalate to a human agent with full context, not a cold handoff.

**Current real-world deployment** *(updated 2026-09-03)*: one live business, **VitalFix**, selling one digital product (the **"DIABETES FIX" ebook**, ₦10,000) over WhatsApp, driven by Facebook/Instagram Click-to-WhatsApp ads. Real production system with real customers and real money, not a demo.

> **This replaced Truefix Wellness**, whose WhatsApp Business Account was permanently disabled by Meta on 2026-08-24 for a Business Terms of Service breach — root-caused to health-claim language in the ad creatives (`docs/AD_COPY_COMPLIANCE_AUDIT.md`). VitalFix is a separate business on a clean Meta Business Portfolio, with the corrected playbook and ad copy carried over. Both `Business` rows still exist in the database; Truefix Wellness is inactive. Anything describing Truefix Wellness as the live deployment is out of date.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Language/runtime | TypeScript on Node.js (Node 20, migration to 22 pending — see §7) |
| Framework | **Next.js 16** (App Router, Turbopack) — one deployable serves the WhatsApp webhook, internal API routes, and the dashboard |
| Database | **PostgreSQL** |
| ORM | **Prisma 7** — note: Prisma 7 changed connection handling; `schema.prisma` no longer holds a `url`, connection config lives in `prisma.config.ts`, and `PrismaClient` is instantiated via `@prisma/adapter-pg`, not a bare constructor |
| Job queue | **pg-boss** (Postgres-native) — handles follow-up scheduling, no separate Redis/broker needed |
| LLM | **Claude (Anthropic API)**, via `@anthropic-ai/sdk` — used for conversation reasoning (tool use / Action Contract), receipt image verification (vision), and on-demand Trends-page insights |
| Object storage | **Cloudflare R2** (S3-compatible, via `@aws-sdk/client-s3`) — receipt images. Currently served via R2's `r2.dev` public dev URL (rate-limited, flagged for a real custom domain later) |
| WhatsApp integration | **WhatsApp Cloud API** (Meta Graph API, direct — no BSP middleman) |
| Hosting | **Railway** — one web service (`prisma migrate deploy && next start` on boot) + one worker process (`tsx watch src/worker/followup-worker.ts`) + managed Postgres |
| UI | React 19, Tailwind CSS 4, shadcn-derived components (`@base-ui/react`), `lucide-react` icons, `sonner` for toasts |

**Deliberately not used** (MVP scope decision, `docs/ARCHITECTURE.md` §3): microservices, Kafka/RabbitMQ, Redis, Kubernetes, a separate OCR vendor. Two processes plus a database, not nine services.

⚠️ **This repo pins Next.js 16 and Prisma 7**, both of which have breaking changes since most LLM training data was written. The project's own `AGENTS.md` explicitly warns: *"This is NOT the Next.js you know... Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."* Any AI assistant working on this codebase should treat prior training knowledge of Next.js/Prisma APIs as unreliable and verify against the installed docs/source instead of assuming.

---

## 3. System architecture

```
Customer (WhatsApp)
        │
        ▼
Meta WhatsApp Cloud API
        │  (webhook POST)
        ▼
Next.js API route  ──writes──▶  events table (Postgres, append-only)
        │
        ▼
pg-boss worker picks up event
        │
        ▼
Perception (Claude: text understanding, or vision on receipt image)
        │
        ▼
Conversation Brain read/update (Postgres)
        │
        ▼
Workflow Engine (checks current stage + business rules)
        │
        ▼
AI Employee Runtime (one Claude call: system prompt = sales framework +
                      persona, tools = Action Contract, context =
                      Conversation Brain + retrieved Knowledge)
        │
        ▼
Action executor (platform code — NEVER the LLM directly) runs the tool(s):
  send message · verify receipt · deliver product · create follow-up ·
  escalate to human · update CRM
        │
        ▼
WhatsApp Cloud API (send)   +   Dashboard reads the same Postgres tables
```

The dashboard is server-rendered Next.js pages reading Postgres directly — no separate analytics service.

### The Conversation Brain (core concept)

Rather than re-reading a growing message transcript on every turn, the AI reasons over a compact structured state:
- **Customer Profile** — phone, name, language, country, returning-customer flag, lifetime purchases, tags
- **Conversation State** — current stage, current objective, confidence score
- **Facts** (`ConversationFact` table) — typed rows for `INTENT`, `GOAL`, `OBJECTION`, `ENTITY`, `TASK`, each with its own confidence and a `resolved` boolean, so "which objections are still open" is a real SQL query, not a JSON scan
- **Knowledge** — product catalog, FAQ entries, payment accounts, and a per-business "playbook" (proven scripts/copy the business wants mirrored, not freehanded)

### The Action Contract

The AI's only way to affect the world is by requesting one of these tools; platform code validates and executes every one:

| Tool | What it does | Who executes it |
|---|---|---|
| `send_message` | WhatsApp text reply | Platform |
| `search_products` | Look up catalog | Platform |
| `send_product` | Deliver the digital file | Platform — gated by `deliverBeforePayment` config or a verified order |
| `send_payment_details` | Return configured bank account(s) | Platform |
| `request_payment_verification` | Ask the platform to verify a receipt image | Platform runs Claude vision extraction + rule comparison — **the AI never itself declares payment confirmed** |
| `update_stage` | Move the conversation's workflow state | Platform, validates the transition |
| `create_followup` | Schedule a follow-up | Platform, writes to `Followup` via pg-boss |
| `escalate_to_human` | Hand off, pause AI on that thread | Platform |
| `tag_customer` | Apply a CRM tag | Platform |
| `generate_summary` | Produce a handoff summary | Always stored, never just spoken |

This table is the literal enforcement of Philosophy 3 above — every row's executor is "Platform," never "the model directly."

### Event sourcing

Every meaningful thing (`MESSAGE_RECEIVED`, `PAYMENT_VERIFIED`, `PRODUCT_DELIVERED`, `FOLLOWUP_SCHEDULED`, `FOLLOWUP_CANCELLED`, `HUMAN_ASSIGNED`, `STAGE_CHANGED`, etc.) is written to an append-only `Event` table first. The Conversation Brain and workflow state in Postgres are, in principle, a materialized view rebuildable by replaying events in order. This is what makes every automated action traceable and every conversation recoverable.

---

## 4. Data model (Prisma schema highlights)

Key tables (`prisma/schema.prisma`):

- **`Business`** — one row per business; `whatsappPhoneNumberId` (primary number) + `additionalWhatsappPhoneNumberIds` (array — a business can run multiple WhatsApp numbers as informal "branches") + `whatsappPhoneNumberLabels` (JSON, human-readable labels for the dashboard's number switcher)
- **`BusinessConfig`** — the Business Rules Engine: `deliverBeforePayment`, `maxFollowups` (1–5, clamped), `escalationConfidenceThreshold`, `aiHandlesReceiptIssues`, **`followupsEnabled`** (business-wide follow-up kill switch, added this session), `businessHours` (JSON, schema exists but not yet enforced), `greetingTemplate`, `playbook` (JSON — the business's own proven sales scripts)
- **`FaqEntry`** — curated Q&A pairs injected into the system prompt (chosen over full ebook-content search for safety/cost on health-adjacent claims; deferred to phase 2, see §7)
- **`PaymentAccount`**, **`Product`** — payment/product knowledge
- **`Customer`** — profile, unique per `(businessId, phoneNumber)`, `tags` (JSON)
- **`Conversation`** — `currentStage` (an 18-value enum: `NEW_LEAD` → ... → `SALE_COMPLETED`, plus `FOLLOWUP_DAY_1/3/7`, `LOST_LEAD`, `HUMAN_REVIEW_REQUIRED`, `HUMAN_ASSIGNED`, `RESOLVED`), `currentObjective`, `confidence`, `whatsappPhoneNumberId` (which number this thread lives on — sticky for the conversation's life), `referral` (JSON — Meta's ad/post attribution object, captured from the first inbound message if present)
- **`Message`** — direction/sender/type, `whatsappMessageId` (dedupes webhook redeliveries)
- **`ConversationFact`** — the flexible Conversation Brain layer: `kind` (`INTENT`/`GOAL`/`OBJECTION`/`ENTITY`/`TASK`), `payload` (JSON), `confidence`, `resolved`
- **`Order`** — `expectedAmount`, `receiptImageUrl`, `extractedAmount`/`extractedBank` (from Claude vision), `verificationConfidence`, `status` (`PENDING`/`VERIFIED`/`ESCALATED`/`REJECTED`), `verifiedAt`, plus **`metaConversionReportedAt`/`metaConversionReportReason`** (tracks whether the sale was successfully reported to Meta's Conversions API — `"reported"`, `"not_ad_attributed"`, `"send_failed"`, `"not_configured"`, or `null` if never attempted)
- **`Followup`** — `step`, `message` (the planned wording, used as fallback template), `reason` (`GENERAL` or `AWAITING_PAYMENT_EVIDENCE` — the latter escalates to a human on exhaustion instead of auto-tagging "Uninterested"), `scheduledFor`, `sent`, `cancelled`
- **`HumanAgent`** — doubles as the dashboard login identity; `isAdmin` gates `/settings` and `/manage`
- **`Event`** — append-only audit log, described above

---

## 5. What's built and live (feature inventory)

### Core AI runtime
- Full inbound WhatsApp webhook → event → perception → Conversation Brain → workflow → AI runtime → action executor pipeline, working end to end in production.
- Receipt image verification via Claude vision (extract amount/bank, compare against expected, confidence-gated).
- Follow-up sequencing (`src/lib/followup-sequence.ts`) — a fixed multi-step cadence, configurable length (`maxFollowups`, 1–5) per business, re-enters the AI runtime to generate natural wording (falls back to a Meta-approved template if outside the 24-hour customer-service window).
- Human escalation with full context handoff (summary, stage, recent messages) — no re-explaining for the customer.
- Multi-number support: one business can run several WhatsApp numbers (`Business.whatsappPhoneNumberId` + `additionalWhatsappPhoneNumberIds`), with a dashboard-wide number filter cookie (`src/lib/number-filter.ts`). Currently informal — not a first-class `Branch` model yet (see §7).

### Dashboard (`src/app/...`)
- **Home** (`/home`) — revenue chart, top-line KPIs.
- **Dashboard / Monitor** (`/dashboard`) — active conversations, conversations awaiting human review sorted to top.
- **Conversation Review** (`/dashboard/[id]`) — message history, Conversation Brain facts, orders, follow-ups; human can reply directly (claims the conversation) or resolve it.
- **Customers** (`/customers`) — CRM list view: tags, follow-up status/countdown, spend, conversation count.
- **Trends** (`/trends`) — **built this session**, see below.
- **Settings** (`/settings`, admin-only) — business rules (delivery policy, follow-up cadence, escalation threshold, receipt-issue handling), and the new business-wide **follow-up pause toggle**.
- **Manage** (`/manage`, admin-only) — CRUD on products and payment accounts.
- **Auth** — signed HMAC cookie (`AUTH_SECRET`), no session table; verified in `src/proxy.ts` (this Next.js version's renamed `middleware.ts`) and independently re-checked inside every Server Action (`requireSession`/`requireAdminSession`). No public sign-up — first admin created via `npm run create-admin`.

### Trends page (shipped this session)
A dedicated analytics page answering exactly what earlier ad-hoc SQL audits were answering by hand:
- **Funnel** — conversation counts by pipeline stage (horizontal bar chart), with exception counts (`LOST_LEAD`/`HUMAN_REVIEW_REQUIRED`/etc.) shown separately.
- **Follow-up step performance** — reply rate per follow-up step, out of everything actually sent.
- **Conversion attribution** — Organic vs. Recovered-by-follow-up vs. Delivered-but-unpaid.
- **Number health** — live pull from Meta Graph API (`quality_rating`, `whatsapp_business_manager_messaging_limit`) per WhatsApp number — an honest read from Meta rather than an invented risk score.
- **AI-generated insights** — on-demand button, one plain Claude call over the already-computed numbers, not cached/auto-run (cheap enough at Sonnet pricing that click-to-generate beats building a cache).
- New files: `src/lib/trends.ts`, `src/lib/whatsapp-number-health.ts`, `src/components/category-bar-chart.tsx`, `src/components/followup-step-chart.tsx`, `src/components/trends-insights-panel.tsx`, `src/app/trends/{page,actions}.ts`.

### Follow-up pause toggle (shipped this session)
- `BusinessConfig.followupsEnabled` — a business-wide kill switch in Settings.
- Flipping to "Paused" cancels every currently-pending follow-up in one pass (`cancelAllPendingFollowupsForBusiness`) and logs a `FOLLOWUP_CANCELLED` event per affected conversation with `reason: "business_paused"`.
- Enforced at two points (both required): the worker (`followup-worker.ts`, before sending) and `createFollowup` (`actions.ts`, before scheduling a new sequence) — so nothing accumulates while paused that would need cleanup on resume.
- Deliberately no "catch up on resume" — pending follow-ups are cancelled outright, not deferred, because a stale nudge arriving days late reads worse than none at all.

### Meta Conversions API reporting
- Verified sales on an ad-attributed conversation (one that carries `ctwa_clid` from a Click-to-WhatsApp ad) get reported to Meta as a `Purchase` event, so Meta's ad algorithm learns which ad conversations actually convert.
- **Full runbook documented**: `docs/META_CONVERSIONS_SETUP.md` — written after this session diagnosed a real 46% silent-failure rate caused by stale `META_WHATSAPP_BUSINESS_ACCOUNT_ID`/`META_CONVERSIONS_DATASET_ID` env vars (datasets are per-WABA, not automatically shared across a Business Manager's numbers). The doc covers the full setup checklist, the cross-Business-Manager dataset-sharing steps needed because the ad account belongs to a different Business Manager (the user's brother's account) than the one running WhatsApp, and two Ads Manager gotchas (Conversion location must be "Messaging Apps → WhatsApp" not "Website"; the number picker pulls from the Facebook Page's WhatsApp connection, not the WABA registration).

---

## 6. Business/production context

- **Business**: Truefix Wellness. **Product**: "DIABETES FIX" ebook, ₦10,000, digital delivery over WhatsApp.
- **Numbers**: originally ran on `+234 810 573 4894`; ad spend has since moved to a new primary number, `+234 706 164 5689`. The old number was deprioritized this session — its ~190 pending follow-ups were bulk-cancelled once its outstanding orders were confirmed settled, and it's understood to no longer be receiving ad spend (previously also flagged as possibly banned on Meta).
- **Ad account**: run by the user's brother, on a **separate Meta Business Manager** from the one that owns the WhatsApp number/dataset — this is why the Conversions API dataset had to be explicitly partner-shared (see the runbook).
- **Real bug fixed this session**: a stale "awaiting payment" `ConversationFact` was never marked `resolved` on payment verification, causing the AI to keep messaging customers who had already paid. Root-caused via full event-log/fact-table forensics on the old number's conversation history; fixed in `applyOrderVerifiedEffects` (`src/lib/actions.ts`), which now resolves outstanding `TASK` facts on verification.
- **Data hygiene**: production database periodically gets test/fake customer records from live testing (e.g. "Excel Asaph" on `2348143469421`) — these get manually deleted via a scoped least-privilege `claude_readonly` Postgres role (incrementally granted SELECT → UPDATE/INSERT → DELETE, scoped to the `customers` table only for DELETE) as part of ongoing session hygiene, not a recurring automated job.
- **Compliance**: a full WhatsApp Business Messaging policy audit was run earlier this session; confirmed (after explicit re-verification against Meta's official Advertising Standards and WhatsApp policy-enforcement docs, not just an initial guess) that ad-copy policy violations do not have documented cross-surface enforcement onto the WhatsApp account itself — the two are separate policy domains. Ad copy still needed a rewrite by the user regardless (health-outcome claims are risky under Meta's ad policies specifically).
- **Business Verification (Meta)**: not yet started.

---

## 7. Known gaps, deferred work, and open items

Tracked in `docs/FUTURE.md` (the project's living backlog — read once per feature area before re-proposing something, since a lot of "obvious" ideas have already been considered and deliberately deferred with reasons). Highlights:

**AI runtime**
- Quiet-hours enforcement — `BusinessConfig.businessHours` exists in schema but nothing reads it yet; follow-ups can fire at 3am.
- Ebook full-text search (phase 2 of FAQ) — deferred until the curated FAQ list proves insufficient.
- A cold pitch that goes fully unanswered still auto-tags "Uninterested"/`LOST_LEAD` with no human glance — only the "customer claimed to pay but never sent evidence" case escalates today. Worth reconsidering if it turns out to be writing off real leads.
- Follow-up counter fully resets on any customer reply (even "ok") — deliberate, not a bug, but could in principle let a mildly-responsive-but-never-committing customer get followed up indefinitely. Revisit only if this shows up in real behavior.
- Per-conversation follow-up pause (today only business-wide) — needs `Conversation.followupsPaused`, enforced at the same two points as the business-wide flag, plus a button on the Review page.
- Follow-up fallback template can't reference dynamic content (e.g. a specific recorded blocker) outside the 24-hour window — needs both a new Meta-approved template with a variable placeholder and passing `components` through `sendWhatsAppTemplate`.

**Dashboard/CRM**
- No kanban/pipeline board view yet (all conversations grouped by stage).
- No stage-based filter rail on Conversations.
- No internal team notes (distinct from AI-extracted facts).
- Key events (stage changes, escalations) aren't surfaced inline in the Review page timeline yet.
- No connection-health indicator for the webhook/token (this already silently broke once — caught only when a real customer complained).
- Ad performance/ROAS in Trends — deliberately not built yet; would need Marketing API `ads_read` scope, deliberately not granted to the existing WhatsApp system user (least-privilege — that token is messaging + Conversions API only).
- No in-app spend/usage visibility tile — Anthropic has no API for remaining credit balance (confirmed: a public feature request for exactly this was closed as not planned); the Usage & Cost Admin API can report spend-to-date but not a "remaining" percentage, so any ring-meter UI would need a manually-entered budget figure, which was deferred without a decision.
- No dark mode toggle (tokens exist, no UI — build if asked).

**App shell**
- Skeleton loading states were built and then reverted — `AppShell` isn't a persistent layout (it's called inline per page and re-runs its own queries each navigation), so skeletons shimmered inconsistently with reference platforms. Needs a real `(protected)` route-group layout refactor first.

**Multi-branch / multi-number**
- The two-numbers-as-two-branches setup is currently UI-only scoping (a cookie), not real server-side access control — any logged-in agent can switch to either number. Fine today (small trusted team, ~0 customers in production at time of writing). **Trigger to fix**: the moment a login needs to be restricted to only one branch, build a real `Branch` model + `Conversation.branchId` FK + server-enforced `HumanAgent`→branch relationship before that onboarding.

**Infrastructure**
- WhatsApp access token is set to never-expire (deliberate — no expiry monitoring exists yet, so a 60-day token would silently take down the whole integration). Switch to 60-day once expiry monitoring/alerting exists.
- R2 currently on the rate-limited `r2.dev` dev URL — move to a real custom domain if volume grows.
- A GitHub PAT is embedded in the local git remote URL (never leaked/committed, but flagged for cleanup via `gh auth`/Windows Credential Manager).
- Node 20 → 22 — AWS SDK v3 will require Node ≥22 for versions published after early January 2027; Railway is currently on 20.
- Meta Conversions API setup currently assumes **one number runs ads at a time** (a single global env-var pair for WABA/dataset). If a second number ever carries ad spend simultaneously, this needs to become per-number.

**Not yet started**
- Meta Business Verification.
- A handful of "delivered but never paid" conversations from the original data audit still need manual human review.
- Confirming a WhatsApp message template is specifically approved for the new primary number's WABA (all prior evidence of template approval was from the old WABA) — flagged as unverified.

---

## 8. Recent session history (chronological, most recent work)

1. **WhatsApp Business Platform setup** for a new Meta account — webhook, App Secret, phone number ID troubleshooting.
2. **Full compliance audit** against WhatsApp Business Messaging policy.
3. **Deep data audit** of the old number's conversion/follow-up performance — surfaced and fixed the stale-fact bug (AI messaging already-paid customers).
4. **Shipped**: business-wide follow-up pause toggle (Settings) + cancel-all-pending action.
5. **Shipped**: Trends analytics page (funnel, follow-up performance, conversion attribution, number health via live Meta API call, on-demand AI insights).
6. **Deprioritized the old number** as ad spend moved to the new primary number — bulk-cancelled ~190 pending follow-ups.
7. **Diagnosed and fixed** the Meta Conversions API silent-failure bug (wrong WABA/dataset env vars) and **wrote the reusable runbook** (`docs/META_CONVERSIONS_SETUP.md`) specifically so this diagnosis never has to happen from scratch again.
8. **Helped set up the brother's ad campaign correctly** (Conversion location, dataset selection, number linking — the two Ads Manager gotchas now captured in the runbook).
9. **Verified, with explicit re-research (not just an initial guess)**, that ad-copy policy risk does not have documented cross-surface enforcement onto the WhatsApp account.
10. **Identified and deleted** a fake lead in production caused by Meta's own automated "getting started" system message landing as a `NEW_LEAD` (confirmed harmless — the AI had already correctly called `no_reply_needed`).
11. **Granted and used** scoped, incrementally-widened database access (`claude_readonly` role) for direct production data hygiene (test-record deletion) instead of the user hand-typing SQL.
12. **This document** — a full project snapshot requested by the user to hand to another AI assistant (Gemini/ChatGPT) for external context/second opinions.

---

## 9. Where to look for more detail

| Topic | File |
|---|---|
| Full product spec (14 chapters: problem, personas, workflow philosophy, Conversation Brain, module architecture, the ACSF sales framework, knowledge engine, non-negotiables, MVP scope) | `docs/PRD.md` |
| Technical architecture, DB schema rationale, Action Contract, deployment topology | `docs/ARCHITECTURE.md` |
| Live database schema | `prisma/schema.prisma` |
| Living backlog of deferred/considered-and-rejected ideas | `docs/FUTURE.md` |
| Meta Conversions API setup runbook | `docs/META_CONVERSIONS_SETUP.md` |
| Setup/run instructions | `README.md` |
| Next.js/Prisma version-drift warning for future contributors (human or AI) | `AGENTS.md` |

---

*End of snapshot. This document reflects the state of the repo and production system as of 2026-08-22 and will drift out of date — treat it as a starting point for another AI to get oriented, not as a live source of truth.*
