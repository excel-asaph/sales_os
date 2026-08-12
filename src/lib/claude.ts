import Anthropic from "@anthropic-ai/sdk";

// Resolves ANTHROPIC_API_KEY from the environment automatically. A higher
// maxRetries than the SDK default (2) — real 529 "Overloaded" errors from
// Anthropic have been observed in production outlasting the default retry
// budget, dropping several real customers' turns in one day (confirmed via
// Railway logs, 2026-08-12). The SDK already does exponential backoff
// between attempts; this just gives it more of them before giving up.
// ingest-message.ts's own catch block is the last line of defense for
// whatever gets past even this.
export const claude = new Anthropic({ maxRetries: 5 });

// Configurable via env so switching models is a one-line change, not a
// code change. Sonnet is the default: a per-message WhatsApp turn is a
// bounded tool-calling task against a well-specified playbook, not the
// kind of open-ended multi-step reasoning Opus is for.
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
