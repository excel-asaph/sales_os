import type Anthropic from "@anthropic-ai/sdk";
import { claude, CLAUDE_MODEL } from "@/lib/claude";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { actionContractTools } from "@/lib/tools";
import { executeAction, type ActionContext } from "@/lib/actions";
import { loadConversationBrain, renderConversationBrain } from "@/lib/conversation-brain";
import { getBusinessConfig, getFaqEntries } from "@/lib/knowledge";
import { prisma } from "@/lib/prisma";

// A single rich turn (search a product, send 2-3 short messages, update
// stage, tag the customer) can legitimately take 5-6 tool calls before the
// model has nothing left to add and should end the turn naturally. The cap
// exists to catch genuine runaway loops, not to cut off a normal turn one
// step early.
const MAX_TOOL_ITERATIONS = 12;

/**
 * The AI Employee Runtime (ARCHITECTURE.md §7): one reasoning loop per
 * customer turn. The model reads the Conversation Brain (not the message
 * history) and either replies via the send_message tool or takes other
 * Action Contract steps. Tool calls are executed by platform code
 * (src/lib/actions.ts) — the model never touches the database or
 * WhatsApp directly (PRD Philosophy 3).
 */
export async function runAIEmployeeTurn(conversationId: string, followupNote?: string) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { customer: { include: { business: true } } },
  });

  // Conversations already parked for a human should not be re-entered by
  // the AI (PRD 5.11: exactly one active workflow, and a human taking
  // over means the AI pauses on that conversation).
  if (conversation.currentStage === "HUMAN_REVIEW_REQUIRED" || conversation.currentStage === "HUMAN_ASSIGNED") {
    return;
  }

  const businessId = conversation.customer.businessId;
  const ctx: ActionContext = {
    conversationId,
    businessId,
    customerPhoneNumber: conversation.customer.phoneNumber,
  };

  const [brain, config, faq] = await Promise.all([
    loadConversationBrain(conversationId),
    getBusinessConfig(businessId),
    getFaqEntries(businessId),
  ]);

  const system = buildSystemPrompt({
    name: conversation.customer.business.name,
    deliverBeforePayment: config.deliverBeforePayment,
    playbook: config.playbook as Record<string, string> | null,
    faq,
  });

  const brainContent = followupNote
    ? `${renderConversationBrain(brain)}\n\n${followupNote}`
    : renderConversationBrain(brain);

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: brainContent }];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      // The system prompt is identical for every turn of every customer of
      // this business until an admin edits Settings/products/FAQ — caching
      // it (and the tools list, tools.ts) means every iteration of this
      // loop past the first, and every subsequent customer message within
      // the cache window, mostly reads from cache instead of paying full
      // input price for the same ~1-2K tokens again. A breakpoint here also
      // covers tools (tools render before system), but keeping an explicit
      // one on tools too (tools.ts) lets that half survive even when a
      // different business's system prompt text misses.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools: actionContractTools,
      // Automatic caching: the API places (and moves) this breakpoint on
      // the last cacheable block itself as `messages` grows across this
      // loop's iterations, so the turn's own tool-calling history is
      // cached too without hand-tracking a moving marker. It's additive to
      // the two explicit breakpoints above (they use separate slots, well
      // under the 4-per-request cap) — this is the officially recommended
      // way to combine "explicit for the stable prefix, automatic for the
      // growing conversation" (docs.claude.com/prompt-caching).
      cache_control: { type: "ephemeral" },
      messages,
    });

    logClaudeUsage(conversationId, iteration, response.usage);

    if (response.stop_reason === "refusal") {
      console.warn(`AI Employee Runtime: refusal on conversation ${conversationId}`);
      await executeAction(
        "escalate_to_human",
        { reason: "model_refusal", summary: "The AI declined to respond to this conversation; needs human review." },
        ctx
      );
      return;
    }

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      // end_turn without ever calling send_message means nothing was
      // communicated to the customer — treat as a low-confidence outcome
      // rather than silently doing nothing.
      if (response.stop_reason === "max_tokens") {
        console.warn(`AI Employee Runtime: hit max_tokens on conversation ${conversationId}`);
        await executeAction(
          "escalate_to_human",
          { reason: "max_tokens", summary: "The AI's response was cut off before completing; needs human review." },
          ctx
        );
      }
      return;
    }

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      try {
        const result = await executeAction(block.name, block.input as Record<string, unknown>, ctx);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch (error) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: ${(error as Error).message}`,
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  console.warn(`AI Employee Runtime: exceeded ${MAX_TOOL_ITERATIONS} tool iterations on conversation ${conversationId}`);
  await executeAction(
    "escalate_to_human",
    { reason: "tool_loop_limit", summary: "The AI took too many actions in one turn without finishing; needs human review." },
    ctx
  );
}

// Visibility into whether prompt caching is actually working — until this
// existed, there was no way to see cache hit rate short of trusting the
// dashboard's aggregate numbers. `input_tokens` is the *uncached* remainder
// only; a healthy warm cache should show most of the system+tools prefix
// showing up under cache_read rather than input on iteration > 0 (and on
// iteration 0 too, once another turn for this business has warmed it within
// the last 5 minutes).
function logClaudeUsage(conversationId: string, iteration: number, usage: Anthropic.Usage) {
  console.log(
    `[claude-usage] conversation=${conversationId} iter=${iteration} model=${CLAUDE_MODEL} ` +
      `input=${usage.input_tokens} cache_write=${usage.cache_creation_input_tokens ?? 0} ` +
      `cache_read=${usage.cache_read_input_tokens ?? 0} output=${usage.output_tokens}`
  );
}
