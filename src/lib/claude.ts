import Anthropic from "@anthropic-ai/sdk";

// Resolves ANTHROPIC_API_KEY from the environment automatically.
export const claude = new Anthropic();

// Configurable via env so switching models is a one-line change, not a
// code change. Sonnet is the default: a per-message WhatsApp turn is a
// bounded tool-calling task against a well-specified playbook, not the
// kind of open-ended multi-step reasoning Opus is for.
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
