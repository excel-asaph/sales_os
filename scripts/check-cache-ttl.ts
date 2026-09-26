import "dotenv/config";
import { readFileSync } from "node:fs";
import type Anthropic from "@anthropic-ai/sdk";
import { claude, CLAUDE_MODEL } from "@/lib/claude";
import { buildSystemPrompt, buildProductContentBlock } from "@/lib/system-prompt";
import { actionContractTools } from "@/lib/tools";

/**
 * Pre-flight check for the cache_control layout in ai-runtime.ts.
 *
 * Exists because a `ttl: "1h"` on the product block shipped on 2026-09-26 and
 * 400'd every post-delivery conversation in production. The API rejects the
 * request outright:
 *
 *   system.1.cache_control.ttl: a ttl='1h' cache_control block must not come
 *   after a ttl='5m' cache_control block. Note that blocks are processed in
 *   the following order: `tools`, `system`, `messages`.
 *
 * Nothing in typecheck, lint or build can catch that — only the API can. So
 * this sends the real request shape, at max_tokens 1, and reports which
 * layouts are accepted.
 *
 * Run against production credentials without copying them anywhere:
 *
 *   npx --yes @railway/cli@latest run --service sales_os -- npx tsx scripts/check-cache-ttl.ts
 *
 * Costs a few cents in input tokens and warms the real cache. It sends no
 * customer-facing message and touches no database row.
 */

type Ttl = "5m" | "1h";

function toolsWith(ttl: Ttl | null): Anthropic.Tool[] {
  // tools.ts marks the last tool as the cache breakpoint; clone so the real
  // exported array is never mutated.
  return actionContractTools.map((t, i) => {
    const last = i === actionContractTools.length - 1;
    const clone = { ...t } as Anthropic.Tool & { cache_control?: unknown };
    if (last && ttl) clone.cache_control = { type: "ephemeral", ttl };
    else if (last) clone.cache_control = { type: "ephemeral" };
    else delete clone.cache_control;
    return clone as Anthropic.Tool;
  });
}

async function attempt(
  label: string,
  toolsTtl: Ttl,
  systemTtl: Ttl,
  productTtl: Ttl,
  expect: "accept" | "reject"
) {
  const system = buildSystemPrompt({
    name: "VitalFix",
    deliverBeforePayment: true,
    playbook: null,
    faq: [],
  });
  const product = buildProductContentBlock({
    name: "DIABETES FIX ebook",
    contentText: readFileSync(process.argv[2], "utf-8"),
  });

  try {
    await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1,
      system: [
        { type: "text", text: system, cache_control: { type: "ephemeral", ttl: systemTtl } },
        { type: "text", text: product, cache_control: { type: "ephemeral", ttl: productTtl } },
      ],
      tools: toolsWith(toolsTtl),
      messages: [{ role: "user", content: "ping" }],
    });
    const ok = expect === "accept";
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}  -> accepted`);
    return ok;
  } catch (error) {
    const msg = (error as Error).message.replace(/\s+/g, " ").slice(0, 150);
    const ok = expect === "reject";
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}  -> rejected`);
    console.log(`          ${msg}`);
    return ok;
  }
}

async function main() {
  if (!process.argv[2]) {
    console.error("usage: check-cache-ttl.ts <path-to-product-text.txt>");
    process.exit(2);
  }
  console.log(`model ${CLAUDE_MODEL}\n`);
  console.log("cache_control layouts (order is tools -> system -> messages)\n");

  const results = [
    // What is deployed right now.
    await attempt("all 5m (current, deployed)", "5m", "5m", "5m", "accept"),
    // What broke production: a 1h block sitting behind 5m blocks.
    await attempt("5m tools, 5m system, 1h product (the outage)", "5m", "5m", "1h", "reject"),
    // The proposed fix: nothing 1h may sit behind anything 5m.
    await attempt("1h tools, 1h system, 1h product (proposed)", "1h", "1h", "1h", "accept"),
  ];

  const failed = results.filter((r) => !r).length;
  console.log(
    failed === 0
      ? "\nAll layouts behaved as expected. The proposed fix is accepted by the API."
      : `\n${failed} layout(s) did NOT behave as expected — do not ship.`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main();
