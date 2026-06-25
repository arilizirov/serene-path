import { describe, it, expect, vi } from "vitest";

// Importing ./usage pulls in @/lib/db (Prisma → env) for recordUsage. Stub that
// leaf so this pure-math unit test runs without a DB/env — same convention as
// markdown.test.ts / service.test.ts. recordUsage (the DB write) is deliberately
// NOT exercised here; it's fire-and-forget and the unit path stays DB-free.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { estimateCostUsd, PRICING } from "./usage";
import type { TokenUsage } from "./types";

const usage = (prompt: number, completion: number): TokenUsage => ({
  promptTokens: prompt,
  completionTokens: completion,
  totalTokens: prompt + completion,
});

describe("estimateCostUsd (cost estimate — see PRICING)", () => {
  it("prices a known model from its input/output per-1M rates", () => {
    // gpt-5.4 ≈ { input 2.5, output 15 } per 1M tokens.
    // 1,000,000 prompt → $2.50 ; 1,000,000 completion → $15 ; total $17.50.
    expect(estimateCostUsd("gpt-5.4", usage(1_000_000, 1_000_000))).toBeCloseTo(
      17.5,
      6,
    );
  });

  it("splits input vs output rates correctly", () => {
    // gpt-5.5 ≈ { input 5, output 25 }. 200k in + 100k out.
    // 0.2*5 + 0.1*25 = 1 + 2.5 = 3.5
    expect(estimateCostUsd("gpt-5.5", usage(200_000, 100_000))).toBeCloseTo(3.5, 6);
  });

  it("returns 0 for a zero-token call", () => {
    expect(estimateCostUsd("gpt-5.4", usage(0, 0))).toBe(0);
  });

  it("falls back to the gpt-5.4 rate for an unknown model", () => {
    const unknown = estimateCostUsd("some-future-model", usage(1_000_000, 1_000_000));
    const fallback = estimateCostUsd("gpt-5.4", usage(1_000_000, 1_000_000));
    expect(unknown).toBe(fallback);
    expect(PRICING["some-future-model"]).toBeUndefined();
  });
});
