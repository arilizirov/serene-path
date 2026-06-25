import { prisma } from "@/lib/db";
import type { TokenUsage } from "./types";

// Phase 4 — API COST & USAGE TRACKING (recording + pricing).
//
// Every REAL (paid) model call routes its token usage through recordUsage, which
// estimates a dollar cost and writes one ApiUsage row. The stub path (no
// OPENAI_API_KEY) never produces usage, so it records nothing.
//
// Recording is FIRE-AND-FORGET: a logging/DB failure must never break an intake
// turn, so recordUsage swallows its own errors (see the try/catch below). It is
// `await`-able only so tests can assert on it; callers do not depend on it.

/** The paid call sites we track (one label per AI entry point). */
export type CallType = "intake" | "crisis" | "extract" | "confirm";

/** Per-model USD price, dollars per 1,000,000 tokens, split input/output. */
type ModelPrice = { inputPer1M: number; outputPer1M: number };

// ⚠️ ESTIMATES — these are APPROXIMATE published-style rates, NOT a billed
// amount and NOT scraped live. Adjust to the real OpenAI rate card before
// trusting the dollar figures on the admin dashboard. Unknown models fall back
// to the gpt-5.4 rate (see estimateCostUsd).
export const PRICING: Record<string, ModelPrice> = {
  // approximate — verify against the live rate card
  "gpt-5.4": { inputPer1M: 2.5, outputPer1M: 15 },
  // approximate — verify against the live rate card
  "gpt-5.5": { inputPer1M: 5, outputPer1M: 25 },
};

/** The rate used when a model id isn't in PRICING (keeps cost non-zero & honest). */
const FALLBACK_PRICE: ModelPrice = PRICING["gpt-5.4"];

/**
 * Estimate the USD cost of one call from its token usage. PURE — no I/O — so the
 * pricing math is unit-testable on its own. Cost is an ESTIMATE (see PRICING).
 *   estCostUsd = promptTokens/1e6*inputPer1M + completionTokens/1e6*outputPer1M
 * Unknown models use the gpt-5.4 fallback rate.
 */
export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const price = PRICING[model] ?? FALLBACK_PRICE;
  return (
    (usage.promptTokens / 1e6) * price.inputPer1M +
    (usage.completionTokens / 1e6) * price.outputPer1M
  );
}

/**
 * Record one paid model call's usage + estimated cost as an ApiUsage row.
 * FIRE-AND-FORGET: wrapped in try/catch so a recording failure can NEVER throw
 * into (and break) the request path. Returns nothing meaningful; awaiting is
 * only for tests. Never logs the API key (none is touched here).
 */
export async function recordUsage(
  callType: CallType,
  model: string,
  usage: TokenUsage,
): Promise<void> {
  try {
    await prisma.apiUsage.create({
      data: {
        model,
        callType,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        estCostUsd: estimateCostUsd(model, usage),
      },
    });
  } catch (err) {
    // Swallow — usage logging is best-effort and must not affect the turn.
    console.error("recordUsage failed (ignored):", err);
  }
}
