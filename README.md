# Antflow Sales OS

An AI-powered Sales Operating System — an AI sales employee that runs WhatsApp sales conversations end to end (greet, recommend, handle objections, collect payment, verify receipts, deliver product, follow up) for WhatsApp-first businesses selling digital products.

- Product spec: [docs/PRD.md](docs/PRD.md)
- Technical architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

The MVP vertical slice is built and working end-to-end: the WhatsApp Cloud API webhook, the Claude-based AI Employee Runtime, payment-receipt verification, the follow-up job runner, and a Dashboard (with login) for monitoring conversations, replying/escalating, and managing products and payment accounts. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and Chapter 13 of the PRD for what's in and out of scope.

## Prerequisites

- Node.js 20+
- Docker Desktop (for local Postgres) — or your own Postgres instance

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run dev
```

Then visit `http://localhost:3000/api/health` — it should return `{"status":"ok","businessCount":0}`, confirming the app can reach the database.

In a second terminal, run `npm run worker` to start the follow-up job runner (pg-boss consumer — ARCHITECTURE.md §9/§11). Scheduled follow-ups (`create_followup`) are written to Postgres either way, but nothing sends them unless this process is running.

### Dashboard login

`/dashboard`, `/settings`, and `/manage` require a login (ARCHITECTURE.md §10). There's no sign-up page on purpose — create the first admin login with:

```bash
npm run create-admin -- --business-name "My Business" --name "Jane Doe" --contact jane@example.com --password secret123
```

That creates both the business and its first admin. To add another login (admin or a plain human agent, who only gets `/dashboard`) to an existing business:

```bash
npm run create-admin -- --business-id <id> --name "John Doe" --contact john@example.com --password secret123 [--agent]
```

### Receipt image storage

Payment receipt images are saved to local disk (`storage/receipts/`) until `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, and `STORAGE_PUBLIC_BASE_URL` are all set in `.env` (a Cloudflare R2 bucket or any S3-compatible store) — see `src/lib/media-storage.ts`. Nothing else needs to change once those are filled in.

### If you already run Postgres locally on port 5432

`docker-compose.yml` publishes the dev database on host port **55432**, not 5432, specifically to avoid colliding with an existing local Postgres install. `.env.example` already points at `55432` — leave it as is unless you've changed the compose file.

## Project structure

- `prisma/schema.prisma` — database schema (kept in sync with ARCHITECTURE.md §5)
- `src/app/` — Next.js App Router (pages + API/route handlers)
- `src/lib/prisma.ts` — Prisma Client singleton (uses the `@prisma/adapter-pg` driver adapter — Prisma 7 no longer takes a `url` directly in `schema.prisma`; see `prisma.config.ts`)
- `src/generated/prisma/` — generated Prisma Client (gitignored; regenerate with `npx prisma generate`)

## Notes for future contributors (including AI agents)

This project pins recent major versions of its core tools — **Next.js 16** and **Prisma 7** — both of which introduced breaking changes since most training data was written:

- Next.js: read `node_modules/next/dist/docs/` before assuming an API from memory (see `AGENTS.md`).
- Prisma 7: `schema.prisma` no longer holds a `url` in the `datasource` block; connection config lives in `prisma.config.ts`, and `PrismaClient` is instantiated with a driver adapter (`@prisma/adapter-pg`), not a bare `new PrismaClient()`. See `src/lib/prisma.ts` for the working pattern.
