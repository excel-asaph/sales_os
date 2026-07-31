import Anthropic from "@anthropic-ai/sdk";

// Resolves ANTHROPIC_API_KEY from the environment automatically.
export const claude = new Anthropic();

// Configurable via env so switching models is a one-line change, not a
// code change. Opus is the default per current guidance; for a per-message
// WhatsApp runtime running on every customer turn, claude-sonnet-5 is a
// reasonable cost-conscious alternative worth benchmarking before scaling
// beyond a single pilot business.
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
