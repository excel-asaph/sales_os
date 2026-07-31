# Antflow Sales OS — System Architecture Document

**Version:** 1.0 (Draft)
**Status:** In Progress
**Scope:** Translates the Master PRD (`docs/PRD.md`, Chapters 7–14 in particular) into a concrete, buildable technical design for the MVP defined in PRD Chapter 13. This document does not re-argue product decisions already made in the PRD — where the two conflict, the PRD's MVP Scope and Non-Negotiables chapters win.

---

## 1. Purpose & Scope

This document answers the questions the PRD deliberately leaves open: what language, what database, what does a request actually look like end-to-end, what tables exist, and what does the AI literally call when it wants to take an action.

It targets exactly the MVP described in PRD 13.2: one business, one WhatsApp number, digital products, manual bank-transfer payment verified from a receipt image, delivered automatically, followed up on a fixed cadence, escalated to a human below a confidence threshold.

It does **not** design for multi-tenancy, multi-channel, physical goods, or a capability marketplace — those are explicitly deferred in PRD 13.4, and building for them now would violate the spirit of that chapter.

---

## 2. Guiding Constraints (from PRD Chapter 14)

Every design decision below is bound by the Non-Negotiables already agreed in the PRD. Concretely, that means:

* The LLM is never called in a way that lets it directly write to the database or send a WhatsApp message. It returns a decision (text + optional tool call); platform code executes the tool call. This is Philosophy 3 (PRD 3.3) made literal.
* Every state-changing operation is written to an append-only `events` table before (or atomically with) mutating current state — this is what makes 14.5 (logging) and 14.6 (recoverability) true by construction, not by discipline.
* Every business-specific value (bank accounts, follow-up timing, escalation threshold, greeting copy) lives in a `businesses`/`business_config` row, never in application code or a prompt template literal.
* Confidence scores are first-class columns, not something inferred after the fact — the escalation check in 14.7 has to be a real `WHERE confidence < threshold` condition somewhere, not a vibe.

---

## 3. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Language / runtime | **TypeScript on Node.js** | One language across webhook handling, background workers, and the dashboard. |
| App framework | **Next.js** (App Router) | API routes serve as the WhatsApp webhook + internal API; the same app serves the Dashboard (PRD Module 9). One deployable for the whole MVP. |
| Database | **PostgreSQL** | Relational fits the domain well (customers, conversations, orders, events all have clear relationships); JSONB columns cover the more free-form Conversation Brain fields (Ch 6) without needing a second datastore. |
| ORM | **Prisma** | Type-safe schema, migrations, good fit for a small team iterating quickly. |
| Job queue / scheduler | **pg-boss** (Postgres-native queue) | Handles follow-up scheduling (Day 1/3/7) and async event processing without adding Redis as an infra dependency — one database to operate for the whole MVP. |
| LLM | **Claude (Anthropic API)** | Tool use for the action contract (§7), native vision input for receipt reading (§7.3) — removes the need for a separate OCR service in the MVP. |
| Object storage | **S3-compatible bucket** (Cloudflare R2 or AWS S3) | Product files and receipt images (PRD 7.5, File Storage). |
| WhatsApp integration | **WhatsApp Cloud API** (direct, Meta) | No middleman vendor fee; this is the channel named explicitly in PRD 13.3. |
| Hosting | **Railway or Render** (single web service + Postgres + worker) | Zero-ops for MVP scale (one business, low volume). Migrating to more infra later doesn't require a rewrite — it requires more of the same pieces. |

**Deliberately not chosen for the MVP:** microservices, Kafka/RabbitMQ-style brokers, Redis, Kubernetes, a separate OCR vendor. PRD 13.6 explicitly says the Planning/Capability split and the Perception pipeline can be one process for V1 — the stack reflects that.

---

## 4. System Topology

```
Customer (WhatsApp)
        │
        ▼
Meta WhatsApp Cloud API
        │  (webhook POST)
        ▼
Next.js API route  ── writes ──▶  events table (Postgres)
        │
        ▼
pg-boss worker picks up event
        │
        ▼
Perception  (Claude: text understanding, or vision on receipt image)
        │
        ▼
Conversation Brain read/update (Postgres)
        │
        ▼
Workflow Engine (check current stage + business rules)
        │
        ▼
AI Employee Runtime  (single Claude call: system prompt = ACSF + persona,
                       tools = the Action Contract in §7, context = Conversation
                       Brain + retrieved Knowledge)
        │
        ▼
Action executor (platform code — NOT the LLM) runs the requested tool(s):
  send message · verify receipt · deliver product · create follow-up ·
  escalate to human · update CRM
        │
        ▼
WhatsApp Cloud API (send message / media)   +   Dashboard reads latest state
```

The same Next.js app serves the Dashboard (Monitor + Review surfaces per PRD 13.6) by querying the same Postgres tables directly — no separate analytics service for the MVP.

---

## 5. Database Schema

Only the tables needed for the MVP scope (PRD 13.3). Field lists are representative, not exhaustive — Prisma migrations will refine exact types.

```
businesses
  id, name, whatsapp_phone_number_id, timezone, created_at
  -- one row for the MVP; table exists so multi-tenant isn't a rewrite later

business_config          -- Business Rules Engine (PRD Ch 5.10, Module 6)
  id, business_id, deliver_before_payment (bool),
  max_followups (int), escalation_confidence_threshold (float),
  business_hours (jsonb), greeting_template (text)

payment_accounts         -- Payment Knowledge (PRD 11.3)
  id, business_id, bank_name, account_number, account_name, active (bool)

products                 -- Product Knowledge (PRD 11.3)
  id, business_id, name, description, price, currency,
  file_url, format, category, available (bool)

customers                -- Customer Profile (PRD 6.3)
  id, business_id, phone_number, name, preferred_language,
  country, timezone, returning_customer (bool),
  lifetime_purchases (int), customer_since, tags (jsonb)

conversations             -- Conversation State (PRD 6.3) + Workflow state (PRD 5.4)
  id, customer_id, current_stage (enum: NEW_LEAD ... SALE_COMPLETED ... LOST_LEAD),
  current_objective (text), confidence (float),
  assigned_human_id (nullable), summary (text),
  referral (jsonb, nullable) -- ad/post attribution, from the first message's
                                Meta `referral` webhook object, if present
  created_at, updated_at

messages
  id, conversation_id, direction (in/out), sender (customer/ai/human),
  type (text/image/document/voice), content, media_url, created_at

conversation_facts        -- Intent / Goals / Objections / Extracted Entities (PRD 6.3)
  id, conversation_id, kind (enum: intent/goal/objection/entity/task),
  payload (jsonb), confidence (float), resolved (bool), created_at

orders                    -- Payment Collection + Receipt Verification (PRD 13.3)
  id, conversation_id, product_id, expected_amount,
  receipt_image_url, extracted_amount, extracted_bank,
  verification_confidence (float), status (enum: pending/verified/escalated/rejected),
  verified_at

followups                 -- Follow-Up Engine (PRD 8.6)
  id, conversation_id, step (1/2/3), scheduled_for, sent (bool), cancelled (bool)

human_agents               -- Human Handoff (PRD 5.9, 8.7)
  id, business_id, name, whatsapp_or_dashboard_contact, active (bool)

events                    -- Event Engine (PRD Module 2) — append-only, source of truth
  id, conversation_id, type, payload (jsonb), created_at
```

`conversations.current_stage` is the Workflow Engine's state (PRD 5.4). `conversation_facts` is the flexible part of the Conversation Brain — objections, goals, extracted entities, and outstanding tasks all live here as typed rows rather than one big JSON blob, so querying "which objections are unresolved" stays a real SQL query, not a JSON scan.

---

## 6. Event Model

Every meaningful thing that happens — an inbound WhatsApp message, an AI decision, a verified payment, a scheduled follow-up firing — is written to `events` first. This is the literal implementation of PRD 14.5 (every action logged and attributable) and 14.6 (every conversation recoverable): the Conversation Brain and Workflow state in Postgres are a materialized view that can, in principle, be rebuilt by replaying `events` in order.

Event types for the MVP map directly onto PRD 5.5:

`MESSAGE_RECEIVED`, `RECEIPT_IMAGE_RECEIVED`, `AI_RESPONSE_GENERATED`, `PAYMENT_VERIFIED`, `PAYMENT_ESCALATED`, `PRODUCT_DELIVERED`, `FOLLOWUP_SCHEDULED`, `FOLLOWUP_SENT`, `FOLLOWUP_CANCELLED`, `HUMAN_ASSIGNED`, `HUMAN_REPLY_SENT`, `HUMAN_RESOLVED`, `STAGE_CHANGED`.

---

## 7. AI Employee Runtime (Claude Integration)

### 7.1 Call shape

One Claude call per customer turn, using tool use:

* **System prompt** — the ACSF (PRD Chapter 8) distilled into instructions, plus the business's tone/persona configuration.
* **Context provided** — the Conversation Brain (current stage, objective, confidence, unresolved objections, extracted entities, outstanding tasks) and any Knowledge Engine facts retrieved for this turn (PRD 11.6) — not the full message history. This keeps the call cheap and keeps the AI reasoning over structured state (PRD 6.6), not re-reading a growing transcript.
* **Tools available** — the Action Contract below. The model's response is either a customer-facing message, a tool call, or both.

### 7.2 Action Contract (maps to PRD 5.6)

| Tool | Purpose | Executed by |
|---|---|---|
| `send_message(text)` | Send a WhatsApp text reply | Platform, via WhatsApp Cloud API |
| `search_products(query)` | Look up matching products from the catalog | Platform, reads `products` table |
| `send_product(product_id)` | Deliver the digital file/link | Platform — only runs if business rules (deliver-before-payment) or a verified order allow it |
| `send_payment_details()` | Return the active configured payment account(s) | Platform, reads `payment_accounts` |
| `request_payment_verification(image_url, expected_amount)` | Ask the platform to verify a receipt | Platform runs Claude vision extraction + rule comparison — **the AI never declares payment confirmed itself** (PRD 14.2) |
| `update_stage(new_stage)` | Move the conversation's workflow state | Platform, validates the transition is legal |
| `create_followup(days, template)` | Schedule a follow-up | Platform, writes to `followups` via pg-boss |
| `escalate_to_human(reason, summary)` | Hand off to a human agent | Platform, notifies via `human_agents`, pauses AI on that conversation |
| `tag_customer(tag)` | Apply a CRM tag | Platform |
| `generate_summary()` | Produce the handoff summary (PRD 8.7) | Can be model-generated text, but is always stored, never just spoken |

This table is the literal enforcement of PRD Philosophy 3 — every row's "Executed by" column reads "Platform," never "the model directly."

### 7.3 Perception (PRD Chapter 12, MVP-scoped per 13.6)

* **Text** — handled inline by the same Claude call (intent, language, sentiment folded into the reasoning step rather than a separate pass, for MVP simplicity).
* **Images (receipts)** — sent to Claude as a vision input with a focused prompt ("extract amount, bank, timestamp; return confidence"); this *is* the Vision Processor for the MVP — no separate OCR vendor.
* **Voice, documents, stickers, contacts, location** — out of scope per PRD 13.4; the webhook can acknowledge and store them, but no processor acts on them yet.

---

## 8. WhatsApp Integration

* Inbound: Meta sends webhook POSTs to a Next.js API route for every message/media/status event on the connected number.
* Outbound: platform code calls the WhatsApp Cloud API's `/messages` endpoint directly — text, and media (product files, images) via the media upload endpoint.
* Normalization: every inbound payload is converted into a `messages` row and an `events` row before anything else happens (PRD Module 1, Channel Gateway).
* Ad attribution: if the first message of a new conversation carries Meta's `referral` object (a "click to WhatsApp" ad or post), it's captured onto `conversations.referral` — see the schema note in §5.

---

## 9. Follow-Up Scheduling

`create_followup` schedules a `pg-boss` delayed job for Day 1 / Day 3 / Day 7 (PRD 8.6). When a job fires, the worker checks whether the order has since completed (`orders.status = verified`) or the follow-up was cancelled — if either, it's a no-op logged as `FOLLOWUP_CANCELLED`. Otherwise it re-enters the same AI Employee Runtime with the follow-up context so the message stays natural rather than a fixed template blast (though a template is the fallback if generation fails).

---

## 10. Dashboard

Server-rendered Next.js pages reading directly from Postgres, all under `/dashboard`, `/settings`, `/manage`:

* **Monitor** (`/dashboard`) — active conversations, today's counts, conversations awaiting a human (PRD 13.3). `HUMAN_REVIEW_REQUIRED`/`HUMAN_ASSIGNED` conversations always sort to the top.
* **Review** (`/dashboard/[id]`) — per-conversation drill-down: summary, current stage, message history, Conversation Brain facts, orders, follow-ups. Two actions here: reply directly as a human (`sendHumanReply` — also claims the conversation via `assignedHumanId` and flips `HUMAN_REVIEW_REQUIRED` → `HUMAN_ASSIGNED`), and resolve it (`resolveConversation`).
* **Manage** (`/manage`, MVP-light per 13.6) — direct CRUD on `products` and `payment_accounts`; `business_config` is covered separately by `/settings`. No workflow-builder UI.

**Auth** (PRD 4: a single admin/business-owner role and a human-agent role, two roles only for MVP): `HumanAgent` doubles as the login identity — `isAdmin` distinguishes the two roles. `/settings` and `/manage` are admin-only; `/dashboard` is open to any authenticated agent for that business. Sessions are a signed, self-contained cookie (`src/lib/auth.ts`, HMAC via `AUTH_SECRET`, no session table) verified by `src/proxy.ts` (the renamed `middleware.ts` in this Next.js version) in front of all three, and independently re-checked inside every Server Action behind them (`requireSession`/`requireAdminSession`) since Next's own docs warn a matcher change can silently drop Proxy coverage for a Server Function. There is no public sign-up route — the first login for a business is created out-of-band via `npm run create-admin` (`scripts/create-admin.ts`), the same way a real deploy would provision its first admin.

---

## 11. Deployment

* One Railway/Render **web service** (Next.js: webhook + API + dashboard).
* One Railway/Render **worker process** (pg-boss consumer — perception, planning, follow-up firing).
* One **Postgres** instance (Railway/Render managed, or Neon/Supabase).
* One **object storage bucket** (Cloudflare R2 recommended for cost).

This is intentionally two processes plus a database — not nine microservices. The module boundaries in PRD Chapter 7 stay real inside the codebase (folders/modules with clear responsibilities and an internal event bus), they just don't need separate deployments yet.

---

## 12. Prerequisites Checklist (outside this document, but blocking)

Before implementation can start against a real business:

* [ ] Meta Business verification + WhatsApp Cloud API access + a phone number connected to it.
* [ ] Anthropic API key (Claude).
* [ ] A real (or realistic test) product catalog: names, prices, files, at least one payment account.
* [ ] Hosting + Postgres + object storage accounts provisioned.

**Object storage is code-complete but not provisioned (2026-07-26):** `src/lib/media-storage.ts` uploads receipt images to real S3-compatible storage (Cloudflare R2 or AWS S3, via `@aws-sdk/client-s3`) whenever `STORAGE_ENDPOINT`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY`/`STORAGE_PUBLIC_BASE_URL` are all set. Until a real bucket is created and those env vars are filled in, it falls back to local disk (`storage/receipts/`, gitignored) — fine for local dev, not for production. Creating the actual bucket is still a manual step outside this repo.

---

## 13. Open Decisions Deferred to Implementation

* Exact Prisma schema types/constraints (this document lists fields, not a migration file).
* Whether `search_products` uses simple SQL matching or embeddings — SQL is almost certainly sufficient at MVP catalog size (PRD 13.3: "single digits to low dozens of SKUs").
* Exact prompt content for the system prompt (this is the "AI Sales Playbook" the original ideation conversation flagged as a separate document — worth writing once the runtime is being built, not before).
